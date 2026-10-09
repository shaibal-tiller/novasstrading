// @vitest-environment node
import { describe, it, expect } from "vitest";
import { allMissingEnv, ga4Hostname, missingEnv, normalizePropertyId } from "@/lib/analytics/config";
import { describeGoogleError, GoogleApiError, GoogleConfigError } from "@/lib/analytics/errors";

const FULL = {
  GOOGLE_SERVICE_ACCOUNT_JSON: "{}",
  GA4_PROPERTY_ID: "123456789",
  GSC_SITE_URL: "https://novasstrading.com/",
};

describe("not connected detection", () => {
  it("is connected when every value is present", () => {
    expect(missingEnv("ga4", FULL)).toEqual([]);
    expect(missingEnv("searchConsole", FULL)).toEqual([]);
    expect(allMissingEnv(FULL)).toEqual([]);
  });

  it("lists exactly what each source is missing (blank counts as missing)", () => {
    const env = { ...FULL, GA4_PROPERTY_ID: "  ", GSC_SITE_URL: undefined };
    expect(missingEnv("ga4", env)).toEqual(["GA4_PROPERTY_ID"]);
    expect(missingEnv("searchConsole", env)).toEqual(["GSC_SITE_URL"]);
  });

  it("lists the shared key once when nothing is set", () => {
    expect(allMissingEnv({})).toEqual(["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID", "GSC_SITE_URL"]);
  });

  it("treats GA4_HOSTNAME as optional", () => {
    expect(ga4Hostname({})).toBeNull();
    expect(ga4Hostname({ GA4_HOSTNAME: " novasstrading.com " })).toBe("novasstrading.com");
  });
});

describe("normalizePropertyId", () => {
  it("accepts the bare number or properties/<n>", () => {
    expect(normalizePropertyId("123456789")).toBe("123456789");
    expect(normalizePropertyId(" properties/123456789 ")).toBe("123456789");
  });

  it("rejects a G- measurement ID with a helpful message", () => {
    expect(() => normalizePropertyId("G-ABC123")).toThrow(/numeric property ID/);
  });
});

describe("describeGoogleError", () => {
  it("explains permission problems per source", () => {
    const denied = new GoogleApiError("User does not have sufficient permissions", 403, "PERMISSION_DENIED");
    expect(describeGoogleError(denied, "ga4")).toBe(
      "Google says: permission denied — add the service account as a Viewer in GA4 (Admin → Property access management).",
    );
    expect(describeGoogleError(denied, "searchConsole")).toMatch(/Restricted user in Search Console/);
  });

  it("explains a disabled API, a rejected key, quota and network problems", () => {
    expect(describeGoogleError(new GoogleApiError("x", 403, "SERVICE_DISABLED"), "ga4")).toMatch(
      /Google Analytics Data API is not enabled/,
    );
    expect(describeGoogleError(new GoogleApiError("x", 400, "invalid_grant"), "ga4")).toMatch(/rejected the service-account key/);
    expect(describeGoogleError(new GoogleApiError("x", 429), "searchConsole")).toMatch(/quota/);
    expect(describeGoogleError(new GoogleApiError("x", 0, "NETWORK"), "ga4")).toMatch(/Could not reach Google/);
    expect(describeGoogleError(new GoogleConfigError("Bad key."), "ga4")).toBe("Bad key.");
  });
});
