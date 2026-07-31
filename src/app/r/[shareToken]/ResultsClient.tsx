"use client";

import { useMemo, useState } from "react";
import type { RoadmapStep, StepStatus } from "@/lib/getRoadmap";

const COLUMNS: { key: StepStatus; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "border-slate-300" },
  { key: "in_progress", label: "In Progress", accent: "border-amber-400" },
  { key: "done", label: "Done", accent: "border-green-500" },
];

export default function ResultsClient({
  shareToken,
  title,
  role,
  overview,
  initialSteps,
}: {
  shareToken: string;
  title: string;
  role: string;
  overview: string;
  initialSteps: RoadmapStep[];
}) {
  const [steps, setSteps] = useState<RoadmapStep[]>(initialSteps);
  const [copied, setCopied] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

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
        <button
          onClick={copyLink}
          className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {copied ? "✓ Link copied" : "🔗 Copy shareable link"}
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colSteps = steps.filter((s) => s.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const s = steps.find((x) => x.id === dragId);
                if (s) move(s, col.key);
                setDragId(null);
              }}
              className="rounded-2xl bg-slate-100/70 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-slate-700">
                  {col.label}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {colSteps.length}
                </span>
              </div>

              <div className="space-y-3">
                {colSteps.map((step) => {
                  const idx = COLUMNS.findIndex((c) => c.key === step.status);
                  return (
                    <article
                      key={step.id}
                      draggable
                      onDragStart={() => setDragId(step.id)}
                      onDragEnd={() => setDragId(null)}
                      className={`cursor-grab rounded-xl border-l-4 ${col.accent} bg-white p-3 shadow-sm active:cursor-grabbing`}
                    >
                      <h3
                        className={`text-sm font-semibold ${
                          step.status === "done"
                            ? "text-slate-500 line-through"
                            : "text-slate-900"
                        }`}
                      >
                        {step.title}
                      </h3>
                      {step.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {step.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          onClick={() =>
                            move(step, COLUMNS[Math.max(0, idx - 1)].key)
                          }
                          disabled={idx === 0}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          ◀ Back
                        </button>
                        <button
                          onClick={() =>
                            move(
                              step,
                              COLUMNS[Math.min(COLUMNS.length - 1, idx + 1)].key
                            )
                          }
                          disabled={idx === COLUMNS.length - 1}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-30"
                        >
                          Next ▶
                        </button>
                      </div>
                    </article>
                  );
                })}
                {colSteps.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-slate-400">
                    Drag steps here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Drag cards between columns, or use ◀ / ▶. Bookmark this page to track your
        progress — anyone with the link can view it.
      </p>
    </main>
  );
}
