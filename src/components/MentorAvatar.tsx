"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MentorAvatar3D } from "@/components/MentorAvatar3D";

/**
 * The mentor's avatar. Real 3D (Three.js/WebGL) by default — a stylized
 * figure, not a monogram or an icon — because "avatar" was read literally:
 * something that looks like a person. Pass `src` once a real photo exists;
 * that path renders it as a lit, animated 2D portrait instead (the 3D figure
 * is a stand-in for "no photo yet," not the permanent design).
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
    if (!src) return;
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
  }, [src]);

  useEffect(() => {
    if (!src || !speaking) return;
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
  }, [src, speaking]);

  if (!src) {
    return <MentorAvatar3D size={size} speaking={speaking} />;
  }

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Your product mentor"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
