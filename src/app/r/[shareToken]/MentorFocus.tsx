"use client";

import { useMemo } from "react";
import type { RoadmapStep, StepStatus } from "@/lib/getRoadmap";

const FOCUS_SIZE = 2;

export default function MentorFocus({
  steps,
  move,
  onViewBoard,
}: {
  steps: RoadmapStep[];
  move: (step: RoadmapStep, status: StepStatus) => void;
  onViewBoard: () => void;
}) {
  const ordered = useMemo(
    () => [...steps].sort((a, b) => a.step_order - b.step_order),
    [steps]
  );
  const completed = ordered.filter((s) => s.status === "done");
  const remaining = ordered.filter((s) => s.status !== "done");
  const focus = remaining.slice(0, FOCUS_SIZE);
  const upcoming = remaining.slice(FOCUS_SIZE);

  return (
    <div>
      {completed.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {completed.map((s) => (
            <span
              key={s.id}
              className="pill border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300"
              title={s.title}
            >
              ✓ {s.title}
            </span>
          ))}
        </div>
      )}

      {focus.length === 0 ? (
        <div className="card text-center">
          <div className="text-3xl">🎉</div>
          <h2 className="font-display mt-3 text-xl font-semibold text-cream">
            You've cleared the whole roadmap.
          </h2>
          <p className="mt-1 text-sm text-cream/60">
            Every step is done. Take a look at the full board any time to
            revisit what you covered.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm font-medium text-cream/70">
            {completed.length === 0
              ? `I can see ${remaining.length} things standing between you and this role. Let's not look at all of them at once, start with these ${focus.length}:`
              : `Nice progress, ${completed.length} down. Here's what to focus on next:`}
          </p>

          <div className="space-y-4">
            {focus.map((step, i) => (
              <article key={step.id} className="card border-l-4 border-l-accent-500">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-ink">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-cream">
                      {step.title}
                    </h3>
                    {step.description && (
                      <p className="mt-1.5 text-sm text-cream/60">
                        {step.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {step.estimated_time && (
                        <span className="tag">⏱ {step.estimated_time}</span>
                      )}
                      {step.status === "in_progress" && (
                        <span className="pill border border-amber-500/20 bg-amber-500/[0.08] text-amber-300">
                          In progress
                        </span>
                      )}
                    </div>

                    {step.resource_note && (
                      <p className="mt-3 rounded-xl border border-accent-500/15 bg-accent-500/[0.06] px-3 py-2.5 text-sm text-cream/80">
                        📚 {step.resource_note}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      {step.status === "todo" && (
                        <button
                          onClick={() => move(step, "in_progress")}
                          className="btn-ghost text-sm"
                        >
                          Start this
                        </button>
                      )}
                      <button
                        onClick={() => move(step, "done")}
                        className="btn-primary text-sm"
                      >
                        Mark done →
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {upcoming.length > 0 && (
            <div className="mt-6">
              <p className="tag mb-2">up next, once you clear the above</p>
              <div className="space-y-1.5">
                {upcoming.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-2 text-sm text-cream/35"
                  >
                    <span aria-hidden>🔒</span>
                    {s.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={onViewBoard}
        className="mt-8 text-sm font-medium text-accent-500 hover:text-accent-600"
      >
        See the full roadmap board →
      </button>
    </div>
  );
}
