"use client";

import { useMemo, useRef, useState } from "react";

export type JourneyStep = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  details?: string[];
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// Pinpoint Marker Icon for the road nodes
function PinpointMarker({
  stepNumber,
  status,
  isHovered,
}: {
  stepNumber: number;
  status: "todo" | "in_progress" | "done";
  isHovered?: boolean;
}) {
  const isDone = status === "done";
  const isCurrent = status === "in_progress";

  return (
    <div
      className={`group relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 text-xs font-extrabold shadow-lg transition-all duration-300 ${
        isDone
          ? "border-white bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-900/30"
          : isCurrent
          ? "border-white bg-gradient-to-tr from-sky-500 to-blue-600 text-white ring-4 ring-sky-300/50 shadow-sky-900/40"
          : "border-slate-200 bg-slate-800 text-slate-100 shadow-slate-900/20 hover:bg-slate-700"
      } ${isHovered ? "scale-125 ring-4 ring-sky-400 shadow-2xl" : "hover:scale-110"}`}
    >
      {isDone ? <CheckIcon /> : stepNumber}
    </div>
  );
}

// Catmull-Rom to Cubic Bezier curve string generator for 100% smooth curves with ZERO kinks
function getSmoothSplineD(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function JourneyMap({
  steps,
  startLabel,
  finishLabel,
  onSelectStep,
}: {
  steps: JourneyStep[];
  startLabel: string;
  finishLabel: string;
  onSelectStep?: (stepId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const firstNotDoneIdx = steps.findIndex((s) => s.status !== "done");

  // Default closed state (no card open by default unless hovered/clicked)
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);
  const [clickedStepId, setClickedStepId] = useState<string | null>(null);

  // Scalable SVG ViewBox dimensions (fits 100% container width with ZERO horizontal scroll!)
  const VIEW_W = 1000;
  const VIEW_H = 620;

  // Road thickness configuration
  const ROAD_WIDTH = 48;
  const WHITE_BORDER_OFFSET = 6;

  // Generate smooth horizontal centerline spline points in the middle band
  const centerPoints = useMemo(() => {
    const total = steps.length + 2; // + start + finish
    const pts = [];

    const waveRatios = [
      { x: 0.08, y: 0.50 }, // Start Left
      { x: 0.20, y: 0.40 },
      { x: 0.34, y: 0.60 },
      { x: 0.50, y: 0.42 },
      { x: 0.66, y: 0.58 },
      { x: 0.80, y: 0.40 },
      { x: 0.92, y: 0.50 }, // Target Right
    ];

    for (let i = 0; i < total; i++) {
      const progress = i / (total - 1);
      const idxFloat = progress * (waveRatios.length - 1);
      const idx0 = Math.floor(idxFloat);
      const idx1 = Math.min(idx0 + 1, waveRatios.length - 1);
      const t = idxFloat - idx0;

      const rx = waveRatios[idx0].x + t * (waveRatios[idx1].x - waveRatios[idx0].x);
      const ry = waveRatios[idx0].y + t * (waveRatios[idx1].y - waveRatios[idx0].y);

      pts.push({
        x: rx * VIEW_W,
        y: ry * VIEW_H,
      });
    }
    return pts;
  }, [steps.length, VIEW_W, VIEW_H]);

  const smoothCenterD = useMemo(() => getSmoothSplineD(centerPoints), [centerPoints]);

  const startPt = centerPoints[0];
  const finishPt = centerPoints[centerPoints.length - 1];

  // Map steps onto alternating top/bottom road edge points
  const stepNodes = useMemo(() => {
    return steps.map((step, idx) => {
      const cPt = centerPoints[idx + 1];
      const prev = centerPoints[Math.max(0, idx)];
      const next = centerPoints[Math.min(centerPoints.length - 1, idx + 2)];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const angle = Math.atan2(dy, dx);

      const isTop = idx % 2 === 0;
      const normAngle = angle + (isTop ? -Math.PI / 2 : Math.PI / 2);
      const r = ROAD_WIDTH / 2 + WHITE_BORDER_OFFSET / 2;

      const nodeX = cPt.x + r * Math.cos(normAngle);
      const nodeY = cPt.y + r * Math.sin(normAngle);

      return {
        step,
        index: idx,
        centerPt: cPt,
        nodePt: { x: nodeX, y: nodeY },
        isTop,
      };
    });
  }, [steps, centerPoints]);

  const activeFocusedId = hoveredStepId || clickedStepId;

  return (
    <div className="relative w-full rounded-3xl border border-sky-200/80 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#ffffff] p-4 shadow-xl sm:p-8">
      {/* Soft Ambient Sky Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
      </div>

      {/* Non-Scrollable 100% Width Canvas Wrapper (No Horizontal Scrollbar!) */}
      <div className="relative w-full overflow-visible py-2">
        <div
          ref={containerRef}
          className="relative mx-auto w-full"
          style={{ maxWidth: VIEW_W, aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="asphaltGradClean" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="60%" stopColor="#334155" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              <filter id="asphaltShadowClean" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Ambient Shadow Layer */}
            <path
              d={smoothCenterD}
              fill="none"
              stroke="#0f172a"
              strokeWidth={ROAD_WIDTH + WHITE_BORDER_OFFSET + 10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.14"
              filter="blur(8px)"
            />

            {/* Smooth Outer White Border Layer */}
            <path
              d={smoothCenterD}
              fill="none"
              stroke="#ffffff"
              strokeWidth={ROAD_WIDTH + WHITE_BORDER_OFFSET}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#asphaltShadowClean)"
            />

            {/* Dark Charcoal Asphalt Core Layer */}
            <path
              d={smoothCenterD}
              fill="none"
              stroke="url(#asphaltGradClean)"
              strokeWidth={ROAD_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dashed White Center Lane Line */}
            <path
              d={smoothCenterD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeDasharray="16 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* Leader Lines & Blue Edge Dots */}
            {stepNodes.map(({ nodePt, step, index, isTop }) => {
              const isDone = step.status === "done";
              const isCurrent = index === firstNotDoneIdx;
              const isFocused = activeFocusedId === step.id;

              const targetY = isTop ? nodePt.y - 45 : nodePt.y + 45;

              return (
                <g key={`node-${step.id}`}>
                  {/* Vertical Leader Line */}
                  <line
                    x1={nodePt.x}
                    y1={nodePt.y}
                    x2={nodePt.x}
                    y2={targetY}
                    stroke={isDone ? "#10b981" : isCurrent ? "#0ea5e9" : "#94a3b8"}
                    strokeWidth={isFocused ? "2.5" : "1.8"}
                    strokeDasharray={isDone || isCurrent ? "none" : "4 4"}
                  />

                  {/* Blue Indicator Dot Positioned Centered on the White Edge Border */}
                  <circle
                    cx={nodePt.x}
                    cy={nodePt.y}
                    r={isFocused ? "7.5" : "6"}
                    className={
                      isDone
                        ? "fill-emerald-500 stroke-white"
                        : isCurrent
                        ? "fill-sky-400 stroke-white ring-4 ring-sky-300/50"
                        : "fill-sky-500 stroke-white"
                    }
                    strokeWidth="2.5"
                  />

                  {/* Inner White Center Dot */}
                  <circle cx={nodePt.x} cy={nodePt.y} r="2" fill="#ffffff" />
                </g>
              );
            })}
          </svg>

          {/* Start Banner (Left Foreground) */}
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center z-20"
            style={{ left: `${(startPt.x / VIEW_W) * 100}%`, top: `${(startPt.y / VIEW_H) * 100}%` }}
          >
            <div className="min-w-[130px] sm:min-w-[160px] rounded-2xl border border-sky-300 bg-white/95 px-3 py-2 text-center shadow-xl backdrop-blur-md">
              <span className="text-[9px] font-extrabold tracking-wider text-sky-700 uppercase">START</span>
              <p className="text-xs font-bold text-slate-800 leading-snug break-words">{startLabel}</p>
            </div>
          </div>

          {/* Target Banner (Right Vanishing Point) */}
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center z-20"
            style={{ left: `${(finishPt.x / VIEW_W) * 100}%`, top: `${(finishPt.y / VIEW_H) * 100}%` }}
          >
            <div className="min-w-[150px] sm:min-w-[180px] rounded-2xl border border-slate-900 bg-slate-900 px-3.5 py-2 text-center text-white shadow-xl backdrop-blur-md">
              <span className="text-[9px] font-extrabold tracking-widest text-sky-400 uppercase">TARGET ROLE</span>
              <p className="text-xs font-extrabold text-white leading-snug break-words">{finishLabel}</p>
            </div>
          </div>

          {/* PINPOINTS ON ROAD NODES (Cards closed by default!) */}
          {stepNodes.map(({ nodePt, step, index, isTop }) => {
            const isDone = step.status === "done";
            const isCurrent = index === firstNotDoneIdx;
            const isFocused = activeFocusedId === step.id;

            const targetY = isTop ? nodePt.y - 45 : nodePt.y + 45;

            return (
              <div
                key={step.id}
                onMouseEnter={() => setHoveredStepId(step.id)}
                onMouseLeave={() => setHoveredStepId(null)}
                onClick={() => {
                  setClickedStepId(clickedStepId === step.id ? null : step.id);
                  if (onSelectStep) onSelectStep(step.id);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all"
                style={{
                  left: `${(nodePt.x / VIEW_W) * 100}%`,
                  top: `${(targetY / VIEW_H) * 100}%`,
                  zIndex: isFocused ? 50 : 20,
                }}
              >
                {/* Pinpoint Icon */}
                <PinpointMarker
                  stepNumber={index + 1}
                  status={step.status}
                  isHovered={isFocused}
                />

                {/* FLOATING HOVER / CLICK DETAIL CARD */}
                {isFocused && (
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-56 sm:w-64 rounded-2xl border border-sky-300/80 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95 ${
                      isTop ? "bottom-full mb-3" : "top-full mt-3"
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-1.5 flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-[10px] font-extrabold tracking-wider text-sky-700 uppercase">
                        STEP 0{index + 1}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800"
                            : isCurrent
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isDone ? "Completed ✓" : isCurrent ? "Active Focus ⚡" : "Up Next"}
                      </span>
                    </div>

                    {/* Step Title */}
                    <h4 className="font-display text-xs font-bold leading-snug text-slate-900">
                      {step.title}
                    </h4>

                    {/* Sub Details */}
                    {step.details && step.details.length > 0 && (
                      <ul className="mt-1.5 space-y-1 text-[11px] text-slate-600">
                        {step.details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold">✓</span>
            <span>Completed Step</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-sky-500 ring-2 ring-sky-200 flex items-center justify-center text-white text-[9px] font-bold">⚡</span>
            <span>Active Milestone Pin (Hover/Click for details)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-slate-800 ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold">1</span>
            <span>Upcoming Pinpoint</span>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-800">
          {steps.filter((s) => s.status === "done").length} of {steps.length} Milestones Achieved
        </p>
      </div>
    </div>
  );
}
