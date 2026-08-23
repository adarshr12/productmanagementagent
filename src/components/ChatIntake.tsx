"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MessageCircle, Target, Map as MapIcon } from "lucide-react";
import type { Question } from "@/lib/questions";
import { SplineScene } from "@/components/ui/splite";
import { SplineErrorBoundary } from "@/components/ui/spline-error-boundary";

// What the mentor panel highlights at each stage — gives the sidebar real
// content instead of just an icon and a progress count, and reassures
// anyone mid-conversation that this is going somewhere specific.
const STAGES = [
  { icon: MessageCircle, label: "Getting to know you", until: 0.34 },
  { icon: Target, label: "Scoring 19 roles against you", until: 0.74 },
  { icon: MapIcon, label: "Building your roadmap", until: 1 },
];

function currentStage(step: number, total: number) {
  if (total <= 0) return STAGES[0];
  const progress = Math.min(Math.max(step / total, 0), 1);
  return STAGES.find((s) => progress <= s.until) ?? STAGES[STAGES.length - 1];
}

type Turn = { id: string; from: "mentor" | "user"; text: string };

const GREETING =
  "Hey, welcome. I'm going to ask a handful of quick questions so I can score you against every product role and tell you exactly why, not just guess. Answer with a tap, or just type, whatever's faster.";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatIntake({
  questions,
  onComplete,
}: {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [typing, setTyping] = useState(true);
  const [freeText, setFreeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  function pushMentor(text: string) {
    setTurns((t) => [...t, { id: uid(), from: "mentor", text }]);
  }
  function pushUser(text: string) {
    setTurns((t) => [...t, { id: uid(), from: "user", text }]);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMentor(GREETING);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setStep(0);
        pushMentor(questions[0].label);
      }, 900);
    }, 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, typing]);

  // New turns lift in, reinforces "this is happening now," not a static log.
  useEffect(() => {
    if (!scrollRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const last = scrollRef.current.lastElementChild;
    if (last) {
      gsap.fromTo(
        last,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    }
  }, [turns]);

  function advance(rawValue: string) {
    const q = questions[step];
    const value = rawValue.trim();
    if (!value && q.required) {
      setError("Go ahead and answer this one, even a short answer helps.");
      return;
    }
    setError(null);
    pushUser(value || "Skipped");
    const nextAnswers = { ...answers, [q.id]: value };
    setAnswers(nextAnswers);
    setFreeText("");

    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      setStep(nextStep);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushMentor(
          "Perfect, that's everything I need. Scoring your profile and redirecting you to create an account / sign in..."
        );
        setTimeout(() => onComplete(nextAnswers), 900);
      }, 700);
      return;
    }
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setStep(nextStep);
        pushMentor(questions[nextStep].label);
      },
      550 + Math.random() * 300
    );
  }

  const currentQuestion =
    step >= 0 && step < questions.length ? questions[step] : null;
  const stage = currentStage(Math.max(step, 0), questions.length);
  const stageIndex = STAGES.indexOf(stage);
  const StageIcon = stage.icon;

  return (
    <div className="flex h-full min-h-0 w-full flex-col sm:grid sm:grid-cols-[1fr_auto]">
      {/* transcript — mentor lane right-aligned, user lane left-aligned */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-line sm:border-b-0 sm:border-r">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-8 sm:px-12 sm:py-12"
          aria-live="polite"
          aria-relevant="additions"
        >
          {turns.map((t) =>
              t.from === "mentor" ? (
                <div key={t.id} className="flex justify-end">
                  <div className="chat-bubble-mentor font-display text-lg">
                    {t.text}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="flex items-start justify-start gap-2">
                  <span className="tag mt-2.5 shrink-0">you</span>
                  <div className="chat-bubble-user">{t.text}</div>
                </div>
              )
            )}
            {typing && (
              <div className="flex justify-end" role="status" aria-label="Your mentor is typing">
                <div className="chat-bubble-mentor flex items-center gap-1 py-4">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" />
                  <span
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {currentQuestion && !typing && (
            <div className="border-t border-line px-5 py-4 sm:px-8">
              {error && (
                <p role="alert" className="mb-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              {currentQuestion.type === "select" &&
                currentQuestion.options && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => advance(opt)}
                        className="chip min-h-[44px]"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  advance(freeText);
                }}
                className="flex items-center gap-2"
              >
                <label htmlFor="free-text-answer" className="sr-only">
                  {currentQuestion.label}
                </label>
                <input
                  id="free-text-answer"
                  autoFocus
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={
                    currentQuestion.type === "select"
                      ? "Or type your own answer..."
                      : currentQuestion.placeholder || "Type your answer..."
                  }
                  className="field-input flex-1"
                />
                <button type="submit" className="btn-gold min-h-[44px] px-4 py-2.5">
                  Send
                </button>
                {!currentQuestion.required && (
                  <button
                    type="button"
                    onClick={() => advance("")}
                    className="flex min-h-[44px] shrink-0 items-center px-2 text-xs font-medium text-slate-soft hover:text-slate"
                  >
                    Skip
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

      {/* the mentor's identity — brand mark + progress. The 3D scene is a
          background layer behind the icon (hidden on the mobile row layout,
          where there's no vertical room for it), same pattern as /assistant. */}
      <div className="relative flex flex-row items-center gap-4 overflow-hidden px-6 py-5 sm:w-[260px] sm:flex-col sm:justify-center sm:px-6 sm:py-10">
        <div className="absolute inset-0 z-0 hidden opacity-40 sm:block">
          <SplineErrorBoundary fallback={null}>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="h-full w-full"
            />
          </SplineErrorBoundary>
        </div>

        <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-teal text-white shadow-lg sm:h-16 sm:w-16">
          <StageIcon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} />
        </div>
        <div className="relative z-10 min-w-0 sm:mt-4 sm:text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
            Your product mentor
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">{stage.label}</p>
          {step >= 0 && (
            <p className="mt-1 text-xs font-medium text-slate-soft">
              Question {Math.min(step + 1, questions.length)} of{" "}
              {questions.length}
            </p>
          )}
        </div>

        {/* stage stepper — spells out the 3-part journey (chat, scoring,
            roadmap) so the panel reads as "here's where this is going,"
            not just a bare progress count. Hidden on the mobile row layout,
            where there's no vertical room for a 3-item list. */}
        <div className="relative z-10 mt-2 hidden w-full flex-col gap-1 sm:mt-6 sm:flex">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isCurrent = i === stageIndex;
            const isDone = i < stageIndex;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                  isCurrent ? "bg-white/70 shadow-sm" : ""
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-accent-500 text-white"
                      : isCurrent
                        ? "bg-accent-100 text-accent-500"
                        : "bg-line text-slate-soft"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span
                  className={`text-xs font-medium leading-tight ${
                    isCurrent
                      ? "text-ink"
                      : isDone
                        ? "text-slate"
                        : "text-slate-soft"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {step >= 0 && (
          <div
            className="relative z-10 flex flex-wrap gap-1 sm:mt-4 sm:justify-center"
            aria-hidden="true"
          >
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i <= step ? "bg-accent-500" : "bg-line"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
