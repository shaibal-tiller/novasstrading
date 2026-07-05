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
          DEFAULT: "#1a1a1a",
          soft: "#2d2d2d",
          muted: "#5a5a5a",
        },
        page: "#EBEBEB",
        card: {
          DEFAULT: "#F4F0EF",
          light: "#F8F5F3",
        },
        canvas: "#FFFFFF",
        accent: {
          DEFAULT: "#B08A4F",
          light: "#C6A268",
          dark: "#8C6C3A",
        },
        ivory: {
          DEFAULT: "#F6F3ED",
          deep: "#EFE7DD",
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
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        shell: "82rem",
      },
      borderRadius: {
        card: "1.5rem",
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
        "slide-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-left": "slide-left 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
