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
        // Light, editorial, professional-services palette: cool paper
        // background + deep-navy ink text + a single confident blue/teal
        // accent. Replaces the dark cyan "AI SaaS" system — that read as a
        // tech demo, not a credible advisor for a high-stakes career
        // decision. Blue-to-teal (not purple) still avoids the AI-gradient
        // cliché the original palette was chosen to avoid.
        paper: "#f6f7f9",
        surface: {
          DEFAULT: "#ffffff",
          raised: "#fbfcfd",
        },
        ink: "#10192b",
        slate: {
          DEFAULT: "#566072",
          soft: "#8a94a6",
        },
        line: "#e3e6eb",
        accent: {
          // `DEFAULT`/`foreground` are the shadcn semantic slot (bg-accent,
          // text-accent-foreground) — new shadcn/ui components added via
          // `npx shadcn add` pick this up automatically. The numeric shades
          // below are untouched: every existing accent-500/accent-600/etc.
          // class in the app keeps resolving exactly as it did before.
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#eaf3ff",
          100: "#d6e8ff",
          200: "#a9cbff",
          500: "#155eef",
          600: "#0f4fc7",
          teal: "#0ba5a6",
        },
        // shadcn's remaining semantic tokens, mapped to the SAME palette
        // above (see globals.css :root) so a freshly-added shadcn component
        // is themed correctly on arrival instead of defaulting to zinc/blue.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      // One radius scale: shadcn's lg/md/sm derive from --radius (12px,
      // matching this app's existing control radius so new shadcn
      // components land on-scale automatically), and 2xl stays the
      // explicit 22px used for surfaces (cards, chat bubbles, the roadmap
      // shell) — overriding it here instead of an arbitrary rounded-[22px]
      // keeps every "surface" corner in lockstep.
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "22px",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
