"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { JourneyMap, type JourneyStep } from "@/components/JourneyMap";

const JOURNEY_POINTS = [
  {
    title: "Starts from where you are",
    body: "Your current role and domain set the starting point on the map, not a generic template everyone gets.",
  },
  {
    title: "Every step has a size",
    body: "Each one comes with an estimated time and a resource, so nothing on the roadmap is a mystery task.",
  },
  {
    title: "Move it like real work",
    body: "Drag steps from to-do to done on a board, and the road behind you fills in as you go.",
  },
  {
    title: "Your mentor keeps you focused",
    body: "Only your next couple of steps stay in view at a time, so the whole roadmap never feels like a wall of tasks.",
  },
];

const DEMO_STEPS: JourneyStep[] = [
  { id: "1", title: "Portfolio teardown", status: "done" },
  { id: "2", title: "Case study practice", status: "done" },
  { id: "3", title: "Mock interview reps", status: "in_progress" },
  { id: "4", title: "Warm outreach to 10 PMs", status: "todo" },
];

const AUTOPLAY_MS = 3200;

/** Left: auto-advancing list of what the roadmap actually gives you.
 * Right: the real JourneyMap component (same one shown on a live roadmap)
 * with sample milestones, so this isn't a mockup of the feature — it's
 * the feature. Text content always renders regardless of JS; only the
 * active-step emphasis and progress bar are animated. */
export function JourneySection() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + 100 / (AUTOPLAY_MS / 100);
        setCurrent((c) => (c + 1) % JOURNEY_POINTS.length);
        return 0;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="flex flex-col justify-center gap-7">
        {JOURNEY_POINTS.map((point, i) => (
          <motion.div
            key={point.title}
            className="flex items-start gap-4"
            animate={{ opacity: i === current ? 1 : 0.4 }}
            transition={{ duration: 0.4 }}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                i === current
                  ? "border-accent-500 bg-accent-500 text-white"
                  : i < current
                    ? "border-accent-500/40 bg-accent-50 text-accent-500"
                    : "border-line bg-white text-slate-soft"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <div>
              <h3 className="font-display font-semibold text-ink">{point.title}</h3>
              <p className="mt-1 text-sm text-slate">{point.body}</p>
              {i === current && (
                <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <JourneyMap
          steps={DEMO_STEPS}
          startLabel="Business Analyst"
          finishLabel="Growth PM"
        />
      </div>
    </div>
  );
}
