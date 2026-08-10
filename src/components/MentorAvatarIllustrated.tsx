"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * A hand-illustrated vector portrait — a face with real features (hair, brows,
 * eyes, nose, mouth) and shoulders in a blazer, not an abstract sphere/visor.
 * GSAP drives blink, idle head sway, and a talk-pulse on the mouth so it
 * reads as "someone," not a static sticker.
 */
export function MentorAvatarIllustrated({
  size = 200,
  speaking = false,
}: {
  size?: number;
  speaking?: boolean;
}) {
  const headRef = useRef<SVGGElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const mouthClosedRef = useRef<SVGPathElement>(null);
  const mouthOpenRef = useRef<SVGEllipseElement>(null);

  // idle head sway + breathing bob, and a recurring natural (non-metronomic) blink
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(headRef.current, {
        rotation: 2.2,
        transformOrigin: "120px 200px",
        duration: 3.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      gsap.to(headRef.current, {
        y: -3,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.3,
      });

      function scheduleBlink() {
        const delay = 2.4 + Math.random() * 2.6;
        gsap.delayedCall(delay, () => {
          gsap.to([leftEyeRef.current, rightEyeRef.current], {
            scaleY: 0.08,
            transformOrigin: "center",
            duration: 0.08,
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
          });
          scheduleBlink();
        });
      }
      scheduleBlink();
    });
    return () => ctx.revert();
  }, []);

  // talk-pulse: mouth opens/closes irregularly while speaking, settles to a
  // closed neutral smile otherwise — no precise lip-sync, just enough motion
  // to read as "talking" rather than a frozen frame.
  useEffect(() => {
    if (!speaking) {
      gsap.to(mouthClosedRef.current, { opacity: 1, duration: 0.2 });
      gsap.to(mouthOpenRef.current, { opacity: 0, scaleY: 0.3, duration: 0.2 });
      return;
    }
    let cancelled = false;
    function pulse() {
      if (cancelled) return;
      const open = Math.random() > 0.32;
      gsap.to(mouthOpenRef.current, {
        opacity: open ? 1 : 0,
        scaleY: open ? 0.6 + Math.random() * 0.7 : 0.3,
        transformOrigin: "center",
        duration: 0.09,
        ease: "power1.out",
      });
      gsap.to(mouthClosedRef.current, {
        opacity: open ? 0 : 1,
        duration: 0.09,
      });
      gsap.delayedCall(0.09 + Math.random() * 0.1, pulse);
    }
    pulse();
    return () => {
      cancelled = true;
    };
  }, [speaking]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="orb-pulse pointer-events-none absolute rounded-full"
        style={{
          inset: -size * 0.28,
          background:
            "radial-gradient(circle, rgba(34,211,238,0.55), rgba(34,211,238,0.12) 55%, transparent 72%)",
          filter: "blur(6px)",
          animationDuration: speaking ? "1.3s" : "3.2s",
        }}
        aria-hidden="true"
      />
      <div
        className="relative overflow-hidden rounded-full bg-[#0d131c]"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 240 240" className="h-full w-full">
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d8ab80" />
              <stop offset="100%" stopColor="#ab7c50" />
            </linearGradient>
            <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#232f42" />
              <stop offset="100%" stopColor="#0a0f18" />
            </linearGradient>
            <linearGradient id="blazer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c283b" />
              <stop offset="100%" stopColor="#0e1622" />
            </linearGradient>
            <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="75%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* backdrop wash so the circle isn't a hard black void behind the figure */}
          <rect x="0" y="0" width="240" height="240" fill="#0d131c" />
          <ellipse cx="120" cy="150" rx="140" ry="120" fill="#111a27" opacity="0.6" />

          {/* shoulders / blazer */}
          <path
            d="M18 240 C 24 196 66 178 120 178 C 174 178 216 196 222 240 Z"
            fill="url(#blazer)"
          />
          {/* lapels */}
          <path d="M120 182 L 96 240" stroke="#0a1018" strokeWidth="5" fill="none" />
          <path d="M120 182 L 144 240" stroke="#0a1018" strokeWidth="5" fill="none" />
          <path
            d="M120 182 L 100 222 L 120 214 Z"
            fill="#22d3ee"
            opacity="0.9"
          />
          {/* shirt/collar peek */}
          <path d="M108 186 L 120 214 L 132 186 L 120 196 Z" fill="#e7edf3" opacity="0.92" />

          {/* head + face group — this is what sways/bobs */}
          <g ref={headRef}>
            {/* neck */}
            <path
              d="M104 158 C 104 176 104 182 108 190 L 132 190 C 136 182 136 176 136 158 Z"
              fill="url(#skin)"
            />
            <path d="M104 165 C 112 172 128 172 136 165" stroke="#8a6039" strokeWidth="2" opacity="0.35" fill="none" />

            {/* face */}
            <path
              d="M120 40 C 160 40 170 72 168 106 C 166 142 150 176 120 178 C 90 176 74 142 72 106 C 70 72 80 40 120 40 Z"
              fill="url(#skin)"
            />
            {/* rim light along the right edge of the face, like the reference apps' key-lit look */}
            <path
              d="M120 40 C 160 40 170 72 168 106 C 166 142 150 176 120 178"
              stroke="url(#rim)"
              strokeWidth="3"
              fill="none"
            />
            {/* cheek/jaw shading */}
            <path d="M96 150 C 104 162 112 168 120 170" stroke="#8a6039" strokeWidth="2" opacity="0.25" fill="none" />

            {/* ears */}
            <ellipse cx="71" cy="104" rx="7" ry="11" fill="url(#skin)" />
            <ellipse cx="169" cy="104" rx="7" ry="11" fill="url(#skin)" />

            {/* hair — short, side-swept, sits above/behind the face */}
            <path
              d="M62 96 C 58 56 84 30 120 30 C 158 30 182 56 178 98 C 174 84 168 74 168 74 C 160 56 140 46 120 46 C 100 46 82 56 76 78 C 76 78 68 84 62 96 Z"
              fill="url(#hair)"
            />
            <path
              d="M120 30 C 158 30 182 56 178 98 C 176 90 172 82 168 76"
              stroke="#67e8f9"
              strokeWidth="1.5"
              opacity="0.4"
              fill="none"
            />

            {/* eyebrows */}
            <path d="M90 92 C 96 87 106 87 112 91" stroke="#3a2413" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M128 91 C 134 87 144 87 150 92" stroke="#3a2413" strokeWidth="3.5" strokeLinecap="round" fill="none" />

            {/* eyes */}
            <g ref={leftEyeRef}>
              <ellipse cx="100" cy="104" rx="9.5" ry="6.5" fill="#f4ede2" opacity="0.9" />
              <circle cx="100" cy="104" r="4.4" fill="#20140a" />
              <circle cx="102" cy="102" r="1.2" fill="#a5f3fc" />
            </g>
            <g ref={rightEyeRef}>
              <ellipse cx="140" cy="104" rx="9.5" ry="6.5" fill="#f4ede2" opacity="0.9" />
              <circle cx="140" cy="104" r="4.4" fill="#20140a" />
              <circle cx="142" cy="102" r="1.2" fill="#a5f3fc" />
            </g>

            {/* nose — a soft shadow line, not a filled blob */}
            <path
              d="M118 108 C 116 118 114 126 112 130 C 115 133 121 133 125 130"
              stroke="#8a6039"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />

            {/* mouth — closed smile (default) and open oval (speaking), crossfaded */}
            <path
              ref={mouthClosedRef}
              d="M104 150 C 111 155 129 155 136 150 C 129 152 111 152 104 150 Z"
              fill="#5c2f22"
            />
            <ellipse
              ref={mouthOpenRef}
              cx="120"
              cy="151"
              rx="11"
              ry="6"
              fill="#3a1811"
              opacity="0"
            />
          </g>

          <rect x="1" y="1" width="238" height="238" rx="119" fill="none" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
