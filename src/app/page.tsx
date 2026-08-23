"use client";

import { useEffect, useState } from "react";
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
import { PinnedHowItWorks } from "@/components/ui/pinned-how-it-works";
import { JourneySection } from "@/components/JourneySection";
import { MessageCircle, ListChecks, Map as MapIcon, Compass } from "lucide-react";

import { createBrowserClient } from "@/lib/supabaseClient";

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = sessionStorage.getItem("pending_intake");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed?.intakeId && parsed?.matches?.length > 0) {
            setIntakeId(parsed.intakeId);
            setMatches(parsed.matches);
            setPhase("roles");
          }
        } catch {
          // ignore json error
        }
      }
    }
  }, []);

  function submit(answers: Record<string, string>) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pending_answers", JSON.stringify(answers));
      window.location.href = "/login?next=/r/claim&reason=unlock_roadmap";
    }
  }

  async function chooseRole(roleId: string) {
    setError(null);
    setPickingRole(roleId);
    setPhase("generating");
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pending_intake", JSON.stringify({ intakeId, roleId }));
        }
        router.push(`/login?next=/r/claim&reason=unlock_roadmap`);
        return;
      }

      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
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
            related roles, not for PMs already 5+ years in
          </p>
        </section>

        {/* how it works — pinned corkboard cards instead of the flat bento
            grid, sourced from a 21st.dev component and reskinned to the
            paper/ink/accent palette (chosen because it reuses the same
            scroll-driven feel as the hero instead of introducing a new
            interaction pattern) */}
        <section className="relative mx-auto max-w-[1400px] overflow-hidden px-6 py-24 sm:px-10">
          <PathGraphic className="pointer-events-none absolute -right-24 top-1/2 hidden h-[560px] w-auto -translate-y-1/2 opacity-[0.06] lg:block" />
          <p className="tag mb-8 text-center">how it works</p>
          <Reveal>
            <PinnedHowItWorks steps={HOW_IT_WORKS} />
          </Reveal>
        </section>

        {/* the roadmap, previewed with the real JourneyMap component —
            not a mockup, the same component a live roadmap renders */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
            <p className="tag mb-2">the roadmap</p>
            <h2 className="font-display max-w-2xl text-2xl font-semibold text-ink sm:text-3xl">
              Your journey, not just a checklist.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate">
              This is the actual roadmap view you get once you pick a role,
              shown here with a sample path from business analyst to growth
              PM.
            </p>
            <div className="mt-12">
              <Reveal>
                <JourneySection />
              </Reveal>
            </div>
          </div>
        </section>

        {/* role coverage — makes "19 roles scored" concrete instead of just
            a number in the stats strip above */}
        <section className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-20 sm:px-10">
            <p className="tag mb-2">every role, actually explained</p>
            <h2 className="font-display max-w-2xl text-2xl font-semibold text-ink sm:text-3xl">
              Not just a score. The full map of where you could go.
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
            Two minutes, no login, no résumé. Just a conversation with your
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
          <p className="tag">no résumé required to start, just a conversation</p>
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
