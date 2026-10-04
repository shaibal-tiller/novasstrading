/** A Google env value is present but unusable (malformed key, wrong ID format). */
export class GoogleConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleConfigError";
  }
}

/** Google answered with an error (or could not be reached: status 0, reason "NETWORK"). */
export class GoogleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly reason?: string,
  ) {
    super(message);
    this.name = "GoogleApiError";
  }
}

export type GoogleSource = "ga4" | "searchConsole";

const GRANT_ACCESS: Record<GoogleSource, string> = {
  ga4: "add the service account as a Viewer in GA4 (Admin → Property access management)",
  searchConsole:
    "add the service account as a Restricted user in Search Console (Settings → Users and permissions)",
};

const API_NAME: Record<GoogleSource, string> = {
  ga4: "Google Analytics Data API",
  searchConsole: "Google Search Console API",
};

const NOT_FOUND: Record<GoogleSource, string> = {
  ga4: "Google says: property not found — check GA4_PROPERTY_ID is the numeric property ID (not the G- measurement ID).",
  searchConsole:
    "Google says: site not found — GSC_SITE_URL must match the Search Console property exactly (e.g. https://novasstrading.com/ or sc-domain:novasstrading.com).",
};

const KEY_REJECTED = new Set(["invalid_grant", "invalid_client", "unauthorized_client"]);

/** The one-line message an admin sees on a panel that failed. Never includes secrets. */
export function describeGoogleError(err: unknown, source: GoogleSource): string {
  if (err instanceof GoogleConfigError) return err.message;
  if (err instanceof GoogleApiError) {
    if (err.reason === "NETWORK") return "Could not reach Google — try again in a minute.";
    if (err.reason && KEY_REJECTED.has(err.reason)) {
      return "Google rejected the service-account key — check GOOGLE_SERVICE_ACCOUNT_JSON holds a current key that has not been deleted in Google Cloud.";
    }
    if (
      err.reason === "SERVICE_DISABLED" ||
      err.reason === "accessNotConfigured" ||
      /has not been used in project|is disabled/i.test(err.message)
    ) {
      return `Google says: the ${API_NAME[source]} is not enabled — turn it on in Google Cloud (APIs & Services → Library).`;
    }
    if (err.status === 403) return `Google says: permission denied — ${GRANT_ACCESS[source]}.`;
    if (err.status === 404) return NOT_FOUND[source];
    if (err.status === 429) return "Google says: too many requests (quota reached) — try again in an hour.";
    if (err.status === 401) return "Google says: not signed in — the service-account key may have been revoked.";
    if (err.status >= 500) return "Google is having trouble right now — try again shortly.";
    const msg = err.message.length > 200 ? `${err.message.slice(0, 200)}…` : err.message;
    return `Google says: ${msg}`;
  }
  return "Something went wrong loading this panel.";
}
