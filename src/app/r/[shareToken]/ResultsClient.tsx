"use client";

import { useMemo, useState } from "react";
import type { RoadmapStep } from "@/lib/getRoadmap";

export default function ResultsClient({
  shareToken,
  title,
  overview,
  initialSteps,
}: {
  shareToken: string;
  title: string;
  overview: string;
  initialSteps: RoadmapStep[];
}) {
  const [steps, setSteps] = useState<RoadmapStep[]>(initialSteps);
  const [copied, setCopied] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const completed = useMemo(
    () => steps.filter((s) => s.is_completed).length,
    [steps]
  );
  const pct = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  async function toggle(step: RoadmapStep) {
    const next = !step.is_completed;
    setSavingId(step.id);
    // optimistic update
    setSteps((prev) =>
      prev.map((s) => (s.id === step.id ? { ...s, is_completed: next } : s))
    );
    try {
      const res = await fetch("/api/step/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken, stepId: step.id, isCompleted: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // revert on failure
      setSteps((prev) =>
        prev.map((s) =>
          s.id === step.id ? { ...s, is_completed: !next } : s
        )
      );
    } finally {
      setSavingId(null);
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
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-6">
        <p className="text-sm font-semibold text-brand-600">Your roadmap</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {overview && <p className="mt-3 text-slate-600">{overview}</p>}
      </header>

      {/* progress + share */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            {completed} of {steps.length} steps done
          </span>
          <span className="text-sm font-semibold text-brand-600">{pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          onClick={copyLink}
          className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {copied ? "✓ Link copied" : "🔗 Copy shareable link"}
        </button>
      </div>

      {/* steps */}
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={`card flex gap-4 transition ${
              step.is_completed ? "opacity-70" : ""
            }`}
          >
            <button
              onClick={() => toggle(step)}
              disabled={savingId === step.id}
              aria-label={
                step.is_completed ? "Mark incomplete" : "Mark complete"
              }
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                step.is_completed
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white hover:border-brand-500"
              }`}
            >
              {step.is_completed ? "✓" : i + 1}
            </button>
            <div>
              <h3
                className={`font-semibold ${
                  step.is_completed ? "text-slate-500 line-through" : ""
                }`}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-slate-400">
        Bookmark this page to track your progress. Anyone with the link can view
        it.
      </p>
    </main>
  );
}
