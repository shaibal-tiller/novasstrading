import { compliance } from "@/lib/content";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

export function Compliance() {
  return (
    <section id="compliance" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="max-w-2xl">
          <p className="eyebrow">{compliance.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{compliance.title}</h2>
          <p className="lede mt-5">{compliance.intro}</p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal>
            <h3 className="display-md text-ink">{compliance.protocolTitle}</h3>
            <div className="mt-4 space-y-4 text-ink-muted">
              {compliance.protocolBody.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>

            <ol className="mt-8 space-y-px overflow-hidden rounded-sm border border-ink/10">
              {compliance.checks.map((c, i) => (
                <li
                  key={c.title}
                  className="flex gap-4 bg-canvas p-4 sm:p-5"
                >
                  <span className="font-mono text-sm text-brass-dark">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-sans text-sm font-semibold text-ink">
                      {c.title}
                    </h4>
                    <p className="mt-1 text-sm text-ink-muted">{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <div>
            <Reveal>
              <ContentMedia
                src="garment-quality-inspection"
                alt="QA officer inspecting garments / measuring fabric under inspection lights"
                aspect="aspect-[4/3]"
              />
            </Reveal>

            <Reveal delay={80} className="mt-8">
              <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
                Certifications & memberships
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {compliance.certifications.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-sm border border-ink/10 bg-canvas p-4 text-center"
                  >
                    <ContentMedia
                      src={c.src}
                      alt={`${c.name} membership badge`}
                      kind="logo"
                      aspect="aspect-[3/2]"
                    />
                    <p className="mt-3 font-display text-base font-semibold text-ink">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">{c.detail}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-8 border-l-2 border-brass pl-5 text-sm leading-relaxed text-ink-muted">
                {compliance.footnote}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
