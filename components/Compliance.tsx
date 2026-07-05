import { compliance } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./Reveal";

export function Compliance() {
  return (
    <section id="compliance" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Image collage */}
          <Reveal>
            <div className="relative h-[24rem] w-full sm:h-[28rem]">
              <div className="absolute left-0 top-0 w-[55%] z-10">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone/40">
                  <Image
                    src="/assets/garment-quality-inspection.png"
                    alt="QA officer inspecting garments under inspection lights"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 55vw, 28vw"
                  />
                </div>
              </div>
              <div className="absolute right-0 top-[8%] w-[48%] z-20">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone/40">
                  <Image
                    src="/assets/oeko-tex-standard-100-logo.png"
                    alt="OEKO-TEX Standard 100 certification"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 48vw, 24vw"
                  />
                </div>
              </div>
              <div className="absolute bottom-0 left-[18%] w-[52%] z-30">
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-stone/40">
                  <Image
                    src="/assets/fsc-certified-logo.png"
                    alt="FSC Forest Stewardship Council certification"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 52vw, 26vw"
                  />
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
            <ul className="mt-6 space-y-2">
              {compliance.certifications.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
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
