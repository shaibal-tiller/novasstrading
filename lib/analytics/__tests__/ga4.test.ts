// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { __resetAnalyticsCache } from "@/lib/analytics/cache";
import { __resetGoogleTokenCache, GOOGLE_TOKEN_URL } from "@/lib/analytics/google-auth";
import {
  dimensionFilter,
  getGa4Dashboard,
  parseDaily,
  parseEventCount,
  parseRanked,
  parseRealtime,
  parseReport,
  parseTotals,
  type RawReport,
} from "@/lib/analytics/ga4";
import { percentChange } from "@/lib/analytics/range";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const ENV = {
  GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "reader@nova-test.iam.gserviceaccount.com", private_key: privateKey }),
  GA4_PROPERTY_ID: "123456789",
};
const NOW = new Date("2026-10-04T10:00:00Z"); // 16:00 in Dhaka → "yesterday" is 2026-10-03

const TOTALS: RawReport = {
  dimensionHeaders: [{ name: "dateRange" }],
  metricHeaders: [
    { name: "activeUsers" },
    { name: "sessions" },
    { name: "screenPageViews" },
    { name: "averageSessionDuration" },
    { name: "engagementRate" },
  ],
  rows: [
    { dimensionValues: [{ value: "previous" }], metricValues: [{ value: "80" }, { value: "100" }, { value: "300" }, { value: "60" }, { value: "0.5" }] },
    { dimensionValues: [{ value: "current" }], metricValues: [{ value: "120" }, { value: "150" }, { value: "450" }, { value: "95.5" }, { value: "0.62" }] },
  ],
};

const DAILY: RawReport = {
  dimensionHeaders: [{ name: "date" }],
  metricHeaders: [{ name: "activeUsers" }],
  rows: [
    { dimensionValues: [{ value: "20260927" }], metricValues: [{ value: "4" }] },
    { dimensionValues: [{ value: "20261003" }], metricValues: [{ value: "9" }] },
  ],
};

function ranked(dimension: string, metric: string, rows: [string, number][]): RawReport {
  return {
    dimensionHeaders: [{ name: dimension }],
    metricHeaders: [{ name: metric }],
    rows: rows.map(([label, value]) => ({ dimensionValues: [{ value: label }], metricValues: [{ value: String(value) }] })),
  };
}

const EVENTS: RawReport = {
  dimensionHeaders: [{ name: "dateRange" }],
  metricHeaders: [{ name: "eventCount" }],
  rows: [{ dimensionValues: [{ value: "current" }], metricValues: [{ value: "6" }] }],
};

function jsonResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

type Body = { dimensions?: { name: string }[]; metrics: { name: string }[]; dimensionFilter?: unknown; dateRanges?: unknown };

/** Answers like Google would, by looking at what each report asks for. */
function googleAnswer(url: string, body: Body, overrides: Record<string, ReturnType<typeof jsonResponse>> = {}) {
  if (url.endsWith(":runRealtimeReport")) {
    return overrides.realtime ?? jsonResponse(200, { metricHeaders: [{ name: "activeUsers" }], rows: [{ metricValues: [{ value: "3" }] }] });
  }
  const dim = body.dimensions?.[0]?.name;
  const metric = body.metrics[0].name;
  const key = dim ?? (metric === "eventCount" ? "events" : "totals");
  if (overrides[key]) return overrides[key];
  switch (key) {
    case "totals":
      return jsonResponse(200, TOTALS);
    case "events":
      return jsonResponse(200, EVENTS);
    case "date":
      return jsonResponse(200, DAILY);
    case "pagePath":
      return jsonResponse(200, ranked("pagePath", "screenPageViews", [["/", 300], ["/products", 50]]));
    case "country":
      return jsonResponse(200, ranked("country", "activeUsers", [["Bangladesh", 70], ["Germany", 20]]));
    case "sessionDefaultChannelGroup":
      return jsonResponse(200, ranked("sessionDefaultChannelGroup", "sessions", [["Organic Search", 90], ["Direct", 40]]));
    case "deviceCategory":
      return jsonResponse(200, ranked("deviceCategory", "activeUsers", [["mobile", 80], ["desktop", 40]]));
  }
  return jsonResponse(500, {});
}

const fetchMock = vi.fn();
function routeFetch(overrides: Record<string, ReturnType<typeof jsonResponse>> = {}) {
  fetchMock.mockImplementation(async (url: string, init: { body: string }) => {
    if (url === GOOGLE_TOKEN_URL) return jsonResponse(200, { access_token: "tok", expires_in: 3600 });
    return googleAnswer(url, JSON.parse(init.body), overrides);
  });
}
function reportCalls() {
  return fetchMock.mock.calls.filter(([url]) => url !== GOOGLE_TOKEN_URL);
}

beforeEach(() => {
  __resetAnalyticsCache();
  __resetGoogleTokenCache();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GA4 response parsing", () => {
  it("keys rows by header name", () => {
    expect(parseReport(ranked("pagePath", "screenPageViews", [["/", 12]]))).toEqual([
      { dimensions: { pagePath: "/" }, metrics: { screenPageViews: 12 } },
    ]);
    expect(parseReport({})).toEqual([]);
  });

  it("splits totals into current and previous periods", () => {
    const totals = parseTotals(TOTALS);
    expect(totals.current).toEqual({
      activeUsers: 120,
      sessions: 150,
      screenPageViews: 450,
      averageSessionDuration: 95.5,
      engagementRate: 0.62,
    });
    expect(totals.previous.activeUsers).toBe(80);
    expect(percentChange(totals.current.activeUsers, totals.previous.activeUsers)).toBe(50);
    expect(percentChange(totals.current.sessions, totals.previous.sessions)).toBe(50);
    expect(percentChange(totals.current.engagementRate, totals.previous.engagementRate)).toBeCloseTo(24);
  });

  it("treats a period with no row as zeros", () => {
    expect(parseEventCount(EVENTS)).toEqual({ current: 6, previous: 0 });
    expect(parseTotals({ ...TOTALS, rows: [] }).current.activeUsers).toBe(0);
  });

  it("fills every day of the range, 0 where GA4 has no row", () => {
    const points = parseDaily(DAILY, { start: "2026-09-27", end: "2026-10-03" });
    expect(points).toHaveLength(7);
    expect(points[0]).toEqual({ date: "2026-09-27", value: 4 });
    expect(points[1]).toEqual({ date: "2026-09-28", value: 0 });
    expect(points[6]).toEqual({ date: "2026-10-03", value: 9 });
  });

  it("maps ranked rows and labels blanks as (not set)", () => {
    expect(parseRanked(ranked("country", "activeUsers", [["", 3], ["Bangladesh", 9]]), "country", "activeUsers")).toEqual([
      { label: "(not set)", value: 3 },
      { label: "Bangladesh", value: 9 },
    ]);
  });

  it("reads realtime active users (0 when nobody is on)", () => {
    expect(parseRealtime({ metricHeaders: [{ name: "activeUsers" }], rows: [{ metricValues: [{ value: "4" }] }] })).toBe(4);
    expect(parseRealtime({ metricHeaders: [{ name: "activeUsers" }] })).toBe(0);
  });
});

describe("dimensionFilter", () => {
  it("filters to the hostname, AND-ed with any extra filter", () => {
    expect(dimensionFilter(null)).toBeUndefined();
    expect(dimensionFilter("novasstrading.com")).toEqual({
      filter: { fieldName: "hostName", stringFilter: { matchType: "EXACT", value: "novasstrading.com" } },
    });
    const extra = { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "contact_form_submit" } } };
    expect(dimensionFilter("novasstrading.com", extra)).toEqual({
      andGroup: { expressions: [dimensionFilter("novasstrading.com"), extra] },
    });
    expect(dimensionFilter(null, extra)).toEqual(extra);
  });
});

describe("getGa4Dashboard", () => {
  it("is not connected (no fetch) while env values are missing", async () => {
    expect(await getGa4Dashboard(28, { env: {}, now: NOW })).toEqual({
      status: "not_connected",
      missing: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"],
    });
    expect(await getGa4Dashboard(28, { env: { ...ENV, GA4_PROPERTY_ID: "" }, now: NOW })).toMatchObject({
      missing: ["GA4_PROPERTY_ID"],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a malformed property ID as one source-level error", async () => {
    const result = await getGa4Dashboard(28, { env: { ...ENV, GA4_PROPERTY_ID: "G-ABC123" }, now: NOW });
    expect(result).toMatchObject({ status: "error" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads every panel for the chosen range and the previous period", async () => {
    routeFetch();
    const result = await getGa4Dashboard(7, { env: ENV, now: NOW });
    if (result.status !== "connected") throw new Error(`unexpected ${result.status}`);

    expect(result.period).toEqual({
      current: { start: "2026-09-27", end: "2026-10-03" },
      previous: { start: "2026-09-20", end: "2026-09-26" },
    });
    expect(result.totals).toEqual({ ok: true, data: parseTotals(TOTALS) });
    expect(result.daily.ok && result.daily.data).toHaveLength(7);
    expect(result.pages).toEqual({ ok: true, data: [{ label: "/", value: 300 }, { label: "/products", value: 50 }] });
    expect(result.countries.ok && result.countries.data[0]).toEqual({ label: "Bangladesh", value: 70 });
    expect(result.channels.ok && result.channels.data[0].label).toBe("Organic Search");
    expect(result.devices.ok && result.devices.data[0].label).toBe("mobile");
    expect(result.contactForms).toEqual({ ok: true, data: { current: 6, previous: 0 } });
    expect(result.realtime).toEqual({ ok: true, data: 3 });

    const urls = reportCalls().map(([url]) => url);
    expect(urls).toContain("https://analyticsdata.googleapis.com/v1beta/properties/123456789:runReport");
    expect(urls).toContain("https://analyticsdata.googleapis.com/v1beta/properties/123456789:runRealtimeReport");

    const totalsBody = reportCalls()
      .map(([, init]) => JSON.parse(init.body))
      .find((b) => !b.dimensions && b.metrics[0].name === "activeUsers" && b.dateRanges);
    expect(totalsBody.dateRanges).toEqual([
      { startDate: "2026-09-27", endDate: "2026-10-03", name: "current" },
      { startDate: "2026-09-20", endDate: "2026-09-26", name: "previous" },
    ]);
    expect(totalsBody.dimensionFilter).toBeUndefined();
  });

  it("filters every report but realtime to GA4_HOSTNAME when set", async () => {
    routeFetch();
    await getGa4Dashboard(28, { env: { ...ENV, GA4_HOSTNAME: "novasstrading.com" }, now: NOW });
    const bodies = reportCalls().map(([url, init]) => ({ url, body: JSON.parse(init.body) }));
    for (const { url, body } of bodies) {
      const text = JSON.stringify(body.dimensionFilter ?? null);
      if (url.endsWith(":runRealtimeReport")) expect(body.dimensionFilter).toBeUndefined();
      else expect(text).toContain('"fieldName":"hostName"');
    }
    const events = bodies.find(({ body }) => body.metrics[0].name === "eventCount")!.body;
    expect(JSON.stringify(events.dimensionFilter)).toContain("contact_form_submit");
  });

  it("shows a per-panel error and still renders the rest", async () => {
    routeFetch({
      pagePath: jsonResponse(403, { error: { code: 403, message: "User does not have sufficient permissions for this property.", status: "PERMISSION_DENIED" } }),
    });
    const result = await getGa4Dashboard(28, { env: ENV, now: NOW });
    if (result.status !== "connected") throw new Error(`unexpected ${result.status}`);

    expect(result.pages).toEqual({
      ok: false,
      error: "Google says: permission denied — add the service account as a Viewer in GA4 (Admin → Property access management).",
    });
    expect(result.totals.ok).toBe(true);
    expect(result.countries.ok).toBe(true);
  });

  it("reports a rejected key once, at source level", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: "invalid_grant", error_description: "Invalid JWT Signature." }));
    const result = await getGa4Dashboard(28, { env: ENV, now: NOW });
    expect(result).toEqual({ status: "error", message: expect.stringMatching(/rejected the service-account key/) });
  });

  it("caches reports for 10 minutes", async () => {
    routeFetch();
    await getGa4Dashboard(28, { env: ENV, now: NOW });
    const first = reportCalls().length;
    expect(first).toBe(8);
    await getGa4Dashboard(28, { env: ENV, now: NOW });
    expect(reportCalls().length).toBe(first);
  });
});
