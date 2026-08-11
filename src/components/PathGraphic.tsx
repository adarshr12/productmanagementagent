"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const PATH_D =
  "M 60 520 C 60 420, 180 420, 200 340 C 220 260, 340 300, 340 220 C 340 140, 420 160, 420 60";

const NODES = [
  { cx: 60, cy: 520, r: 6, label: "You are here" },
  { cx: 200, cy: 340, r: 5, label: "Skill gaps closed" },
  { cx: 340, cy: 220, r: 5, label: "Interviewing" },
  { cx: 420, cy: 60, r: 9, label: "Offer" },
];

/**
 * The hero visual: an abstract route from a starting point to a destination,
 * echoing the actual roadmap/journey-map feature instead of a stock
 * illustration or a rendered face. Draws in once on mount.
 */
export function PathGraphic({ className = "" }: { className?: string }) {
  const scope = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const path = scope.current?.querySelector<SVGPathElement>(".route-path");
      if (!path) return;
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        path.style.strokeDashoffset = "0";
        return;
      }

      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(path, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" });
      tl.from(
        ".route-node",
        { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.5, stagger: 0.35, ease: "back.out(2.5)" },
        0.15
      );
      tl.to(".route-end", { scale: 1.35, duration: 0.9, ease: "sine.inOut", repeat: -1, yoyo: true }, ">-0.3");
    },
    { scope }
  );

  return (
    <svg
      ref={scope}
      viewBox="0 0 480 560"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="route-gradient" x1="0" y1="560" x2="480" y2="0">
          <stop offset="0%" stopColor="#155eef" />
          <stop offset="100%" stopColor="#0ba5a6" />
        </linearGradient>
      </defs>

      <path
        className="route-path"
        d={PATH_D}
        stroke="url(#route-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {NODES.map((n, i) => (
        <g key={i} className={i === NODES.length - 1 ? "route-node route-end" : "route-node"} style={{ transformBox: "fill-box" }}>
          <circle
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={i === NODES.length - 1 ? "url(#route-gradient)" : "#ffffff"}
            stroke="url(#route-gradient)"
            strokeWidth={i === NODES.length - 1 ? 0 : 2.5}
          />
        </g>
      ))}
    </svg>
  );
}
