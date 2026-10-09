import type { compliance as ComplianceContent } from "@/lib/content";
import { Editable } from "./admin/Editable";
import { ContentMedia } from "./ContentMedia";
import { Reveal } from "./Reveal";

export function Compliance({ compliance }: { compliance: typeof ComplianceContent }) {
  // Local item-id widening: DB rows carry a numeric `id`; the static content
  // type doesn't. See Task 8 brief — `id` is `undefined` at runtime here,
  // which is safe since Editable never reads it outside edit mode.
  type ProtocolParaWithId = (typeof compliance.protocolBody)[number] & { id: number };
  type CheckWithId = (typeof compliance.checks)[number] & { id: number };
  type CertWithId = (typeof compliance.certifications)[number] & { id: number };
  const protocolBody = compliance.protocolBody as ProtocolParaWithId[];
  const checks = compliance.checks as CheckWithId[];
  const certifications = compliance.certifications as CertWithId[];

  return (
    <section id="compliance" className="section-wrap">
      <div className="section-card section-card--light">
        <div className="max-w-2xl">
          <p className="eyebrow">
            <Editable id="compliance.eyebrow" kind="text">{compliance.eyebrow}</Editable>
          </p>
          <h2 className="display-lg mt-5 text-ink">
            <Editable id="compliance.title" kind="text">{compliance.title}</Editable>
          </h2>
          <p className="lede mt-5">
            <Editable id="compliance.intro" kind="text">{compliance.intro}</Editable>
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal>
            <h3 className="display-md text-ink">
              <Editable id="compliance.protocolTitle" kind="text">{compliance.protocolTitle}</Editable>
            </h3>
            <div className="mt-4 space-y-4 text-ink-muted">
              {protocolBody.map((p) => (
                <p key={p.slice(0, 20)}>
                  <Editable id={`compliance.protocolBody.${p.id}`} kind="item">{p}</Editable>
                </p>
              ))}
            </div>

            <ol className="mt-8 space-y-px overflow-hidden rounded-sm border border-ink/10">
              {checks.map((c, i) => (
                <li
                  key={c.title}
                  className="flex gap-4 bg-canvas p-4 sm:p-5"
                >
                  <Editable id={`compliance.checks.${c.id}`} kind="item" as="div" className="contents">
                    <span className="font-mono text-sm text-brass-dark">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="font-sans text-sm font-semibold text-ink">
                        {c.title}
                      </h4>
                      <p className="mt-1 text-sm text-ink-muted">{c.body}</p>
                    </div>
                  </Editable>
                </li>
              ))}
            </ol>
          </Reveal>

          <div>
            <Reveal>
              <ContentMedia
                src="garment-quality-inspection.jpg"
                alt="QA officer inspecting garments / measuring fabric under inspection lights"
                aspect="aspect-[4/3]"
              />
            </Reveal>

            <Reveal delay={80} className="mt-8">
              <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-loom">
                Certifications & memberships
              </h3>
              {/* Mobile: 3-across compact strip with smaller logos. */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
                {certifications.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-sm border border-ink/10 bg-canvas p-2 text-center sm:p-4"
                  >
                    <Editable id={`compliance.certifications.${c.id}`} kind="item" as="div" className="contents">
                      <div className="mx-auto max-w-[3.5rem] sm:max-w-none">
                        <ContentMedia
                          src={c.src}
                          alt={`${c.name} membership badge`}
                          kind="logo"
                          aspect="aspect-[3/2]"
                          sizes="160px"
                        />
                      </div>
                      <p className="mt-2 font-display text-xs font-semibold text-ink sm:mt-3 sm:text-base">
                        {c.name}
                      </p>
                      <p className="mt-0.5 hidden text-xs text-ink-muted sm:block">
                        {c.detail}
                      </p>
                    </Editable>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-8 border-l-2 border-brass pl-5 text-sm leading-relaxed text-ink-muted">
                <Editable id="compliance.footnote" kind="text">{compliance.footnote}</Editable>
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

