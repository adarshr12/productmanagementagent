"use client";

import { useState } from "react";
import type { RoadmapStep, StepStatus } from "@/lib/getRoadmap";
import { RoadmapUnlockOverlay } from "@/components/roadmap/RoadmapUnlockOverlay";

const COLUMNS: { key: StepStatus; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "border-slate-300" },
  { key: "in_progress", label: "In Progress", accent: "border-amber-400" },
  { key: "done", label: "Done", accent: "border-emerald-400" },
];

export default function KanbanBoard({
  steps,
  move,
  isAuthenticated = false,
  shareToken,
  role,
}: {
  steps: RoadmapStep[];
  move: (step: RoadmapStep, status: StepStatus) => void;
  isAuthenticated?: boolean;
  shareToken?: string;
  role?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="relative min-h-[460px] rounded-2xl">
      <div
        className={`grid gap-4 md:grid-cols-3 ${
          !isAuthenticated
            ? "filter blur-[6px] select-none pointer-events-none opacity-30"
            : ""
        }`}
      >
        {COLUMNS.map((col) => {
          const colSteps = steps.filter((s) => s.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!isAuthenticated) return;
                const s = steps.find((x) => x.id === dragId);
                if (s) move(s, col.key);
                setDragId(null);
              }}
              className="rounded-2xl bg-paper p-3 border border-line/60"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate">
                  {col.label}
                </h2>
                <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-slate">
                  {colSteps.length}
                </span>
              </div>

              <div className="space-y-3">
                {colSteps.map((step) => {
                  return (
                    <article
                      key={step.id}
                      draggable={isAuthenticated}
                      onDragStart={() => isAuthenticated && setDragId(step.id)}
                      onDragEnd={() => isAuthenticated && setDragId(null)}
                      className={`cursor-grab rounded-xl border-l-4 ${col.accent} bg-surface-raised p-3 shadow-glass-sm active:cursor-grabbing`}
                    >
                      <h3
                        className={`text-sm font-semibold ${
                          step.status === "done"
                            ? "text-slate-soft line-through"
                            : "text-ink"
                        }`}
                      >
                        {step.title}
                      </h3>
                      {step.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate">
                          {step.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-soft">
                        <span>⏱ {step.estimated_time || "1 week"}</span>
                        {step.resource_note && <span>📚 Note</span>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lock overlay when not authenticated */}
      {!isAuthenticated && shareToken && (
        <RoadmapUnlockOverlay
          shareToken={shareToken}
          role={role}
          totalSteps={steps.length}
        />
      )}
    </div>
  );
}
