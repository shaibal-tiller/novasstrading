import { whyUs } from "@/lib/content";
import { Reveal } from "./Reveal";

const icons = [
  NetworkIcon,
  QualityIcon,
  ClockIcon,
  CustomIcon,
  TeamIcon,
  LeafIcon,
];

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

function NetworkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.8 6.8L6.2 16m7-9.2l4.6 9.2M7.2 18h9.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 19c.7-3 3-4.5 5.5-4.5s4.8 1.5 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5.9a3 3 0 110 5.2M17.4 14.7c1.6.6 2.8 1.9 3.2 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19c0-8 5-14 14-14 0 9-5 14-14 14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 19c3-5 7-9 11-11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
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
