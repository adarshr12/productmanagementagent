"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Question } from "@/lib/questions";
import { MentorAvatar } from "@/components/MentorAvatar";
import { useMediaQuery } from "@/lib/useMediaQuery";

type Turn = { id: string; from: "mentor" | "user"; text: string };

const GREETING =
  "Hey — welcome. I'm going to ask a handful of quick questions so I can score you against every product role and tell you exactly why — not just guess. Answer with a tap, or just type — whatever's faster.";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatIntake({
  questions,
  onComplete,
  mentorPhotoSrc,
}: {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
  mentorPhotoSrc?: string;
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
  const isDesktop = useMediaQuery("(min-width: 640px)");

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

  // New turns lift in — reinforces "this is happening now," not a static log.
  useEffect(() => {
    if (!scrollRef.current) return;
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
      setError("Go ahead and answer this one — even a short answer helps.");
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
          "Perfect — that's everything I need. Scoring you against every product role now..."
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

  return (
    <div className="flex h-full min-h-0 w-full flex-col sm:grid sm:grid-cols-[1fr_auto]">
      {/* transcript — mentor lane right-aligned, user lane left-aligned */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-white/10 sm:border-b-0 sm:border-r">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-8 sm:px-12 sm:py-12"
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
              <div className="flex justify-end">
                <div className="chat-bubble-mentor flex items-center gap-1 py-4">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/50" />
                  <span
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/50"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/50"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {currentQuestion && !typing && (
            <div className="border-t border-white/10 px-5 py-4 sm:px-8">
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
                        className="chip"
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
                  className="field-input flex-1"
                />
                <button type="submit" className="btn-gold px-4 py-2.5">
                  Send
                </button>
                {!currentQuestion.required && (
                  <button
                    type="button"
                    onClick={() => advance("")}
                    className="shrink-0 text-xs font-medium text-cream/40 hover:text-cream/70"
                  >
                    Skip
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

      {/* the mentor — big, persistent, on the right */}
      <div className="flex flex-row items-center gap-4 bg-white/[0.02] px-6 py-5 sm:w-[300px] sm:flex-col sm:justify-start sm:px-6 sm:py-10">
        <MentorAvatar
          src={mentorPhotoSrc}
          size={isDesktop ? 220 : 120}
          speaking={typing}
        />
        <div className="sm:-mt-3 sm:text-center">
          <p className="text-sm font-semibold text-cream">
            Your product mentor
          </p>
          {step >= 0 && (
            <div className="mt-2 flex flex-wrap gap-1 sm:justify-center">
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
      </div>
    </div>
  );
}
