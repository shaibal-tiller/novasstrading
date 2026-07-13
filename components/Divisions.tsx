import { divisions } from "@/lib/content";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";
import { LeadTimeTable } from "./LeadTimeTable";

const placeholders = [
  { src: "trims-accessories-flat-lay", alt: "Flat-lay of trims & accessories — buttons, zippers, woven labels, threads" },
  { src: "premium-fabric-rolls-textures", alt: "Premium fabric rolls fanned to show knit, woven & denim textures" },
];

export function Divisions() {
  return (
    <section id="divisions" className="section-wrap">
      <div className="section-card section-card--cream">
        <div className="max-w-2xl">
          <p className="eyebrow">{divisions.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{divisions.title}</h2>
          <p className="lede mt-5">{divisions.intro}</p>
        </div>

        <div className="mt-16 space-y-16">
          {divisions.items.map((d, i) => {
            const media = placeholders[i];
            const flip = i % 2 === 1;
            return (
              <Reveal
                key={d.title}
                as="article"
                className="grid gap-8 lg:grid-cols-2 lg:gap-14 lg:items-center"
              >
                <div className={flip ? "lg:order-2" : ""}>
                  <ContentMedia
                    src={media.src}
                    alt={media.alt}
                    aspect="aspect-[5/4]"
                  />
                </div>
                <div className={flip ? "lg:order-1" : ""}>
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-brass-dark">
                    {d.index}
                  </span>
                  <h3 className="display-md mt-3 text-ink">{d.title}</h3>
                  <p className="mt-4 leading-relaxed text-ink-muted">{d.body}</p>

                  <p className="mt-5 text-sm leading-relaxed text-ink">
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-loom">
                      {d.productsLabel}:{" "}
                    </span>
                    {d.products}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {d.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-3 text-sm text-ink"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <hr className="stitch my-16" />
        <LeadTimeTable />
      </div>
    </section>
  );
}
