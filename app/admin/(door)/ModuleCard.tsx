"use client";

import { useEffect, useRef } from "react";

/**
 * A module link on the /admin chooser. Plain <a> (not next/link): Assets is a
 * separate app behind a rewrite, so it needs a full navigation. React only
 * honours autoFocus on form controls, so the default card focuses itself.
 */
export function ModuleCard({
  href,
  label,
  blurb,
  primary,
}: {
  href: string;
  label: string;
  blurb: string;
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
      className={`flex flex-col gap-1 rounded-2xl border p-5 transition-colors focus:outline-none focus:ring-2 focus:ring-brass/40 ${
        primary
          ? "border-ink bg-ink text-ivory hover:bg-brass-dark"
          : "border-ink/15 text-ink hover:border-brass hover:bg-brass/10"
      }`}
    >
      <span className="display-md">{label}</span>
      <span className={`text-sm ${primary ? "text-ivory/80" : "text-ink-muted"}`}>{blurb}</span>
    </a>
  );
}
