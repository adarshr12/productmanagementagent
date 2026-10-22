"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { RoadmapStep, StepStatus } from "@/lib/getRoadmap";
import { RoadmapUnlockOverlay } from "@/components/roadmap/RoadmapUnlockOverlay";

const FOCUS_SIZE = 2;

export default function MentorFocus({
  steps,
  move,
  onViewBoard,
  isAuthenticated = false,
  shareToken,
  role,
}: {
  steps: RoadmapStep[];
  move: (step: RoadmapStep, status: StepStatus) => void;
  onViewBoard: () => void;
  isAuthenticated?: boolean;
  shareToken: string;
  role?: string;
}) {
  const router = useRouter();

  const ordered = useMemo(
    () => [...steps].sort((a, b) => a.step_order - b.step_order),
    [steps]
  );
  const completed = ordered.filter((s) => s.status === "done");
  const remaining = ordered.filter((s) => s.status !== "done");
  const focus = remaining.slice(0, FOCUS_SIZE);
  const upcoming = remaining.slice(FOCUS_SIZE);

  function handleStepAction(step: RoadmapStep, status: StepStatus) {
    if (!isAuthenticated) {
      router.push(`/signup?next=/r/${shareToken}`);
      return;
    }
    move(step, status);
  }

  // --- UNMEMBER / PREVIEW TEASER MODE ---
  if (!isAuthenticated) {
    const previewStep = ordered[0] || steps[0];
    const peekStep = ordered[1];
    const remainingCount = Math.max(1, steps.length - 1);

    return (
      <div className="space-y-6">
        {/* Milestone 1: Double-bezel Active Milestone Card */}
        {previewStep && (
          <div className="rounded-2xl border border-line/80 bg-surface-raised/60 p-1.5 shadow-sm">
            <article className="rounded-[calc(1rem-2px)] border border-line/60 bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white font-mono text-[11px] font-bold">
                    01
                  </span>
                  <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-slate">
                    Initial Sprint
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-soft">
                  Step 1 of {steps.length}
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink">
                {previewStep.title}
              </h3>

              {previewStep.description && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate">
                  {previewStep.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
                {previewStep.estimated_time && (
                  <span className="rounded-md border border-line bg-paper px-2.5 py-1 text-slate">
                    ⏱ {previewStep.estimated_time}
                  </span>
                )}
                <span className="rounded-md border border-accent-200/60 bg-accent-50/50 px-2.5 py-1 text-accent-700">
                  Core Foundation
                </span>
              </div>

              {previewStep.resource_note && (
                <div className="mt-4 rounded-xl border border-line/70 bg-paper/50 p-4 text-xs sm:text-sm text-slate">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-soft mb-1 font-semibold">
                    Key Artifacts & Exercises
                  </p>
                  <p className="whitespace-pre-line leading-relaxed">{previewStep.resource_note}</p>
                </div>
              )}

              <div className="mt-5 flex items-center gap-3 border-t border-line/60 pt-4">
                <button
                  onClick={() => handleStepAction(previewStep, "in_progress")}
                  className="rounded-xl border border-line bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 hover:bg-paper"
                >
                  Start milestone
                </button>
                <button
                  onClick={() => handleStepAction(previewStep, "done")}
                  className="rounded-xl bg-ink px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90"
                >
                  Mark complete →
                </button>
              </div>
            </article>
          </div>
        )}

        {/* Milestone 2 Peek + Elegant Workspace Gate Overlay */}
        <div className="relative min-h-[460px] rounded-3xl overflow-hidden border border-line/70 bg-paper/40">
          
          {/* Partially visible Milestone 2 dissolving into the background */}
          <div className="opacity-40 select-none pointer-events-none p-5 sm:p-7 space-y-4 filter blur-[2px]">
            {peekStep && (
              <div className="rounded-2xl border border-line bg-white p-6">
                <div className="flex items-center gap-2 mb-2 font-mono text-[11px] text-slate-soft">
                  <span className="font-bold text-slate">02</span>
                  <span>Next Sprint</span>
                </div>
                <h4 className="font-display text-lg font-bold text-ink">
                  {peekStep.title}
                </h4>
                <p className="mt-2 text-xs text-slate line-clamp-2">
                  {peekStep.description}
                </p>
              </div>
            )}
            
            <div className="rounded-2xl border border-line/60 bg-white/70 p-5">
              <div className="h-4 w-1/3 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Genuine Architectural Workspace Gate */}
          <RoadmapUnlockOverlay
            shareToken={shareToken}
            role={role}
            totalSteps={steps.length}
          />
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED FULL ACCESS MODE ---
  return (
    <div>
      {completed.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {completed.map((s) => (
            <span
              key={s.id}
              className="pill border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700"
              title={s.title}
            >
              ✓ {s.title}
            </span>
          ))}
        </div>
      )}

      {focus.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-4xl">🎉</div>
          <h2 className="font-display mt-3 text-2xl font-bold text-ink">
            You&apos;ve cleared the whole roadmap!
          </h2>
          <p className="mt-1 text-sm text-slate max-w-md mx-auto">
            Every step is done. Revisit the Kanban board anytime to review your artifacts and interview readiness.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm font-medium text-slate">
            {completed.length === 0
              ? `I can see ${remaining.length} things standing between you and this role. Let's not look at all of them at once, start with these ${focus.length}:`
              : `Nice progress, ${completed.length} down. Here's what to focus on next:`}
          </p>

          <div className="space-y-4">
            {focus.map((step) => (
              <article key={step.id} className="card border-l-4 border-l-accent-500">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                    {step.step_order || ordered.findIndex((s) => s.id === step.id) + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-ink">
                      {step.title}
                    </h3>
                    {step.description && (
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate">
                        {step.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {step.estimated_time && (
                        <span className="tag">⏱ {step.estimated_time}</span>
                      )}
                      {step.status === "in_progress" && (
                        <span className="pill border border-amber-500/20 bg-amber-500/[0.08] text-amber-700">
                          In progress
                        </span>
                      )}
                    </div>

                    {step.resource_note && (
                      <p className="mt-3 whitespace-pre-line rounded-xl border border-accent-500/15 bg-accent-500/[0.06] px-3 py-2.5 text-sm leading-relaxed text-slate">
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
                    className="flex items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-slate-soft"
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
        className="mt-8 text-sm font-semibold text-accent-500 hover:text-accent-600"
      >
        See the full roadmap board →
      </button>
    </div>
  );
}
