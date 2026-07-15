import { Fragment } from "react";
import { sourcing } from "@/lib/content";
import { Reveal } from "./Reveal";
import { ServicePillars } from "./ServicePillars";

export function Sourcing() {
  return (
    <section id="sourcing" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="max-w-2xl">
          <p className="eyebrow">{sourcing.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{sourcing.title}</h2>
          <p className="lede mt-5">{sourcing.intro}</p>
        </div>

        {/* ── Service Pillars infographic (Quick Service / Best Quality / Communication / Problem Solving) ── */}
        <ServicePillars />

        {/* ── Service cards + "we also ensure" checklist, paired on one screen ── */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-12">
          {/* Detailed service cards. Mobile: 2 × 4 grid. */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10">
            {sourcing.services.map((s, i) => (
              <Reveal
                key={s.title}
                as="article"
                delay={(i % 2) * 60}
                className="group bg-ivory p-3.5 transition-colors duration-300 hover:bg-canvas sm:p-6"
              >
                <span className="font-mono text-xs text-brass-dark">
                  S{String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2.5 font-display text-sm font-medium leading-snug text-ink sm:mt-3 sm:text-base">
                  {s.title}
                </h3>
                <p className="mt-1.5 line-clamp-4 text-[0.78rem] leading-relaxed text-ink-muted sm:mt-2 sm:line-clamp-none sm:text-[0.82rem]">
                  {s.body}
                </p>
              </Reveal>
            ))}
          </div>

          {/* Checklist — bullet panel on sm+ (travels with the cards on tall screens) */}
          <Reveal
            delay={80}
            className="hidden rounded-2xl border border-ink/10 bg-canvas p-7 sm:block lg:sticky lg:top-28"
          >
            <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
              {sourcing.checklistLabel}
            </h3>
            <ul className="mt-5 space-y-3">
              {sourcing.checklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-snug text-ink"
                >
                  <span
                    aria-hidden
                    className="mt-[0.42rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Checklist — mobile: chips justified like a paragraph */}
          <div className="sm:hidden">
            <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
              {sourcing.checklistLabel}
            </h3>
            <p className="mt-4 text-justify leading-loose [text-align-last:left]">
              {sourcing.checklist.map((item) => (
                <Fragment key={item}>
                  <span className="inline-block rounded-full border border-ink/15 bg-ivory px-3 py-1 text-[0.72rem] font-medium text-ink">
                    {item}
                  </span>{" "}
                </Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
