import { partners } from "@/lib/content";

export function Partners() {
  const slots = Array.from({ length: partners.count }, (_, i) => i + 1);
  const loop = [...slots, ...slots];

  return (
    <section id="partners" className="section-wrap">
      <div className="section-card section-card--cream overflow-hidden">
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
            aria-label="Partner brands"
          >
            {loop.map((n, i) => (
              <li
                key={`${n}-${i}`}
                aria-hidden={i >= slots.length}
                className="grid h-24 w-44 flex-shrink-0 place-items-center rounded-2xl border border-ink/10 bg-canvas"
              >
                <div className="text-center">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-brass-dark">
                    Logo
                  </span>
                  <p className="font-display text-xl font-semibold text-ink/70">
                    LOGO-{String(n).padStart(2, "0")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
