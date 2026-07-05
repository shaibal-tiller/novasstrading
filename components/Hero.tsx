import { hero } from "@/lib/content";
import { ContentMedia } from "./ContentMedia";

export function Hero() {
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
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 className="display-xl mt-6 text-ink">
              <span className="mb-3 block font-sans text-2xl font-normal leading-snug tracking-normal text-ink-muted sm:text-3xl lg:text-4xl">
                {hero.titlePrefix}
              </span>
              {hero.title}
            </h1>
            <p className="lede mt-6 max-w-xl">{hero.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={hero.primaryCta.href} className="btn btn-primary">
                {hero.primaryCta.label}
                <Arrow />
              </a>
              <a href={hero.secondaryCta.href} className="btn btn-outline">
                {hero.secondaryCta.label}
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-6">
              {[
                { v: "02", l: "Specialized divisions" },
                { v: "08", l: "Stage QA workflow" },
                { v: "24h", l: "Inquiry response" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-display text-2xl font-semibold text-brass-dark">
                    {s.v}
                  </dt>
                  <dd className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ink-muted">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Scattered, overlapping collage */}
          <div className="relative mx-auto h-[30rem] w-full max-w-lg animate-fade-up [animation-delay:120ms] sm:h-[34rem]">
            <div className="absolute right-0 top-0 w-[58%]">
              <ContentMedia
                src="brass-trims-zippers-buttons"
                alt="Macro of premium brass trims — zippers & buttons"
                aspect="aspect-[4/5]"
              />
            </div>
            <div className="absolute left-0 top-[14%] w-[42%]">
              <ContentMedia
                src="stacked-premium-fabric-rolls"
                alt="Stacked rolls of premium fabric"
                aspect="aspect-[3/4]"
              />
            </div>
            <div className="absolute bottom-[6%] left-[8%] w-[46%]">
              <ContentMedia
                src="garment-factory-sewing-floor"
                alt="Garment factory sewing floor in operation"
                aspect="aspect-square"
              />
            </div>
            <div className="absolute bottom-0 right-[4%] w-[44%]">
              <ContentMedia
                src="designer-inspecting-labels-swatches"
                alt="Designer inspecting woven labels & swatches"
                aspect="aspect-[5/4]"
              />
            </div>
          </div>
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
