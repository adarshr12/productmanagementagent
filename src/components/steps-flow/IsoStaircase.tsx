"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BRICK_STACK, DARK, type BrickGroup } from "./content";

// A true isometric staircase — each step is a 3-face cuboid (top rhombus,
// light-left face, dark-right face) drawn with exact SVG geometry, not an
// approximated CSS transform. Steps climb up and to the right; later
// (higher) steps are drawn after earlier ones so they correctly occlude
// the tread behind them, the way real stacked blocks would.
const TOP_W = 112;
const TOP_H = 56; // 2:1 isometric ratio
const RISER_H = 52;
const STEP_DX = 60;
const STEP_DY = 42;

const COLOR: Record<BrickGroup, { top: string; left: string; right: string }> = {
  root: { top: "#ffdb8a", left: "#f2b632", right: "#a9711a" },
  get: { top: "#7fa4ff", left: "#155eef", right: "#0d3ea3" },
  do: { top: "#5fe0df", left: "#0ba5a6", right: "#076f70" },
};

type Pt = [number, number];
const addP = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];
const poly = (pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");

function stepFaces(center: Pt) {
  const top: Pt = addP(center, 0, -TOP_H / 2);
  const right: Pt = addP(center, TOP_W / 2, 0);
  const bottom: Pt = addP(center, 0, TOP_H / 2);
  const left: Pt = addP(center, -TOP_W / 2, 0);
  const topFace = [top, right, bottom, left];
  const leftFace = [left, bottom, addP(bottom, 0, RISER_H), addP(left, 0, RISER_H)];
  const rightFace = [bottom, right, addP(right, 0, RISER_H), addP(bottom, 0, RISER_H)];
  return { top, topFace, leftFace, rightFace };
}

// A tiny deterministic tilt per step (not random per render) so the climb
// looks hand-placed instead of perfectly robotic, without jittering to a
// new angle on every re-render.
function tiltFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return (h % 5) - 2;
}

/** The pinned build: an isometric staircase of 3D block steps that fall
 * and land one by one, climbing up and to the right, each tagged with a
 * speech-bubble callout — as the matching section on the left scrolls
 * into view. Sized to fit inside one viewport so it never gets clipped
 * while sticky-pinned; only the text column scrolls. */
export function IsoStaircase({ activeId }: { activeId: string }) {
  const activeIdx = Math.max(
    0,
    BRICK_STACK.findIndex((b) => b.id === activeId)
  );

  const layout = useMemo(() => {
    const centers: Pt[] = BRICK_STACK.map((_, i) => [i * STEP_DX, -i * STEP_DY]);
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    centers.forEach((c) => {
      const { leftFace, rightFace, topFace } = stepFaces(c);
      [...topFace, ...leftFace, ...rightFace].forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
    });
    const bubbleHeadroom = 56;
    const pad = 12;
    const originX = -minX + pad;
    const originY = -minY + bubbleHeadroom;
    return {
      centers: centers.map(([x, y]) => [x + originX, y + originY] as Pt),
      width: maxX - minX + pad * 2,
      height: maxY - minY + bubbleHeadroom + pad,
    };
  }, []);

  return (
    <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
      <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
        {BRICK_STACK.map(({ id, group }, index) => {
          const revealed = index <= activeIdx;
          const active = id === activeId;
          const tilt = tiltFor(id);
          const c = COLOR[group];
          const { topFace, leftFace, rightFace } = stepFaces(layout.centers[index]);

          return (
            <motion.g
              key={id}
              initial="hidden"
              animate={revealed ? "landed" : "hidden"}
              variants={{
                hidden: { y: -180, opacity: 0 },
                landed: {
                  y: [-180, 8, -3, 0],
                  opacity: [0, 1, 1, 1],
                  transition: { duration: 0.5, times: [0, 0.6, 0.82, 1], ease: "easeOut" },
                },
              }}
              style={{ transformOrigin: `${layout.centers[index][0]}px ${layout.centers[index][1]}px`, rotate: tilt }}
            >
              <polygon points={poly(leftFace)} fill={c.left} stroke="rgba(0,0,0,.15)" strokeWidth={0.5} />
              <polygon points={poly(rightFace)} fill={c.right} stroke="rgba(0,0,0,.2)" strokeWidth={0.5} />
              <polygon
                points={poly(topFace)}
                fill={c.top}
                stroke="rgba(255,255,255,.25)"
                strokeWidth={0.5}
                style={active ? { filter: "drop-shadow(0 0 10px rgba(255,255,255,.6))" } : undefined}
              />
            </motion.g>
          );
        })}
      </svg>

      {BRICK_STACK.map(({ id, label }, index) => {
        const revealed = index <= activeIdx;
        const { top } = stepFaces(layout.centers[index]);

        return (
          <motion.div
            key={id}
            className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap"
            style={{ left: top[0], top: top[1] - 8 }}
            initial="hidden"
            animate={revealed ? "landed" : "hidden"}
            variants={{
              hidden: { opacity: 0, y: 10 },
              landed: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.32 } },
            }}
          >
            <div className="relative rounded-xl bg-white px-3 py-1.5 text-[12px] font-semibold text-ink shadow-[0_10px_22px_-8px_rgba(0,0,0,.5)]">
              {label}
              <div
                className="absolute left-1/2 top-full -translate-x-1/2"
                style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "7px solid white" }}
              />
            </div>
          </motion.div>
        );
      })}

      <p
        className="absolute left-0 text-[11px] font-mono uppercase tracking-wide"
        style={{ bottom: -22, color: DARK.textOnDarkFaint }}
      >
        built one step at a time
      </p>
    </div>
  );
}
