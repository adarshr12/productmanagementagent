"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Large, prominent mentor avatar — an idle "breathing" motion at rest, and a
 * short attention pulse while the mentor is "speaking" (i.e. typing/thinking).
 * Pass `src` once a real photo is available; falls back to a hand-built
 * illustrated placeholder (no emoji-as-icon — see ui-ux-pro-max skill).
 */
export function MentorAvatar({
  src,
  size = 200,
  speaking = false,
}: {
  src?: string;
  size?: number;
  speaking?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(wrapRef.current, {
        y: -6,
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(glowRef.current, {
        scale: 1.15,
        opacity: 0.55,
        duration: 1.9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!speaking) return;
    const tween = gsap.to(wrapRef.current, {
      scale: 1.035,
      duration: 0.32,
      ease: "sine.inOut",
      yoyo: true,
      repeat: 5,
    });
    return () => {
      tween.kill();
      gsap.set(wrapRef.current, { scale: 1 });
    };
  }, [speaking]);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size * 1.35, height: size * 1.35 }}
    >
      <div
        ref={glowRef}
        className="absolute rounded-full bg-accent-500/30 blur-2xl"
        style={{ width: size * 1.1, height: size * 1.1, opacity: 0.35 }}
        aria-hidden="true"
      />
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-full border-[3px] border-accent-500/50 shadow-2xl"
        style={{ width: size, height: size }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Your product mentor"
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderPortrait />
        )}
      </div>
    </div>
  );
}

// Deliberately NOT a generic person-silhouette icon — that reads as a
// default/missing-avatar placeholder, which undercuts the "real mentor"
// feel. A monogram on a gradient is the same pattern Stripe/Notion/Linear
// use for unset avatars, and reads as intentional rather than a fallback.
function PlaceholderPortrait() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="mentorBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3227" />
          <stop offset="100%" stopColor="#191510" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#mentorBg)" />
      <text
        x="100"
        y="128"
        textAnchor="middle"
        fontSize="92"
        fontStyle="italic"
        fontWeight="600"
        fill="#c9a24b"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        P
      </text>
    </svg>
  );
}
