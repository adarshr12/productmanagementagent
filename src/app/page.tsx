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
import { CinematicHero } from "@/components/ui/cinematic-hero";
import { MessageCircle, ListChecks, Map as MapIcon, Compass } from "lucide-react";

type Phase = "landing" | "intake" | "matching" | "roles" | "generating";

const STATS = [
  { value: "19", label: "product roles scored" },
  { value: "~2 min", label: "average conversation" },
  { value: "Free", label: "no login to start" },
];

// Grouped once at module scope, not on every render — ROLE_CATALOG is a
// static import, so this only needs to run once.
const ROLE_FAMILIES: { family: string; roles: typeof ROLE_CATALOG }[] = [
  "PM ladder",
  "Specialization",
  "Adjacent role",
].map((family) => ({
  family,
  roles: ROLE_CATALOG.filter((r) => r.family === family),
}));

const HOW_IT_WORKS = [
  {
    icon: MessageCircle,
    step: "01",
    title: "Talk it through",
    body: "A real conversation, not a form. Your mentor asks, you answer in your own words, and every past answer stays visible as you go.",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "Get every role scored",
    body: "See your fit for AI PM, Growth PM, BA and more, with the specific reasons why.",
  },
  {
    icon: MapIcon,
    step: "03",
    title: "Follow a trackable roadmap",
    body: "Pick a role and get a guided path from where you are to where you're going.",
  },
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

        <CinematicHero onStart={() => setPhase("intake")} />

        <section className="mx-auto max-w-[1400px] px-6 pt-10 sm:px-10 sm:pt-14">
          {error && <p className="alert-error mb-6 text-center">{error}</p>}

          {/* credibility strip — real numbers, not a decorative icon row */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-5 py-6 text-center sm:px-8 sm:py-8">
                <p className="font-display text-3xl font-bold text-ink sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-slate sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="tag mt-6 text-center">
            for people moving into product manager, business analyst, and
            related roles — not for PMs already 5+ years in
          </p>
        </section>

        {/* how it works — bento sizing, icon per step, a bleed graphic
            behind the section instead of flat white space */}
        <section className="relative mx-auto max-w-[1400px] overflow-hidden px-6 py-24 sm:px-10">
          <PathGraphic className="pointer-events-none absolute -right-24 top-1/2 hidden h-[560px] w-auto -translate-y-1/2 opacity-[0.06] lg:block" />
          <p className="tag mb-8">how it works</p>
          <div className="relative grid gap-6 lg:grid-cols-12 lg:gap-4">
            {HOW_IT_WORKS.slice(0, 2).map((step, i) => {
              const Icon = step.icon;
              const primary = i === 0;
              return (
                <Reveal
                  key={step.step}
                  delayMs={i * 120}
                  className={primary ? "lg:col-span-7" : "lg:col-span-5"}
                >
                  <div
                    className={`card flex h-full flex-col ${
                      primary ? "justify-center border-accent-500/20 sm:p-9" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-teal text-white ${
                          primary ? "h-12 w-12" : "h-10 w-10"
                        }`}
                      >
                        <Icon className={primary ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.25} />
                      </span>
                      <p className="tag">{step.step}</p>
                    </div>
                    <h3
                      className={`font-display mt-4 font-semibold text-ink ${
                        primary ? "text-2xl" : "text-lg"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className={`mt-2 text-sm text-slate ${primary ? "max-w-md" : ""}`}>
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}

            {/* Third step as a full-width horizontal strip rather than
                wrapping to a new row at the same width as card 2 — that
                left an empty gap beside it instead of using the row. */}
            {HOW_IT_WORKS.slice(2).map((step) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.step} delayMs={240} className="lg:col-span-12">
                  <div className="card flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-teal text-white">
                      <Icon className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="tag">{step.step}</p>
                        <h3 className="font-display text-lg font-semibold text-ink">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-slate">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* role coverage — makes "19 roles scored" concrete instead of just
            a number in the stats strip above */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-20 sm:px-10">
            <p className="tag mb-2">every role, actually explained</p>
            <h2 className="font-display max-w-2xl text-2xl font-semibold text-ink sm:text-3xl">
              Not just a score — the full map of where you could go.
            </h2>
            <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-6">
              {ROLE_FAMILIES.map((group, gi) => (
                <Reveal key={group.family} delayMs={gi * 100}>
                  <p className="tag mb-3 text-accent-500">{group.family}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.roles.map((r) => (
                      <span key={r.id} className="chip cursor-default hover:border-line hover:bg-white">
                        <span aria-hidden>{r.emoji}</span>
                        {r.label}
                      </span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* repeated CTA — the hero's button is the only other one on the
            page, and it can be several screens of scroll away by here */}
        <section className="mx-auto max-w-[1400px] px-6 py-20 text-center sm:px-10">
          <Compass className="mx-auto h-8 w-8 text-accent-500" strokeWidth={2.25} />
          <h2 className="font-display mt-4 text-2xl font-semibold text-ink sm:text-3xl">
            Ready to see where you fit?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate">
            Two minutes, no login, no résumé — just a conversation with your
            mentor.
          </p>
          <button
            onClick={() => setPhase("intake")}
            className="btn-gold btn-bounce mt-6 px-7 py-3.5 text-base"
          >
            Talk to my mentor →
          </button>
        </section>

        <footer className="mx-auto max-w-[1400px] px-6 pb-10 text-center sm:px-10">
          <p className="tag">no résumé required to start — just a conversation</p>
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
