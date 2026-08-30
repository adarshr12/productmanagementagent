"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BusinessmanPathAnimation } from "@/components/BusinessmanPathAnimation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export type StairStep = {
  id: string;
  stepNumber: number;
  title: string;
  stairLabel: string;
  description: string;
  duration: string;
  skillBadge: string;
  xPos: number; // left %
  yPos: number; // bottom %
};

const DEFAULT_STAIR_STEPS: StairStep[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Domain & Skill Gap Audit",
    stairLabel: "01 • Skill Gap Audit",
    description: "Analyze your current background and map transferable skills to target product roles.",
    duration: "Week 1",
    skillBadge: "Transferable Skills",
    xPos: 12,
    yPos: 14,
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "PRDs & Product Analytics",
    stairLabel: "02 • PRDs & SQL Metrics",
    description: "Master spec writing, wireframing, SQL data queries, and cohort retention metrics.",
    duration: "Weeks 2-4",
    skillBadge: "Product Specs",
    xPos: 25,
    yPos: 29,
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Portfolio Teardown & Case Study",
    stairLabel: "03 • Portfolio & Teardowns",
    description: "Build 2 real-world product case studies demonstrating strategic product thinking.",
    duration: "Weeks 5-7",
    skillBadge: "Case Studies",
    xPos: 39,
    yPos: 44,
  },
  {
    id: "step-4",
    stepNumber: 4,
    title: "Mock Interview Reps",
    stairLabel: "04 • Mock Interviews",
    description: "Practice product design, estimation, and behavioral questions with senior PM mentors.",
    duration: "Weeks 8-10",
    skillBadge: "Interview Practice",
    xPos: 53,
    yPos: 59,
  },
  {
    id: "step-5",
    stepNumber: 5,
    title: "Offer & Growth PM Landing",
    stairLabel: "05 • Growth PM Landing",
    description: "Targeted referral outreach, resume positioning, and offer negotiation strategy.",
    duration: "Week 12+",
    skillBadge: "Role Landing",
    xPos: 67,
    yPos: 74,
  },
];

export function BusinessmanStaircaseMap({
  steps = DEFAULT_STAIR_STEPS,
  startRole = "Business Analyst",
  targetRole = "Growth PM",
  completedCount: externalCompletedCount,
}: {
  steps?: StairStep[];
  startRole?: string;
  targetRole?: string;
  completedCount?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalCompletedCount, setInternalCompletedCount] = useState(0);

  const isControlled = typeof externalCompletedCount === "number";
  const completedCount = isControlled ? externalCompletedCount : internalCompletedCount;

  useGSAP(
    () => {
      if (isControlled || !containerRef.current) return;

      const trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 75%",
        end: "bottom 25%",
        scrub: 0.5,
        onUpdate: (self) => {
          const count = Math.floor(self.progress * (steps.length + 0.95));
          setInternalCompletedCount(count);
        },
      });

      return () => trigger.kill();
    },
    { scope: containerRef, dependencies: [steps.length, isControlled] }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl border border-line bg-gradient-to-b from-white via-paper to-accent-50/40 p-6 sm:p-8 shadow-[0_20px_50px_-20px_rgba(16,25,43,0.14)] overflow-hidden flex flex-col justify-center h-full min-h-[540px]"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-line/80 pb-3">
        <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
          Path: <span className="text-slate">{startRole}</span> →{" "}
          <span className="text-emerald-600">{targetRole}</span>
        </h3>
      </div>

      {/* Businessman Path Animation Container (Ultra-Clean, Chrome Badges Removed) */}
      <div className="relative min-h-[460px] w-full rounded-2xl border border-line bg-white p-4 shadow-inner flex items-center justify-center overflow-hidden">
        {/* Official Businessman Lottie Animation */}
        <div className="relative h-[420px] w-[420px] max-w-full">
          <BusinessmanPathAnimation autoplay={true} loop={true} />

          {/* Overlaid Stair Step Points: Sleek horizontal pills turning GREEN 1-by-1 on scroll */}
          {steps.map((stair, idx) => {
            const isGreen = idx < completedCount;

            return (
              <motion.div
                key={stair.id}
                animate={{
                  scale: isGreen ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`absolute z-30 flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-md transition-all duration-500 whitespace-nowrap -translate-x-1/2 translate-y-1/2 ${
                  isGreen
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-400/20"
                    : "border-line bg-white/95 text-slate backdrop-blur-md"
                }`}
                style={{
                  left: `${stair.xPos}%`,
                  bottom: `${stair.yPos}%`,
                }}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors duration-300 ${
                    isGreen
                      ? "bg-white text-emerald-700 font-extrabold"
                      : "bg-line text-slate"
                  }`}
                >
                  {isGreen ? "✓" : stair.stepNumber}
                </span>
                <span className="font-mono text-[11px] tracking-tight whitespace-nowrap">
                  {stair.stairLabel}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
