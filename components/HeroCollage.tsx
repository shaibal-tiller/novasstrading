"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { blurData } from "@/lib/blurData";
import { clsx } from "@/lib/utils";

type Slot = {
  images: { src: string; alt: string }[];
  wrapClass: string;
  aspect: string;
};

// Scattered, overlapping collage — each slot slowly crossfades through its
// own pair of cutout product photos, shown as floating cards (not full-bleed
// crops) since the source photos are transparent-background cutouts.
const slots: Slot[] = [
  {
    wrapClass: "absolute right-0 top-0 w-[58%]",
    aspect: "aspect-[4/5]",
    images: [
      { src: "/assets/products/men/men-brushed-plaid-overshirt.png", alt: "Brushed plaid overshirt" },
      { src: "/assets/products/men/men-contrast-raglan-top.png", alt: "Contrast raglan top" },
    ],
  },
  {
    wrapClass: "absolute left-0 top-[14%] w-[42%]",
    aspect: "aspect-[3/4]",
    images: [
      { src: "/assets/products/men/men-quarter-zip-knit-sweater.png", alt: "Quarter-zip knit sweater" },
      { src: "/assets/products/men/men-textured-crew-neck-sweater-mustard.png", alt: "Mustard textured crew-neck sweater" },
    ],
  },
  {
    wrapClass: "absolute bottom-[6%] left-[8%] w-[46%]",
    aspect: "aspect-square",
    images: [
      { src: "/assets/products/kids/kids-astronaut-graphic-top.png", alt: "Kids astronaut graphic top" },
      { src: "/assets/products/kids/kids-monster-print-top.png", alt: "Kids monster print top" },
    ],
  },
  {
    wrapClass: "absolute bottom-0 right-[4%] w-[44%]",
    aspect: "aspect-[5/4]",
    images: [
      { src: "/assets/products/lingerie/lingerie-sage-smooth-molded-bra.png", alt: "Sage smooth molded bra" },
      { src: "/assets/products/lingerie/lingerie-wine-lace-panel-bra.png", alt: "Wine lace panel bra" },
    ],
  },
];

const ROTATE_MS = 4200;

export function HeroCollage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto h-[30rem] w-full max-w-lg animate-fade-up [animation-delay:120ms] sm:h-[34rem]">
      {slots.map((slot, s) => {
        // Stagger slot changes so the collage never swaps all at once.
        const active = Math.floor((tick + s) / slots.length) % slot.images.length;
        return (
          <div key={s} className={slot.wrapClass}>
            {/* Styled card — the source photos are transparent cutouts, so
                they're framed on a soft tinted ground with room to breathe,
                rather than cropped edge-to-edge like full-bleed photography. */}
            <div
              className={clsx(
                "relative w-full overflow-hidden rounded-md border border-ink/8 bg-gradient-to-br from-ivory-light to-stone/50 shadow-[0_24px_48px_-28px_rgba(22,25,31,0.35)]",
                slot.aspect,
              )}
            >
              {slot.images.map((img, i) => (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={i === active ? img.alt : ""}
                  aria-hidden={i !== active}
                  fill
                  priority={s < 2 && i === 0}
                  placeholder={
                    blurData[img.src.replace("/assets/", "")]
                      ? "blur"
                      : "empty"
                  }
                  blurDataURL={blurData[img.src.replace("/assets/", "")]}
                  sizes="(max-width: 768px) 60vw, 30vw"
                  className={clsx(
                    "object-contain p-5 drop-shadow-[0_18px_22px_rgba(22,25,31,0.16)] transition-opacity duration-[1400ms] ease-in-out sm:p-7",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
