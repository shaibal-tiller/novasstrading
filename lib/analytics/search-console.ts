import "server-only";
import { cached, REPORT_TTL_MS } from "./cache";
import { missingEnv } from "./config";
import { describeGoogleError } from "./errors";
import { getAccessToken, googlePostJson, parseServiceAccount, SCOPES, type ServiceAccount } from "./google-auth";
import { comparePeriods, isoDateInZone, SEARCH_CONSOLE_TIME_ZONE, type DateSpan, type RangeDays } from "./range";
import type { Comparison, GscRow, GscTotals, Panel, SearchConsoleResult } from "./types";

/** Search Console Search Analytics API over plain fetch. */

/** Search Console data lags ~2–3 days, so every range ends 3 days ago. */
export const SEARCH_CONSOLE_LAG_DAYS = 3;

export type RawSearchAnalytics = {
  rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[];
};

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function searchAnalyticsUrl(siteUrl: string): string {
  return `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
}

/** No dimensions → a single totals row (absent when there is no data at all). */
export function parseGscTotals(raw: RawSearchAnalytics): GscTotals {
  const row = raw?.rows?.[0];
  return { clicks: num(row?.clicks), impressions: num(row?.impressions), ctr: num(row?.ctr), position: num(row?.position) };
}

export function parseGscRows(raw: RawSearchAnalytics): GscRow[] {
  return (raw?.rows ?? []).map((row) => ({
    label: row.keys?.[0] || "(not set)",
    clicks: num(row.clicks),
    impressions: num(row.impressions),
    ctr: num(row.ctr),
    position: num(row.position),
  }));
}

async function settle<T>(work: Promise<T>, label: string): Promise<Panel<T>> {
  try {
    return { ok: true, data: await work };
  } catch (err) {
    console.error(`[analytics] Search Console ${label} failed:`, err instanceof Error ? err.message : err);
    return { ok: false, error: describeGoogleError(err, "searchConsole") };
  }
}

export type SearchConsoleOptions = { env?: Record<string, string | undefined>; now?: Date };

/** Totals (vs the previous equal period), top 10 searches and top 10 pages. Cached 10 minutes. */
export async function getSearchConsoleDashboard(
  days: RangeDays,
  options: SearchConsoleOptions = {},
): Promise<SearchConsoleResult> {
  const env = options.env ?? process.env;
  const missing = missingEnv("searchConsole", env);
  if (missing.length > 0) return { status: "not_connected", missing };

  let sa: ServiceAccount;
  try {
    sa = parseServiceAccount(env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
    await getAccessToken(SCOPES.searchConsole, sa);
  } catch (err) {
    console.error("[analytics] Search Console sign-in failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: describeGoogleError(err, "searchConsole") };
  }

  const siteUrl = (env.GSC_SITE_URL ?? "").trim();
  const url = searchAnalyticsUrl(siteUrl);
  const period = comparePeriods(
    isoDateInZone(options.now ?? new Date(), SEARCH_CONSOLE_TIME_ZONE),
    days,
    SEARCH_CONSOLE_LAG_DAYS,
  );

  function query<T>(span: DateSpan, dimensions: string[], parse: (raw: RawSearchAnalytics) => T): Promise<T> {
    const key = `gsc|${siteUrl}|${span.start}|${span.end}|${dimensions.join(",")}`;
    return cached(key, REPORT_TTL_MS, async () =>
      parse(
        await googlePostJson<RawSearchAnalytics>(url, SCOPES.searchConsole, sa, {
          startDate: span.start,
          endDate: span.end,
          dimensions,
          rowLimit: dimensions.length ? 10 : 1,
        }),
      ),
    );
  }

  const [totals, queries, pages] = await Promise.all([
    settle(
      Promise.all([query(period.current, [], parseGscTotals), query(period.previous, [], parseGscTotals)]).then(
        ([current, previous]): Comparison<GscTotals> => ({ current, previous }),
      ),
      "totals",
    ),
    settle(query(period.current, ["query"], parseGscRows), "top searches"),
    settle(query(period.current, ["page"], parseGscRows), "top pages"),
  ]);

  return { status: "connected", period, totals, queries, pages };
}
