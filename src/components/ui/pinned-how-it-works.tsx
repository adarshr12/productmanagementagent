"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type PinnedStep = {
  step: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

const POSITIONS = [
  { className: "md:absolute md:top-0 md:left-[8%]", rotate: "md:-rotate-3" },
  { className: "md:absolute md:top-[210px] md:right-[6%]", rotate: "md:rotate-2" },
  { className: "md:absolute md:top-[460px] md:left-[14%]", rotate: "md:-rotate-2" },
];

const THEMES = [
  { badge: "bg-accent-50 text-accent-500", pin: "text-accent-500" },
  { badge: "bg-accent-teal/10 text-accent-teal", pin: "text-accent-teal" },
];

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
    </svg>
  );
}

/** Corkboard-pinned step cards with a hand-drawn connecting line. Fully
 * visible on first paint — the connecting line's dash animation is the
 * only thing gated behind JS, matching Reveal.tsx's progressive-enhancement
 * rule (see src/components/Reveal.tsx). */
export function PinnedHowItWorks({ steps }: { steps: PinnedStep[] }) {
  const height = 720;

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="relative mx-auto w-full max-w-[900px] md:h-[var(--h)]"
        style={{ "--h": `${height}px` } as React.CSSProperties}
      >
        <svg
          className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
          viewBox={`0 0 900 ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <m.path
            d="M 230 130 C 480 130, 560 260, 730 260 C 880 260, 480 330, 250 470"
            stroke="currentColor"
            className="text-line"
            strokeWidth="2"
            strokeDasharray="8 6"
            fill="none"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            animate={{ strokeDashoffset: [0, -140] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        <div className="flex flex-col gap-6 md:block">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const pos = POSITIONS[i % POSITIONS.length];
            const theme = THEMES[i % THEMES.length];
            return (
              <div
                key={s.step}
                className={`relative w-full transition-transform duration-300 hover:z-30 hover:!rotate-0 md:w-[300px] ${pos.className} ${pos.rotate}`}
              >
                <div className="rounded-2xl border border-line bg-white p-2 shadow-[0_16px_32px_-20px_rgba(16,25,43,0.25)]">
                  <PinIcon className={`mx-auto mb-4 h-6 w-6 ${theme.pin}`} />
                  <div className={`flex h-full flex-col rounded-xl border border-line p-4 ${theme.badge}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                      <span className="font-mono text-[11px] tracking-wide">{s.step}</span>
                    </div>
                    <h3 className="font-display mt-3 text-lg font-semibold text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate">{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LazyMotion>
  );
}
