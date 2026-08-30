"use client";

import { useState } from "react";
import { DotLottieReact, DotLottie } from "@lottiefiles/dotlottie-react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface LottieAnimationProps {
  src?: string;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  className?: string;
  showControls?: boolean;
  badgeText?: string;
}

export function LottieAnimation({
  src = "https://lottie.host/cd0a9496-172f-4bad-8dd1-36a1d32caca9/VmHC2dM7zF.lottie",
  autoplay = true,
  loop = true,
  speed = 1,
  className = "",
  showControls = true,
  badgeText = "Interactive Animation",
}: LottieAnimationProps) {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isLoaded, setIsLoaded] = useState(false);

  const dotLottieRefCallback = (instance: DotLottie | null) => {
    setDotLottie(instance);
  };

  const handlePlayPause = () => {
    if (!dotLottie) return;
    if (isPlaying) {
      dotLottie.pause();
      setIsPlaying(false);
    } else {
      dotLottie.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!dotLottie) return;
    dotLottie.stop();
    dotLottie.play();
    setIsPlaying(true);
  };

  return (
    <div className={`group relative flex flex-col items-center justify-center rounded-3xl border border-accent-200/60 bg-gradient-to-b from-white via-accent-50/30 to-accent-100/20 p-6 shadow-[0_20px_50px_-20px_rgba(63,109,220,0.25)] transition-all duration-300 hover:border-accent-400/80 hover:shadow-[0_25px_60px_-15px_rgba(63,109,220,0.35)] ${className}`}>
      {/* Top ambient glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 right-10 h-32 w-32 rounded-full bg-accent-violet/20 blur-2xl" />

      {/* Top Header Badge */}
      <div className="z-10 mb-4 flex items-center justify-between w-full">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-white/80 px-3 py-1 text-xs font-semibold text-accent-600 backdrop-blur-md shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-accent-violet animate-pulse" />
          <span>{badgeText}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-mono font-medium text-slate-soft">dotLottie 60fps</span>
        </div>
      </div>

      {/* Animation Container */}
      <div className="relative z-10 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white/60 p-4 backdrop-blur-sm sm:min-h-[360px]">
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/50">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-200 border-t-accent-500" />
            <p className="text-xs font-medium text-slate">Loading animation…</p>
          </div>
        )}

        <DotLottieReact
          src={src}
          autoplay={autoplay}
          loop={loop}
          speed={speed}
          dotLottieRefCallback={dotLottieRefCallback}
          onLoad={() => setIsLoaded(true)}
          className="h-full max-h-[420px] w-full max-w-[420px] object-contain drop-shadow-md transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Control Bar */}
      {showControls && (
        <div className="z-10 mt-4 flex items-center justify-between w-full rounded-xl border border-line bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-white transition hover:bg-accent-600 hover:scale-105 active:scale-95 shadow-sm"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={handleRestart}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-slate transition hover:border-accent-200 hover:bg-accent-50 hover:text-ink active:scale-95"
              title="Restart"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-amber" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-violet" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="ml-1 text-[11px] font-mono text-slate">Live Vector</span>
          </div>
        </div>
      )}
    </div>
  );
}
