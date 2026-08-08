"use client";

type Strength = "strong" | "moderate" | "developing";

function getStrength(score: number): Strength {
  if (score >= 75) return "strong";
  if (score >= 45) return "moderate";
  return "developing";
}

const STRENGTH_STYLES: Record<
  Strength,
  { label: string; badge: string; stroke: string }
> = {
  strong: {
    label: "Strong fit",
    badge: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    stroke: "#34d399",
  },
  moderate: {
    label: "Moderate fit",
    badge: "border border-amber-500/25 bg-amber-500/10 text-amber-300",
    stroke: "#f6b93b",
  },
  developing: {
    label: "Developing fit",
    badge: "border border-white/15 bg-white/[0.04] text-cream/50",
    stroke: "#8a7f6d",
  },
};

const RADIUS = 45;
const HALF_CIRCUMFERENCE = Math.PI * RADIUS;

/**
 * Animated half-circle fit-score gauge for a role result card.
 * Hand-built (no external component library) to match the app's existing
 * flat-SaaS Tailwind design system.
 */
export function RoleScoreGauge({
  score,
  delayMs = 0,
}: {
  score: number;
  delayMs?: number;
}) {
  const clamped = Math.min(Math.max(score, 0), 100);
  const strength = getStrength(clamped);
  const style = STRENGTH_STYLES[strength];
  // Circle is centered just past the bottom edge of the viewBox so only its
  // top half renders (the viewBox clips the rest) — that clipped top half is
  // the "half-circle gauge". A plain full circle (no dasharray) gives the
  // gray track for free. For the progress arc, a dash the length of one
  // half-circumference starts at the 3-o'clock point and — because SVG angle
  // increases clockwise — initially runs through the (clipped) BOTTOM half.
  // A negative dashoffset shifts that dash backwards along the path so it
  // instead covers the top half, sweeping from 9-o'clock towards 3-o'clock
  // as the offset approaches -HALF_CIRCUMFERENCE (i.e. the full score).
  const targetOffset = -(clamped / 100) * HALF_CIRCUMFERENCE;

  return (
    <div className="flex w-24 shrink-0 flex-col items-center sm:w-28">
      <svg className="h-14 w-24 sm:h-16 sm:w-28" viewBox="0 0 100 50" aria-hidden="true">
        <g fill="none" strokeWidth="9" transform="translate(50, 48)">
          <circle stroke="rgba(255,255,255,0.1)" r={RADIUS} />
          <circle
            r={RADIUS}
            stroke={style.stroke}
            strokeLinecap="round"
            strokeDasharray={`${HALF_CIRCUMFERENCE} ${HALF_CIRCUMFERENCE}`}
            className="score-arc"
            style={
              {
                "--score-offset": targetOffset,
                animationDelay: `${delayMs}ms`,
              } as React.CSSProperties
            }
          />
        </g>
      </svg>
      <div className="-mt-6 text-xl font-extrabold text-cream sm:text-2xl">
        {Math.round(clamped)}
      </div>
      <span className={`pill mt-1.5 whitespace-nowrap ${style.badge}`}>
        {style.label}
      </span>
    </div>
  );
}
