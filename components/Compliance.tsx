import { compliance } from "@/lib/content";
import { Reveal } from "./Reveal";

export function Compliance() {
  return (
    <section id="compliance" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Image collage placeholders */}
          <Reveal>
            <div className="relative h-[24rem] w-full sm:h-[28rem]">
              <div className="absolute left-0 top-0 w-[55%] z-10">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#d8ccc0] flex items-center justify-center text-ink/40 font-mono text-xs text-center p-4 uppercase tracking-widest">
                  [ Placeholder ]
                </div>
              </div>
              <div className="absolute right-0 top-[8%] w-[48%] z-20">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#cebfb2] flex items-center justify-center text-ink/40 font-mono text-xs text-center p-4 uppercase tracking-widest">
                  [ Placeholder ]
                </div>
              </div>
              <div className="absolute bottom-0 left-[18%] w-[52%] z-30">
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-[#e3dcd1] flex items-center justify-center text-ink/40 font-mono text-xs text-center p-4 uppercase tracking-widest">
                  [ Placeholder ]
                </div>
              </div>
            </div>
          </Reveal>

          {/* Text */}
          <Reveal delay={100}>
            <h2 className="display-lg text-ink">{compliance.heading}</h2>
            <div className="lede mt-6 space-y-4">
              {compliance.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            {compliance.certifications.length > 0 && (
              <ul className="mt-6 space-y-2">
                {compliance.certifications.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm font-medium text-ink">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
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
