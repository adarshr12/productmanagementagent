"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Mic, Send, Navigation } from "lucide-react";
import type { Question } from "@/lib/questions";
import { RobotAvatar } from "@/components/RobotAvatar";
import { TypingIndicator } from "@/components/TypingIndicator";

type Turn = { id: string; from: "mentor" | "user"; text: string; at: number };

const GREETING =
  "Hey, welcome! I am your mentor. I'm going to ask a handful of quick questions so I can score you against every product role and tell you exactly why, not just guess. Answer with a tap, or just type, whatever's faster.";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatIntake({
  questions,
  onComplete,
  onCancel,
}: {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
  onCancel?: () => void;
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
    setTurns((t) => [...t, { id: uid(), from: "mentor", text, at: Date.now() }]);
  }
  function pushUser(text: string) {
    setTurns((t) => [...t, { id: uid(), from: "user", text, at: Date.now() }]);
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
      }, 700);
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, typing]);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const last = scrollRef.current.lastElementChild;
    if (last) {
      gsap.fromTo(
        last,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [turns]);

  function advance(rawValue: string) {
    const q = questions[step];
    const value = rawValue.trim();
    if (!value && q.required) {
      setError("Please answer this question to help us find your best match.");
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
          "Perfect, that's everything! Scoring your background against 19 product roles now..."
        );
        setTimeout(() => onComplete(nextAnswers), 800);
      }, 600);
      return;
    }

    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setStep(nextStep);
        pushMentor(questions[nextStep].label);
      },
      500 + Math.random() * 200
    );
  }

  const currentQuestion =
    step >= 0 && step < questions.length ? questions[step] : null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#f8fafc]">
      {/* Top Header spanning full-width */}
      <div className="w-full border-b border-slate-200 bg-white px-5 py-3.5 shadow-xs shrink-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <RobotAvatar size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-[#0f172a] leading-tight">Product Mentor</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-[#64748b] leading-tight mt-0.5">
                Scoring 19 product roles against your experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step >= 0 && step < questions.length && (
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Question {step + 1} of {questions.length}
              </span>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                aria-label="Close assessment"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <span className="text-lg leading-none font-bold">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Area spanning full-width with comfortable reading width */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 w-full"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="mx-auto max-w-4xl space-y-5">
          {turns.map((t) =>
            t.from === "mentor" ? (
              /* AI / Robot on the LEFT */
              <div key={t.id} className="flex w-full justify-start gap-3">
                <RobotAvatar size="sm" />
                <div className="flex max-w-[88%] sm:max-w-[80%] flex-col items-start">
                  <div className="chat-bubble-mentor">
                    {t.text}
                  </div>
                  <p className="chat-timestamp pl-1">{formatTime(t.at)}</p>
                </div>
              </div>
            ) : (
              /* User on the RIGHT */
              <div key={t.id} className="flex w-full justify-end">
                <div className="flex max-w-[85%] sm:max-w-[75%] flex-col items-end">
                  <div className="chat-bubble-user">{t.text}</div>
                  <p className="chat-timestamp pr-1 text-right">{formatTime(t.at)}</p>
                </div>
              </div>
            )
          )}

          {/* Typing indicator on the LEFT */}
          {typing && <TypingIndicator />}
          <div ref={endRef} />
        </div>
      </div>

      {/* Bottom Composer and Option Chips matching reference screenshot */}
      {currentQuestion && !typing && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-8 shrink-0 w-full shadow-lg">
          <div className="mx-auto max-w-4xl">
            {error && (
              <p role="alert" className="mb-2 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            {/* Quick Option Chips */}
            {currentQuestion.type === "select" && currentQuestion.options && (
              <div className="mb-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  <Navigation className="h-3 w-3 rotate-45 text-[#64748b]" />
                  <span>Choose an option:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => advance(opt)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#0a3258] hover:bg-slate-50 transition active:scale-[0.98]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pill Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                advance(freeText);
              }}
              className="flex items-center gap-2.5"
            >
              <div className="relative flex-1">
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
                      ? "Or type your own answer…"
                      : currentQuestion.placeholder || "Type your answer…"
                  }
                  className="w-full rounded-full border border-slate-300 bg-white pl-5 pr-11 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:border-[#0a3258] focus:outline-none focus:ring-1 focus:ring-[#0a3258]/20 transition"
                />
                <button
                  type="button"
                  aria-label="Voice input"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              {/* Circular Dark Navy Send Button */}
              <button
                type="submit"
                disabled={!freeText.trim() && currentQuestion.required}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a3258] text-white shadow-sm hover:bg-[#072440] transition active:scale-95 disabled:opacity-40 shrink-0"
                aria-label="Send answer"
              >
                <Send className="h-4 w-4 -translate-y-px translate-x-px" />
              </button>

              {!currentQuestion.required && (
                <button
                  type="button"
                  onClick={() => advance("")}
                  className="flex min-h-[44px] shrink-0 items-center px-3 text-xs font-medium text-slate-400 hover:text-slate-600 transition"
                >
                  Skip
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
