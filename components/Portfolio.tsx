"use client";

import Image from "next/image";
import { useState } from "react";
import { portfolio } from "@/lib/content";
import { clsx } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function Portfolio() {
  const [active, setActive] = useState(portfolio.tabs[0].key);
  const tab = portfolio.tabs.find((t) => t.key === active) ?? portfolio.tabs[0];

  return (
    <section id="portfolio" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="max-w-2xl">
          <p className="eyebrow">{portfolio.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{portfolio.title}</h2>
          <p className="lede mt-5">{portfolio.intro}</p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Sourcing portfolio categories"
          className="mt-10 flex flex-wrap gap-2"
        >
          {portfolio.tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={t.key === active}
              onClick={() => setActive(t.key)}
              className={clsx(
                "rounded-full border px-6 py-2.5 font-sans text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-300",
                t.key === active
                  ? "border-brass bg-brass text-ivory shadow-[0_10px_24px_-12px_rgba(176,138,79,0.7)]"
                  : "border-ink/15 bg-transparent text-ink hover:border-brass hover:text-brass-dark",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <ul
          key={`cats-${tab.key}`}
          className="mt-8 flex flex-wrap gap-2"
          aria-label={`${tab.label} categories`}
        >
          {tab.categories.map((c, i) => (
            <li
              key={c}
              className="animate-fade-up rounded-sm border border-ink/10 bg-canvas px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-muted"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {c}
            </li>
          ))}
        </ul>

        {/* Photo grid */}
        <div
          key={`grid-${tab.key}`}
          className="mt-10 grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {tab.photos.map((p, i) => (
            <figure
              key={p.src}
              className="group animate-fade-up relative overflow-hidden rounded-sm border border-ink/5 bg-ivory"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={`/assets/${p.src}`}
                  alt={p.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/70 to-transparent p-3 pt-8 text-xs font-medium text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {p.alt.split("— ")[1] ?? p.alt}
              </figcaption>
            </figure>
          ))}
        </div>

        <Reveal className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/10 pt-6">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
            {portfolio.extra.label}:
          </span>
          {portfolio.extra.items.map((x) => (
            <span
              key={x}
              className="font-display text-base font-medium text-ink-muted"
            >
              {x}
              <span aria-hidden className="ml-3 text-brass">
                ·
              </span>
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
