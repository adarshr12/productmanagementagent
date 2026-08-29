"use client";

import { useEffect, useState } from "react";
import { DotLottieReact, DotLottie, setWasmUrl } from "@lottiefiles/dotlottie-react";

// Self-host the WASM engine locally to avoid runtime CDN failures
setWasmUrl("/animations/dotlottie-player.wasm");

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
