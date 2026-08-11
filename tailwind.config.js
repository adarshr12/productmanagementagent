/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Futuristic register: geometric grotesk for display, replacing the
        // warm literary-serif direction that was explicitly rejected.
        display: ["var(--font-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Cool near-black + a single electric-cyan accent, replacing the warm
        // ink/gold "coaching brand" palette that was explicitly rejected.
        // Cyan/teal (not purple/blue-violet) deliberately avoids the
        // "AI-gradient" cliché flagged by the design-taste skill.
        ink: "#0a0e14",
        surface: {
          DEFAULT: "#101722",
          raised: "#182234",
        },
        cream: {
          DEFAULT: "#eaf2f7",
          dim: "#c7d3dc",
        },
        accent: {
          50: "#e6fbff",
          100: "#bff3fb",
          200: "#7fe6f5",
          500: "#22d3ee",
          600: "#0891b2",
        },
      },
      // One radius scale, used deliberately: xl for controls (buttons,
      // inputs, chips), 2xl for surfaces (cards, chat bubbles, the roadmap
      // shell). Overriding 2xl here instead of reaching for an arbitrary
      // rounded-[22px] value keeps every "surface" corner in lockstep.
      borderRadius: {
        "2xl": "22px",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
};
