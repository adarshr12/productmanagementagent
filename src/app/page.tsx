"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import { ROLE_CATALOG } from "@/lib/roles";
import type { RoleMatch } from "@/lib/roleMatch";
import { RoleScoreGauge } from "@/components/RoleScoreGauge";
import { ChatIntake } from "@/components/ChatIntake";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { PathGraphic } from "@/components/PathGraphic";

type Phase = "landing" | "intake" | "matching" | "roles" | "generating";

const STATS = [
  { value: "19", label: "product roles scored" },
  { value: "~2 min", label: "average conversation" },
  { value: "Free", label: "no login to start" },
];

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

  const nav = <SiteNav />;

  // ================= LIVE CHAT INTAKE (full screen, mentor-led) =================
  if (phase === "intake") {
    return (
      <div className="flex h-screen flex-col">
        {nav}
        <div className="min-h-0 flex-1">
          <ChatIntake questions={INTAKE_QUESTIONS} onComplete={submit} />
        </div>
        {error && <p className="alert-error mx-6 mb-4">{error}</p>}
      </div>
    );
  }

  // ================= LANDING =================
  if (phase === "landing") {
    return (
      <main className="min-h-screen overflow-hidden">
        {nav}

        <section className="mx-auto max-w-[1400px] px-6 pt-14 sm:px-10 sm:pt-20">
          <h1 className="animate-fade-up font-display max-w-[15ch] text-[13vw] font-extrabold leading-[0.94] tracking-[-0.03em] text-ink sm:text-[8vw] lg:text-[5.6vw]">
            Which product role actually fits{" "}
            <span className="bg-gradient-to-r from-accent-500 to-accent-teal bg-clip-text text-transparent">
              you?
            </span>
          </h1>

          <div className="relative mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="animate-fade-up delay-1 max-w-lg">
              <p className="text-lg text-slate">
                Talk to your mentor for two minutes. We&apos;ll score{" "}
                <strong className="text-ink">all 19 product roles</strong> for
                how easily you can transition into each, explain exactly why,
                and hand you a personalized, trackable roadmap.
              </p>
              <div className="mt-8 flex items-center gap-5">
                <button
                  onClick={() => setPhase("intake")}
                  className="btn-gold btn-bounce px-7 py-3.5 text-base"
                >
                  Talk to my mentor →
                </button>
                {error && <p className="alert-error">{error}</p>}
              </div>
            </div>

            <div className="animate-fade-up delay-2 -mb-10 flex justify-center lg:-mr-10 lg:mb-0 lg:justify-end">
              <PathGraphic className="h-[280px] w-auto sm:h-[340px]" />
            </div>
          </div>

          {/* credibility strip — real numbers, not a decorative icon row */}
          <div className="animate-fade-up delay-3 mt-14 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:mt-16">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-5 py-6 text-center sm:px-8 sm:py-8">
                <p className="font-display text-3xl font-bold text-ink sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-slate sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how it works — asymmetric, not three equal cards */}
        <section className="mx-auto max-w-[1400px] px-6 py-20 sm:px-10">
          <p className="tag mb-8">how it works</p>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-4">
            <Reveal className="lg:col-span-7">
              <div className="card flex h-full flex-col justify-center border-accent-500/20">
                <p className="tag mb-3">01</p>
                <h3 className="font-display text-2xl font-semibold text-ink">
                  Talk it through
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate">
                  A real conversation, not a form. Your mentor asks, you
                  answer in your own words, and every past answer stays
                  visible as you go.
                </p>
              </div>
            </Reveal>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Reveal delayMs={120}>
                <div className="card">
                  <p className="tag mb-3">02</p>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    Get every role scored
                  </h3>
                  <p className="mt-1 text-sm text-slate">
                    See your fit for AI PM, Growth PM, BA and more, with the
                    specific reasons why.
                  </p>
                </div>
              </Reveal>
              <Reveal delayMs={240}>
                <div className="card">
                  <p className="tag mb-3">03</p>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    Follow a trackable roadmap
                  </h3>
                  <p className="mt-1 text-sm text-slate">
                    Pick a role and get a guided path from where you are to
                    where you&apos;re going.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-[1400px] px-6 pb-10 text-center sm:px-10">
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
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <header className="mb-7 max-w-2xl">
            <p className="tag text-accent-500">your matches</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-ink">
              Roles ranked by how well they fit you
            </h1>
            <p className="mt-2 text-slate">
              Higher score = easier transition from your background. Pick one
              to get your roadmap.
            </p>
          </header>

          {error && <p className="alert-error mb-4">{error}</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            {matches.map((m, i) => {
              const emoji =
                ROLE_CATALOG.find((r) => r.id === m.id)?.emoji ?? "•";
              return (
                <div
                  key={m.id}
                  className={`card flex flex-col transition duration-200 hover:-translate-y-1 hover:border-accent-500/40 hover:shadow-[0_20px_44px_-24px_rgba(21,94,239,0.35)] ${
                    i === 0 ? "border-accent-500/50 lg:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-50 text-2xl">
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold leading-snug text-ink">
                        {m.label}
                      </h3>
                      {i === 0 && (
                        <span className="pill mt-1 inline-flex bg-accent-500 text-white">
                          Best match
                        </span>
                      )}
                      <p className="tag mt-1">{m.family}</p>
                    </div>
                    <RoleScoreGauge score={m.score} delayMs={i * 120} />
                  </div>

                  <p className="mt-3 text-sm text-slate">{m.description}</p>
                  {m.reason && (
                    <p className="mt-2 text-sm font-medium text-ink">
                      {m.reason}
                    </p>
                  )}

                  {(m.matchedStrengths.length > 0 ||
                    m.growthAreas.length > 0) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {m.matchedStrengths.length > 0 && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                          <p className="tag text-emerald-700">why you fit</p>
                          <ul className="mt-1 space-y-0.5 text-xs text-emerald-800">
                            {m.matchedStrengths.map((s, idx) => (
                              <li key={idx}>✓ {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.growthAreas.length > 0 && (
                        <div className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2.5">
                          <p className="tag text-accent-600">
                            what&apos;s needed
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-slate">
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
      <PathGraphic className="h-32 w-auto" />
      <h2 className="font-display mt-6 text-2xl font-semibold text-ink">
        Scoring all 19 roles for you…
      </h2>
      <p className="mt-1 text-sm text-slate">
        This takes a few seconds. Please don&apos;t close the page.
      </p>
    </main>
  );
}
