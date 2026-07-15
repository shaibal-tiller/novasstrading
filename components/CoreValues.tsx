"use client";

import { useState } from "react";
import { coreValues } from "@/lib/content";
import { clsx } from "@/lib/utils";
import { Reveal } from "./Reveal";

const STEP = 360 / coreValues.values.length; // one bearing per value

export function CoreValues() {
  // null = needle at rest (north); a number = the value being pointed at.
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? null : coreValues.values[active];

  return (
    <section id="values" className="section-wrap">
      <div className="section-card section-card--cream">
        <div className="max-w-2xl">
          <p className="eyebrow">{coreValues.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{coreValues.title}</h2>
          <p className="lede mt-5">{coreValues.intro}</p>
        </div>

        {/* Mobile: 2 × 4 compact grid (compass is hover-only, so omitted here) */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:hidden">
          {coreValues.values.map((v, i) => (
            <div
              key={v.title}
              className="rounded-xl border border-ink/10 bg-ivory/60 p-4"
            >
              <span className="font-mono text-[0.7rem] text-brass-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-display text-sm font-semibold leading-snug text-ink">
                {v.title}
              </h3>
              <p className="mt-1.5 text-[0.75rem] leading-snug text-ink-muted">
                {v.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 hidden gap-12 sm:grid lg:grid-cols-[auto_1fr] lg:gap-16">
          {/* ── The compass: needle swings to the value under the cursor ── */}
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Compass active={active} label={current?.title ?? null} />
          </Reveal>

          {/* ── The values, as editorial rows on stitched hairlines ── */}
          <Reveal delay={80}>
            <ol
              className="border-t border-dashed border-brass/50"
              onMouseLeave={() => setActive(null)}
            >
              {coreValues.values.map((v, i) => {
                const isActive = active === i;
                return (
                  <li
                    key={v.title}
                    tabIndex={0}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className={clsx(
                      "group relative cursor-default border-b border-dashed border-brass/50 py-5 pl-6 pr-4 transition-colors duration-300 focus:outline-none sm:pl-8",
                      isActive ? "bg-ivory/70" : "hover:bg-ivory/70",
                    )}
                  >
                    {/* brass rule that draws down the row edge */}
                    <span
                      aria-hidden
                      className={clsx(
                        "absolute left-0 top-0 h-full w-[2px] origin-top bg-brass transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        isActive ? "scale-y-100" : "scale-y-0",
                      )}
                    />

                    <div className="flex items-baseline gap-4 sm:gap-6">
                      <span
                        className={clsx(
                          "font-mono text-[0.7rem] tabular-nums transition-colors duration-300",
                          isActive ? "text-brass-dark" : "text-ink-muted/70",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3
                          className={clsx(
                            "font-display text-lg font-medium transition-colors duration-300 sm:text-xl",
                            isActive ? "text-brass-dark" : "text-ink",
                          )}
                        >
                          {v.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                          {v.body}
                        </p>
                      </div>

                      {/* the value's monogram, echoing the compass face */}
                      <span
                        aria-hidden
                        className={clsx(
                          "hidden font-display text-3xl font-semibold transition-all duration-500 sm:block",
                          isActive
                            ? "text-brass opacity-100"
                            : "text-ink/15 opacity-70 group-hover:text-ink/25",
                        )}
                      >
                        {v.title.charAt(0)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Compass({
  active,
  label,
}: {
  active: number | null;
  label: string | null;
}) {
  const bearing = active === null ? 0 : active * STEP;

  return (
    <div className="mx-auto w-[16rem] sm:w-[19rem]">
      <div className="relative aspect-square">
        <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
          {/* outer dashed ring */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="rgba(176,138,79,0.45)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="rgba(22,25,31,0.10)"
            strokeWidth="1"
          />

          {/* one tick + node per value, set on its own bearing */}
          {coreValues.values.map((v, i) => {
            const rad = ((i * STEP - 90) * Math.PI) / 180;
            const isActive = active === i;
            return (
              <g key={v.title}>
                <line
                  x1={100 + Math.cos(rad) * 78}
                  y1={100 + Math.sin(rad) * 78}
                  x2={100 + Math.cos(rad) * 92}
                  y2={100 + Math.sin(rad) * 92}
                  stroke={isActive ? "#B08A4F" : "rgba(22,25,31,0.18)"}
                  strokeWidth={isActive ? 2 : 1}
                  className="transition-all duration-300"
                />
                <circle
                  cx={100 + Math.cos(rad) * 78}
                  cy={100 + Math.sin(rad) * 78}
                  r={isActive ? 4.5 : 2.5}
                  fill={isActive ? "#B08A4F" : "rgba(22,25,31,0.22)"}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* needle — rotates to the active bearing */}
          <g
            className="transition-transform duration-700 ease-[cubic-bezier(0.34,1.3,0.44,1)]"
            style={{
              transform: `rotate(${bearing}deg)`,
              transformOrigin: "100px 100px",
            }}
          >
            <path d="M100 30 L106 100 L94 100 Z" fill="#B08A4F" />
            <path d="M100 170 L106 100 L94 100 Z" fill="rgba(22,25,31,0.28)" />
          </g>

          <circle cx="100" cy="100" r="9" fill="#16191F" />
          <circle cx="100" cy="100" r="3" fill="#EFE7DD" />
        </svg>

        {/* the active value's monogram, floating over the compass face */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            aria-hidden
            className={clsx(
              "mt-[5.6rem] font-display text-[2.6rem] font-semibold leading-none transition-all duration-500",
              label ? "text-brass opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            {label?.charAt(0)}
          </span>
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-4 text-center font-mono text-[0.68rem] uppercase tracking-[0.2em] text-ink-muted"
      >
        {label ?? `${coreValues.values.length} values, one direction`}
      </p>
    </div>
  );
}
