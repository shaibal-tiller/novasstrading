import { sourcing } from "@/lib/content";
import { Reveal } from "./Reveal";

export function Sourcing() {
  return (
    <section id="sourcing" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text + CTA */}
          <Reveal>
            <h2 className="display-lg text-ink">{sourcing.heading}</h2>
            <p className="lede mt-6">{sourcing.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={sourcing.downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {sourcing.downloadLabel}
              </a>
            </div>
          </Reveal>

          {/* Pillar pills */}
          <Reveal delay={100}>
            <div className="flex flex-col gap-4">
              {sourcing.pillars.map((p) => (
                <span key={p.label} className="pill text-base py-4 px-6">
                  <span
                    className="pill-dot"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
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
