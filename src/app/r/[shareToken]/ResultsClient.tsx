"use client";

import { useEffect, useMemo, useState } from "react";
import type { RoadmapStep, StepStatus } from "@/lib/getRoadmap";
import MentorFocus from "./MentorFocus";
import KanbanBoard from "./KanbanBoard";
import { JourneyMap } from "@/components/JourneyMap";
import { createBrowserClient } from "@/lib/supabaseClient";

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const done = useMemo(
    () => steps.filter((s) => s.status === "done").length,
    [steps]
  );
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const previewPct = steps.length ? Math.round((1 / steps.length) * 100) : 12;

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
    <main className="py-6 sm:py-10">
      <header className="mb-8">
        {role && (
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent-600 mb-1.5">
            Roadmap · {role}
          </p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {overview && (
          <p className="mt-3 max-w-3xl whitespace-pre-line text-sm sm:text-base leading-relaxed text-slate">
            {overview}
          </p>
        )}
      </header>

      {/* Progress & Quick Share */}
      <div className="card mb-8 p-5">
        <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
          <span className="text-slate">
            {isAuthenticated
              ? `${done} of ${steps.length} milestones complete`
              : `Milestone 01 active · ${steps.length - 1} queued`}
          </span>
          <span className="font-semibold text-ink">
            {isAuthenticated ? `${pct}%` : `${previewPct}% preview`}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-ink transition-all duration-300"
            style={{ width: `${isAuthenticated ? pct : previewPct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            onClick={copyLink}
            className="font-medium text-slate hover:text-ink transition underline underline-offset-4"
          >
            {copied ? "✓ Link copied to clipboard" : "Share roadmap link"}
          </button>
          {view === "board" && (
            <button
              onClick={() => setView("mentor")}
              className="font-medium text-slate-soft hover:text-ink transition"
            >
              ← Back to guidance
            </button>
          )}
        </div>
      </div>

      {view === "mentor" ? (
        <>
          <div className="mb-8">
            <JourneyMap
              steps={steps.map((s, idx) => ({
                id: s.id,
                title: s.title,
                status: !isAuthenticated && idx > 0 ? "todo" : s.status,
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
            isAuthenticated={isAuthenticated}
            shareToken={shareToken}
            role={role}
          />
        </>
      ) : (
        <KanbanBoard
          steps={steps}
          move={move}
          isAuthenticated={isAuthenticated}
          shareToken={shareToken}
          role={role}
        />
      )}
    </main>
  );
}
