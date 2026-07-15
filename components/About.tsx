"use client";

import { useState } from "react";
import { about } from "@/lib/content";
import { clsx } from "@/lib/utils";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

export function About() {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"mission" | "vision">("mission");
  const mv = tab === "mission" ? about.mission : about.vision;

  return (
    <section id="about" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">{about.eyebrow}</p>
            <h2 className="display-lg mt-5 text-ink">{about.title}</h2>

            {/* Mobile: collapsible intro */}
            <div className="mt-6 sm:hidden">
              {expanded ? (
                <div className="lede space-y-4">
                  {about.body.map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              ) : (
                <p className="lede line-clamp-3">{about.body[0]}</p>
              )}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-brass-dark underline-offset-4 hover:underline"
              >
                {expanded ? "Read less" : "Read more"}
              </button>
            </div>

            {/* Desktop: full intro */}
            <div className="lede mt-6 hidden max-w-xl space-y-4 sm:block">
              {about.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            <ul className="mt-8 space-y-3">
              {about.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-ink">
                  <Check />
                  <span className="font-medium">{h}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Right column: image + mission/vision */}
          <div className="relative pb-6">
            {/* Mobile: short image + Mission/Vision tabs */}
            <div className="sm:hidden">
              <ContentMedia
                src="products/categories/kidswear-1.jpg"
                alt="Kidswear production — teal tracksuit sets from our factory network"
                aspect="aspect-[16/10]"
              />
              <div className="mt-4" role="tablist" aria-label="Mission and vision">
                <div className="flex gap-2">
                  {(["mission", "vision"] as const).map((k) => (
                    <button
                      key={k}
                      role="tab"
                      aria-selected={tab === k}
                      onClick={() => setTab(k)}
                      className={clsx(
                        "rounded-full border px-5 py-2 font-sans text-xs font-semibold uppercase tracking-[0.08em] transition-colors",
                        tab === k
                          ? "border-loom bg-loom text-ivory"
                          : "border-ink/15 text-ink",
                      )}
                    >
                      {k === "mission" ? about.mission.title : about.vision.title}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-ink/10 bg-canvas p-5">
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {mv.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop: layered composition */}
            <div className="hidden sm:block">
              <Reveal className="lg:pr-16">
                <ContentMedia
                  src="products/categories/kidswear-1.jpg"
                  alt="Kidswear production — teal tracksuit sets from our factory network"
                  aspect="aspect-[4/5]"
                />
              </Reveal>

              <Reveal
                as="article"
                delay={120}
                className="relative z-10 -mt-10 ml-auto w-[88%] rounded-2xl border border-ink/10 bg-canvas p-6 shadow-[0_24px_50px_-30px_rgba(22,25,31,0.35)]"
              >
                <h3 className="display-md text-loom">{about.mission.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {about.mission.body}
                </p>
              </Reveal>

              <Reveal
                as="article"
                delay={180}
                className="relative z-10 mt-5 w-[88%] rounded-2xl border border-ink/10 bg-canvas p-6 shadow-[0_24px_50px_-30px_rgba(22,25,31,0.35)]"
              >
                <h3 className="display-md text-loom">{about.vision.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {about.vision.body}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <span
      aria-hidden
      className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-brass/15 text-brass-dark"
    >
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 6.5L5 9l4.5-5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
