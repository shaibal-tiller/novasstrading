import Image from "next/image";
import { partners } from "@/lib/content";
import { SectionParticles } from "./SectionParticles";

export function Partners() {
  // Repeat the logo set so the marquee loop stays dense.
  const strip = Array.from({ length: 4 }, () => partners.logos).flat();
  const loop = [...strip, ...strip];

  return (
    <section id="partners" className="section-wrap">
      <div className="section-card section-card--cream overflow-hidden section-card--particled">
        <SectionParticles seed={11} />
        <div className="max-w-2xl">
          <p className="eyebrow">{partners.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{partners.title}</h2>
          <p className="lede mt-5">{partners.intro}</p>
        </div>

        <div
          className="relative mt-12 flex"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)",
          }}
        >
          <ul
            className="flex shrink-0 animate-marquee items-center gap-4 pr-4"
            aria-label="Client brands"
          >
            {loop.map((logo, i) => (
              <li
                key={`${logo.name}-${i}`}
                aria-hidden={i >= strip.length}
                className="grid h-24 w-44 flex-shrink-0 place-items-center rounded-2xl border border-ink/10 bg-canvas px-6"
              >
                <Image
                  src={`/assets/${logo.src}`}
                  alt={i < strip.length ? `${logo.name} logo` : ""}
                  width={132}
                  height={56}
                  className="max-h-14 w-auto object-contain"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 border-t border-ink/10 pt-8">
          <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
            Memberships
          </h3>
          <ul className="mt-5 flex flex-wrap items-center gap-4">
            {partners.memberships.map((m) => (
              <li
                key={m.name}
                className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-canvas px-5 py-3"
              >
                <Image
                  src={`/assets/${m.src}`}
                  alt={`${m.name} membership logo`}
                  width={72}
                  height={40}
                  className="max-h-10 w-auto object-contain"
                />
                <span className="font-display text-base font-semibold text-ink/80">
                  {m.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
