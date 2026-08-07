"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import { ROLE_CATALOG } from "@/lib/roles";
import type { RoleMatch } from "@/lib/roleMatch";
import { RoleScoreGauge } from "@/components/RoleScoreGauge";
import { ChatIntake } from "@/components/ChatIntake";

type Phase = "landing" | "intake" | "matching" | "roles" | "generating";

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("landing");
  const [matches, setMatches] = useState<RoleMatch[]>([]);
  const [intakeId, setIntakeId] = useState("");
  const [pickingRole, setPickingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(answers: Record<string, string>) {
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
      setPhase("landing");
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

  const nav = (
    <nav className="border-b border-brand-100/60 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <span className="font-display text-lg font-semibold tracking-tight">
          <span className="text-accent-600">◆</span> ProductPath
        </span>
        <Link
          href="/login?next=/me"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink transition hover:bg-brand-50"
        >
          <span aria-hidden>👤</span> Log in
        </Link>
      </div>
    </nav>
  );

  // ================= LANDING + CHAT INTAKE =================
  if (phase === "landing" || phase === "intake") {
    return (
      <main>
        {nav}

        <section className="bg-ink text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* left: editorial copy, left-aligned, not centered */}
            <div className="flex flex-col justify-center">
              <span className="animate-fade-up pill w-fit bg-white/10 text-accent-200">
                Free · No login needed
              </span>
              <h1 className="animate-fade-up delay-1 font-display mt-5 text-4xl font-semibold italic leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                Which product role
                <br className="hidden sm:block" /> actually fits{" "}
                <span className="text-accent-500">you</span>?
              </h1>
              <p className="animate-fade-up delay-2 mt-6 max-w-lg text-lg text-white/65">
                Talk to your mentor for two minutes. We&apos;ll score{" "}
                <strong className="text-white">all 19 product roles</strong>{" "}
                for how easily you can transition into each, explain exactly
                why, and hand you a personalized, trackable roadmap.
              </p>
              <div className="animate-fade-up delay-3 mt-8">
                <button
                  onClick={() => setPhase("intake")}
                  className="btn-gold btn-bounce px-8 py-4 text-base"
                >
                  Talk to my mentor →
                </button>
                <p className="mt-3 text-xs text-white/40">Takes about 2 minutes</p>
              </div>

              <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center gap-2">
                {ROLE_CATALOG.slice(0, 10).map((r) => (
                  <span
                    key={r.id}
                    title={r.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base"
                  >
                    {r.emoji}
                  </span>
                ))}
                <span className="ml-1 text-sm font-medium text-white/40">
                  +9 more
                </span>
              </div>
            </div>

            {/* right: the chat itself (landing) or live intake */}
            <div className="lg:mt-2">
              {phase === "intake" ? (
                <ChatIntake questions={INTAKE_QUESTIONS} onComplete={submit} />
              ) : (
                <div className="chat-shell flex h-[420px] flex-col justify-center gap-4 px-6 py-6 sm:h-[480px]">
                  <div className="flex items-start gap-2.5">
                    <div className="chat-avatar h-7 w-7 text-sm">🎯</div>
                    <div className="chat-bubble-mentor">
                      Hey — welcome. What&apos;s your current job title?
                    </div>
                  </div>
                  <div className="flex">
                    <div className="chat-bubble-user">
                      Customer Support Executive
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="chat-avatar h-7 w-7 text-sm">🎯</div>
                    <div className="chat-bubble-mentor">
                      Got it. That's a great base for stakeholder-facing PM
                      roles — let's find your best fit.
                    </div>
                  </div>
                  <button
                    onClick={() => setPhase("intake")}
                    className="btn-ghost-dark mt-2 w-fit"
                  >
                    Start the real conversation →
                  </button>
                </div>
              )}
              {error && (
                <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "💬",
                title: "Talk it through",
                body: "A real conversation, not a form — your mentor asks, you answer in your own words.",
              },
              {
                icon: "🎯",
                title: "Get every role scored",
                body: "See your fit for AI PM, Growth PM, BA and more, with the specific reasons why.",
              },
              {
                icon: "🗺️",
                title: "Follow a trackable roadmap",
                body: "Pick a role and get a guided path from where you are to where you're going.",
              },
            ].map((s, i) => (
              <div key={i} className="card">
                <div className="text-2xl">{s.icon}</div>
                <h3 className="font-display mt-3 text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-5 pb-10 text-center text-xs text-muted sm:px-8">
          Built for people moving into Product Manager, Analyst, and related roles.
        </footer>
      </main>
    );
  }

  // ================= ROLE RESULTS =================
  if (phase === "roles" || phase === "generating") {
    return (
      <main>
        {nav}
        <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
          <header className="mb-7">
            <p className="text-sm font-semibold text-accent-600">
              Your matches
            </p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
              Roles ranked by how well they fit you
            </h1>
            <p className="mt-2 text-muted">
              Higher score = easier transition from your background. Pick one
              to get your roadmap.
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
                  className={`card ${
                    i === 0 ? "border-accent-500 ring-2 ring-accent-100" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-50 text-2xl">
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold leading-snug">
                        {m.label}
                      </h3>
                      {i === 0 && (
                        <span className="pill mt-1 inline-flex bg-brand-600 text-white">
                          Best match
                        </span>
                      )}
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {m.family}
                      </p>
                    </div>
                    <RoleScoreGauge score={m.score} delayMs={i * 120} />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {m.description}
                  </p>
                  {m.reason && (
                    <p className="mt-2 text-sm font-medium text-ink">
                      {m.reason}
                    </p>
                  )}

                  {(m.matchedStrengths.length > 0 ||
                    m.growthAreas.length > 0) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {m.matchedStrengths.length > 0 && (
                        <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            Why you fit
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-emerald-800">
                            {m.matchedStrengths.map((s, idx) => (
                              <li key={idx}>✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.growthAreas.length > 0 && (
                        <div className="rounded-lg bg-accent-50 px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-600">
                            What's needed
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-brand-500">
                            {m.growthAreas.map((s, idx) => (
                              <li key={idx}>→ {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
        </div>
      </main>
    );
  }

  // ================= MATCHING (brief transition) =================
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-5 text-center text-white">
      <div className="text-4xl">🎯</div>
      <h2 className="font-display mt-4 text-2xl font-semibold">
        Scoring all 19 roles for you…
      </h2>
      <p className="mt-1 text-sm text-white/50">
        This takes a few seconds — please don&apos;t close the page.
      </p>
    </main>
  );
}
