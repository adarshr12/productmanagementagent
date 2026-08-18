"use client";

import { useEffect, useRef, useState } from "react";

/** Fades/rises a child in once it scrolls into view. Reuses the existing
 * `.animate-fade-up` keyframe (already reduced-motion safe) instead of
 * pulling in a new animation library for a one-shot reveal.
 *
 * Renders fully visible on the server and on first paint — only once
 * `useEffect` has actually run (confirming JS is live) does it switch to
 * the hidden-until-scrolled-into-view state. The old version started
 * hidden (`opacity-0`) unconditionally and depended on a client effect to
 * ever reveal it, including its own "never leave this permanently
 * invisible" fallback timer — if hydration never completes at all (a
 * blocked script, a slow connection, JS disabled), that effect never
 * runs, and the content stays invisible forever despite being real,
 * present markup in the page. That's indistinguishable from "the content
 * isn't there" to anyone actually looking at the rendered page. */
export function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setLive(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    // Safety net: never leave content permanently invisible if the
    // observer doesn't fire for some reason.
    const fallback = setTimeout(() => setVisible(true), 2500);
    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const revealClassName = !live
    ? className
    : visible
      ? `animate-fade-up ${className}`
      : `opacity-0 ${className}`;

  return (
    <div
      ref={ref}
      className={revealClassName}
      style={live && visible ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
