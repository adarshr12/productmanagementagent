"use client";

import { useEffect, useState } from "react";
import { MentorPresence, MENTOR_CAPTIONS, type MentorState } from "@/components/MentorPresence";

/**
 * Replaces the old fixed side panel: the mentor's presence now floats in
 * the corner of the viewport, like a companion who's around rather than a
 * permanent column eating into the chat's width. Listens for the same
 * "mentor-presence" window event AssistantChat already emits, so it stays
 * a small, independently-mountable client component.
 */
export function FloatingMentor() {
  const [state, setState] = useState<MentorState>("idle");

  useEffect(() => {
    function onPresence(e: Event) {
      const detail = (e as CustomEvent<{ state: MentorState }>).detail;
      if (detail?.state) setState(detail.state);
    }
    window.addEventListener("mentor-presence", onPresence);
    return () => window.removeEventListener("mentor-presence", onPresence);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 hidden flex-col items-end gap-2.5 sm:flex">
      <div
        key={state}
        className="mentor-bubble pointer-events-auto max-w-[190px] animate-fade-up rounded-2xl rounded-br-sm border border-line bg-white px-3.5 py-2.5 text-sm font-medium leading-snug text-ink shadow-lg"
      >
        {MENTOR_CAPTIONS[state]}
      </div>
      <MentorPresence state={state} size={84} className="pointer-events-auto drop-shadow-xl" />
    </div>
  );
}
