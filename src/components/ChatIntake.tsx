"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Question } from "@/lib/questions";
import { MentorAvatar } from "@/components/MentorAvatar";

const GREETING =
  "Hey — welcome. I'm going to ask a handful of quick questions so I can score you against every product role and tell you exactly why — not just guess. Answer with a tap, or just type — whatever's faster.";

export function ChatIntake({
  questions,
  onComplete,
  mentorPhotoSrc,
}: {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
  mentorPhotoSrc?: string;
}) {
  const [step, setStep] = useState(-1);
  const [displayText, setDisplayText] = useState(GREETING);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<{ label: string; value: string }[]>(
    []
  );
  const [typing, setTyping] = useState(true);
  const [freeText, setFreeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const started = useRef(false);

  // Fade/lift the question text in whenever it changes.
  useEffect(() => {
    if (!textRef.current) return;
    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
  }, [displayText]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setStep(0);
          setDisplayText(questions[0].label);
        }, 900);
      }, 300);
    }, 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function advance(rawValue: string) {
    const q = questions[step];
    const value = rawValue.trim();
    if (!value && q.required) {
      setError("Go ahead and answer this one — even a short answer helps.");
      return;
    }
    setError(null);
    setHistory((h) => [...h, { label: q.label, value: value || "Skipped" }]);
    const nextAnswers = { ...answers, [q.id]: value };
    setAnswers(nextAnswers);
    setFreeText("");

    const nextStep = step + 1;
    if (nextStep >= questions.length) {
      setStep(nextStep);
      setTyping(true);
      setDisplayText(
        "Perfect — that's everything I need. Scoring you against every product role now..."
      );
      setTimeout(() => onComplete(nextAnswers), 900);
      return;
    }
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setStep(nextStep);
        setDisplayText(questions[nextStep].label);
      },
      550 + Math.random() * 300
    );
  }

  const currentQuestion =
    step >= 0 && step < questions.length ? questions[step] : null;

  return (
    <div className="chat-shell mx-auto w-full max-w-4xl px-6 py-10 sm:px-10 sm:py-14">
      <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-12">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <MentorAvatar
            src={mentorPhotoSrc}
            size={168}
            speaking={typing}
          />
          <p className="mt-4 text-sm font-semibold text-white">
            Your product mentor
          </p>
          {step >= 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1 sm:justify-start">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    i <= step ? "bg-accent-500" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="min-h-[92px] sm:min-h-[110px]">
            {typing ? (
              <div className="flex items-center gap-1.5 py-2">
                <span className="typing-dot h-2 w-2 rounded-full bg-accent-500" />
                <span
                  className="typing-dot h-2 w-2 rounded-full bg-accent-500"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="typing-dot h-2 w-2 rounded-full bg-accent-500"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            ) : (
              <p
                ref={textRef}
                className="font-display text-2xl font-medium italic leading-snug text-white sm:text-3xl"
              >
                {displayText}
              </p>
            )}
          </div>

          {currentQuestion && !typing && (
            <div className="mt-6">
              {error && (
                <p className="mb-2 text-xs text-accent-200">{error}</p>
              )}
              {currentQuestion.type === "select" &&
                currentQuestion.options && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => advance(opt)}
                        className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm
                          text-white/90 transition hover:border-accent-500 hover:bg-accent-500/10"
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
                <input
                  autoFocus
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={
                    currentQuestion.type === "select"
                      ? "Or type your own answer..."
                      : currentQuestion.placeholder || "Type your answer..."
                  }
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm
                    text-white outline-none transition placeholder:text-white/35
                    focus:border-accent-500"
                />
                <button type="submit" className="btn-gold px-4 py-2.5">
                  Send
                </button>
                {!currentQuestion.required && (
                  <button
                    type="button"
                    onClick={() => advance("")}
                    className="shrink-0 text-xs font-medium text-white/40 hover:text-white/70"
                  >
                    Skip
                  </button>
                )}
              </form>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-1.5 border-t border-white/10 pt-4">
              {history.map((h, i) => (
                <span
                  key={i}
                  title={h.label}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/45"
                >
                  {h.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
