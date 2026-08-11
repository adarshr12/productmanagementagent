"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MapPin, Flag } from "lucide-react";

gsap.registerPlugin(useGSAP);

const PATH_D =
  "M 50 500 C 50 400, 170 400, 190 320 C 210 240, 330 280, 330 200 C 330 120, 410 140, 410 60";

// Unlabeled waypoints along the curve, purely decorative (progress dots).
const WAYPOINTS = [
  { cx: 190, cy: 320 },
  { cx: 330, cy: 200 },
];

/**
 * The hero visual: a clearly-readable route from "you are here" to a target,
 * using the same pin/flag iconography as the roadmap's journey map — not an
 * abstract shape the visitor has to decode. Draws in once on mount.
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
      tl.from(".route-start", { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.4, ease: "back.out(2.5)" });
      tl.to(path, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, "-=0.1");
      tl.from(
        ".route-waypoint",
        { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.4, stagger: 0.5, ease: "back.out(2.5)" },
        "-=1.4"
      );
      tl.from(".route-end", { scale: 0, opacity: 0, transformOrigin: "center", duration: 0.5, ease: "back.out(2.5)" }, "-=0.3");
      tl.to(".route-end-ring", { scale: 1.5, opacity: 0, duration: 1.4, ease: "sine.out", repeat: -1 }, ">-0.2");
    },
    { scope }
  );

  return (
    <svg
      ref={scope}
      viewBox="0 0 470 540"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="route-gradient" x1="0" y1="540" x2="470" y2="0">
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

      {WAYPOINTS.map((n, i) => (
        <circle
          key={i}
          className="route-waypoint"
          cx={n.cx}
          cy={n.cy}
          r={5}
          fill="#ffffff"
          stroke="url(#route-gradient)"
          strokeWidth={2.5}
          style={{ transformBox: "fill-box" }}
        />
      ))}

      {/* start: "you are here" */}
      <g className="route-start" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx={50} cy={500} r={22} fill="#ffffff" stroke="#155eef" strokeWidth={2} />
        <foreignObject x={36} y={486} width={28} height={28}>
          <MapPin size={28} color="#155eef" strokeWidth={2.25} />
        </foreignObject>
        <text x={50} y={534} textAnchor="middle" className="fill-slate" fontSize="13" fontWeight={600}>
          You are here
        </text>
      </g>

      {/* end: the target role/offer */}
      <g style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle className="route-end-ring" cx={410} cy={60} r={26} fill="none" stroke="#0ba5a6" strokeWidth={2} />
        <g className="route-end">
          <circle cx={410} cy={60} r={22} fill="url(#route-gradient)" />
          <foreignObject x={396} y={46} width={28} height={28}>
            <Flag size={28} color="#ffffff" strokeWidth={2.25} />
          </foreignObject>
        </g>
        <text x={410} y={28} textAnchor="middle" className="fill-ink" fontSize="13" fontWeight={700}>
          Your target role
        </text>
      </g>
    </svg>
  );
}
