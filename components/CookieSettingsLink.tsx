"use client";

/**
 * Footer link that reopens the cookie banner (ConsentBanner registers
 * window.openCookieSettings). Kept apart from ConsentBanner so the footer
 * does not pull the banner's code into the page bundle.
 */
export function CookieSettingsLink({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.openCookieSettings?.()}>
      Cookie settings
    </button>
  );
}
