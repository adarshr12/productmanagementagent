/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Flat-design SaaS palette (from the UI/UX skill)
        brand: {
          50: "#eff5ff",
          100: "#dbe8fe",
          200: "#bfd7fe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        accent: {
          50: "#fff4ed",
          100: "#ffe6d5",
          500: "#f97316",
          600: "#ea580c",
        },
        ink: "#1e293b",
        muted: "#64748b",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};
