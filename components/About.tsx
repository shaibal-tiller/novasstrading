import { about } from "@/lib/content";
import { Reveal } from "./Reveal";

export function About() {
  return (
    <section id="about" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="display-lg text-ink">{about.heading}</h2>
            <div className="lede mt-6 space-y-4">
              {about.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <p className="mt-6 font-display text-lg italic leading-relaxed text-ink">
              {about.vision}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-wrap gap-3 lg:justify-end lg:pt-8">
              {about.coreValues.map((v) => (
                <span key={v.label} className="pill">
                  <span
                    className="pill-dot"
                    style={{ backgroundColor: v.color }}
                  />
                  {v.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-8 flex justify-end">
          <a href="#home" className="up-btn">
            <UpArrow /> Up
          </a>
        </div>
      </div>
    </section>
  );
}

function UpArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M5 9V1M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
