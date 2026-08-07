"use client";

import { useMemo } from "react";

export type JourneyStep = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
};

const VIEW_W = 640;
const VIEW_H = 260;
const MARGIN_X = 46;
const MARGIN_TOP = 34;
const MARGIN_BOTTOM = 46;

/**
 * A generated-every-time visual: an ascending road from "where you are" to
 * "where you'll be", with one flagged milestone per roadmap step and a
 * marker showing current progress along it. Hand-built SVG + Tailwind
 * overlay, no chart library.
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
  const points = useMemo(() => {
    const n = steps.length;
    const usableW = VIEW_W - MARGIN_X * 2;
    const usableH = VIEW_H - MARGIN_TOP - MARGIN_BOTTOM;
    // t=0 is the start marker, t=1 is the finish flag; steps sit evenly between.
    const at = (t: number) => {
      const x = MARGIN_X + t * usableW;
      // Gentle uphill climb (bottom-left -> top-right) with a light zigzag
      // per stop so it reads as a winding road, not a straight ramp.
      const zigzag = Math.sin(t * Math.PI * (n + 1)) * 10;
      const y = VIEW_H - MARGIN_BOTTOM - t * usableH + zigzag;
      return { x, y };
    };

    const start = at(0);
    const finish = at(1);
    const stepPoints = steps.map((s, i) => ({
      step: s,
      ...at((i + 1) / (n + 1)),
    }));
    return { start, finish, stepPoints };
  }, [steps]);

  const firstNotDoneIdx = steps.findIndex((s) => s.status !== "done");
  const allDone = firstNotDoneIdx === -1 && steps.length > 0;
  const avatarPos = allDone
    ? points.finish
    : firstNotDoneIdx === -1
    ? points.start
    : points.stepPoints[firstNotDoneIdx];

  const roadD = [
    `M ${points.start.x} ${points.start.y}`,
    ...points.stepPoints.map((p) => `L ${p.x} ${p.y}`),
    `L ${points.finish.x} ${points.finish.y}`,
  ].join(" ");

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div className="card overflow-hidden">
      <div
        className="relative mx-auto w-full"
        style={{ maxWidth: VIEW_W, aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* road bed */}
          <path
            d={roadD}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* dashed centre line */}
          <path
            d={roadD}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeDasharray="8 8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* travelled portion, highlighted */}
          <path
            d={[
              `M ${points.start.x} ${points.start.y}`,
              ...points.stepPoints
                .slice(0, firstNotDoneIdx === -1 ? steps.length : firstNotDoneIdx)
                .map((p) => `L ${p.x} ${p.y}`),
            ].join(" ")}
            fill="none"
            stroke="#2563eb"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        </svg>

        {/* start marker */}
        <div
          className="absolute flex -translate-x-1/2 flex-col items-center"
          style={{
            left: pct(points.start.x, VIEW_W),
            top: pct(points.start.y, VIEW_H),
            transform: "translate(-50%, 10%)",
          }}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-base shadow">
            🧑
          </span>
          <span className="mt-1 max-w-[110px] rounded-md bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-medium text-slate-600 shadow-sm">
            {startLabel}
          </span>
        </div>

        {/* milestone markers */}
        {points.stepPoints.map(({ step, x, y }, i) => {
          const isCurrent = i === firstNotDoneIdx;
          const isDone = step.status === "done";
          return (
            <div
              key={step.id}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{
                left: pct(x, VIEW_W),
                top: pct(y, VIEW_H),
                transform: "translate(-50%, -50%)",
              }}
            >
              {isCurrent && !allDone && (
                <span className="absolute -top-7 text-lg" aria-hidden="true">
                  🧍
                </span>
              )}
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm shadow ${
                  isDone
                    ? "border-emerald-600 bg-emerald-500 text-white"
                    : isCurrent
                    ? "border-brand-600 bg-white text-brand-600"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {isDone ? "✓" : "🚩"}
              </span>
              <span
                className={`mt-1 max-w-[92px] rounded-md px-1.5 py-0.5 text-center text-[10px] font-medium shadow-sm ${
                  isDone
                    ? "bg-emerald-50 text-emerald-700"
                    : isCurrent
                    ? "bg-brand-50 text-brand-700"
                    : "bg-white/90 text-slate-500"
                }`}
                style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {step.title}
              </span>
            </div>
          );
        })}

        {/* finish flag */}
        <div
          className="absolute flex -translate-x-1/2 flex-col items-center"
          style={{
            left: pct(points.finish.x, VIEW_W),
            top: pct(points.finish.y, VIEW_H),
            transform: "translate(-50%, -10%)",
          }}
        >
          {allDone && (
            <span className="absolute -top-7 text-lg" aria-hidden="true">
              🎉
            </span>
          )}
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-accent-500 text-lg shadow">
            {finishEmoji}
          </span>
          <span className="mt-1 max-w-[120px] rounded-md bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-semibold text-ink shadow-sm">
            {finishLabel}
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        {allDone
          ? `You've reached the top — you're ready for ${finishLabel} roles.`
          : `Clear each flag to reach ${finishLabel}.`}
      </p>
    </div>
  );
}
