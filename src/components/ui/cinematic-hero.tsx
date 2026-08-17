"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MessageCircle, Map as MapIcon, Target } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

// Adapted from a dark, skeuomorphic "cinematic hero" pattern to this app's
// light/editorial token system (paper/ink/accent — see globals.css) and
// rewritten around ProductPath's actual product (a mentor-led role match +
// roadmap, not the sobriety-tracker app it was originally built for).
const INJECTED_STYLES = `
  .ch-reveal { visibility: hidden; }

  .ch-grid-bg {
    background-size: 56px 56px;
    background-image:
      linear-gradient(to right, rgba(16,25,43,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(16,25,43,0.05) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .ch-card {
    background: linear-gradient(160deg, #ffffff 0%, #fbfcfd 100%);
    box-shadow:
      0 40px 90px -30px rgba(16, 25, 43, 0.22),
      0 14px 30px -18px rgba(16, 25, 43, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border: 1px solid #e3e6eb;
    position: relative;
  }

  .ch-card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(21,94,239,0.06) 0%, transparent 40%);
    transition: opacity 0.3s ease;
  }

  .ch-phone-bezel {
    background-color: #111318;
    box-shadow:
      inset 0 0 0 2px #3a3f4a,
      inset 0 0 0 7px #000,
      0 30px 60px -15px rgba(16, 25, 43, 0.35);
    transform-style: preserve-3d;
  }

  .ch-widget {
    background: #ffffff;
    border: 1px solid #e3e6eb;
    box-shadow: 0 6px 14px -8px rgba(16, 25, 43, 0.12);
  }

  .ch-badge {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow:
      0 0 0 1px rgba(16, 25, 43, 0.06),
      0 20px 40px -18px rgba(16, 25, 43, 0.28);
  }

  .ch-progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }
`;

function PhoneMockup({ mockupRef }: { mockupRef?: React.RefObject<HTMLDivElement> }) {
  return (
    <div
      ref={mockupRef}
      className="ch-phone-bezel relative flex h-[560px] w-[270px] flex-col rounded-[3rem]"
      style={{ willChange: "transform", transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-[7px] z-10 overflow-hidden rounded-[2.5rem] bg-paper text-ink shadow-[inset_0_0_15px_rgba(0,0,0,0.15)]">
        <div className="absolute left-1/2 top-[5px] z-50 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-3">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="relative flex h-full w-full flex-col px-5 pb-8 pt-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-soft">
                Your matches
              </span>
              <span className="text-xl font-bold tracking-tight text-ink">Growth PM</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-sm font-bold text-ink">
              YM
            </div>
          </div>

          <div className="relative mx-auto mb-6 flex h-40 w-40 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#e3e6eb" strokeWidth="10" />
              <circle
                className="ch-progress-ring"
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#155eef"
                strokeWidth="10"
                style={{ strokeDashoffset: mockupRef ? undefined : 105 }}
              />
            </svg>
            <div className="z-10 flex flex-col items-center text-center">
              <span className="ch-score-val text-4xl font-extrabold tracking-tighter text-ink">
                {mockupRef ? 0 : 92}
              </span>
              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-accent-500">
                Fit score
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="ch-widget flex items-center rounded-2xl p-3">
              <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50">
                <MessageCircle size={16} className="text-accent-500" strokeWidth={2.25} />
              </div>
              <div className="flex-1">
                <div className="mb-1.5 h-2 w-24 rounded-full bg-line" />
                <div className="h-1.5 w-14 rounded-full bg-line/70" />
              </div>
            </div>
            <div className="ch-widget flex items-center rounded-2xl p-3">
              <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <MapIcon size={16} className="text-emerald-600" strokeWidth={2.25} />
              </div>
              <div className="flex-1">
                <div className="mb-1.5 h-2 w-20 rounded-full bg-line" />
                <div className="h-1.5 w-24 rounded-full bg-line/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchBadges() {
  return (
    <>
      <div className="ch-badge absolute left-[-10px] top-8 z-30 flex items-center gap-3 rounded-2xl p-3 lg:left-[-70px] lg:top-12 lg:p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 lg:h-10 lg:w-10">
          <Target size={18} className="text-accent-500" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-tight text-ink lg:text-sm">92% match</p>
          <p className="text-[10px] font-medium text-slate-soft lg:text-xs">Growth PM</p>
        </div>
      </div>

      <div className="ch-badge absolute bottom-14 right-[-10px] z-30 flex items-center gap-3 rounded-2xl p-3 lg:bottom-20 lg:right-[-70px] lg:p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 lg:h-10 lg:w-10">
          <MapIcon size={18} className="text-emerald-600" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-tight text-ink lg:text-sm">Roadmap ready</p>
          <p className="text-[10px] font-medium text-slate-soft lg:text-xs">6 steps</p>
        </div>
      </div>
    </>
  );
}

// A plain, non-animated stack for anyone with prefers-reduced-motion set (or
// before we've checked, server-side) — no pin/scroll-jack, no mouse tilt,
// and critically, the CTA button lives in normal document flow instead of
// only inside the scroll-triggered overlay, so it's always reachable.
function StaticHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-paper px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl">
          Which product role{" "}
          <span className="bg-gradient-to-r from-accent-500 to-accent-teal bg-clip-text text-transparent">
            actually fits you?
          </span>
        </h1>
      </div>

      <div className="ch-card relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-[32px]">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-12 lg:px-12">
          <div className="relative flex shrink-0 items-center justify-center" style={{ perspective: "1000px" }}>
            <div className="relative scale-90 sm:scale-100">
              <PhoneMockup />
              <MatchBadges />
            </div>
          </div>
          <div className="text-center lg:text-left">
            <h3 className="mb-3 text-2xl font-bold tracking-tight text-ink lg:text-4xl">
              A mentor, not a form.
            </h3>
            <p className="mb-6 text-base leading-relaxed text-slate">
              ProductPath scores all 19 product roles against your background
              in a two-minute conversation, then hands you a personalized,
              trackable roadmap — not a static quiz result.
            </p>
            <button onClick={onStart} className="btn-gold btn-bounce px-7 py-3.5 text-base">
              Talk to my mentor →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedHero({ onStart }: { onStart: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useGSAP(
    () => {
      const handleMouseMove = (e: MouseEvent) => {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(() => {
          if (!mainCardRef.current || !mockupRef.current) return;
          const rect = mainCardRef.current.getBoundingClientRect();
          mainCardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, {
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
          });
        });
      };
      window.addEventListener("mousemove", handleMouseMove);

      const isMobile = window.innerWidth < 768;

      gsap.set(".ch-text-track", { autoAlpha: 0, y: 50, filter: "blur(16px)" });
      gsap.set(".ch-quick-cta", { autoAlpha: 0, y: 20 });
      gsap.set(".ch-main-card", { y: window.innerHeight + 200 });
      gsap.set([".ch-card-left", ".ch-card-right", ".ch-mockup", ".ch-badge"], { autoAlpha: 0 });
      gsap.set(".ch-cta", { autoAlpha: 0, scale: 0.9, filter: "blur(20px)" });

      gsap
        .timeline({ delay: 0.2 })
        .to(".ch-text-track", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.3, ease: "expo.out", stagger: 0.15 })
        .to(".ch-quick-cta", { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          // Was 3600px of scroll to play out the whole sequence — that's
          // roughly 4 viewport-heights of pure scrolling before the pinned
          // section even lets go, which reads as "stuck," not cinematic.
          // Compressed to a third of that; the .ch-quick-cta button above
          // also means nobody has to sit through any of it just to click
          // through to the chat.
          end: "+=1200",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to(".ch-hero-text, .ch-grid-bg", { scale: 1.1, filter: "blur(14px)", opacity: 0.15, duration: 1.5 }, 0)
        .to(".ch-main-card", { y: 0, duration: 1.5 }, 0)
        .to(".ch-main-card", { width: "100%", height: "100%", borderRadius: "0px", duration: 1.2 })
        .fromTo(
          ".ch-mockup",
          { y: 240, rotationX: 40, autoAlpha: 0, scale: 0.7 },
          { y: 0, rotationX: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.8 },
          "-=0.6"
        )
        .fromTo(
          ".ch-widget",
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.12, ease: "back.out(1.4)", duration: 1 },
          "-=1.1"
        )
        .to(".ch-progress-ring", { strokeDashoffset: 105, duration: 1.5 }, "-=1")
        .to(".ch-score-val", { innerHTML: 92, snap: { innerHTML: 1 }, duration: 1.5 }, "-=1.5")
        .fromTo(
          ".ch-badge",
          { y: 70, autoAlpha: 0, scale: 0.8 },
          { y: 0, autoAlpha: 1, scale: 1, ease: "back.out(1.5)", duration: 1.1, stagger: 0.15 },
          "-=1.4"
        )
        .fromTo(".ch-card-left", { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.1 }, "-=1")
        .fromTo(".ch-card-right", { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.1 }, "<")
        .to({}, { duration: 1.6 })
        .set([".ch-headline-group", ".ch-quick-cta"], { autoAlpha: 0 })
        .set(".ch-cta", { autoAlpha: 1 })
        .to({}, { duration: 1 })
        .to(
          [".ch-mockup", ".ch-badge", ".ch-card-left", ".ch-card-right"],
          { scale: 0.92, y: -30, autoAlpha: 0, duration: 1, stagger: 0.05 },
          "pullback"
        )
        .to(
          ".ch-main-card",
          {
            width: isMobile ? "92vw" : "82vw",
            height: isMobile ? "88vh" : "80vh",
            borderRadius: isMobile ? "28px" : "36px",
            duration: 1.4,
          },
          "pullback"
        )
        .to(".ch-cta", { scale: 1, filter: "blur(0px)", duration: 1.4 }, "pullback")
        // Sequential (no position arg): starts once the "pullback" group
        // above has fully settled, giving the CTA a moment to actually be
        // readable before the exit begins.
        .to(".ch-main-card", { y: -window.innerHeight - 200, duration: 1.2 })
        // .ch-cta is an absolutely-positioned sibling of the card, not a
        // child of it — without its own exit it stays visible (and its
        // button stays clickable) once the container unpins and returns to
        // normal flow, bleeding into whatever section comes next.
        .to(".ch-cta", { autoAlpha: 0, duration: 0.6 }, "<");

      return () => window.removeEventListener("mousemove", handleMouseMove);
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-paper"
      style={{ perspective: "1500px" }}
    >
      <div className="ch-grid-bg absolute inset-0 z-0 pointer-events-none opacity-70" aria-hidden="true" />

      {/* Headline + final CTA occupy the same footprint; only one is visible at a time.
          The quick-start button below is a sibling of .ch-headline-group, not a
          child — so hiding the headline group later doesn't take it down too, and
          anyone who wants to start right away never has to scroll to find a button. */}
      <div className="ch-hero-text absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
        <div className="ch-headline-group flex flex-col items-center">
          <h1 className="ch-text-track ch-reveal font-display max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl">
            Which product role
          </h1>
          <h1 className="ch-text-track ch-reveal font-display max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-accent-500 to-accent-teal bg-clip-text text-transparent">
              actually fits you?
            </span>
          </h1>
        </div>
        <button
          onClick={onStart}
          className="ch-quick-cta ch-reveal btn-gold btn-bounce mt-8 px-6 py-3 text-sm"
        >
          Talk to my mentor →
        </button>
      </div>

      <div className="ch-cta ch-reveal absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
        <h2 className="font-display mb-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          Ready to find your path?
        </h2>
        <p className="mb-8 max-w-md text-base text-slate sm:text-lg">
          Talk to your mentor for two minutes. Get all 19 product roles
          scored, and a roadmap built around you.
        </p>
        <button onClick={onStart} className="btn-gold btn-bounce pointer-events-auto px-7 py-3.5 text-base">
          Talk to my mentor →
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          ref={mainCardRef}
          className="ch-main-card ch-card relative flex w-[92vw] items-center justify-center overflow-hidden rounded-[28px] pointer-events-auto sm:w-[85vw] sm:rounded-[36px]"
          style={{ height: "92vh" }}
        >
          <div className="ch-card-sheen" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-evenly px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-12 lg:py-0">
            <div className="ch-card-right order-1 flex w-full justify-center lg:order-3 lg:justify-end">
              <h2 className="font-display text-5xl font-black uppercase tracking-tighter text-ink sm:text-6xl lg:text-7xl">
                ProductPath
              </h2>
            </div>

            <div
              className="ch-mockup order-2 relative flex h-[340px] w-full items-center justify-center lg:order-2 lg:h-[560px]"
              style={{ perspective: "1000px" }}
            >
              <div className="relative flex h-full w-full scale-[0.65] items-center justify-center sm:scale-90 lg:scale-100">
                <PhoneMockup mockupRef={mockupRef} />
                <MatchBadges />
              </div>
            </div>

            <div className="ch-card-left order-3 flex w-full flex-col justify-center px-4 text-center lg:order-1 lg:px-0 lg:text-left">
              <h3 className="mb-0 text-2xl font-bold tracking-tight text-ink lg:mb-5 lg:text-4xl">
                A mentor, not a form.
              </h3>
              <p className="mx-auto hidden max-w-sm text-base leading-relaxed text-slate md:block lg:mx-0 lg:max-w-none">
                ProductPath scores all 19 product roles against your
                background in a two-minute conversation, then hands you a
                personalized, trackable roadmap — not a static quiz result.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CinematicHero({ onStart }: { onStart: () => void }) {
  // Defaults to the static layout (matches server render, and is the safe
  // choice for anyone whose OS asks for reduced motion) and only switches to
  // the animated, scroll-pinned version once we've confirmed on the client
  // that motion is fine.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      {animated ? <AnimatedHero onStart={onStart} /> : <StaticHero onStart={onStart} />}
    </>
  );
}
