import { technicalQA } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./Reveal";

export function TechnicalQA() {
  return (
    <section id="technical" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text */}
          <Reveal>
            <h2 className="display-lg text-ink">{technicalQA.heading}</h2>
            <div className="lede mt-6 space-y-4">
              {technicalQA.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </Reveal>

          {/* Image collage */}
          <Reveal delay={100}>
            <div className="relative h-[22rem] w-full sm:h-[26rem]">
              <div className="absolute left-0 top-0 w-[58%] z-10">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone/40">
                  <Image
                    src="/assets/garment-quality-inspection.png"
                    alt="Quality assurance team inspecting garment stitching"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 58vw, 29vw"
                  />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-[55%] z-20">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone/40">
                  <Image
                    src="/assets/premium-fabric-rolls-textures.png"
                    alt="Fabric testing and quality measurement"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 55vw, 28vw"
                  />
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
