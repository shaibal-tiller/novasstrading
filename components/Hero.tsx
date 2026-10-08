import Image from "next/image";
import type { hero as HeroContent } from "@/lib/content";
import { Editable } from "./admin/Editable";
import { HeroCollage } from "./HeroCollage";

export function Hero({ hero, headingTag: Heading = "h1" }: { hero: typeof HeroContent; headingTag?: "h1" | "h2" }) {
  // Local item-id widening: DB rows carry a numeric `id`; the static content
  // type doesn't. See Task 8 brief — `id` is `undefined` at runtime here,
  // which is safe since Editable never reads it outside edit mode.
  type StatWithId = (typeof hero.stats)[number] & { id: number };
  const stats = hero.stats as StatWithId[];

  return (
    <section id="home" className="section-wrap pt-[5.75rem]">
      <div className="section-card section-card--cream relative overflow-hidden">
        {/* ambient warp lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(176,138,79,0.05) 0 1px, transparent 1px 72px)",
          }}
        />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
          {/* Copy */}
          <div className="animate-fade-up">
            <Image 
              src="/logo.png" 
              alt="Nova SS Trading Logo" 
              width={88} 
              height={88} 
              className="mb-8 h-20 w-auto object-contain drop-shadow-sm" 
              priority
            />
            <p className="eyebrow">
              <Editable id="hero.eyebrow" kind="text">{hero.eyebrow}</Editable>
            </p>
            <Heading className="display-xl mt-6 text-ink leading-[1.1]">
              <Editable id="hero.companyName" kind="text">{hero.companyName}</Editable>
              <span className="text-brass-dark">.</span>
            </Heading>
            <p className="mt-4 font-display text-xl font-light italic tracking-wide text-ink-muted sm:text-2xl">
              <Editable id="hero.tagline" kind="text">{hero.tagline}</Editable>
            </p>
            <p className="lede mt-6 max-w-xl">
              <Editable id="hero.body" kind="text">{hero.body}</Editable>
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={hero.primaryCta.href} className="btn btn-primary">
                <Editable id="hero.primaryCta.label" kind="text">{hero.primaryCta.label}</Editable>
                <Arrow />
              </a>
              <a href={hero.secondaryCta.href} className="btn btn-outline">
                <Editable id="hero.secondaryCta.label" kind="text">{hero.secondaryCta.label}</Editable>
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-6">
              {stats.map((s) => (
                <div key={s.l}>
                  <Editable id={`hero.stats.${s.id}`} kind="item" as="div">
                    <dt className="font-display text-2xl font-semibold text-brass-dark">
                      {s.v}
                    </dt>
                    <dd className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ink-muted">
                      {s.l}
                    </dd>
                  </Editable>
                </div>
              ))}
            </dl>
          </div>

          {/* Scattered, overlapping collage of real product photos */}
          <HeroCollage />
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

