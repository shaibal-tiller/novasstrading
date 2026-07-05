import { designPD } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./Reveal";

export function DesignPD() {
  return (
    <section id="design-pd" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text + pills */}
          <Reveal>
            <h2 className="display-lg text-ink">{designPD.heading}</h2>
            <div className="lede mt-6 space-y-4">
              {designPD.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4">
              {designPD.pills.map((p) => (
                <span key={p.label} className="pill py-4 px-6 text-base">
                  <span
                    className="pill-dot"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          </Reveal>

          {/* Image */}
          <Reveal delay={100}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone/40">
              <div className="absolute inset-0 bg-[#d8ccc0] flex items-center justify-center text-ink/40 font-mono text-sm uppercase tracking-widest">
                [ Placeholder Image ]
              </div>
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
