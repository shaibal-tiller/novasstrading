import { sourcing } from "@/lib/content";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

const portfolioMedia = [
  { src: "menswear-apparel-sourcing", alt: "Menswear flat-lay — polos, shirts, chinos" },
  { src: "womenswear-apparel-sourcing", alt: "Womenswear rail — dresses, blouses, knit tops" },
  { src: "kidswear-apparel-sourcing", alt: "Kidswear set — rompers, hoodies, organic basics" },
  { src: "knitwear-denim-sourcing", alt: "Knitwear & denim — jackets, jeans, fleece hoodies" },
];

export function Sourcing() {
  return (
    <section id="sourcing" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="max-w-2xl">
          <p className="eyebrow">{sourcing.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{sourcing.title}</h2>
          <p className="lede mt-5">{sourcing.intro}</p>
        </div>

        {/* Services */}
        <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {sourcing.services.map((s, i) => (
            <Reveal
              key={s.title}
              as="article"
              delay={(i % 3) * 60}
              className="group bg-ivory p-7 transition-colors duration-300 hover:bg-canvas"
            >
              <span className="font-mono text-xs text-brass-dark">
                S{String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-lg font-medium text-ink">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                {s.body}
              </p>
            </Reveal>
          ))}
        </div>

        <hr className="stitch my-16" />

        {/* Portfolio */}
        <div className="max-w-2xl">
          <h3 className="display-md text-ink">{sourcing.portfolio.title}</h3>
          <p className="mt-4 text-ink-muted">{sourcing.portfolio.intro}</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sourcing.portfolio.categories.map((c, i) => (
            <Reveal key={c.title} as="article" delay={i * 70}>
              <ContentMedia
                src={portfolioMedia[i].src}
                alt={portfolioMedia[i].alt}
                aspect="aspect-[3/4]"
              />
              <h4 className="mt-4 font-display text-lg font-medium text-ink">
                {c.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {c.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
