"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { blurData } from "@/lib/blurData";
import { portfolio } from "@/lib/content";
import { clsx } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionParticles } from "./SectionParticles";

export function Portfolio() {
  const [active, setActive] = useState(portfolio.tabs[0].key);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const tab = portfolio.tabs.find((t) => t.key === active) ?? portfolio.tabs[0];
  const photos = tab.photos;

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((cur) =>
        cur === null ? cur : (cur + dir + photos.length) % photos.length,
      ),
    [photos.length],
  );

  // Prefetch the neighbouring lightbox images so arrow navigation is instant
  useEffect(() => {
    if (lightbox === null) return;
    [1, -1].forEach((dir) => {
      const next = photos[(lightbox + dir + photos.length) % photos.length];
      [1080, 1920].forEach((w) => {
        const img = new window.Image();
        img.src = `/_next/image?url=${encodeURIComponent(`/assets/${next.src}`)}&w=${w}&q=75`;
      });
    });
  }, [lightbox, photos]);

  // Keyboard controls + scroll lock while the lightbox is open
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, close, step]);

  return (
    <section id="portfolio" className="section-wrap">
      <div className="section-card section-card--light section-card--particled">
        <SectionParticles seed={6} />
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
              onClick={() => {
                setActive(t.key);
                setLightbox(null);
              }}
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
          {photos.map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setLightbox(i)}
              aria-label={`View ${p.alt} full screen`}
              className="group animate-fade-up relative overflow-hidden rounded-sm border border-ink/5 bg-ivory text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={`/assets/${p.src}`}
                  alt={p.alt}
                  fill
                  loading="lazy"
                  placeholder={blurData[p.src] ? "blur" : "empty"}
                  blurDataURL={blurData[p.src]}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>

              {/* Hover veil with centred + */}
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center bg-ink/0 transition-colors duration-300 group-hover:bg-ink/35 group-focus-visible:bg-ink/35"
              >
                <span className="grid h-14 w-14 scale-75 place-items-center rounded-full border border-ivory/60 bg-ivory/15 text-ivory opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
                  <PlusIcon />
                </span>
              </span>

              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/70 to-transparent p-3 pt-8 text-xs font-medium text-ivory opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
              >
                {p.alt.split("— ")[1] ?? p.alt}
              </span>
            </button>
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

      {/* Full-screen gallery */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${tab.label} gallery — image ${lightbox + 1} of ${photos.length}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close gallery"
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-brass hover:text-brass"
          >
            <CloseIcon />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous image"
            className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-brass hover:text-brass sm:left-6"
          >
            <ArrowIcon flip />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next image"
            className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-ivory/25 text-ivory transition-colors hover:border-brass hover:text-brass sm:right-6"
          >
            <ArrowIcon />
          </button>

          <figure
            className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-14 sm:px-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[76vh] w-full">
              <Image
                key={photos[lightbox].src}
                src={`/assets/${photos[lightbox].src}`}
                alt={photos[lightbox].alt}
                fill
                sizes="90vw"
                placeholder={blurData[photos[lightbox].src] ? "blur" : "empty"}
                blurDataURL={blurData[photos[lightbox].src]}
                className="animate-fade-up object-contain"
                priority
              />
            </div>
            <figcaption className="flex items-center gap-4 text-ivory/85">
              <span className="font-mono text-xs tracking-[0.15em] text-brass">
                {String(lightbox + 1).padStart(2, "0")} /{" "}
                {String(photos.length).padStart(2, "0")}
              </span>
              <span className="text-sm">{photos[lightbox].alt}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function ArrowIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
