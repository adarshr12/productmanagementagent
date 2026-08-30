"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FLOW_SECTIONS, DARK } from "./content";
import { IsoStaircase } from "./IsoStaircase";

/**
 * The "sticky visual, scrolling text" pattern — modeled on
 * casual.pm/how-to/become-project-manager: an isometric 3D staircase
 * pinned on the right, long-form text scrolling on the left, the
 * staircase's active step synced to whichever section is currently in
 * view via IntersectionObserver. Steps fall and land one by one,
 * climbing up and to the right, as their matching section is reached
 * (see IsoStaircase.tsx).
 */
export function StepsFlowSection({ onAction, error }: { onAction: () => void; error?: string | null }) {
  const [activeId, setActiveId] = useState(FLOW_SECTIONS[0].nodeId);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.nodeId;
            if (id) setActiveId(id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    // No overflow-hidden here: it would make this <section> the nearest
    // scroll container for the sticky staircase panel below (per the CSS
    // overflow spec, a non-visible value forces the other axis to compute
    // as "auto") and silently break its position:sticky — same failure
    // mode hit earlier on <main>. The grid background doesn't need
    // clipping anyway; it's sized with inset-0 to its parent already.
    <section className="relative" style={{ background: DARK.bg }}>
      {/* faint fixed grid, purely atmospheric — same trick used on the app's other dark sections */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_640px] lg:gap-12">
          <div className="max-w-2xl">
            {error && <p className="alert-error mb-6">{error}</p>}
            {FLOW_SECTIONS.map((s) => (
              <div
                key={s.nodeId}
                data-node-id={s.nodeId}
                ref={(el) => {
                  if (el) sectionRefs.current.set(s.nodeId, el);
                  else sectionRefs.current.delete(s.nodeId);
                }}
                className="py-14 first:pt-0"
                style={{ borderTop: `1px solid ${DARK.line}` }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <p className="tag" style={{ color: "#0ba5a6" }}>
                    {s.eyebrow}
                  </p>
                  <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl" style={{ color: DARK.textOnDark }}>
                    {s.heading}
                  </h2>
                  {s.body.map((p, i) => (
                    <p key={i} className="mt-3 max-w-xl text-base leading-relaxed" style={{ color: DARK.textOnDarkMuted }}>
                      {p}
                    </p>
                  ))}
                  {s.cta && (
                    <button onClick={onAction} className="btn-gold btn-bounce mt-6 px-7 py-3.5 text-base">
                      {s.cta.label}
                    </button>
                  )}
                </motion.div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <IsoStaircase activeId={activeId} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
