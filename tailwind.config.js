/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Confident consultant/coaching-brand palette: warm paper + near-black
        // ink + a single muted-gold accent. Replaces the earlier flat SaaS blue.
        brand: {
          50: "#f2efe9",
          100: "#e4ddce",
          200: "#c9bda2",
          500: "#48423a",
          600: "#2a251f",
          700: "#191510",
        },
        accent: {
          50: "#fbf3e1",
          100: "#f5e4bd",
          200: "#e8cb84",
          500: "#c9a24b",
          600: "#a9822f",
        },
        paper: "#faf6ee",
        ink: "#18140f",
        muted: "#6b6155",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};
