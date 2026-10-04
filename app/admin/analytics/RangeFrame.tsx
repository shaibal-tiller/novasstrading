"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RANGE_OPTIONS, type RangeDays } from "@/lib/analytics/range";

/**
 * The date-range control (?range=7|28|90) plus the frame it scopes. While a
 * new range loads, the current numbers stay on screen, dimmed — no layout jump.
 * The options are real links, so they also work before JS loads.
 */
export function RangeFrame({ range, children }: { range: RangeDays; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(e: React.MouseEvent<HTMLAnchorElement>, days: RangeDays) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (days === range) return;
    startTransition(() => router.push(`/admin/analytics?range=${days}`, { scroll: false }));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Date range" className="inline-flex rounded-full border border-ink/15 bg-paper p-1">
          {RANGE_OPTIONS.map((days) => {
            const active = days === range;
            return (
              <a
                key={days}
                href={`/admin/analytics?range=${days}`}
                aria-current={active ? "true" : undefined}
                onClick={(e) => choose(e, days)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 ${
                  active ? "bg-ink text-ivory" : "text-ink-muted hover:bg-brass/10 hover:text-ink"
                }`}
              >
                {days} days
              </a>
            );
          })}
        </div>
        {pending && (
          <span role="status" className="text-xs text-ink-muted">
            Loading…
          </span>
        )}
      </div>
      <div aria-busy={pending} className={`flex flex-col gap-8 transition-opacity ${pending ? "opacity-50" : ""}`}>
        {children}
      </div>
    </>
  );
}
