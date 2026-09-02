"use client";

import { useEffect, useState } from "react";
import { MentorPresence, MENTOR_CAPTIONS, type MentorState } from "@/components/MentorPresence";

const BUBBLE_TEXT: Record<MentorState, string> = {
  idle: "Right here whenever you're ready.",
  listening: "I'm listening — go ahead.",
  thinking: "Give me a second, thinking this through…",
  responding: "Here's what I think.",
};

const SUGGESTIONS = [
  "How do I move from BA to PM?",
  "What does an AI PM actually do day to day?",
  "How should I frame a career gap in interviews?",
];

/**
 * Wraps <MentorPresence> for pages where the chat and this panel are
 * siblings, not parent/child (e.g. /assistant's layout puts the chat and
 * this decorative column side by side). Listens for the "mentor-presence"
 * window event that AssistantChat emits on its own state changes, so the
 * panel stays a small, independently-mountable client component instead of
 * requiring the whole page to be lifted into one shared state tree.
 *
 * Spreads its content across three anchored groups (intro, presence,
 * suggestions) rather than one clump vertically centered in the column —
 * on a tall viewport a single centered block just leaves dead space above
 * and below it; three groups fill the height on purpose instead.
 */
export function MentorPresencePanel() {
  const [state, setState] = useState<MentorState>("idle");

  useEffect(() => {
    function onPresence(e: Event) {
      const detail = (e as CustomEvent<{ state: MentorState }>).detail;
      if (detail?.state) setState(detail.state);
    }
    window.addEventListener("mentor-presence", onPresence);
    return () => window.removeEventListener("mentor-presence", onPresence);
  }, []);

  function suggest(text: string) {
    window.dispatchEvent(new CustomEvent("mentor-suggest", { detail: { text } }));
  }

  return (
    <div className="relative flex h-full w-full flex-col justify-between gap-8 p-6 text-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
          Your product mentor
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink">
          Your mentor is{" "}
          <span className="bg-gradient-to-r from-accent-500 to-accent-teal bg-clip-text text-transparent">
            {MENTOR_CAPTIONS[state]}
          </span>
        </h2>
        <p className="mx-auto mt-2 max-w-[240px] text-sm text-slate">
          Ask about a role, a framework, or a decision you&apos;re stuck on.
          It&apos;s the same mentor who builds your roadmap.
        </p>
      </div>

      {/* The robot's thought, not a caption pinned beside it. Right-aligned
          (not centered) so the robot sits flush against the panel's own
          edge in normal flow — the robot + bubble combined are wider than
          this column's inner width, so with justify-end the overflow only
          ever happens on the left, predictably, instead of a centered
          group spilling out on both sides at once (which is what was
          clipping the bubble's text before). Top-aligned so the bubble
          sits level with the character's head, not down by its torso. A
          tight gap (not a negative margin pulling the bubble away) keeps
          the trailing thought-dots actually reaching the character instead
          of trailing off into empty space — the bubble reaches back past
          the column's border by being wide, not by being shifted left. */}
      <div className="relative z-20 flex items-start justify-end gap-1.5">
        <div
          key={state}
          className="mentor-thought-bubble z-10 mt-1 max-w-[195px] animate-fade-up"
        >
          {BUBBLE_TEXT[state]}
        </div>
        <MentorPresence state={state} size={176} className="shrink-0" />
      </div>

      <div className="text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
          Try asking
        </p>
        <div className="mt-2.5 flex flex-col gap-2">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => suggest(q)}
              className="rounded-xl border border-line bg-white px-3.5 py-2.5 text-left text-sm text-ink transition hover:border-accent-500/40 hover:bg-accent-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
