// Page-wide ambient "fabric thread" atmosphere — yarn dots and thread
// pills drifting upward across the ENTIRE page: over sections, gutters,
// padding and margins alike. One fixed viewport-level layer, pure CSS,
// zero client JS. Values are deterministic so SSR and client markup match.

const PALETTE = [
  "rgba(176, 138, 79, 0.55)", // brass
  "rgba(44, 107, 102, 0.42)", // loom teal
  "rgba(192, 115, 74, 0.42)", // terracotta
  "rgba(176, 138, 79, 0.38)", // brass, softer
  "rgba(91, 123, 176, 0.32)", // indigo
  "rgba(22, 25, 31, 0.22)", // ink haze
];

const COUNT = 46;

type Particle = {
  left: string;
  width: string;
  height: string;
  color: string;
  duration: string;
  delay: string;
  rotate: string;
  drift: string;
  blur: string;
};

function buildParticles(): Particle[] {
  const out: Particle[] = [];
  for (let i = 1; i <= COUNT; i++) {
    const isThread = i % 3 === 0; // every third particle is a thread pill
    const dot = 4 + ((i * 7) % 7); // 4–10px yarn dots
    const threadLen = 22 + ((i * 13) % 34); // 22–55px threads
    const dur = 26 + ((i * 11) % 30); // 26–55s full-height loops
    out.push({
      left: `${(i * 61.803) % 100}%`, // golden-angle spread across full width
      width: isThread ? "2px" : `${dot}px`,
      height: isThread ? `${threadLen}px` : `${dot}px`,
      color: PALETTE[i % PALETTE.length],
      duration: `${dur}s`,
      delay: `-${(i * 7.7) % dur}s`, // negative: already mid-flight on load
      rotate: `${-40 + ((i * 37) % 80)}deg`,
      drift: `${-14 + ((i * 17) % 28)}vw`, // lateral sway while rising
      blur: i % 5 === 0 ? "1.4px" : "0px", // a few soft, out-of-focus motes
    });
  }
  return out;
}

export function PageParticles() {
  return (
    <div aria-hidden className="page-particles">
      {buildParticles().map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            filter: p.blur === "0px" ? undefined : `blur(${p.blur})`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            ["--rot" as string]: p.rotate,
            ["--drift" as string]: p.drift,
          }}
        />
      ))}
    </div>
  );
}
