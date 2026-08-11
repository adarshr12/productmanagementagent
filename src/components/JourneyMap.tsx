"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type JourneyStep = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

const ROW_H = 168;
const MARGIN_TOP = 90;
const CENTER_X = 210;
const AMPLITUDE = 120;
const VIEW_W = CENTER_X * 2;

// Real SVG icons — no emoji-as-icon (flags, cars, person glyphs render
// inconsistently across platforms and read as unpolished at this size).

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth={1.6}
        opacity={0.5}
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 32 20" className="h-5 w-8" fill="none" aria-hidden="true">
      <path
        d="M4 13 6 7.5c.6-1.6 1.3-2 3-2h10c1.7 0 2.4.4 3 2L28 13"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="2" y="12" width="28" height="4.5" rx="2.2" fill="currentColor" />
      <circle cx="9" cy="17.5" r="2.5" fill="#0a0e14" stroke="currentColor" strokeWidth={1.6} />
      <circle cx="23" cy="17.5" r="2.5" fill="#0a0e14" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

// Smooth cubic-bezier road through a column of points, curving left/right —
// a flowing road rather than a straight line or right-angle path.
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/**
 * A generated-every-time visual: a flowing, curving road (top to bottom) —
 * matching the winding-path reference style, recolored to this product's
 * dark/cyan theme instead of the pink reference. As the visitor scrolls, a
 * car drives the length of the road (GSAP ScrollTrigger, scrubbed to scroll
 * position) while each flag's color still reflects real progress.
 */
export function JourneyMap({
  steps,
  startLabel,
  finishLabel,
}: {
  steps: JourneyStep[];
  startLabel: string;
  finishLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const travelledRef = useRef<SVGPathElement>(null);
  const carRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => {
    const total = steps.length + 2; // + start + finish
    const at = (i: number) => ({
      x: CENTER_X + (i % 2 === 0 ? -1 : 1) * AMPLITUDE * (i === 0 || i === total - 1 ? 0 : 1),
      y: MARGIN_TOP + i * ROW_H,
    });
    const start = at(0);
    const finish = at(total - 1);
    const stepPoints = steps.map((s, i) => ({ step: s, ...at(i + 1) }));
    const allPoints = [start, ...stepPoints, finish];
    const viewH = MARGIN_TOP * 2 + (total - 1) * ROW_H;
    return { start, finish, stepPoints, allPoints, viewH };
  }, [steps]);

  const roadD = smoothPath(layout.allPoints);

  // Scroll-driven: the road draws in and the car travels its length as the
  // visitor scrolls through this section.
  useEffect(() => {
    if (!containerRef.current || !pathRef.current) return;
    const pathEl = pathRef.current;
    const travelledEl = travelledRef.current;
    const carEl = carRef.current;
    const totalLen = pathEl.getTotalLength();

    if (travelledEl) {
      travelledEl.style.strokeDasharray = `${totalLen}`;
      travelledEl.style.strokeDashoffset = `${totalLen}`;
    }

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 85%",
      end: "bottom 60%",
      scrub: 0.6,
      onUpdate: (self) => {
        const len = self.progress * totalLen;
        if (travelledEl) travelledEl.style.strokeDashoffset = `${totalLen - len}`;
        if (carEl) {
          const pt = pathEl.getPointAtLength(len);
          const ptAhead = pathEl.getPointAtLength(Math.min(len + 1, totalLen));
          const angle =
            (Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * 180) / Math.PI;
          gsap.set(carEl, {
            left: `${(pt.x / VIEW_W) * 100}%`,
            top: `${(pt.y / layout.viewH) * 100}%`,
            rotate: angle,
          });
        }
      },
    });

    return () => trigger.kill();
  }, [layout.viewH, roadD]);

  const firstNotDoneIdx = steps.findIndex((s) => s.status !== "done");
  const allDone = firstNotDoneIdx === -1 && steps.length > 0;

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div className="card overflow-hidden">
      <div
        ref={containerRef}
        className="relative mx-auto w-full"
        style={{ maxWidth: VIEW_W, aspectRatio: `${VIEW_W} / ${layout.viewH}` }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEW_W} ${layout.viewH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path
            d={roadD}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={20}
            strokeLinecap="round"
          />
          <path
            ref={pathRef}
            d={roadD}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={2}
            strokeDasharray="10 10"
            strokeLinecap="round"
          />
          <path
            ref={travelledRef}
            d={roadD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={6}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.6))" }}
          />
        </svg>

        {/* the car — driven by scroll position */}
        <div
          ref={carRef}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-accent-500"
          style={{ left: "0%", top: "0%", filter: "drop-shadow(0 0 8px rgba(34,211,238,0.8))" }}
          aria-hidden="true"
        >
          <CarIcon />
        </div>

        {/* start marker */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: pct(layout.start.x, VIEW_W), top: pct(layout.start.y, layout.viewH) }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-cream text-ink shadow">
            <PinIcon />
          </span>
          <span className="mt-1.5 max-w-[130px] rounded-md bg-surface-raised px-2 py-1 text-center text-[11px] font-medium text-cream/70 shadow-glass-sm">
            {startLabel}
          </span>
        </div>

        {/* milestone markers */}
        {layout.stepPoints.map(({ step, x, y }, i) => {
          const isCurrent = i === firstNotDoneIdx;
          const isDone = step.status === "done";
          return (
            <div
              key={step.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: pct(x, VIEW_W), top: pct(y, layout.viewH) }}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold shadow ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCurrent
                    ? "border-accent-500 bg-surface text-accent-500 shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                    : "border-white/15 bg-surface text-cream/30"
                }`}
              >
                {isDone ? <CheckIcon /> : i + 1}
              </span>
              <span
                className={`mt-1.5 max-w-[150px] rounded-md px-2 py-1 text-center text-[11px] font-medium leading-snug shadow-glass-sm ${
                  isDone
                    ? "bg-emerald-500/10 text-emerald-300"
                    : isCurrent
                    ? "bg-accent-500/10 text-accent-500"
                    : "bg-surface-raised text-cream/40"
                }`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}

        {/* finish */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: pct(layout.finish.x, VIEW_W), top: pct(layout.finish.y, layout.viewH) }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-accent-500 text-ink shadow-[0_0_20px_rgba(34,211,238,0.6)]">
            <TargetIcon />
          </span>
          <span className="mt-1.5 max-w-[140px] rounded-md bg-surface-raised px-2 py-1 text-center text-[11px] font-semibold text-cream shadow-glass-sm">
            {finishLabel}
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-cream/40">
        {allDone
          ? `You've reached the end, you're ready for ${finishLabel} roles.`
          : `Scroll to drive the road to ${finishLabel}.`}
      </p>
    </div>
  );
}
