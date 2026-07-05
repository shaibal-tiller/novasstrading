import { whyUs } from "@/lib/content";
import { Reveal } from "./Reveal";

const icons = [QualityIcon, CustomIcon, ClockIcon];

export function WhyUs() {
  return (
    <section className="section-wrap">
      <div className="section-card section-card--light">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <div>
            <p className="eyebrow">{whyUs.eyebrow}</p>
            <h2 className="display-lg mt-5 text-ink">{whyUs.title}</h2>
          </div>
          <p className="lede max-w-xl lg:pb-2">{whyUs.intro}</p>
        </div>

        <hr className="stitch my-12" />

        <div className="grid gap-8 md:grid-cols-3">
          {whyUs.reasons.map((r, i) => {
            const Icon = icons[i] ?? QualityIcon;
            return (
              <Reveal key={r.title} as="article" delay={i * 80}>
                <span className="grid h-12 w-12 place-items-center rounded-sm bg-loom/10 text-loom">
                  <Icon />
                </span>
                <h3 className="mt-5 font-display text-xl font-medium text-ink">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {r.body}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function QualityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 20.3 7.1 17.2 8 11.7 4 7.8 9.5 7 12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CustomIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 21l6-6m0 0l3 3 9-9-3-3-9 9-3 3-3 3 3-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="9" r="0" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l3.5 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
