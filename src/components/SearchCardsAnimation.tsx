"use client";

import { useEffect, useState } from "react";
import { DotLottieReact, DotLottie, setWasmUrl } from "@lottiefiles/dotlottie-react";
import { useMediaQuery } from "@/lib/useMediaQuery";

// dotlottie-web fetches its WASM render engine from a CDN (jsdelivr, with an
// unpkg fallback) by default. That's an unnecessary runtime dependency on a
// third party, and on this network — and potentially on ad-blockers,
// corporate proxies, or offline dev environments — that fetch just fails,
// which silently leaves the animation stuck on its first frame with no
// error surfaced anywhere in the UI. Self-hosting the same .wasm file
// (copied from node_modules/@lottiefiles/dotlottie-web/dist) removes that
// point of failure entirely.
setWasmUrl("/animations/dotlottie-player.wasm");

/**
 * Renders the "search cards" illustration from the Lottie source
 * (public/animations/search-cards.lottie — the same artwork as
 * search-cards.svg/search-cards.gif) via lottie-web's JS-driven
 * interpolation rather than either raster GIF frames or native SVG/SMIL
 * playback (Safari in particular is known to drop or truncate nested SMIL
 * sequences, which is why the SVG-only version never played through).
 *
 * The WASM engine still has to be fetched and instantiated before the
 * canvas can paint its first frame — a real, unavoidable beat, worse on a
 * cold load — which showed up as a blank gap in the hero even with
 * autoplay on. To make it feel instant, the static SVG (same fully
 * assembled artwork, no motion) renders underneath as a poster the moment
 * the page paints — it's a plain <img>, no WASM involved — and the
 * animated canvas crossfades in on top of it the instant it's actually
 * ready, so there's never a blank space, just a static frame that quietly
 * starts moving.
 *
 * This is a purely decorative hero illustration, not functional content —
 * so below the desktop breakpoint (mobile & tablet) it renders nothing at
 * all, rather than falling back to the static poster image. That's a
 * deliberate step further than just hiding it with CSS: neither the poster
 * SVG nor the Lottie/WASM asset is ever requested on a small screen.
 */
export function SearchCardsAnimation({ className = "" }: { className?: string }) {
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
    <div className={`relative flex aspect-square items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- plain static
          poster, intentionally not run through next/image's optimizer so it
          paints as soon as the page does. */}
      <img
        src="/animations/search-cards.svg"
        alt="A person searching a stack of candidate cards with a magnifying glass"
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <DotLottieReact
        src="/animations/search-cards.lottie"
        autoplay={true}
        loop={true}
        dotLottieRefCallback={setDotLottie}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
