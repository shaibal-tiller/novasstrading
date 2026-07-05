import { divisions } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./Reveal";

export function Divisions() {
  return (
    <section id="divisions" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text + pills */}
          <Reveal>
            <h2 className="display-lg text-ink">{divisions.heading}</h2>
            <p className="lede mt-6">{divisions.body}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {divisions.pills.map((p) => (
                <span key={p.label} className="pill">
                  <span
                    className="pill-dot"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </span>
              ))}
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {divisions.divisions.map((d) => (
                <div key={d.title} className="rounded-2xl border border-ink/10 bg-white/60 p-5">
                  <h3 className="font-sans text-sm font-bold uppercase tracking-[0.08em] text-ink">
                    {d.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Image */}
          <Reveal delay={100}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone/40">
              <Image
                src="/assets/trims-accessories-flat-lay.png"
                alt="Flat-lay of trims and accessories — buttons, zippers, woven labels"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
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
