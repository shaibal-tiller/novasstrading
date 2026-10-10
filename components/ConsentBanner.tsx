"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  denyAnalytics,
  grantAnalytics,
  readConsent,
  setConsentDefaults,
  writeConsent,
  type ConsentChoice,
} from "@/lib/gtag";

/**
 * Cookie consent + Google Analytics, public pages only. Renders nothing (and
 * loads nothing) without a measurement ID or on /admin. Consent Mode v2
 * defaults are queued as "denied" first. A saved choice always wins. With no
 * saved choice, /api/region says whether the visitor's country requires an
 * opt-in (EU/EEA/UK/Switzerland, or unknown): if so the bar asks and gtag.js
 * loads only after Accept; if not, they are counted without a bar (nothing is
 * saved, so "Cookie settings" can still opt them out).
 * Nothing is rendered on the server; the bar appears after hydration only.
 */
export function ConsentBanner({
  measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
}: {
  measurementId?: string;
}) {
  const id = measurementId?.trim();
  const pathname = usePathname() ?? "";
  const active = !!id && !pathname.startsWith("/admin");

  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [open, setOpen] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const reopened = useRef(false);

  useEffect(() => {
    if (!active || !id) return;
    setConsentDefaults();
    const stored = readConsent();
    if (stored === "granted") grantAnalytics(id);
    setChoice(stored);
    setOpen(false);

    let cancelled = false;
    if (stored === null) {
      fetch("/api/region", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { consentRequired: true }))
        .catch(() => ({ consentRequired: true }))
        .then((data: { consentRequired?: boolean }) => {
          if (cancelled || readConsent() !== null) return;
          if (data.consentRequired === false) {
            grantAnalytics(id);
            setChoice("granted");
          } else {
            setOpen(true);
          }
        });
    }

    const reopen = () => {
      reopened.current = true;
      setOpen(true);
    };
    window.openCookieSettings = reopen;
    return () => {
      cancelled = true;
      if (window.openCookieSettings === reopen) delete window.openCookieSettings;
    };
  }, [active, id]);

  useEffect(() => {
    if (open && reopened.current) {
      reopened.current = false;
      firstButton.current?.focus();
    }
  }, [open]);

  if (!active || !id) return null;

  function decide(next: ConsentChoice) {
    writeConsent(next);
    if (next === "granted") grantAnalytics(id!);
    else denyAnalytics();
    setChoice(next);
    setOpen(false);
  }

  return (
    <>
      {choice === "granted" && (
        <Script
          id="ga-gtag"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
          strategy="afterInteractive"
        />
      )}
      {open && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-ivory/10 bg-ink/95 text-ivory shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.45)] backdrop-blur"
        >
          <div className="shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="text-sm text-ivory/85">
              We use analytics cookies to understand how visitors use this site.{" "}
              <a href="/privacy" className="underline underline-offset-2 hover:text-brass-light">
                Privacy policy
              </a>
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                ref={firstButton}
                type="button"
                onClick={() => decide("denied")}
                className="rounded-full border border-ivory/30 px-5 py-2 text-xs font-semibold tracking-wide transition-colors hover:bg-ivory/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-light"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => decide("granted")}
                className="rounded-full bg-brass px-5 py-2 text-xs font-semibold tracking-wide text-ink transition-colors hover:bg-brass-light focus:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
