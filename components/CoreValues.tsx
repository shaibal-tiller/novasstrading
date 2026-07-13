import { coreValues } from "@/lib/content";
import { PillList } from "./PillList";
import { Reveal } from "./Reveal";

export function CoreValues() {
  return (
    <section id="values" className="section-wrap">
      <div className="section-card section-card--cream">
        <div className="max-w-2xl">
          <p className="eyebrow">{coreValues.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{coreValues.title}</h2>
          <p className="lede mt-5">{coreValues.intro}</p>
        </div>

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <Reveal>
            <PillList
              label="Core Values"
              stagger
              items={coreValues.values.map((v) => v.title)}
            />
          </Reveal>

          <Reveal delay={80}>
            <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {coreValues.values.map((v) => (
                <div key={v.title}>
                  <dt className="font-display text-lg font-medium text-ink">
                    {v.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {v.body}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
