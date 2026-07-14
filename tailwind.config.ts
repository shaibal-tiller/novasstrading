import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#16191F",
          soft: "#22272F",
          muted: "#3A4049",
        },
        paper: "#FCFBF7",
        ivory: {
          DEFAULT: "#F6F3ED",
          light: "#F8F5EF",
          deep: "#EFE7DD",
        },
        canvas: "#FFFFFF",
        brass: {
          DEFAULT: "#B08A4F",
          light: "#C6A268",
          dark: "#8C6C3A",
        },
        loom: {
          DEFAULT: "#1E4D4A",
          light: "#2C6B66",
        },
        stone: {
          DEFAULT: "#DDD5C7",
          dark: "#C4B9A6",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        shell: "78rem",
      },
      letterSpacing: {
        eyebrow: "0.28em",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow-kf": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "spin-slow": "spin-slow-kf 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
