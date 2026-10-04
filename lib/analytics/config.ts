import "server-only";
import { GoogleConfigError } from "./errors";
import type { AnalyticsEnvName } from "./types";

type Env = Record<string, string | undefined>;

/** What each env value is for — shown on the "Not connected yet" panel. */
export const ANALYTICS_ENV_HELP: Record<AnalyticsEnvName, string> = {
  GOOGLE_SERVICE_ACCOUNT_JSON:
    "The Google service account's JSON key (raw or base64) — lets this site read your Google data, read-only.",
  GA4_PROPERTY_ID: "The numeric Google Analytics 4 property ID (Admin → Property details), e.g. 123456789.",
  GSC_SITE_URL:
    "The Search Console property, exactly as Google shows it, e.g. https://novasstrading.com/ or sc-domain:novasstrading.com.",
};

/** Which part of the page each value switches on. */
export const ANALYTICS_ENV_UNLOCKS: Record<AnalyticsEnvName, string> = {
  GOOGLE_SERVICE_ACCOUNT_JSON: "Visitors and Google Search",
  GA4_PROPERTY_ID: "Visitors",
  GSC_SITE_URL: "Google Search",
};

const ENV_ORDER: readonly AnalyticsEnvName[] = ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID", "GSC_SITE_URL"];

const NEEDS: Record<"ga4" | "searchConsole", readonly AnalyticsEnvName[]> = {
  ga4: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GA4_PROPERTY_ID"],
  searchConsole: ["GOOGLE_SERVICE_ACCOUNT_JSON", "GSC_SITE_URL"],
};

function isSet(env: Env, name: string): boolean {
  return !!env[name]?.trim();
}

/** The env values a source still needs; empty = that source is connected. */
export function missingEnv(source: "ga4" | "searchConsole", env: Env = process.env): AnalyticsEnvName[] {
  return NEEDS[source].filter((name) => !isSet(env, name));
}

/** Every missing value across both sources, once each, in a stable order. */
export function allMissingEnv(env: Env = process.env): AnalyticsEnvName[] {
  const missing = new Set([...missingEnv("ga4", env), ...missingEnv("searchConsole", env)]);
  return ENV_ORDER.filter((name) => missing.has(name));
}

/** Accepts "123456789" or "properties/123456789". */
export function normalizePropertyId(raw: string): string {
  const id = raw.trim().replace(/^properties\//, "");
  if (!/^\d+$/.test(id)) {
    throw new GoogleConfigError(
      "GA4_PROPERTY_ID should be the numeric property ID (e.g. 123456789), not the G- measurement ID.",
    );
  }
  return id;
}

/** Optional: only count GA4 traffic for this host (keeps staging visits out of production numbers). */
export function ga4Hostname(env: Env = process.env): string | null {
  return env.GA4_HOSTNAME?.trim() || null;
}
