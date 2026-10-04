// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { __resetAnalyticsCache } from "@/lib/analytics/cache";
import { __resetGoogleTokenCache, GOOGLE_TOKEN_URL } from "@/lib/analytics/google-auth";
import {
  getSearchConsoleDashboard,
  parseGscRows,
  parseGscTotals,
  searchAnalyticsUrl,
} from "@/lib/analytics/search-console";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const ENV = {
  GOOGLE_SERVICE_ACCOUNT_JSON: Buffer.from(
    JSON.stringify({ client_email: "reader@nova-test.iam.gserviceaccount.com", private_key: privateKey }),
  ).toString("base64"),
  GSC_SITE_URL: "sc-domain:novasstrading.com",
};
const NOW = new Date("2026-10-04T10:00:00Z"); // 03:00 in Los Angeles → 2026-10-04 there

function jsonResponse(status: number, body: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

const fetchMock = vi.fn();

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

describe("Search Console parsing", () => {
  it("reads the totals row, zeros when there is no data", () => {
    expect(parseGscTotals({ rows: [{ clicks: 12, impressions: 340, ctr: 0.035, position: 8.2 }] })).toEqual({
      clicks: 12,
      impressions: 340,
      ctr: 0.035,
      position: 8.2,
    });
    expect(parseGscTotals({})).toEqual({ clicks: 0, impressions: 0, ctr: 0, position: 0 });
  });

  it("maps keyed rows", () => {
    expect(
      parseGscRows({
        rows: [
          { keys: ["garments buying house bangladesh"], clicks: 5, impressions: 90, ctr: 0.055, position: 4.1 },
          { keys: [], clicks: 1, impressions: 2, ctr: 0.5, position: 1 },
        ],
      }),
    ).toEqual([
      { label: "garments buying house bangladesh", clicks: 5, impressions: 90, ctr: 0.055, position: 4.1 },
      { label: "(not set)", clicks: 1, impressions: 2, ctr: 0.5, position: 1 },
    ]);
  });

  it("URL-encodes the site in the endpoint", () => {
    expect(searchAnalyticsUrl("https://novasstrading.com/")).toBe(
      "https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fnovasstrading.com%2F/searchAnalytics/query",
    );
  });
});

describe("getSearchConsoleDashboard", () => {
  it("is not connected (no fetch) without GSC_SITE_URL", async () => {
    expect(await getSearchConsoleDashboard(28, { env: { ...ENV, GSC_SITE_URL: "" }, now: NOW })).toEqual({
      status: "not_connected",
      missing: ["GSC_SITE_URL"],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("queries totals for both periods (ending 3 days ago), top searches and top pages", async () => {
    fetchMock.mockImplementation(async (url: string, init: { body: string }) => {
      if (url === GOOGLE_TOKEN_URL) return jsonResponse(200, { access_token: "tok", expires_in: 3600 });
      const body = JSON.parse(init.body);
      if (body.dimensions.length === 0) {
        const clicks = body.endDate === "2026-10-01" ? 30 : 20;
        return jsonResponse(200, { rows: [{ clicks, impressions: 1000, ctr: clicks / 1000, position: 7.5 }] });
      }
      return jsonResponse(200, { rows: [{ keys: [body.dimensions[0] === "query" ? "nova ss trading" : "https://novasstrading.com/"], clicks: 9, impressions: 50, ctr: 0.18, position: 1.4 }] });
    });

    const result = await getSearchConsoleDashboard(28, { env: ENV, now: NOW });
    if (result.status !== "connected") throw new Error(`unexpected ${result.status}`);

    expect(result.period).toEqual({
      current: { start: "2026-09-04", end: "2026-10-01" },
      previous: { start: "2026-08-07", end: "2026-09-03" },
    });
    expect(result.totals).toEqual({
      ok: true,
      data: {
        current: { clicks: 30, impressions: 1000, ctr: 0.03, position: 7.5 },
        previous: { clicks: 20, impressions: 1000, ctr: 0.02, position: 7.5 },
      },
    });
    expect(result.queries.ok && result.queries.data[0].label).toBe("nova ss trading");
    expect(result.pages.ok && result.pages.data[0].label).toBe("https://novasstrading.com/");

    const calls = fetchMock.mock.calls.filter(([url]) => url !== GOOGLE_TOKEN_URL);
    expect(calls).toHaveLength(4);
    for (const [url, init] of calls) {
      expect(url).toBe(
        "https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Anovasstrading.com/searchAnalytics/query",
      );
      expect(init.headers.authorization).toBe("Bearer tok");
    }
    const queryBody = calls.map(([, init]) => JSON.parse(init.body)).find((b) => b.dimensions[0] === "query");
    expect(queryBody).toEqual({ startDate: "2026-09-04", endDate: "2026-10-01", dimensions: ["query"], rowLimit: 10 });

    // the token was requested with the Search Console scope
    const tokenCall = fetchMock.mock.calls.find(([url]) => url === GOOGLE_TOKEN_URL)!;
    const assertion = new URLSearchParams(tokenCall[1].body).get("assertion")!;
    expect(JSON.parse(Buffer.from(assertion.split(".")[1], "base64url").toString()).scope).toBe(
      "https://www.googleapis.com/auth/webmasters.readonly",
    );
  });

  it("explains a permission error on each failing panel", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === GOOGLE_TOKEN_URL) return jsonResponse(200, { access_token: "tok", expires_in: 3600 });
      return jsonResponse(403, { error: { code: 403, message: "User does not have sufficient permission for site", status: "PERMISSION_DENIED" } });
    });
    const result = await getSearchConsoleDashboard(7, { env: ENV, now: NOW });
    if (result.status !== "connected") throw new Error(`unexpected ${result.status}`);
    expect(result.queries).toEqual({
      ok: false,
      error:
        "Google says: permission denied — add the service account as a Restricted user in Search Console (Settings → Users and permissions).",
    });
    expect(result.totals.ok).toBe(false);
  });
});
