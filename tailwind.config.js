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
        // Palette derived directly from Lottie animation (cd0a9496-172f-4bad-8dd1-36a1d32caca9/VmHC2dM7zF.lottie)
        paper: "#f4f8fd",
        surface: {
          DEFAULT: "#ffffff",
          raised: "#f8fafd",
        },
        ink: "#0f172a",
        slate: {
          DEFAULT: "#475569",
          soft: "#8297b0",
        },
        line: "#dbe4f0",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "#eef4ff",
          100: "#dbe8fe",
          200: "#c9dcf7",
          300: "#9ccaef",
          400: "#5886f5",
          500: "#3f6ddc",
          600: "#2553c2",
          700: "#1d42a3",
          teal: "#5886f5",
          violet: "#b687f2",
          amber: "#eaad59",
          rose: "#e695ae",
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
