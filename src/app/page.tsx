"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import { ROLE_CATALOG } from "@/lib/roles";
import type { RoleMatch } from "@/lib/roleMatch";
import { RoleScoreGauge } from "@/components/RoleScoreGauge";
import { ChatIntake } from "@/components/ChatIntake";
import { SiteNav } from "@/components/SiteNav";
import { Reveal } from "@/components/Reveal";
import { PathGraphic } from "@/components/PathGraphic";
import { HowItWorksShowcase } from "@/components/ui/how-it-works-showcase";
import { JourneySection } from "@/components/JourneySection";
import { SearchCardsAnimation } from "@/components/SearchCardsAnimation";
import {
  MessageCircle,
  ListChecks,
  Map as MapIcon,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

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
      setPickingRole(null);
    }
  }

  useEffect(() => {
    function handleReset() {
      setPhase("landing");
    }
    window.addEventListener("reset-landing", handleReset);
    return () => window.removeEventListener("reset-landing", handleReset);
  }, []);

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
    // No overflow-x here: per the CSS overflow spec, setting only one axis
    // to a non-"visible" value forces the *other* axis to compute as
    // "auto" too — so even "overflow-x-hidden" still creates a scroll
    // container on the y-axis and breaks position:sticky for anything
    // pinned inside (e.g. the how-it-works panel). Horizontal bleed from
    // decorative elements is instead clipped at the true root (html/body
    // in globals.css), which doesn't have this problem.
    return (
      <main className="min-h-screen">
        {nav}

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-8 pb-8 sm:pt-12 sm:pb-10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
              {/* Left Copy Column */}
              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-accent-500" />
                    <span>Built for career switchers</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-accent-amber/40 bg-accent-amber/10 px-3.5 py-1.5 text-xs font-semibold text-accent-amber shadow-sm">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Coming soon</span>
                  </div>
                </div>

                <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl leading-[1.12]">
                  Stop guessing which product role fits you.{" "}
                  <span className="text-accent-500">
                    Talk to an advisor in 2 minutes.
                  </span>
                </h1>

                <p className="mt-5 text-lg leading-relaxed text-slate max-w-2xl">
                  Get 19 PM, BA, and Product Analyst roles scored against your actual background — plus a step-by-step career transition roadmap.
                </p>

                {/* flex-nowrap + a shorter mobile-only CTA label keep both
                    buttons on one line even at the narrowest width, instead
                    of wrapping the primary button's full text onto a
                    second line. */}
                <div className="mt-8 flex flex-nowrap items-center gap-2 sm:gap-4">
                  {/* The mentor flow isn't live yet — the button stays visible
                      (so the offer is still legible) but is disabled, with a
                      hover tooltip explaining why, instead of starting an
                      intake that doesn't go anywhere. */}
                  <div className="group relative inline-block">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="btn-gold whitespace-nowrap px-4 py-3 text-sm font-semibold opacity-60 shadow-lg shadow-accent-500/25 cursor-not-allowed sm:px-7 sm:py-4 sm:text-base"
                    >
                      <span className="sm:hidden">Start Now</span>
                      <span className="hidden sm:inline">Start 2-Minute Mentorship</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-center text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                      Coming soon — check back shortly
                    </span>
                  </div>

                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-accent-300 hover:bg-accent-50/50 sm:px-6 sm:py-4"
                  >
                    How it works
                  </a>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-line/80 pt-6 text-xs text-slate">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent-500" />
                    <span>No Resume Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent-amber" />
                    <span>19 Roles Evaluated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent-violet" />
                    <span>Actionable Steps & Timelines</span>
                  </div>
                </div>
              </div>

              {/* Right showcase column — illustration only, no functional
                  content, so it's dropped entirely below desktop rather than
                  shown as a static image: no animation/video/image on
                  mobile or tablet. */}
              <div className="hidden lg:col-span-5 lg:block">
                <div className="relative">
                  <div className="pointer-events-none absolute -top-10 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-accent-400/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-accent-violet/20 blur-2xl" />
                  <SearchCardsAnimation className="relative z-10 w-full max-w-[420px] mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-6 sm:px-10">
          {error && <p className="alert-error mb-6 text-center">{error}</p>}

          {/* credibility strip — real numbers. Value and label both stay on
              a single line even in the narrowest column (mobile's 3-up
              grid) via a smaller mobile-only type scale and tighter
              tracking/padding, instead of wrapping to 2-3 lines. */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-1.5 py-4 text-center sm:px-8 sm:py-8">
                <p className="font-display whitespace-nowrap text-lg font-bold text-ink sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 whitespace-nowrap text-[10px] leading-tight tracking-tight text-slate sm:whitespace-normal sm:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <p className="tag mt-6 text-center">
            for people moving into product manager, business analyst, and related roles
          </p>
        </section>

        {/* how it works section — GSAP vertical scroll showcase */}
        <section id="how-it-works" className="relative w-full">
          <PathGraphic className="pointer-events-none absolute -right-24 top-1/2 hidden h-[560px] w-auto -translate-y-1/2 opacity-[0.06] lg:block" />
          <HowItWorksShowcase steps={HOW_IT_WORKS} />
        </section>

        {/* Roadmap preview section */}
        <section id="roadmap" className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm">
              <MapIcon className="h-3.5 w-3.5 text-accent-500" />
              <span>Your roadmap</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Your personalized Product Transition Path
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-slate sm:text-base">
              This is the actual roadmap view generated once you select your target role — shown here with a sample path from Business Analyst to Growth PM.
            </p>

            <div className="mt-10">
              <JourneySection />
            </div>
          </div>
        </section>

        {/* Role coverage section */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm">
              <ListChecks className="h-3.5 w-3.5 text-accent-500" />
              <span>Role coverage</span>
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
              19 Product Roles, mapped to your background
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-slate sm:text-base">
              Every role family requires a distinct toolkit. We evaluate where your transferable experience holds a natural edge.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-6">
              {ROLE_FAMILIES.map((group, gi) => (
                <Reveal key={group.family} delayMs={gi * 100}>
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-line bg-paper p-6 sm:p-8 transition-all duration-300 hover:border-slate/40">
                    <div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white border border-line px-3 py-1 text-xs font-bold text-ink">
                        <Zap className="h-3.5 w-3.5 text-accent-500" />
                        <span className="capitalize">{group.family}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {group.roles.map((r) => (
                          <span
                            key={r.id}
                            className="chip cursor-default border-line bg-white text-ink transition-colors hover:border-ink"
                          >
                            <span aria-hidden className="text-base">{r.emoji}</span>
                            <span className="font-medium">{r.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <div className="rounded-3xl border border-line bg-paper p-8 sm:p-14 text-center shadow-sm">
            <div className="mx-auto max-w-2xl">
              <div className="mb-2 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-accent-500" />
                  <span>Get started</span>
                </div>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
                No résumé required to start. Just a conversation.
              </h2>

              <p className="mt-4 text-base text-slate sm:text-lg leading-relaxed">
                Two minutes. Answer 4 questions about your actual work history and get your custom role evaluation and transition roadmap.
              </p>

              <div className="group relative mt-8 inline-block">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="btn-gold inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold opacity-60 shadow-lg shadow-accent-500/20 cursor-not-allowed"
                >
                  <span>Talk to my mentor</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-center text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  Coming soon — check back shortly
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-[1400px] px-6 pb-12 text-center sm:px-10">
          <p className="tag">ProductPath • Built for product management career transitions</p>
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
