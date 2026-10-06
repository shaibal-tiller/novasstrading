"use client";

import { useEffect, useRef } from "react";
import { AdminIcon, type AdminIconName } from "@/components/admin/AdminIcon";

/**
 * A module card on the /admin dashboard. Plain <a> (not next/link): Assets is a
 * separate app behind a rewrite, so it needs a full navigation. React only
 * honours autoFocus on form controls, so the default card focuses itself.
 */
export function ModuleCard({
  href,
  label,
  blurb,
  icon,
  primary,
}: {
  href: string;
  label: string;
  blurb: string;
  icon: AdminIconName;
  primary: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (primary) ref.current?.focus();
  }, [primary]);

  return (
    <a
      ref={ref}
      href={href}
      className={`group relative flex h-full min-h-[13rem] flex-col gap-4 overflow-hidden rounded-3xl border p-6 shadow-[0_1px_2px_rgba(22,25,31,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-24px_rgba(22,25,31,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 ${
        primary ? "border-ink bg-ink text-ivory" : "border-ink/10 bg-white text-ink hover:border-brass"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${
          primary ? "bg-brass/30 opacity-70" : "bg-brass/15 opacity-0"
        }`}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl ${
            primary ? "bg-brass text-ink" : "bg-brass/10 text-brass-dark"
          }`}
        >
          <AdminIcon name={icon} className="h-6 w-6" />
        </span>
        {primary && (
          <span className="rounded-full border border-ivory/25 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ivory/80">
            Default
          </span>
        )}
      </div>
      <div className="relative flex flex-1 flex-col gap-1.5">
        <span className="display-md">{label}</span>
        <span className={`text-sm leading-relaxed ${primary ? "text-ivory/75" : "text-ink-muted"}`}>{blurb}</span>
      </div>
      <span
        className={`relative inline-flex items-center gap-2 text-sm font-semibold ${
          primary ? "text-brass-light" : "text-brass-dark"
        }`}
      >
        Open
        <AdminIcon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </a>
  );
}
