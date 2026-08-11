"use client";

import { useEffect, useRef, useState } from "react";

/** Fades/rises a child in once it scrolls into view. Reuses the existing
 * `.animate-fade-up` keyframe (already reduced-motion safe) instead of
 * pulling in a new animation library for a one-shot reveal. */
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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

  return (
    <div
      ref={ref}
      className={visible ? `animate-fade-up ${className}` : `opacity-0 ${className}`}
      style={visible ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
