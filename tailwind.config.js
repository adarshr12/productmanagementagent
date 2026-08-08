/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Full commitment to one register — dark, editorial, warm — instead of
        // switching between a light "paper" page and a dark "ink" section.
        // Per the redesign audit: alternating light/dark sections page-to-page
        // reads as unintentional, not as design.
        ink: "#141110",
        surface: {
          DEFAULT: "#1e1811",
          raised: "#28211a",
        },
        cream: {
          DEFAULT: "#f2efe9",
          dim: "#e4ddce",
        },
        accent: {
          50: "#fbf3e1",
          100: "#f5e4bd",
          200: "#e8cb84",
          500: "#c9a24b",
          600: "#a9822f",
        },
        // Kept for the few remaining light-surface contexts (admin/login).
        brand: {
          50: "#f2efe9",
          100: "#e4ddce",
          200: "#c9bda2",
          500: "#48423a",
          600: "#2a251f",
          700: "#191510",
        },
        paper: "#faf6ee",
        muted: "#a89a86",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};
