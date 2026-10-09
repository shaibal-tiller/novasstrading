import "server-only";
import { cached, REALTIME_TTL_MS, REPORT_TTL_MS } from "./cache";
import { ga4Hostname, missingEnv, normalizePropertyId } from "./config";
import { describeGoogleError } from "./errors";
import { getAccessToken, googlePostJson, parseServiceAccount, SCOPES, type ServiceAccount } from "./google-auth";
import { comparePeriods, eachDay, GA4_TIME_ZONE, isoDateInZone, type DateSpan, type RangeDays } from "./range";
import type { Comparison, DailyPoint, Ga4Result, Ga4Totals, Panel, RankedRow } from "./types";

/** GA4 Data API (v1beta) over plain fetch. */

const API_BASE = "https://analyticsdata.googleapis.com/v1beta";
export const CONTACT_FORM_EVENT = "contact_form_submit";

const TOTAL_METRICS: (keyof Ga4Totals)[] = [
  "activeUsers",
  "sessions",
  "screenPageViews",
  "averageSessionDuration",
  "engagementRate",
];

// ---- response parsing ---------------------------------------------------------

export type RawReport = {
  dimensionHeaders?: { name?: string }[];
  metricHeaders?: { name?: string }[];
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
};

export type ReportRow = { dimensions: Record<string, string>; metrics: Record<string, number> };

function toNumber(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Rows keyed by header name: { dimensions: { pagePath: "/" }, metrics: { screenPageViews: 12 } }. */
export function parseReport(raw: RawReport | null | undefined): ReportRow[] {
  const dims = (raw?.dimensionHeaders ?? []).map((h) => h.name ?? "");
  const mets = (raw?.metricHeaders ?? []).map((h) => h.name ?? "");
  return (raw?.rows ?? []).map((row) => {
    const dimensions: Record<string, string> = {};
    const metrics: Record<string, number> = {};
    dims.forEach((name, i) => (dimensions[name] = row.dimensionValues?.[i]?.value ?? ""));
    mets.forEach((name, i) => (metrics[name] = toNumber(row.metricValues?.[i]?.value)));
    return { dimensions, metrics };
  });
}

/**
 * With two named date ranges GA4 adds a `dateRange` dimension valued
 * "current" / "previous". A range with no data has no row at all → zeros.
 */
function splitByRange(rows: ReportRow[]): { current?: ReportRow; previous?: ReportRow } {
  const byRange = (name: string) => rows.find((r) => (r.dimensions.dateRange ?? "current") === name);
  return { current: byRange("current"), previous: byRange("previous") };
}

export function parseTotals(raw: RawReport): Comparison<Ga4Totals> {
  const { current, previous } = splitByRange(parseReport(raw));
  const pick = (row?: ReportRow): Ga4Totals =>
    Object.fromEntries(TOTAL_METRICS.map((m) => [m, row?.metrics[m] ?? 0])) as Ga4Totals;
  return { current: pick(current), previous: pick(previous) };
}

export function parseEventCount(raw: RawReport): Comparison<number> {
  const { current, previous } = splitByRange(parseReport(raw));
  return { current: current?.metrics.eventCount ?? 0, previous: previous?.metrics.eventCount ?? 0 };
}

/** One point per day of the span (GA4 omits days with no visitors → 0). Dates come back as YYYYMMDD. */
export function parseDaily(raw: RawReport, span: DateSpan): DailyPoint[] {
  const values = new Map<string, number>();
  for (const row of parseReport(raw)) {
    const d = row.dimensions.date ?? "";
    if (/^\d{8}$/.test(d)) values.set(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, row.metrics.activeUsers ?? 0);
  }
  return eachDay(span).map((date) => ({ date, value: values.get(date) ?? 0 }));
}

export function parseRanked(raw: RawReport, dimension: string, metric: string): RankedRow[] {
  return parseReport(raw).map((row) => ({
    label: row.dimensions[dimension] || "(not set)",
    value: row.metrics[metric] ?? 0,
  }));
}

export function parseRealtime(raw: RawReport): number {
  return parseReport(raw)[0]?.metrics.activeUsers ?? 0;
}

// ---- requests -----------------------------------------------------------------

type Filter = Record<string, unknown>;

function exact(fieldName: string, value: string): Filter {
  return { filter: { fieldName, stringFilter: { matchType: "EXACT", value } } };
}

/** hostName == GA4_HOSTNAME (when set), AND-ed with any extra filter. */
export function dimensionFilter(hostname: string | null, extra?: Filter): Filter | undefined {
  const parts = [hostname ? exact("hostName", hostname) : null, extra ?? null].filter((f): f is Filter => !!f);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { andGroup: { expressions: parts } };
}

function range(span: DateSpan, name: string) {
  return { startDate: span.start, endDate: span.end, name };
}

function topN(span: DateSpan, dimension: string, metric: string, filter: Filter | undefined) {
  return {
    dateRanges: [range(span, "current")],
    dimensions: [{ name: dimension }],
    metrics: [{ name: metric }],
    orderBys: [{ metric: { metricName: metric }, desc: true }],
    limit: 10,
    ...(filter ? { dimensionFilter: filter } : {}),
  };
}

async function settle<T>(work: Promise<T>, label: string): Promise<Panel<T>> {
  try {
    return { ok: true, data: await work };
  } catch (err) {
    console.error(`[analytics] GA4 ${label} failed:`, err instanceof Error ? err.message : err);
    return { ok: false, error: describeGoogleError(err, "ga4") };
  }
}

export type Ga4Options = { env?: Record<string, string | undefined>; now?: Date };

/**
 * Everything the Analytics page shows from GA4, for the last `days` complete
 * days (ending yesterday) and the equal period before. Each panel succeeds or
 * fails on its own; reports are cached for 10 minutes (realtime for 1).
 */
export async function getGa4Dashboard(days: RangeDays, options: Ga4Options = {}): Promise<Ga4Result> {
  const env = options.env ?? process.env;
  const missing = missingEnv("ga4", env);
  if (missing.length > 0) return { status: "not_connected", missing };

  let sa: ServiceAccount;
  let propertyId: string;
  try {
    sa = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
    propertyId = normalizePropertyId(env.GA4_PROPERTY_ID ?? "");
    // Sign in once up front: a rejected key is one message, not eight.
    await getAccessToken(SCOPES.analytics, sa);
  } catch (err) {
    console.error("[analytics] GA4 sign-in failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: describeGoogleError(err, "ga4") };
  }

  const hostname = ga4Hostname(env);
  const period = comparePeriods(isoDateInZone(options.now ?? new Date(), GA4_TIME_ZONE), days, 1);
  const { current, previous } = period;
  const keyBase = `ga4|${propertyId}|${hostname ?? "*"}|${current.start}|${current.end}`;
  const filter = dimensionFilter(hostname);

  function report<T>(name: string, body: unknown, parse: (raw: RawReport) => T, ttl = REPORT_TTL_MS): Promise<T> {
    return cached(`${keyBase}|${name}`, ttl, async () =>
      parse(await googlePostJson<RawReport>(`${API_BASE}/properties/${propertyId}:runReport`, SCOPES.analytics, sa, body)),
    );
  }

  const [totals, daily, pages, countries, channels, devices, contactForms, realtime] = await Promise.all([
    settle(
      report(
        "totals",
        {
          dateRanges: [range(current, "current"), range(previous, "previous")],
          metrics: TOTAL_METRICS.map((name) => ({ name })),
          ...(filter ? { dimensionFilter: filter } : {}),
        },
        parseTotals,
      ),
      "totals",
    ),
    settle(
      report(
        "daily",
        {
          dateRanges: [range(current, "current")],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "activeUsers" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: 400,
          ...(filter ? { dimensionFilter: filter } : {}),
        },
        (raw) => parseDaily(raw, current),
      ),
      "daily users",
    ),
    settle(report("pages", topN(current, "pagePath", "screenPageViews", filter), (raw) => parseRanked(raw, "pagePath", "screenPageViews")), "top pages"),
    settle(report("countries", topN(current, "country", "activeUsers", filter), (raw) => parseRanked(raw, "country", "activeUsers")), "countries"),
    settle(
      report("channels", topN(current, "sessionDefaultChannelGroup", "sessions", filter), (raw) =>
        parseRanked(raw, "sessionDefaultChannelGroup", "sessions"),
      ),
      "channels",
    ),
    settle(report("devices", topN(current, "deviceCategory", "activeUsers", filter), (raw) => parseRanked(raw, "deviceCategory", "activeUsers")), "devices"),
    settle(
      report(
        "contactForms",
        {
          dateRanges: [range(current, "current"), range(previous, "previous")],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: dimensionFilter(hostname, exact("eventName", CONTACT_FORM_EVENT)),
        },
        parseEventCount,
      ),
      "contact-form count",
    ),
    // Realtime has no hostName dimension, so it is never host-filtered.
    settle(
      cached(`ga4|${propertyId}|realtime`, REALTIME_TTL_MS, async () =>
        parseRealtime(
          await googlePostJson<RawReport>(`${API_BASE}/properties/${propertyId}:runRealtimeReport`, SCOPES.analytics, sa, {
            metrics: [{ name: "activeUsers" }],
          }),
        ),
      ),
      "realtime",
    ),
  ]);

  return { status: "connected", period, hostname, totals, daily, pages, countries, channels, devices, contactForms, realtime };
}
