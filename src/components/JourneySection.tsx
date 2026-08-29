"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BusinessmanStaircaseMap } from "@/components/BusinessmanStaircaseMap";
import { JourneyMap, type JourneyStep } from "@/components/JourneyMap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const JOURNEY_POINTS = [
  {
    title: "Starts from where you are",
    body: "Your current role and domain set the starting point on the stair map, not a generic template everyone gets.",
  },
  {
    title: "Every step has a size & label",
    body: "Each stair step comes labeled with an estimated timeline, skill badge, and concrete goal.",
  },
  {
    title: "Watch your character ascend",
    body: "Track your transition step-by-step as you complete PRDs, case studies, and mock interviews.",
  },
  {
    title: "Your mentor keeps you focused",
    body: "Only your active stair step stays in view at a time, keeping your momentum high until landing your PM role.",
  },
];

const DEMO_STEPS: JourneyStep[] = [
  { id: "1", title: "Portfolio teardown", status: "done" },
  { id: "2", title: "Case study practice", status: "done" },
  { id: "3", title: "Mock interview reps", status: "in_progress" },
  { id: "4", title: "Warm outreach to 10 PMs", status: "todo" },
];

export function JourneySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [completedCount, setCompletedCount] = useState(0); // Starts at 0 (no green initially)
  const [viewMode] = useState<"businessman" | "classic">("businessman");

  // Pin the ENTIRE JourneySection (left column text + right map) sticky in place on scroll!
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${1800}`, // Sticky scroll distance
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Progress 0 to 1 -> step count 0 to 5
          const count = Math.floor(self.progress * 5.95);
          setCompletedCount(count);
        },
      });

      return () => trigger.kill();
    },
    { scope: sectionRef }
  );

  return (
    <div
      ref={sectionRef}
      className="flex min-h-screen w-full flex-col justify-center gap-6 py-6"
    >
      {/* Main Grid: Left Column Text & Right Column Staircase both STAY STICKY TOGETHER */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column Text List - Pins sticky with the section and turns green on scroll */}
        <div className="flex flex-col justify-center gap-5 lg:col-span-5">
          {JOURNEY_POINTS.map((point, i) => {
            const isGreen = i < completedCount;

            return (
              <motion.div
                key={point.title}
                animate={{
                  opacity: isGreen ? 1 : 0.45,
                  scale: isGreen ? 1.02 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition-all duration-500 ${
                  isGreen
                    ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                    : "border-transparent bg-white/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500 ${
                    isGreen
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105"
                      : "border-line bg-white text-slate-soft"
                  }`}
                >
                  {isGreen ? "✓" : i + 1}
                </span>
                <div>
                  <h3
                    className={`font-display font-semibold transition-colors duration-300 ${
                      isGreen ? "text-emerald-900 font-bold" : "text-ink"
                    }`}
                  >
                    {point.title}
                  </h3>
                  <p
                    className={`mt-1 text-xs sm:text-sm leading-relaxed transition-colors duration-300 ${
                      isGreen ? "text-emerald-800" : "text-slate"
                    }`}
                  >
                    {point.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Businessman Staircase Map - Pins sticky together with left column */}
        <div className="lg:col-span-7">
          {viewMode === "businessman" ? (
            <BusinessmanStaircaseMap
              startRole="Business Analyst"
              targetRole="Growth PM"
              completedCount={completedCount}
            />
          ) : (
            <JourneyMap
              steps={DEMO_STEPS}
              startLabel="Business Analyst"
              finishLabel="Growth PM"
            />
          )}
        </div>
      </div>
    </div>
  );
}
