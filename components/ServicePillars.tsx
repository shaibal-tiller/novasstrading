"use client";

import { sourcing } from "@/lib/content";
import { Reveal } from "./Reveal";

/* Icons for each pillar matching the client's "Our Service" wheel diagram */
const pillarIcons: Record<string, React.ReactNode> = {
  clock: (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
      <path d="M24 14v10l6 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* tick marks */}
      <path d="M24 8v3M24 37v3M8 24h3M37 24h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  thumb: (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
      <path d="M14 22l6-14a3 3 0 013 3v8h9a3 3 0 013 3.3l-2 11a3 3 0 01-3 2.7H14" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 22v16H8V22h6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M24 10v4M24 34v4M10 24h4M34 24h4M14.1 14.1l2.8 2.8M31.1 31.1l2.8 2.8M33.9 14.1l-2.8 2.8M16.9 31.1l-2.8 2.8"
        stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"
      />
    </svg>
  ),
};

/* Animated dashed ring orbiting the centre logo */
function OrbitRing({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-72 w-72 lg:h-80 lg:w-80" aria-hidden>
      {/* Outer dashed orbit */}
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-brass/40 animate-spin-slow" />
      {/* Centre badge */}
      <div className="absolute inset-[22%] rounded-full bg-ink flex flex-col items-center justify-center shadow-xl">
        <span className="font-display text-xs font-semibold uppercase tracking-widest text-brass-light">
          Our
        </span>
        <span className="font-display text-xl font-bold text-ivory leading-none">
          Service
        </span>
      </div>
      {children}
    </div>
  );
}

/* Positions a pillar chip centred on the orbit's cardinal points. The chip
   sizes to its own text, so the brass background always sits behind the
   label — no white-on-white overflow, whatever the label length. */
type Pos = "top" | "right" | "bottom" | "left";
const positionMap: Record<Pos, string> = {
  top:    "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  right:  "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  left:   "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

function OrbitBubble({ pos, label }: { pos: Pos; label: string }) {
  return (
    <div
      className={`absolute ${positionMap[pos]} flex max-w-[7rem] items-center justify-center rounded-full bg-brass-dark px-3.5 py-2 text-center shadow-lg ring-4 ring-brass/20`}
    >
      <span className="font-display text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-ivory">
        {label}
      </span>
    </div>
  );
}

export function ServicePillars() {
  const positions: Pos[] = ["top", "right", "bottom", "left"];

  return (
    <Reveal className="mt-16 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm sm:p-8 lg:p-12">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

        {/* Left — orbit infographic (hidden on mobile; the 2×2 cards carry it) */}
        <div className="hidden flex-col items-center sm:flex">
          <OrbitRing>
            {sourcing.pillars.map((p, i) => (
              <OrbitBubble
                key={p.title}
                pos={positions[i]}
                label={p.title}
              />
            ))}
          </OrbitRing>
        </div>

        {/* Right — pillar cards. Mobile: 2 × 2 compact grid. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {sourcing.pillars.map((p, i) => (
            <Reveal
              key={p.title}
              as="article"
              delay={i * 80}
              className="group flex flex-col gap-2.5 rounded-xl border border-ink/10 bg-ivory p-4 transition-shadow duration-300 hover:shadow-md sm:gap-3 sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brass/15 text-brass-dark transition-colors duration-300 group-hover:bg-brass-dark group-hover:text-ivory sm:h-14 sm:w-14">
                {pillarIcons[p.icon]}
              </div>
              <h3 className="font-display text-sm font-semibold leading-snug text-ink sm:text-base">
                {p.title}
              </h3>
              <p className="text-[0.8rem] leading-relaxed text-ink-muted sm:text-sm">
                {p.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
