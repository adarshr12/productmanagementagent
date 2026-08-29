"use client";

import React, { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { MessageCircle, ListChecks, Map as MapIcon, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export type PinnedStep = {
  step: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

const PHOTOS = [
  "https://images.unsplash.com/photo-11-2?q=80&w=1600&auto=format&fit=crop", // placeholder fallbacks
  "https://images.unsplash.com/photo-1758691736979-ff263c04b3d1?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1686061593213-98dad7c599b9?q=80&w=1600&auto=format&fit=crop",
];

const STEP_METADATA = [
  {
    chip: "AI Mentor Intake",
    tagline: "No resume required",
    photo: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1600&auto=format&fit=crop",
    features: ["Interactive conversational intake", "Remembers your work history", "Adaptable questions"],
  },
  {
    chip: "19 Roles Evaluated",
    tagline: "Instant fit breakdown",
    photo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
    features: ["PM, BA & Analyst roles", "Scored against your background", "Clear pros and growth areas"],
  },
  {
    chip: "Personalized Roadmap",
    tagline: "Trackable progression",
    photo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop",
    features: ["Step-by-step career path", "Milestones & skill gaps", "Real-world transition guidance"],
  },
];

export function HowItWorksShowcase({
  steps,
  heading = "From guesswork to a plan, in three steps",
}: {
  steps: PinnedStep[];
  heading?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  React.useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;

      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      if (cards.length === 0) return;

      // Set initial positions: Card 0 active, Card 1 & 2 stacked down
      gsap.set(cards[0], { yPercent: 0, scale: 1, opacity: 1, filter: "blur(0px)" });
      if (cards.length > 1) {
        gsap.set(cards.slice(1), { yPercent: 110, scale: 0.9, opacity: 0, filter: "blur(6px)" });
      }

      const scrollTl = gsap.timeline({
        id: "how-it-works-timeline",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${cards.length * 600}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: (self) => {
            const stepProgress = self.progress * (steps.length - 1);
            const activeIdx = Math.min(steps.length - 1, Math.round(stepProgress));
            setActiveStep(activeIdx);

            if (progressLineRef.current) {
              progressLineRef.current.style.height = `${self.progress * 100}%`;
            }
          },
        },
      });

      // Animate vertical card transitions
      for (let i = 0; i < cards.length - 1; i++) {
        const currentCard = cards[i];
        const nextCard = cards[i + 1];

        scrollTl
          .to(
            currentCard,
            {
              yPercent: -14,
              scale: 0.93,
              opacity: 0.25,
              filter: "blur(6px)",
              duration: 1,
              ease: "power2.inOut",
            },
            `step-${i}`
          )
          .to(
            nextCard,
            {
              yPercent: 0,
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              duration: 1,
              ease: "power2.out",
            },
            `step-${i}`
          );
      }

      return () => {
        ScrollTrigger.getById("how-it-works-timeline")?.kill();
      };
    },
    { scope: containerRef, dependencies: [steps.length, reducedMotion] }
  );

  const scrollToStep = (index: number) => {
    if (!containerRef.current) return;
    const allTriggers = ScrollTrigger.getAll();
    const st = allTriggers.find((t) => t.trigger === containerRef.current);
    if (st) {
      const targetProgress = index / (steps.length - 1);
      const targetY = st.start + targetProgress * (st.end - st.start);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  // ---- reduced motion fallback: simple stacked cards ----
  if (reducedMotion) {
    return (
      <div className="mx-auto w-full max-w-[1100px] py-16">
        <h2 className="font-display mb-12 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {heading}
        </h2>
        <div className="flex flex-col gap-12">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const meta = STEP_METADATA[i % STEP_METADATA.length];
            return (
              <div
                key={s.step}
                className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-line bg-white p-6 shadow-sm md:grid-cols-2 md:p-8"
              >
                <div className="relative h-[280px] overflow-hidden rounded-2xl border border-line">
                  <Image src={meta.photo} alt={s.title} fill sizes="50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-accent-500/10 mix-blend-multiply" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{meta.chip}</span>
                  </div>
                  <h3 className="font-display mt-4 text-2xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-base text-slate">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen w-full flex-col justify-center px-4 py-8 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-[1240px]">
        {/* Section Header */}
        <div className="mb-10 text-center md:mb-14">
          <p className="tag mb-2">how it works</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {heading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate sm:text-base">
            Scroll down to explore each step of the journey, driven by your AI mentor.
          </p>
        </div>

        {/* Grid Layout: Left Navigator + Right Vertical Scroll Card Stack */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center lg:gap-12">
          {/* Left Column: Interactive Vertical Step Navigator */}
          <div className="md:col-span-5 lg:col-span-5">
            <div className="relative pl-6 sm:pl-8">
              {/* Timeline Track & Animated Glowing Progress Bar */}
              <div className="absolute bottom-2 left-2.5 top-2 w-1 rounded-full bg-line sm:left-3.5">
                <div
                  ref={progressLineRef}
                  className="w-full rounded-full bg-gradient-to-b from-accent-500 via-accent-teal to-accent-amber transition-all duration-150"
                  style={{ height: "0%" }}
                />
              </div>

              {/* Step Items */}
              <div className="space-y-6 sm:space-y-8">
                {steps.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = i === activeStep;
                  const meta = STEP_METADATA[i % STEP_METADATA.length];

                  return (
                    <button
                      key={s.step}
                      onClick={() => scrollToStep(i)}
                      className={`group relative flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-all duration-300 ${
                        isActive
                          ? "border border-accent-200/80 bg-white shadow-lg shadow-accent-500/10"
                          : "border border-transparent hover:bg-white/60"
                      }`}
                    >
                      {/* Step Number Circle Badge */}
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-bold transition-all duration-300 ${
                          isActive
                            ? "border-accent-500 bg-accent-500 text-white shadow-md shadow-accent-500/30 scale-105"
                            : "border-line bg-white text-slate group-hover:border-accent-300 group-hover:text-accent-500"
                        }`}
                      >
                        {s.step}
                      </span>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-display text-base font-bold transition-colors ${
                              isActive ? "text-ink" : "text-slate group-hover:text-ink"
                            }`}
                          >
                            {s.title}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-accent-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-700">
                              Active
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-xs leading-relaxed transition-colors line-clamp-2 ${
                            isActive ? "text-slate" : "text-slate-soft group-hover:text-slate"
                          }`}
                        >
                          {s.body}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: GSAP Vertical Card Stack */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="relative h-[440px] w-full sm:h-[500px] lg:h-[540px]">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const meta = STEP_METADATA[i % STEP_METADATA.length];

                return (
                  <div
                    key={s.step}
                    ref={(el) => {
                      cardsRef.current[i] = el;
                    }}
                    className="absolute inset-0 flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-[0_25px_60px_-15px_rgba(16,25,43,0.18)] sm:p-8"
                    style={{ willChange: "transform, opacity, filter" }}
                  >
                    {/* Card Header Tag */}
                    <div className="flex items-center justify-between border-b border-line/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500 shadow-sm">
                          <Icon className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                        <div>
                          <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-soft uppercase">
                            STEP {s.step}
                          </span>
                          <h4 className="font-display text-lg font-bold text-ink">{s.title}</h4>
                        </div>
                      </div>
                      <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 font-mono text-xs font-semibold text-accent-600">
                        {meta.chip}
                      </span>
                    </div>

                    {/* Card Photo Showcase */}
                    <div className="relative my-4 flex-1 overflow-hidden rounded-2xl border border-line">
                      <Image
                        src={meta.photo}
                        alt={s.title}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        priority={i === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                      
                      {/* Floating Badge on Image */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-md border border-white/40">
                        <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-accent-amber" />
                          {meta.tagline}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-accent-600 bg-accent-100 px-2 py-0.5 rounded-full">
                          Step {i + 1} of {steps.length}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer & Features */}
                    <div className="pt-2">
                      <p className="text-xs text-slate sm:text-sm leading-relaxed mb-3">{s.body}</p>
                      <div className="flex flex-wrap gap-2">
                        {meta.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-paper border border-line px-2.5 py-1 text-[11px] font-medium text-ink"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

