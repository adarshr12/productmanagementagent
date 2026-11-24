"use client";

import { setWasmUrl } from "@lottiefiles/dotlottie-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Same self-hosted WASM engine as the hero animation (see
// SearchCardsAnimation.tsx) — avoids depending on the jsdelivr/unpkg CDN
// dotlottie-web otherwise fetches it from at runtime, which fails on
// restrictive networks and silently leaves the animation frozen. Calling
// this twice (once per component) is harmless — it's just configuration.
setWasmUrl("/animations/dotlottie-player.wasm");

/** The "how it works" animation — plays on load, loops, no player chrome. */
export function HowItWorksAnimation({ className = "" }: { className?: string }) {
  return (
    <DotLottieReact
      src="https://lottie.host/aa3c6849-61e6-4a84-a5c1-97b6a92923e6/Un2WfY6VBB.lottie"
      autoplay={true}
      loop={true}
      className={className}
    />
  );
}
