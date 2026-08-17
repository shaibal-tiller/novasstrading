"use client";

import { useRef } from "react";
import { products } from "@/lib/content";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

export function ProductRange() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-card]");
    const amount = card
      ? card.getBoundingClientRect().width + 12 // card + gap-3
      : track.clientWidth * 0.6;
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="products" className="section-wrap">
      <div className="section-card section-card--cream">
        <div className="max-w-2xl">
          <p className="eyebrow">{products.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{products.title}</h2>
          <p className="lede mt-5">{products.intro}</p>
        </div>

        {/* Desktop / tablet: full grid */}
        <div className="mt-14 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-5">
          {products.items.map((p, i) => (
            <Reveal key={p.title} as="article" delay={i * 60} className="group">
              <ContentMedia
                src={p.image}
                alt={p.alt}
                aspect="aspect-[3/4]"
                fit="contain"
                sizes="(max-width: 1024px) 50vw, 18vw"
                className="transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-mono text-xs text-brass-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg font-medium text-ink">
                  {p.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {p.body}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Mobile: peek carousel (≈3 cards + a sliver of the next) */}
        <div className="mt-10 sm:hidden">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.items.map((p, i) => (
              <article
                key={p.title}
                data-card
                className="w-[28%] flex-none snap-start"
              >
                <ContentMedia
                  src={p.image}
                  alt={p.alt}
                  aspect="aspect-[3/4]"
                  fit="contain"
                  sizes="30vw"
                />
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="font-mono text-[0.65rem] text-brass-dark">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-[0.82rem] font-medium leading-tight text-ink">
                    {p.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>

          {/* Controls + hint */}
          <div className="mt-4 flex items-center justify-between">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-ink-muted">
              Swipe to explore
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Previous products"
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 text-ink transition-colors active:bg-ink active:text-ivory"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="Next products"
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 text-ink transition-colors active:bg-ink active:text-ivory"
              >
                <Chevron dir="right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={dir === "left" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
