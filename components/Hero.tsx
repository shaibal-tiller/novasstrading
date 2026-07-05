import { hero } from "@/lib/content";
import Image from "next/image";

export function Hero() {
  return (
    <section id="home" className="section-wrap pt-[5rem]">
      <div className="section-card relative overflow-hidden">
        <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="animate-fade-up">
            <h1 className="display-xl text-ink">
              <span className="not-italic font-sans text-[0.85rem] font-bold uppercase tracking-[0.2em] text-ink-muted block mb-4">
                {hero.titleLine1}
              </span>
              {hero.titleLine2}
            </h1>
            <p className="lede mt-6 max-w-lg">{hero.subtitle}</p>
            <div className="mt-8">
              <a href={hero.cta.href} className="btn btn-primary">
                {hero.cta.label}
              </a>
            </div>
          </div>

          {/* Overlapping image collage */}
          <div className="relative mx-auto h-[28rem] w-full max-w-lg animate-fade-up [animation-delay:120ms] sm:h-[32rem]">
            <div className="absolute right-0 top-0 w-[55%] z-10">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-stone/40">
                <Image
                  src="/assets/brass-trims-zippers-buttons.png"
                  alt="Premium brass trims, zippers and buttons"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 55vw, 28vw"
                  priority
                />
              </div>
            </div>
            <div className="absolute left-0 top-[12%] w-[44%] z-20">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone/40">
                <Image
                  src="/assets/stacked-premium-fabric-rolls.png"
                  alt="Stacked rolls of premium fabric"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 44vw, 22vw"
                  priority
                />
              </div>
            </div>
            <div className="absolute bottom-[4%] left-[6%] w-[48%] z-30">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone/40">
                <Image
                  src="/assets/garment-factory-sewing-floor.png"
                  alt="Garment factory sewing floor"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 48vw, 24vw"
                />
              </div>
            </div>
            <div className="absolute bottom-0 right-[2%] w-[46%] z-20">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-stone/40">
                <Image
                  src="/assets/designer-inspecting-labels-swatches.png"
                  alt="Designer inspecting woven labels and swatches"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 46vw, 23vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
