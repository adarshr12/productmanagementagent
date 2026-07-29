"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTAKE_QUESTIONS } from "@/lib/questions";

export default function IntakePage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // client-side required check
    const missing = INTAKE_QUESTIONS.find(
      (q) => q.required && !String(answers[q.id] ?? "").trim()
    );
    if (missing) {
      setError(`Please answer: ${missing.label}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      router.push(`/r/${data.shareToken}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-sm font-semibold text-brand-600">
          Career Transition · India
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Get your personalized roadmap
        </h1>
        <p className="mt-3 text-slate-600">
          Answer a few quick questions and we&apos;ll build a step-by-step plan to
          move into a Product Manager, Project Manager, Product Analyst, or
          Business Analyst role. It takes about two minutes.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card space-y-6">
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

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Building your roadmap…" : "Generate my roadmap"}
        </button>
        {submitting && (
          <p className="text-center text-xs text-slate-500">
            This takes a few seconds — please don&apos;t close the page.
          </p>
        )}
      </form>
    </main>
  );
}
