import { process } from "@/lib/content";
import { LazyVideo } from "./LazyVideo";
import { Reveal } from "./Reveal";
import { SectionParticles } from "./SectionParticles";

export function Process() {
  return (
    <section id="process" className="section-wrap">
      <div className="section-card section-card--cream section-card--particled">
        <SectionParticles seed={8} />
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="eyebrow">{process.eyebrow}</p>
            <h2 className="display-lg mt-5 text-ink">{process.title}</h2>
            <p className="lede mt-5">{process.intro}</p>
          </div>
          <Reveal>
            <LazyVideo
              className="aspect-video w-full rounded-2xl object-cover shadow-lg"
              src="/assets/vid-01.mp4"
              poster="/assets/vid-01-poster.jpg"
              label="Short company film: buying-house workflow from sampling to shipment"
            />
          </Reveal>
        </div>

        <ol className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, i) => (
            <Reveal key={step.n} as="li" delay={(i % 4) * 60}>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-semibold text-brass-dark">
                  {step.n}
                </span>
                <span className="h-px flex-1 bg-ink/15" />
              </div>
              <h3 className="mt-4 font-display text-base font-medium text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
