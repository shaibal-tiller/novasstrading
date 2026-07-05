"use client";

import { globalPresence } from "@/lib/content";
import { Reveal } from "./Reveal";
import { useState } from "react";

export function GlobalPresence() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? globalPresence.locations.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === globalPresence.locations.length - 1 ? 0 : c + 1));

  return (
    <section id="presence" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Image slider placeholder */}
          <Reveal>
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#d8ccc0]">
                {globalPresence.locations.map((loc, i) => (
                  <div
                    key={loc.name}
                    className={`absolute inset-0 flex items-center justify-center text-ink/40 font-mono text-sm uppercase tracking-widest transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0"}`}
                  >
                    [ Map/Location {i + 1} Placeholder ]
                  </div>
                ))}
              </div>

              {/* Location label */}
              <div className="mt-4 flex items-center justify-between">
                <p className="font-sans text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                  {globalPresence.locations[current]?.role}
                </p>
                <div className="flex gap-2">
                  <button onClick={prev} className="slider-arrow" aria-label="Previous location">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={next} className="slider-arrow" aria-label="Next location">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Text */}
          <Reveal delay={100}>
            <h2 className="display-lg text-ink">{globalPresence.heading}</h2>
            <div className="lede mt-6 space-y-4">
              {globalPresence.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <div className="mt-8">
              <a href={globalPresence.cta.href} className="btn btn-primary">
                {globalPresence.cta.label}
              </a>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 flex justify-end">
          <a href="#home" className="up-btn">
            <UpArrow /> Up
          </a>
        </div>
      </div>
    </section>
  );
}

function UpArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M5 9V1M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
