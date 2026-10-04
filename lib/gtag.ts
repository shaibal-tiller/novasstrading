/**
 * Google tag (GA4) helpers for the public site, with Consent Mode v2.
 * Nothing here loads Google's script — ConsentBanner does that, and only
 * after the visitor clicks Accept.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    /** Reopens the cookie banner (Footer → "Cookie settings"). */
    openCookieSettings?: () => void;
  }
}

export const CONSENT_STORAGE_KEY = "nova_consent";
export type ConsentChoice = "granted" | "denied";

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Private mode / blocked storage: the choice just lasts for this page view.
  }
}

/** gtag.js expects real `arguments` objects in the dataLayer, hence `function`. */
function ensureGtag(): (...args: unknown[]) => void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

function queued(command: string, arg: unknown): boolean {
  return (window.dataLayer ?? []).some((entry) => {
    const e = entry as ArrayLike<unknown> | null;
    return !!e && typeof e === "object" && e[0] === command && e[1] === arg;
  });
}

/** Consent Mode v2 defaults: everything denied until the visitor accepts. Queued once per page. */
export function setConsentDefaults(): void {
  const gtag = ensureGtag();
  if (queued("consent", "default")) return;
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

/** After Accept: allow analytics storage and configure the property (once). */
export function grantAnalytics(measurementId: string): void {
  setConsentDefaults();
  const gtag = ensureGtag();
  gtag("consent", "update", { analytics_storage: "granted" });
  if (!queued("config", measurementId)) {
    gtag("js", new Date());
    gtag("config", measurementId);
  }
}

/** After Decline (e.g. changing their mind via Cookie settings): deny again and drop GA cookies. */
export function denyAnalytics(): void {
  if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: "denied" });
  try {
    const names = document.cookie
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid");
    const labels = window.location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < labels.length - 1; i++) domains.push(`; domain=.${labels.slice(i).join(".")}`);
    for (const name of names) for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
  } catch {
    // Best effort only.
  }
}

/** Send a GA4 event if the Google tag is on the page; otherwise do nothing. */
export function trackEvent(name: string): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name);
  } catch {
    // Analytics must never break the page.
  }
}
