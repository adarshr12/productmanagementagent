"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import type { RoleMatch } from "@/lib/roleMatch";

type Phase = "form" | "matching" | "roles" | "generating";

export default function IntakePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<RoleMatch[]>([]);
  const [intakeId, setIntakeId] = useState<string>("");
  const [pickingRole, setPickingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const missing = INTAKE_QUESTIONS.find(
      (q) => q.required && !String(answers[q.id] ?? "").trim()
    );
    if (missing) {
      setError(`Please answer: ${missing.label}`);
      return;
    }
    setPhase("matching");
    try {
      const res = await fetch("/api/role-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      setMatches(data.matches);
      setIntakeId(data.intakeId);
      setPhase("roles");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("form");
    }
  }

  async function chooseRole(roleId: string) {
    setError(null);
    setPickingRole(roleId);
    setPhase("generating");
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeId, roleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      router.push(`/r/${data.shareToken}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("roles");
      setPickingRole(null);
    }
  }

  // ---- role results view ----
  if (phase === "roles" || phase === "generating") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <p className="text-sm font-semibold text-brand-600">Your best-fit roles</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Which role fits you best?
          </h1>
          <p className="mt-3 text-slate-600">
            Based on your background, here&apos;s how well each product role matches —
            higher means an easier transition. Pick one to get your roadmap.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {matches.map((m, i) => (
            <div
              key={m.id}
              className={`card ${i === 0 ? "ring-2 ring-brand-500" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{m.label}</h3>
                    {i === 0 && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        Best match
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
                    {m.family}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xl font-bold text-brand-600">{m.score}</div>
                  <div className="text-[10px] uppercase text-slate-400">match</div>
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${m.score}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-600">{m.description}</p>
              {m.reason && (
                <p className="mt-2 text-sm italic text-slate-500">{m.reason}</p>
              )}

              <button
                onClick={() => chooseRole(m.id)}
                disabled={phase === "generating"}
                className="btn-primary mt-4 w-full"
              >
                {pickingRole === m.id
                  ? "Building your roadmap…"
                  : `Choose ${m.label} →`}
              </button>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ---- intake form view ----
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-sm font-semibold text-brand-600">
          Career Transition · India
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Find your best-fit product role
        </h1>
        <p className="mt-3 text-slate-600">
          Answer a few questions about your background. We&apos;ll score every
          product role for how well it fits you, then build a step-by-step roadmap
          for the one you choose. Takes about two minutes.
        </p>
      </header>

      <form onSubmit={submitForm} className="card space-y-6">
        {INTAKE_QUESTIONS.map((q) => (
          <div key={q.id}>
            <label htmlFor={q.id} className="field-label">
              {q.label}
              {q.required && <span className="text-brand-600"> *</span>}
            </label>

            {q.type === "select" ? (
              <select
                id={q.id}
                className="field-input"
                value={answers[q.id] ?? ""}
                onChange={(e) => update(q.id, e.target.value)}
                required={q.required}
              >
                <option value="" disabled>
                  Select an option…
                </option>
                {q.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : q.type === "textarea" ? (
              <textarea
                id={q.id}
                className="field-input min-h-[90px]"
                placeholder={q.placeholder}
                value={answers[q.id] ?? ""}
                onChange={(e) => update(q.id, e.target.value)}
                required={q.required}
              />
            ) : (
              <input
                id={q.id}
                type="text"
                className="field-input"
                placeholder={q.placeholder}
                value={answers[q.id] ?? ""}
                onChange={(e) => update(q.id, e.target.value)}
                required={q.required}
              />
            )}
          </div>
        ))}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={phase === "matching"}
        >
          {phase === "matching" ? "Scoring roles for you…" : "See my role matches"}
        </button>
        {phase === "matching" && (
          <p className="text-center text-xs text-slate-500">
            This takes a few seconds — please don&apos;t close the page.
          </p>
        )}
      </form>
    </main>
  );
}
