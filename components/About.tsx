"use client";

import { useState } from "react";
import type { about as AboutContent } from "@/lib/content";
import { clsx } from "@/lib/utils";
import { Editable } from "./admin/Editable";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

export function About({ about }: { about: typeof AboutContent }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"mission" | "vision">("mission");
  const mv = tab === "mission" ? about.mission : about.vision;
  const mvId = tab === "mission" ? "about.mission" : "about.vision";

  // Local item-id widening: DB rows carry a numeric `id`; the static content
  // type doesn't. See Task 8 brief — `id` is `undefined` at runtime here,
  // which is safe since Editable never reads it outside edit mode.
  type BodyParaWithId = (typeof about.body)[number] & { id: number };
  type HighlightWithId = (typeof about.highlights)[number] & { id: number };
  const bodyParas = about.body as BodyParaWithId[];
  const highlights = about.highlights as HighlightWithId[];

  return (
    <section id="about" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">
              <Editable id="about.eyebrow" kind="text">{about.eyebrow}</Editable>
            </p>
            <h2 className="display-lg mt-5 text-ink">
              <Editable id="about.title" kind="text">{about.title}</Editable>
            </h2>

            {/* Mobile: collapsible intro */}
            <div className="mt-6 sm:hidden">
              {expanded ? (
                <div className="lede space-y-4">
                  {bodyParas.map((p) => (
                    <p key={p.slice(0, 24)}>
                      <Editable id={`about.body.${p.id}`} kind="item">{p}</Editable>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="lede line-clamp-3">
                  <Editable id={`about.body.${bodyParas[0]?.id}`} kind="item">
                    {bodyParas[0]}
                  </Editable>
                </p>
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
              {bodyParas.map((p) => (
                <p key={p.slice(0, 24)}>
                  <Editable id={`about.body.${p.id}`} kind="item">{p}</Editable>
                </p>
              ))}
            </div>

            <ul className="mt-8 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-ink">
                  <Editable id={`about.highlights.${h.id}`} kind="item" as="span">
                    <Check />
                    <span className="font-medium">{h}</span>
                  </Editable>
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
                      <Editable id={`${k === "mission" ? "about.mission" : "about.vision"}.title`} kind="text">
                        {k === "mission" ? about.mission.title : about.vision.title}
                      </Editable>
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-ink/10 bg-canvas p-5">
                  <p className="text-sm leading-relaxed text-ink-muted">
                    <Editable id={`${mvId}.body`} kind="text">{mv.body}</Editable>
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
                <h3 className="display-md text-loom">
                  <Editable id="about.mission.title" kind="text">{about.mission.title}</Editable>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  <Editable id="about.mission.body" kind="text">{about.mission.body}</Editable>
                </p>
              </Reveal>

              <Reveal
                as="article"
                delay={180}
                className="relative z-10 mt-5 w-[88%] rounded-2xl border border-ink/10 bg-canvas p-6 shadow-[0_24px_50px_-30px_rgba(22,25,31,0.35)]"
              >
                <h3 className="display-md text-loom">
                  <Editable id="about.vision.title" kind="text">{about.vision.title}</Editable>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  <Editable id="about.vision.body" kind="text">{about.vision.body}</Editable>
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

