"use client";

import { useMemo } from "react";

export type JourneyStep = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

const COLS = 3;
const CELL_W = 170;
const CELL_H = 150;
const MARGIN = 90;

/**
 * A generated-every-time visual: a path with real right-angle turns (like a
 * game board), not a diagonal line — one flagged milestone per roadmap step,
 * generously spaced so labels never overlap, with a marker showing current
 * progress. Hand-built SVG + Tailwind, no chart library.
 */
export function JourneyMap({
  steps,
  startLabel,
  finishLabel,
  finishEmoji = "🏁",
}: {
  steps: JourneyStep[];
  startLabel: string;
  finishLabel: string;
  finishEmoji?: string;
}) {
  const layout = useMemo(() => {
    const total = steps.length + 2; // + start + finish
    const rows = Math.ceil(total / COLS);
    const at = (i: number) => {
      const row = Math.floor(i / COLS);
      const posInRow = i % COLS;
      const col = row % 2 === 0 ? posInRow : COLS - 1 - posInRow;
      return { x: MARGIN + col * CELL_W, y: MARGIN + row * CELL_H };
    };
    const start = at(0);
    const finish = at(total - 1);
    const stepPoints = steps.map((s, i) => ({ step: s, ...at(i + 1) }));
    const viewW = MARGIN * 2 + (COLS - 1) * CELL_W;
    const viewH = MARGIN * 2 + (rows - 1) * CELL_H;
    const allPoints = [start, ...stepPoints, finish];
    return { start, finish, stepPoints, viewW, viewH, allPoints };
  }, [steps]);

  const firstNotDoneIdx = steps.findIndex((s) => s.status !== "done");
  const allDone = firstNotDoneIdx === -1 && steps.length > 0;

  const roadD = layout.allPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const travelledCount =
    firstNotDoneIdx === -1 ? steps.length : firstNotDoneIdx;
  const travelledD = layout.allPoints
    .slice(0, travelledCount + 1)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div className="card overflow-hidden">
      <div
        className="relative mx-auto w-full"
        style={{
          maxWidth: layout.viewW,
          aspectRatio: `${layout.viewW} / ${layout.viewH}`,
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${layout.viewW} ${layout.viewH}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path
            d={roadD}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={roadD}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
            strokeDasharray="9 9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={travelledD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.75}
          />
        </svg>

        {/* start marker */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: pct(layout.start.x, layout.viewW), top: pct(layout.start.y, layout.viewH) }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-cream text-lg text-ink shadow">
            🧑
          </span>
          <span className="mt-1.5 max-w-[130px] rounded-md bg-surface-raised px-2 py-1 text-center text-[11px] font-medium text-cream/70 shadow-sm">
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
              style={{ left: pct(x, layout.viewW), top: pct(y, layout.viewH) }}
            >
              {isCurrent && !allDone && (
                <span
                  className="absolute -top-8 text-xl"
                  aria-hidden="true"
                  style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.7))" }}
                >
                  🧍
                </span>
              )}
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-base shadow ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCurrent
                    ? "border-accent-500 bg-surface text-accent-500 shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                    : "border-white/15 bg-surface text-cream/30"
                }`}
              >
                {isDone ? "✓" : "🚩"}
              </span>
              <span
                className={`mt-1.5 max-w-[140px] rounded-md px-2 py-1 text-center text-[11px] font-medium leading-snug shadow-sm ${
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

        {/* finish flag */}
        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: pct(layout.finish.x, layout.viewW), top: pct(layout.finish.y, layout.viewH) }}
        >
          {allDone && (
            <span className="absolute -top-8 text-xl" aria-hidden="true">
              🎉
            </span>
          )}
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-accent-500 text-xl shadow-[0_0_20px_rgba(34,211,238,0.6)]">
            {finishEmoji}
          </span>
          <span className="mt-1.5 max-w-[140px] rounded-md bg-surface-raised px-2 py-1 text-center text-[11px] font-semibold text-cream shadow-sm">
            {finishLabel}
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-cream/40">
        {allDone
          ? `You've reached the end — you're ready for ${finishLabel} roles.`
          : `Clear each flag to reach ${finishLabel}.`}
      </p>
    </div>
  );
}
