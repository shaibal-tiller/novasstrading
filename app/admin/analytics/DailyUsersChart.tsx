"use client";

import { useState } from "react";
import { formatCount, formatDayLabel, formatShortDate, niceTicks } from "@/lib/analytics/format";
import type { DailyPoint } from "@/lib/analytics/types";

/**
 * Daily visitors as an inline-SVG line (no chart library). The SVG only draws
 * the line and its wash, stretched to fit (non-scaling 2px stroke); dots,
 * labels, crosshair and tooltip are HTML positioned in %, so they stay crisp
 * and readable at any width. Hover, touch or arrow keys read each day; the
 * same numbers are in the table below.
 */

const W = 1000;
const H = 100;
/** Headroom above the highest tick, in % of the plot height, for the end label. */
const HEADROOM = 8;
const LINE = "#1E4D4A"; // tailwind loom

export function DailyUsersChart({ points }: { points: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  if (n === 0) return <p className="text-sm text-ink-muted">No data for this period yet.</p>;

  const max = Math.max(0, ...points.map((p) => p.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const last = n - 1;

  const xPct = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const yPct = (v: number) => HEADROOM + (1 - v / top) * (100 - HEADROOM);

  const coords = points.map((p, i) => [(xPct(i) / 100) * W, (yPct(p.value) / 100) * H] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
  const area = `${line}L${coords[last][0].toFixed(2)},${H}L${coords[0][0].toFixed(2)},${H}Z`;

  function pick(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
    setActive(Math.min(last, Math.max(0, Math.round(ratio * last))));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const current = active ?? last;
    const next =
      e.key === "ArrowLeft" ? current - 1 : e.key === "ArrowRight" ? current + 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    setActive(Math.min(last, Math.max(0, next)));
  }

  const shown = active ?? last;
  const shownX = xPct(shown);
  const shownY = yPct(points[shown].value);
  const tooltipSide: React.CSSProperties =
    shownX > 60 ? { right: `${100 - shownX}%`, marginRight: 10 } : { left: `${shownX}%`, marginLeft: 10 };

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative h-48 w-9 shrink-0 sm:h-56" aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2 text-[0.68rem] tabular-nums text-ink-muted"
              style={{ top: `${yPct(t)}%` }}
            >
              {formatCount(t)}
            </span>
          ))}
        </div>

        <div
          role="group"
          tabIndex={0}
          aria-label="Daily visitors chart. Use the left and right arrow keys to read each day."
          className="relative h-48 flex-1 touch-pan-y rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brass/40 sm:h-56"
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-ink/10" style={{ top: `${yPct(t)}%` }} aria-hidden="true" />
          ))}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <path d={area} fill={LINE} fillOpacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke={LINE}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {active !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-ink/30"
              style={{ left: `${shownX}%` }}
              aria-hidden="true"
            />
          )}

          <span
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
            style={{ left: `${shownX}%`, top: `${shownY}%`, backgroundColor: LINE }}
            aria-hidden="true"
          />

          {active === null ? (
            <span
              className="pointer-events-none absolute -translate-x-full -translate-y-full pb-1 pr-2 text-xs font-semibold text-ink"
              style={{ left: `${shownX}%`, top: `${shownY}%` }}
            >
              {formatCount(points[last].value)}
            </span>
          ) : (
            <div
              aria-live="polite"
              className="pointer-events-none absolute top-1 z-10 whitespace-nowrap rounded-lg border border-ink/10 bg-canvas px-3 py-2 shadow-sm"
              style={tooltipSide}
            >
              <div className="text-sm font-semibold text-ink">
                {formatCount(points[shown].value)} {points[shown].value === 1 ? "visitor" : "visitors"}
              </div>
              <div className="text-xs text-ink-muted">{formatDayLabel(points[shown].date)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="ml-11 flex justify-between text-[0.68rem] text-ink-muted" aria-hidden="true">
        <span>{formatShortDate(points[0].date)}</span>
        <span>{formatShortDate(points[last].date)}</span>
      </div>

      <details className="mt-1 text-sm">
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-brass-dark">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-ink-muted">
                <th className="py-1 font-medium">Day</th>
                <th className="py-1 text-right font-medium">Visitors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {points.map((p) => (
                <tr key={p.date}>
                  <td className="py-1 text-ink">{formatDayLabel(p.date)}</td>
                  <td className="py-1 text-right tabular-nums text-ink">{formatCount(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
