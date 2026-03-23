/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── TalonVigil Brand Palette ──────────────────────────
        navy:  { DEFAULT: "#0D1B2A", 800: "#0a1520", 900: "#070e18" },
        blue:  { DEFAULT: "#1B6CA8", 400: "#2d84c8", 600: "#155a8a" },
        cyan:  { DEFAULT: "#00C2D4", 400: "#00dff4", 600: "#009aaa" },
        // ── Semantic ──────────────────────────────────────────
        safe:       "#22c55e",
        suspicious: "#f59e0b",
        quarantine: "#ef4444",
        veto:       "#a855f7",
      },
      fontFamily: {
        // Space Grotesk for headings, JetBrains Mono for data/scores
        sans:  ["Space Grotesk", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },
      animation: {
        "scan-pulse": "scan-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "layer-in":   "layer-in 0.4s ease-out forwards",
        "glow":       "glow 3s ease-in-out infinite",
      },
      keyframes: {
        "scan-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
        "layer-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,194,212,0.2)" },
          "50%":      { boxShadow: "0 0 40px rgba(0,194,212,0.5)" },
        },
      },
    },
  },
  plugins: [],
};
