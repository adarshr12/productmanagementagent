"use client";

import { useEffect, useState } from "react";
import { DotLottieReact, DotLottie, setWasmUrl } from "@lottiefiles/dotlottie-react";
import { useMediaQuery } from "@/lib/useMediaQuery";

// Self-host the WASM engine locally to avoid runtime CDN failures
setWasmUrl("/animations/dotlottie-player.wasm");

/**
 * Decorative-only illustration (see BusinessmanStaircaseMap, which overlays
 * the actual stair-step content on top of it). Below the desktop breakpoint
 * it renders nothing at all — no poster image, no Lottie/WASM fetch —
 * matching SearchCardsAnimation's approach, rather than just hiding it with
 * CSS while still downloading both assets.
 */
export function BusinessmanPathAnimation({
  className = "",
  autoplay = true,
  loop = true,
}: {
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
}) {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

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

  if (!isDesktop) return null;

  return (
    <div className={`relative flex aspect-square items-center justify-center overflow-hidden ${className}`}>
      {/* Static SVG Poster displayed instantly on first paint while WASM initializes */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/animations/businessman-path.svg"
        alt="Businessman climbing career path stairs animation"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Live DotLottie 60fps Vector Animation */}
      <DotLottieReact
        src="/animations/businessman-path.lottie"
        autoplay={autoplay}
        loop={loop}
        dotLottieRefCallback={setDotLottie}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
