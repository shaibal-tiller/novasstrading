// Ambient "fabric thread" background animation — yarn dots and short
// thread pills that drift slowly upward behind a section's content.
// Pure CSS animation, zero client JS; values are deterministic so
// server and client markup always match.

const PALETTE = [
  "rgba(176, 138, 79, 0.20)", // brass
  "rgba(44, 107, 102, 0.15)", // loom teal
  "rgba(192, 115, 74, 0.14)", // terracotta
  "rgba(176, 138, 79, 0.12)", // brass, fainter
  "rgba(91, 123, 176, 0.11)", // indigo
];

type Particle = {
  left: string;
  width: string;
  height: string;
  color: string;
  duration: string;
  delay: string;
  rotate: string;
  rise: string;
};

function buildParticles(count: number, seed: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + seed;
    const isThread = n % 3 === 0; // every third particle is a thread pill
    const size = 3 + ((n * 7) % 5); // 3–7px dots
    const threadLen = 16 + ((n * 13) % 22); // 16–37px threads
    const dur = 18 + ((n * 7) % 16); // 18–33s loops
    out.push({
      left: `${(n * 61.8) % 100}%`, // golden-angle spread
      width: isThread ? "2px" : `${size}px`,
      height: isThread ? `${threadLen}px` : `${size}px`,
      color: PALETTE[n % PALETTE.length],
      duration: `${dur}s`,
      delay: `-${(n * 5.3) % dur}s`, // negative: already mid-flight on load
      rotate: `${-35 + ((n * 37) % 70)}deg`,
      rise: `${14 + ((n * 11) % 14)}rem`,
    });
  }
  return out;
}

type SectionParticlesProps = {
  /** Number of drifting elements (keep modest — they animate forever) */
  count?: number;
  /** Vary the pattern between sections so they don't move in sync */
  seed?: number;
};

export function SectionParticles({ count = 12, seed = 0 }: SectionParticlesProps) {
  return (
    <div aria-hidden className="section-particles">
      {buildParticles(count, seed).map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            transform: `rotate(${p.rotate})`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            ["--rot" as string]: p.rotate,
            ["--rise" as string]: p.rise,
          }}
        />
      ))}
    </div>
  );
}
