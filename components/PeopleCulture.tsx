import { people } from "@/lib/content";
import { Reveal } from "./Reveal";

export function PeopleCulture() {
  return (
    <section id="people" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <Reveal>
            <h2 className="display-lg text-ink">{people.heading}</h2>
            <div className="lede mt-6 space-y-4">
              {people.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </Reveal>

          {/* Overlapping image collage placeholders */}
          <Reveal delay={100}>
            <div className="relative h-[24rem] w-full sm:h-[28rem]">
              <div className="absolute left-0 top-0 w-[55%] z-10">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#d8ccc0] flex items-center justify-center text-ink/40 font-mono text-xs text-center p-4 uppercase tracking-widest">
                  [ Placeholder ]
                </div>
              </div>
              <div className="absolute right-0 top-[10%] w-[50%] z-20">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#e3dcd1] flex items-center justify-center text-ink/40 font-mono text-xs text-center p-4 uppercase tracking-widest">
                  [ Placeholder ]
                </div>
              </div>
              <div className="absolute bottom-0 left-[20%] w-[50%] z-30">
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-[#cebfb2] flex items-center justify-center text-ink/40 font-mono text-xs text-center p-4 uppercase tracking-widest">
                  [ Placeholder ]
                </div>
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
