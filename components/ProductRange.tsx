import { products } from "@/lib/content";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

export function ProductRange() {
  return (
    <section id="products" className="section-wrap">
      <div className="section-card section-card--cream">
        <div className="max-w-2xl">
          <p className="eyebrow">{products.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{products.title}</h2>
          <p className="lede mt-5">{products.intro}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {products.items.map((p, i) => (
            <Reveal key={p.title} as="article" delay={i * 60} className="group">
              <ContentMedia
                src={p.image}
                alt={p.alt}
                aspect="aspect-[3/4]"
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
      </div>
    </section>
  );
}
