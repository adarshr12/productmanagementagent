"use client";

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2, Brain, Compass, Cpu, TrendingUp, Briefcase } from "lucide-react";
import { MentorPresence } from "@/components/MentorPresence";

const ANALYSIS_STEPS = [
  { text: "Analyzing your background & core skills…", icon: Brain },
  { text: "Evaluating compatibility across 19 product roles…", icon: Compass },
  { text: "Benchmarking Technical, Growth, and AI PM fit…", icon: Cpu },
  { text: "Calculating transition difficulty & timeline…", icon: TrendingUp },
  { text: "Finalizing your personalized role recommendations…", icon: Briefcase },
];

const SCANNING_ROLES = [
  { emoji: "🤖", label: "AI Product Manager", family: "Specialization" },
  { emoji: "📈", label: "Growth PM", family: "Specialization" },
  { emoji: "🧭", label: "Product Manager", family: "PM ladder" },
  { emoji: "🛠️", label: "Technical PM", family: "Specialization" },
  { emoji: "📋", label: "Business Analyst", family: "Adjacent role" },
  { emoji: "⚙️", label: "Product Ops", family: "Adjacent role" },
];

export function RoleScoringLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(12);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);

  // Smoothly increment progress bar to simulate deep AI analysis
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94; // Holds at 94% until real API returns
        const increment = prev < 50 ? Math.random() * 8 + 4 : Math.random() * 4 + 2;
        return Math.min(Math.round(prev + increment), 94);
      });
    }, 450);

    return () => clearInterval(progressTimer);
  }, []);

  // Cycle through human-readable analytical steps
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, 1800);

    return () => clearInterval(stepTimer);
  }, []);

  // Highlight scanning roles in sequence
  useEffect(() => {
    const roleTimer = setInterval(() => {
      setActiveRoleIndex((prev) => (prev + 1) % SCANNING_ROLES.length);
    }, 800);

    return () => clearInterval(roleTimer);
  }, []);

  const StepIcon = ANALYSIS_STEPS[currentStep].icon;

  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#f8fafc] px-4 py-12"
      role="status"
      aria-live="polite"
      aria-label="Scoring product roles against your background"
    >
      {/* Ambient glowing background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-sky-50/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Main Glassmorphic Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/95 p-7 sm:p-9 shadow-[0_20px_50px_-15px_rgba(10,50,88,0.12)] backdrop-blur-md">
          
          {/* Top Live Badge */}
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                AI Mentor Active
              </span>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              Scoring 19 Roles
            </span>
          </div>

          {/* Centerpiece: Robot Mentor Character with Radar Wave */}
          <div className="relative mx-auto my-3 flex h-36 w-36 items-center justify-center">
            {/* Concentric radar scanner rings */}
            <div className="absolute inset-0 rounded-full border border-blue-200 animate-ping opacity-25" />
            <div className="absolute -inset-3 rounded-full border border-sky-100 animate-pulse opacity-40" />
            
            {/* Robot presence animation */}
            <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-b from-blue-50/80 to-white shadow-inner">
              <MentorPresence state="thinking" size={118} />
            </div>
          </div>

          {/* Title & Explanatory Subtitle */}
          <div className="mt-5 text-center">
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a] sm:text-2xl">
              Scoring all 19 roles for you…
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Matching your strengths, background, and preferences against product career paths
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span className="flex items-center gap-1.5 text-[#0a3258]">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
                <span>Evaluating competencies</span>
              </span>
              <span className="tabular-nums font-mono text-xs font-bold text-[#0a3258]">{progress}%</span>
            </div>
            
            {/* Progress track */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0a3258] via-[#2563eb] to-[#38bdf8] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Dynamic Live Step Message */}
          <div className="mt-5 flex min-h-[44px] items-center justify-center gap-2.5 rounded-xl bg-slate-50/80 px-4 py-2.5 border border-slate-100 text-center transition-all duration-300">
            <StepIcon className="h-4 w-4 shrink-0 text-[#2563eb] animate-pulse" />
            <p className="text-xs sm:text-[13px] font-medium text-slate-700 animate-fade-in">
              {ANALYSIS_STEPS[currentStep].text}
            </p>
          </div>

          {/* Live Scanning Roles Ticker */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Role Match Benchmarking
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCANNING_ROLES.map((role, idx) => {
                const isActive = activeRoleIndex === idx;
                const isPassed = activeRoleIndex > idx;
                return (
                  <div
                    key={role.label}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-200 border ${
                      isActive
                        ? "border-[#0a3258] bg-[#0a3258] text-white shadow-xs scale-[1.02]"
                        : isPassed
                        ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                        : "border-slate-100 bg-slate-50/60 text-slate-600"
                    }`}
                  >
                    <span className="text-sm shrink-0">{role.emoji}</span>
                    <span className="truncate text-[11px] font-semibold">{role.label}</span>
                    <span className="ml-auto shrink-0">
                      {isActive ? (
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      ) : isPassed ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Quiet Reassurance Footnote */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          This usually takes 2–4 seconds • Please stay on this screen
        </p>
      </div>
    </main>
  );
}
