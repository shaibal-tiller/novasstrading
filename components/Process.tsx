import { process } from "@/lib/content";
import { Reveal } from "./Reveal";

/* SVG icons matching each of the 6 client process steps */
const icons: Record<string, React.ReactNode> = {
  sourcing: (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2.2" />
      <path d="M23 23l8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 12v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  quality: (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <path d="M8 20l7 7 17-17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  ),
  design: (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <path d="M10 30l4-10 16-16 6 6-16 16-10 4z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M26 10l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="26" r="2" fill="currentColor" />
    </svg>
  ),
  compliance: (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <path d="M20 4l13 5v10c0 8-5.5 14-13 17C12.5 33 7 27 7 19V9l13-5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  packing: (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <rect x="7" y="14" width="26" height="20" rx="2" stroke="currentColor" strokeWidth="2.2" />
      <path d="M14 14V10a6 6 0 0112 0v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 23h14M20 19v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  shipment: (
    <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8" aria-hidden>
      <path d="M4 26h24l6-10H28l-4-8H10L7 20" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="12" cy="30" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="28" cy="30" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/* Connector arrow between steps — only shown on desktop */
function StepArrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-brass-dark/50" aria-hidden>
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
        <path d="M1 8h22M18 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Process() {
  return (
    <section id="process" className="section-wrap">
      <div className="section-card section-card--cream">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="eyebrow">{process.eyebrow}</p>
          <h2 className="display-lg mt-5 text-ink">{process.title}</h2>
          <p className="lede mt-5">{process.intro}</p>
        </div>

        {/* 3 × 2 icon-card grid — matches client's process_flow layout.
            Mobile: 2 columns, compact cards. */}
        <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {process.steps.map((step, i) => (
            <Reveal
              key={step.n}
              as="article"
              delay={i * 70}
              className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-7"
            >
              {/* Step number watermark */}
              <span
                className="absolute right-3 top-2 font-display text-4xl font-bold leading-none text-ink/5 select-none sm:right-4 sm:top-4 sm:text-6xl"
                aria-hidden
              >
                {step.n}
              </span>

              {/* Icon */}
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brass/15 text-brass-dark transition-colors duration-300 group-hover:bg-brass-dark group-hover:text-ivory sm:mb-5 sm:h-14 sm:w-14">
                {icons[step.icon]}
              </div>

              {/* Title */}
              <h3 className="font-display text-base font-semibold text-ink sm:text-lg">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-2 line-clamp-3 text-[0.82rem] leading-relaxed text-ink-muted sm:mt-2.5 sm:line-clamp-none sm:text-sm">
                {step.body}
              </p>

              {/* Bottom accent line on hover */}
              <span className="absolute bottom-0 left-0 h-[3px] w-0 rounded-b-2xl bg-brass-dark transition-all duration-500 group-hover:w-full" />
            </Reveal>
          ))}
        </div>

        {/* Flow connector — desktop visual reading aid */}
        <div className="mt-10 hidden items-center justify-center gap-2 lg:flex">
          {process.steps.map((step, i) => (
            <>
              <span
                key={step.n}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brass-dark/30 bg-ivory text-xs font-bold text-brass-dark"
              >
                {step.n}
              </span>
              {i < process.steps.length - 1 && <StepArrow key={`arrow-${i}`} />}
            </>
          ))}
        </div>
      </div>
    </section>
  );
}
