"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import { ROLE_CATALOG } from "@/lib/roles";
import type { RoleMatch } from "@/lib/roleMatch";
import { RoleScoreGauge } from "@/components/RoleScoreGauge";
import { ChatIntake } from "@/components/ChatIntake";
import { MentorAvatar } from "@/components/MentorAvatar";

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
    <nav className="border-b border-white/[0.08] bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <span className="font-display text-lg font-semibold tracking-tight text-cream">
          <span className="text-accent-500">◆</span> ProductPath
        </span>
        <Link
          href="/login?next=/me"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-cream/80 transition hover:bg-white/5 hover:text-cream"
        >
          Log in
        </Link>
      </div>
    </nav>
  );

  // ================= LIVE CHAT INTAKE (full screen, mentor-led) =================
  if (phase === "intake") {
    return (
      <div className="flex h-screen flex-col">
        {nav}
        <div className="min-h-0 flex-1">
          <ChatIntake questions={INTAKE_QUESTIONS} onComplete={submit} />
        </div>
        {error && (
          <p className="mx-6 mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>
    );
  }

  // ================= LANDING =================
  if (phase === "landing") {
    return (
      <main className="min-h-screen">
        {nav}

        <section>
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            {/* left: editorial copy, left-aligned, not centered */}
            <div className="flex flex-col justify-center">
              <span className="animate-fade-up pill w-fit bg-white/10 text-accent-200">
                Free · No login needed
              </span>
              <h1 className="animate-fade-up delay-1 font-display mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-[3.4rem]">
                Which product role
                <br className="hidden sm:block" /> actually fits{" "}
                <span className="text-accent-500">you</span>?
              </h1>
              <p className="animate-fade-up delay-2 mt-6 max-w-lg text-lg text-cream/60">
                Talk to your mentor for two minutes. We&apos;ll score{" "}
                <strong className="text-cream">all 19 product roles</strong>{" "}
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
                <p className="tag mt-3">takes about 2 minutes</p>
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
                <span className="tag ml-1">+9 more</span>
              </div>
            </div>

            {/* right: mentor preview — no card, the figure sits directly on
                the page's ambient gradient */}
            <div className="flex flex-col items-center gap-5 pt-4 text-center lg:pt-0">
              <MentorAvatar size={320} />
              <p className="font-display -mt-6 max-w-xs text-xl text-cream/90">
                &ldquo;Hey — let&apos;s find out which product role
                actually fits you.&rdquo;
              </p>
              <button
                onClick={() => setPhase("intake")}
                className="btn-ghost w-fit"
              >
                Start the conversation →
              </button>
              {error && (
                <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* how it works — asymmetric, not three equal cards */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="tag mb-8">how it works</p>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-4">
            <div className="lg:col-span-7">
              <div className="card h-full border-accent-500/25">
                <p className="tag mb-3">01</p>
                <h3 className="font-display text-2xl font-semibold text-cream">
                  Talk it through
                </h3>
                <p className="mt-2 max-w-md text-sm text-cream/60">
                  A real conversation, not a form — your mentor asks, you
                  answer in your own words, and every past answer stays
                  visible as you go.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="card">
                <p className="tag mb-3">02</p>
                <h3 className="font-display text-lg font-semibold text-cream">
                  Get every role scored
                </h3>
                <p className="mt-1 text-sm text-cream/60">
                  See your fit for AI PM, Growth PM, BA and more, with the
                  specific reasons why.
                </p>
              </div>
              <div className="card">
                <p className="tag mb-3">03</p>
                <h3 className="font-display text-lg font-semibold text-cream">
                  Follow a trackable roadmap
                </h3>
                <p className="mt-1 text-sm text-cream/60">
                  Pick a role and get a guided path from where you are to
                  where you&apos;re going.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl px-5 pb-10 text-center sm:px-8">
          <p className="tag">
            built for people moving into product manager, analyst, and
            related roles
          </p>
        </footer>
      </main>
    );
  }

  // ================= ROLE RESULTS =================
  if (phase === "roles" || phase === "generating") {
    return (
      <main className="min-h-screen">
        {nav}
        <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
          <header className="mb-7">
            <p className="tag text-accent-500">your matches</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-cream">
              Roles ranked by how well they fit you
            </h1>
            <p className="mt-2 text-cream/60">
              Higher score = easier transition from your background. Pick one
              to get your roadmap.
            </p>
          </header>

          {error && (
            <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
                    i === 0 ? "border-accent-500/60" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-2xl">
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold leading-snug text-cream">
                        {m.label}
                      </h3>
                      {i === 0 && (
                        <span className="pill mt-1 inline-flex bg-accent-500 text-ink">
                          Best match
                        </span>
                      )}
                      <p className="tag mt-1">{m.family}</p>
                    </div>
                    <RoleScoreGauge score={m.score} delayMs={i * 120} />
                  </div>

                  <p className="mt-3 text-sm text-cream/60">
                    {m.description}
                  </p>
                  {m.reason && (
                    <p className="mt-2 text-sm font-medium text-cream">
                      {m.reason}
                    </p>
                  )}

                  {(m.matchedStrengths.length > 0 ||
                    m.growthAreas.length > 0) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {m.matchedStrengths.length > 0 && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
                          <p className="tag text-emerald-400">why you fit</p>
                          <ul className="mt-1 space-y-0.5 text-xs text-emerald-100/80">
                            {m.matchedStrengths.map((s, idx) => (
                              <li key={idx}>✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.growthAreas.length > 0 && (
                        <div className="rounded-lg border border-accent-500/20 bg-accent-500/[0.06] px-3 py-2.5">
                          <p className="tag text-accent-500">
                            what&apos;s needed
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-cream/70">
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
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <MentorAvatar size={96} speaking />
      <h2 className="font-display mt-6 text-2xl font-semibold text-cream">
        Scoring all 19 roles for you…
      </h2>
      <p className="mt-1 text-sm text-cream/50">
        This takes a few seconds — please don&apos;t close the page.
      </p>
    </main>
  );
}
