"use client";

import { productMix } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./Reveal";
import { useState } from "react";
import { clsx } from "@/lib/utils";

const categoryImages: Record<string, { src: string; alt: string }[]> = {
  mens: [
    { src: "/assets/menswear-apparel-sourcing.png", alt: "Menswear collection — polos, shirts, chinos" },
  ],
  ladies: [
    { src: "/assets/womenswear-apparel-sourcing.png", alt: "Womenswear collection — dresses, blouses, knit tops" },
  ],
  kids: [
    { src: "/assets/kidswear-apparel-sourcing.png", alt: "Kidswear collection — rompers, hoodies, organic basics" },
  ],
};

export function ProductMix() {
  const [activeTab, setActiveTab] = useState("mens");
  const images = categoryImages[activeTab] || [];

  return (
    <section id="products" className="section-wrap">
      <div className="section-card">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Text + tabs */}
          <Reveal>
            <h2 className="display-lg text-ink">{productMix.heading}</h2>
            <p className="lede mt-6">{productMix.body}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {productMix.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={clsx(
                    "tab-btn",
                    activeTab === cat.id && "tab-btn--active",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product items for active tab */}
            <div className="mt-6">
              {productMix.categories
                .filter((c) => c.id === activeTab)
                .map((cat) => (
                  <ul key={cat.id} className="grid grid-cols-2 gap-3">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-ink-muted"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ))}
            </div>
          </Reveal>

          {/* Product image */}
          <Reveal delay={100}>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-stone/40">
              {Object.entries(categoryImages).map(([key, imgs]) => (
                <Image
                  key={key}
                  src={imgs[0].src}
                  alt={imgs[0].alt}
                  fill
                  className={clsx(
                    "object-cover transition-opacity duration-500",
                    activeTab === key ? "opacity-100" : "opacity-0",
                  )}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
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
