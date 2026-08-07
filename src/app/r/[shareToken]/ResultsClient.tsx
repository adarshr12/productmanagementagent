"use client";

import { useMemo, useState } from "react";
import type { RoadmapStep, StepStatus } from "@/lib/getRoadmap";
import MentorFocus from "./MentorFocus";
import KanbanBoard from "./KanbanBoard";
import { JourneyMap } from "@/components/JourneyMap";

type View = "mentor" | "board";

export default function ResultsClient({
  shareToken,
  title,
  role,
  overview,
  initialSteps,
  startContext,
}: {
  shareToken: string;
  title: string;
  role: string;
  overview: string;
  initialSteps: RoadmapStep[];
  startContext: { currentRole: string | null; currentDomain: string | null };
}) {
  const [steps, setSteps] = useState<RoadmapStep[]>(initialSteps);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<View>("mentor");

  const done = useMemo(
    () => steps.filter((s) => s.status === "done").length,
    [steps]
  );
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

  async function move(step: RoadmapStep, status: StepStatus) {
    if (step.status === status) return;
    const prev = step.status;
    setSteps((list) =>
      list.map((s) => (s.id === step.id ? { ...s, status } : s))
    );
    try {
      const res = await fetch("/api/step/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken, stepId: step.id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSteps((list) =>
        list.map((s) => (s.id === step.id ? { ...s, status: prev } : s))
      );
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-6">
        {role && (
          <p className="text-sm font-semibold text-brand-600">
            Roadmap · {role}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {overview && <p className="mt-3 max-w-2xl text-slate-600">{overview}</p>}
      </header>

      {/* progress + share */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            {done} of {steps.length} steps done
          </span>
          <span className="text-sm font-semibold text-brand-600">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={copyLink}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {copied ? "✓ Link copied" : "🔗 Copy shareable link"}
          </button>
          {view === "board" && (
            <button
              onClick={() => setView("mentor")}
              className="text-sm font-medium text-slate-500 hover:text-ink"
            >
              ← Back to guidance
            </button>
          )}
        </div>
      </div>

      {view === "mentor" ? (
        <>
          <div className="mb-6">
            <JourneyMap
              steps={steps.map((s) => ({
                id: s.id,
                title: s.title,
                status: s.status,
              }))}
              startLabel={
                startContext.currentRole ||
                startContext.currentDomain ||
                "Where you start"
              }
              finishLabel={role || "Your target role"}
            />
          </div>
          <MentorFocus
            steps={steps}
            move={move}
            onViewBoard={() => setView("board")}
          />
        </>
      ) : (
        <KanbanBoard steps={steps} move={move} />
      )}
    </main>
  );
}
