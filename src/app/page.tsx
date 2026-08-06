"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import { ROLE_CATALOG } from "@/lib/roles";
import type { RoleMatch } from "@/lib/roleMatch";

type Phase = "landing" | "intake" | "matching" | "roles" | "generating";

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<RoleMatch[]>([]);
  const [intakeId, setIntakeId] = useState("");
  const [pickingRole, setPickingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = INTAKE_QUESTIONS.length;
  const q = INTAKE_QUESTIONS[step];

  function setAnswer(id: string, value: string) {
    setAnswers((p) => ({ ...p, [id]: value }));
  }

  function next() {
    setError(null);
    if (q.required && !String(answers[q.id] ?? "").trim()) {
      setError("Please answer this to continue.");
      return;
    }
    if (step < total - 1) setStep(step + 1);
    else submit();
  }

  function pick(id: string, value: string) {
    setAnswer(id, value);
    setError(null);
    setTimeout(() => {
      if (step < total - 1) setStep(step + 1);
      else submit({ ...answers, [id]: value });
    }, 140);
  }

  async function submit(finalAnswers?: Record<string, string>) {
    const payload = finalAnswers ?? answers;
    setPhase("matching");
    try {
      const res = await fetch("/api/role-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      setMatches(data.matches);
      setIntakeId(data.intakeId);
      setPhase("roles");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setPhase("intake");
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

  // ================= LANDING =================
  if (phase === "landing") {
    return (
      <main>
        {/* nav — adapted from 21st.dev "Underline Hero" (sticky, blurred) */}
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
            <span className="text-lg font-extrabold tracking-tight">
              <span className="text-brand-600">◆</span> ProductPath
            </span>
            <Link
              href="/login?next=/me"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
            >
              <span aria-hidden>👤</span> Log in
            </Link>
          </div>
        </nav>

        {/* hero — 21st.dev underline + fade-up animation, recolored to our theme */}
        <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-6 pt-14 text-center sm:pt-20">
          <span className="pill animate-fade-up bg-brand-50 text-brand-700">
            Free · No login needed
          </span>
          <h1 className="animate-fade-up mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Which product role
            <br className="hidden sm:block" /> truly{" "}
            <span className="relative inline-block">
              <span className="font-lobster font-normal text-brand-600">
                fits
              </span>
              <svg
                className="hero-underline text-accent-500"
                viewBox="0 0 170 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 9C32.8203 5.34032 108.769 -0.881146 166 3.51047"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
              </svg>
            </span>{" "}
            you?
          </h1>
          <p className="animate-fade-up delay-1 mx-auto mt-6 max-w-xl text-lg text-muted">
            Answer a few questions about your background. We&apos;ll score{" "}
            <strong className="text-ink">all 19 product roles</strong> for how
            easily you can transition into each — then build a step-by-step
            roadmap you can track like a to-do board.
          </p>
          <div className="animate-fade-up delay-2">
            <button
              onClick={() => setPhase("intake")}
              className="btn-primary btn-bounce mt-8 px-8 py-4 text-base"
            >
              Find my best-fit role →
            </button>
            <p className="mt-3 text-xs text-muted">Takes about 2 minutes</p>
          </div>

          {/* role avatars strip */}
          <div className="animate-fade-up delay-3 mt-12 flex flex-wrap items-center justify-center gap-2">
            {ROLE_CATALOG.slice(0, 12).map((r) => (
              <span
                key={r.id}
                title={r.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg"
              >
                {r.emoji}
              </span>
            ))}
            <span className="ml-1 text-sm font-medium text-muted">+7 more</span>
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto max-w-4xl px-5 py-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "📝",
                title: "Tell us your background",
                body: "Experience, current role, strengths, and where you want to go.",
              },
              {
                icon: "🎯",
                title: "Get every role scored",
                body: "See your fit for AI PM, Growth PM, BA and more — best match first.",
              },
              {
                icon: "🗺️",
                title: "Follow a trackable roadmap",
                body: "Pick a role and get a Kanban board to move from To Do to Done.",
              },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className="text-2xl">{s.icon}</div>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto max-w-4xl px-5 pb-10 text-center text-xs text-muted">
          Built for people moving into Product Manager, Analyst, and related roles.
        </footer>
      </main>
    );
  }

  // ================= ROLE RESULTS =================
  if (phase === "roles" || phase === "generating") {
    return (
      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <header className="mb-7">
          <p className="text-sm font-semibold text-brand-600">Your matches</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
            Roles ranked by how well they fit you
          </h1>
          <p className="mt-2 text-muted">
            Higher score = easier transition from your background. Pick one to get
            your roadmap.
          </p>
        </header>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {matches.map((m, i) => {
            const emoji =
              ROLE_CATALOG.find((r) => r.id === m.id)?.emoji ?? "•";
            return (
              <div
                key={m.id}
                className={`card ${i === 0 ? "border-brand-500 ring-2 ring-brand-100" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-2xl">
                    {emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold">{m.label}</h3>
                      {i === 0 && (
                        <span className="pill bg-brand-600 text-white">
                          Best match
                        </span>
                      )}
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {m.family}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-extrabold text-brand-600">
                      {m.score}
                    </div>
                    <div className="text-[10px] uppercase text-slate-400">
                      / 100
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${m.score}%` }}
                  />
                </div>

                <p className="mt-3 text-sm text-slate-600">{m.description}</p>
                {m.reason && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
                    {m.reason}
                  </p>
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
            );
          })}
        </div>
      </main>
    );
  }

  // ================= CONVERSATIONAL INTAKE =================
  const pct = Math.round(((step + (phase === "matching" ? 1 : 0)) / total) * 100);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-6">
      {/* progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted">
          <span>
            Question {Math.min(step + 1, total)} of {total}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {phase === "matching" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="text-4xl">🎯</div>
          <h2 className="mt-4 text-xl font-bold">Scoring all 19 roles for you…</h2>
          <p className="mt-1 text-sm text-muted">
            This takes a few seconds — please don&apos;t close the page.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <h2 className="text-2xl font-extrabold tracking-tight">{q.label}</h2>

          <div className="mt-6 space-y-3">
            {q.type === "select" ? (
              q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => pick(q.id, opt)}
                  className={`chip ${answers[q.id] === opt ? "chip-selected" : ""}`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      answers[q.id] === opt
                        ? "border-brand-600 bg-brand-600 text-[10px] text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {answers[q.id] === opt ? "✓" : ""}
                  </span>
                  {opt}
                </button>
              ))
            ) : q.type === "textarea" ? (
              <textarea
                autoFocus
                className="field-input min-h-[120px]"
                placeholder={q.placeholder}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            ) : (
              <input
                autoFocus
                type="text"
                className="field-input"
                placeholder={q.placeholder}
                value={answers[q.id] ?? ""}
                onKeyDown={(e) => e.key === "Enter" && next()}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* nav: Back + (Continue/Skip for non-chip questions) */}
          <div className="mt-auto flex items-center justify-between pt-8">
            <button
              onClick={() => {
                setError(null);
                step === 0 ? setPhase("landing") : setStep(step - 1);
              }}
              className="btn-ghost"
            >
              ← Back
            </button>

            {q.type !== "select" && (
              <div className="flex gap-2">
                {!q.required && (
                  <button
                    onClick={() => (step < total - 1 ? setStep(step + 1) : submit())}
                    className="btn-ghost"
                  >
                    Skip
                  </button>
                )}
                <button onClick={next} className="btn-primary">
                  {step === total - 1 ? "See my matches" : "Continue"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
