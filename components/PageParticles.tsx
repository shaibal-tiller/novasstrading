"use client";

import { useEffect, useRef } from "react";

// Page-wide ambient "fabric thread" atmosphere — yarn dots and thread pills
// drifting upward across the ENTIRE page: over sections, gutters, padding
// and margins alike.
//
// Motion has two parts:
//  1. A perpetual CSS drift on each particle (no JS involved).
//  2. Scroll interaction — three parallax depth layers get a JS transform.
//     Scrolling down sweeps the grains upward past you; scrolling up pushes
//     them back down. Near layers react hardest, far ones barely move, which
//     reads as depth. When you stop, everything eases back to rest.

const PALETTE = [
  "rgba(176, 138, 79, 0.55)", // brass
  "rgba(44, 107, 102, 0.42)", // loom teal
  "rgba(192, 115, 74, 0.42)", // terracotta
  "rgba(176, 138, 79, 0.38)", // brass, softer
  "rgba(91, 123, 176, 0.32)", // indigo
  "rgba(22, 25, 31, 0.22)", // ink haze
];

const COUNT = 48;
const DEPTHS = 3;

// How strongly each depth reacts to scroll: far → near.
const PARALLAX = [0.3, 0.7, 1.3];
// Fraction of the surge that survives each frame (higher = longer glide).
const DECAY = 0.94;
const MAX_OFFSET = 260; // px, keeps a fast fling from flushing the field

type Particle = {
  left: string;
  width: string;
  height: string;
  color: string;
  duration: string;
  delay: string;
  rotate: string;
  drift: string;
  blur?: string;
  depth: number;
};

function buildParticles(): Particle[] {
  const out: Particle[] = [];
  for (let i = 1; i <= COUNT; i++) {
    const depth = i % DEPTHS; // 0 = far, 2 = near
    const isThread = i % 3 === 0;
    // Near particles read larger and travel faster — reinforces the parallax.
    const scale = 0.7 + depth * 0.35;
    const dot = (4 + ((i * 7) % 7)) * scale;
    const threadLen = (22 + ((i * 13) % 34)) * scale;
    const dur = (30 + ((i * 11) % 30)) / (0.7 + depth * 0.3);
    out.push({
      left: `${(i * 61.803) % 100}%`,
      width: isThread ? "2px" : `${dot.toFixed(1)}px`,
      height: isThread ? `${threadLen.toFixed(1)}px` : `${dot.toFixed(1)}px`,
      color: PALETTE[i % PALETTE.length],
      duration: `${dur.toFixed(1)}s`,
      delay: `-${((i * 7.7) % dur).toFixed(1)}s`,
      rotate: `${-40 + ((i * 37) % 80)}deg`,
      drift: `${-14 + ((i * 17) % 28)}vw`,
      blur: depth === 0 ? "1.6px" : undefined, // far layer sits out of focus
      depth,
    });
  }
  return out;
}

const PARTICLES = buildParticles();

export function PageParticles() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const offsets = new Array(DEPTHS).fill(0);
    let lastScroll = window.scrollY;
    let pending = 0; // scroll distance not yet fed into the surge
    let raf = 0;
    let running = false;

    const frame = () => {
      // Consume whatever scrolling happened since the last frame.
      const velocity = pending;
      pending = 0;

      let alive = false;
      for (let d = 0; d < DEPTHS; d++) {
        // Scrolling down (positive delta) sweeps grains upward → negative Y.
        offsets[d] = Math.max(
          -MAX_OFFSET,
          Math.min(MAX_OFFSET, (offsets[d] - velocity * PARALLAX[d]) * DECAY),
        );

        const layer = layerRefs.current[d];
        if (layer) {
          const oy = offsets[d];
          // A touch of lateral lean makes the sweep feel like airflow.
          const ox = oy * -0.05;
          layer.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0)`;
        }
        if (Math.abs(offsets[d]) > 0.15) alive = true;
      }

      // Keep ticking while the field is still settling; otherwise sleep.
      if (alive || pending !== 0) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      pending += y - lastScroll;
      lastScroll = y;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="page-particles">
      {Array.from({ length: DEPTHS }, (_, d) => (
        <div
          key={d}
          className="page-particles__layer"
          ref={(el) => {
            layerRefs.current[d] = el;
          }}
        >
          {PARTICLES.filter((p) => p.depth === d).map((p, i) => (
            <span
              key={i}
              style={{
                left: p.left,
                width: p.width,
                height: p.height,
                background: p.color,
                filter: p.blur ? `blur(${p.blur})` : undefined,
                animationDuration: p.duration,
                animationDelay: p.delay,
                ["--rot" as string]: p.rotate,
                ["--drift" as string]: p.drift,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
