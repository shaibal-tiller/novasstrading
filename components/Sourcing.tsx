import { sourcing } from "@/lib/content";
import { PillList } from "./PillList";
import { Reveal } from "./Reveal";

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
        <div className="mt-14 grid gap-px overflow-hidden rounded-sm border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {sourcing.services.map((s, i) => (
            <Reveal
              key={s.title}
              as="article"
              delay={(i % 4) * 60}
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

        <Reveal className="mt-12">
          <PillList
            label={sourcing.checklistLabel}
            stagger
            items={[...sourcing.checklist]}
          />
        </Reveal>
      </div>
    </section>
  );
}
