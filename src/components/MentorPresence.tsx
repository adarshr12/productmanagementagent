"use client";

import { useEffect, useRef, useState } from "react";
import { DotLottieReact, DotLottie, setWasmUrl } from "@lottiefiles/dotlottie-react";
import { useMediaQuery } from "@/lib/useMediaQuery";

// Same reasoning as SearchCardsAnimation: self-host the WASM render engine
// instead of letting dotlottie-web fetch it from a CDN at runtime, so the
// mentor's presence doesn't silently stall on its first frame behind a
// third-party request.
setWasmUrl("/animations/dotlottie-player.wasm");

export type MentorState = "idle" | "listening" | "thinking" | "responding";

const CAPTIONS: Record<MentorState, string> = {
  idle: "settling in",
  listening: "listening closely",
  thinking: "thinking it through",
  responding: "here's what I think",
};

// The source animation (public/animations/animation-bot.lottie) is a single
// looping clip with no built-in state markers, so "reacting to state" is
// layered on top of it rather than swapped inside it: playback speed picks
// up while it's composing, and a glow ring / thought dots / speaking bars
// (same CSS as the rest of the app's mentor-* rules) frame the character
// according to what's actually happening in the conversation.
const SPEED_BY_STATE: Record<MentorState, number> = {
  idle: 0.85,
  listening: 1,
  thinking: 1.4,
  responding: 1.1,
};

/**
 * The mentor's presence — the app's own animation-bot Lottie character,
 * not a hand-built stand-in — reacting to conversation state (idle /
 * listening / thinking / responding) instead of sitting on a single static
 * frame the whole time.
 */
export function MentorPresence({
  state = "idle",
  size = 132,
  className,
}: {
  state?: MentorState;
  size?: number;
  className?: string;
}) {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!dotLottie) return;
    if (dotLottie.isLoaded) {
      setIsLoaded(true);
      return;
    }
    const onLoad = () => setIsLoaded(true);
    dotLottie.addEventListener("load", onLoad);
    return () => dotLottie.removeEventListener("load", onLoad);
  }, [dotLottie]);

  // Nudge playback speed with state instead of just leaving it on a flat
  // loop the whole conversation — subtle, but it's the difference between
  // "this plays" and "this is paying attention right now."
  useEffect(() => {
    if (!dotLottie || !isLoaded || reduceMotion) return;
    dotLottie.setSpeed(SPEED_BY_STATE[state]);
  }, [dotLottie, isLoaded, state, reduceMotion]);

  return (
    <div
      role="img"
      aria-label={`Your mentor is ${CAPTIONS[state]}`}
      data-mentor-state={state}
      className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* listening — soft rings pulsing out from behind the character */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <circle className="mentor-ring mentor-ring-1" cx="50" cy="50" r="42" fill="none" stroke="var(--accent-500)" strokeWidth="2" />
        <circle className="mentor-ring mentor-ring-2" cx="50" cy="50" r="42" fill="none" stroke="var(--accent-500)" strokeWidth="2" />
      </svg>

      {/* The WASM engine has to be fetched and instantiated before the
          live character can paint its first frame — a real beat, worse on
          a cold load — which otherwise shows up as a blank gap right where
          the mentor is supposed to be. This static frame-0 export of the
          same clip (public/animations/animation-bot-poster.svg) paints
          instantly instead — it's a plain <img>, no WASM involved — and
          the live version crossfades in on top the moment it's ready, so
          the character is on screen from the first paint. Same pattern as
          SearchCardsAnimation's poster/canvas crossfade. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static
          poster, intentionally not run through next/image so it paints as
          soon as the page does. */}
      <img
        src="/animations/animation-bot-poster.svg"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />

      <DotLottieReact
        src="/animations/animation-bot.lottie"
        autoplay={!reduceMotion}
        loop={!reduceMotion}
        dotLottieRefCallback={setDotLottie}
        className={`h-full w-full transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* thinking — small dots surfacing above the character */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <circle className="mentor-thought mentor-thought-1" cx="76" cy="14" r="2.6" fill="var(--accent-violet)" />
        <circle className="mentor-thought mentor-thought-2" cx="86" cy="7" r="2" fill="var(--accent-violet)" />
        <circle className="mentor-thought mentor-thought-3" cx="94" cy="0" r="1.5" fill="var(--accent-violet)" />
      </svg>

      {/* responding — a small speaking indicator at the character's base */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[6%] flex items-end justify-center gap-[3px]">
        <span className="mentor-bar block w-[3px] rounded-full bg-accent-teal" style={{ height: "18%" }} />
        <span className="mentor-bar block w-[3px] rounded-full bg-accent-teal" style={{ height: "18%" }} />
        <span className="mentor-bar block w-[3px] rounded-full bg-accent-teal" style={{ height: "18%" }} />
      </div>
    </div>
  );
}

export { CAPTIONS as MENTOR_CAPTIONS };
