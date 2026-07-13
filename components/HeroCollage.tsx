"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clsx } from "@/lib/utils";

type Slot = {
  images: { src: string; alt: string }[];
  wrapClass: string;
  aspect: string;
};

// Scattered, overlapping collage — each slot slowly crossfades
// through its own set of real product photos.
const slots: Slot[] = [
  {
    wrapClass: "absolute right-0 top-0 w-[58%]",
    aspect: "aspect-[4/5]",
    images: [
      { src: "/assets/products/men/men-hooded-puffer-olive-mannequin.jpg", alt: "Olive & black hooded puffer jacket on mannequin" },
      { src: "/assets/products/men/men-quilted-puffer-jacket-black.jpg", alt: "Black quilted puffer jacket" },
    ],
  },
  {
    wrapClass: "absolute left-0 top-[14%] w-[42%]",
    aspect: "aspect-[3/4]",
    images: [
      { src: "/assets/products/categories/womenswear-2.jpg", alt: "Womenswear — navy blazer over white blouse" },
      { src: "/assets/products/categories/denim-1.jpg", alt: "Womenswear — washed denim romper" },
    ],
  },
  {
    wrapClass: "absolute bottom-[6%] left-[8%] w-[46%]",
    aspect: "aspect-square",
    images: [
      { src: "/assets/products/kids/kids-striped-dungaree-yellow.jpg", alt: "Kids yellow striped jersey dungaree" },
      { src: "/assets/products/kids/kids-car-print-tshirt-green.jpg", alt: "Kids green adventure-car print t-shirt" },
    ],
  },
  {
    wrapClass: "absolute bottom-0 right-[4%] w-[44%]",
    aspect: "aspect-[5/4]",
    images: [
      { src: "/assets/products/men/men-half-zip-sweater-cream.jpg", alt: "Cream half-zip sweater" },
      { src: "/assets/products/categories/knitwear-1.jpg", alt: "Red open-knit jumper" },
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
            <div
              className={clsx(
                "relative w-full overflow-hidden rounded-sm bg-stone/40",
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
                  sizes="(max-width: 768px) 60vw, 30vw"
                  className={clsx(
                    "object-cover transition-opacity duration-[1400ms] ease-in-out",
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
