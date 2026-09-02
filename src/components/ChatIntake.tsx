"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MessageCircle, Target, Map as MapIcon, UserRound } from "lucide-react";
import type { Question } from "@/lib/questions";
import { MentorPresence, MENTOR_CAPTIONS } from "@/components/MentorPresence";

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

type Turn = { id: string; from: "mentor" | "user"; text: string; at: number };

const GREETING =
  "Hey, welcome. I'm going to ask a handful of quick questions so I can score you against every product role and tell you exactly why, not just guess. Answer with a tap, or just type, whatever's faster.";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Same quiet-caption treatment as AssistantChat, so both surfaces read as
// one consistent mentor thread rather than two differently-built chats.
// Locale pinned to en-US for the same reason as AssistantChat's copy of
// this helper — keeps formatting stable regardless of environment locale.
function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Same robot still used in AssistantChat's copy of this helper, so every
// mentor line across both chat surfaces is visibly the same character.
function MentorAvatar() {
  return (
    <span className="chat-avatar mt-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static
          avatar, not worth routing through next/image. */}
      <img src="/animations/animation-bot-poster.svg" alt="" aria-hidden="true" />
    </span>
  );
}

// The person's own avatar — a plain human mark, mirrored from the mentor's
// robot avatar on the opposite lane.
function UserAvatar() {
  return (
    <span className="chat-avatar chat-avatar--user mt-0.5">
      <UserRound className="h-4 w-4" strokeWidth={2.25} />
    </span>
  );
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
  const [justResponded, setJustResponded] = useState(false);
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
      }, 900);
    }, 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, typing]);

  // A brief "responding" beat right as a new mentor line lands — the
  // companion visibly delivers the line instead of just sitting in
  // "listening" the whole time a message happens to be on screen.
  useEffect(() => {
    const last = turns[turns.length - 1];
    if (!last || last.from !== "mentor") return;
    setJustResponded(true);
    const id = setTimeout(() => setJustResponded(false), 900);
    return () => clearTimeout(id);
  }, [turns]);

  // New turns lift in, reinforces "this is happening now," not a static log.
  useEffect(() => {
    if (!scrollRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 1023px)").matches) return;
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
          "Perfect, that's everything I need. Scoring you against every product role now..."
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

  const presenceState = typing
    ? "thinking"
    : justResponded
      ? "responding"
      : currentQuestion
        ? "listening"
        : "idle";

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
                <div key={t.id} className="flex items-start justify-end gap-2">
                  <div className="flex flex-col items-end">
                    <div className="chat-bubble-mentor font-display text-lg">
                      {t.text}
                    </div>
                    <p className="chat-timestamp pr-1">{formatTime(t.at)}</p>
                  </div>
                  <MentorAvatar />
                </div>
              ) : (
                <div key={t.id} className="flex items-start justify-start gap-2">
                  <UserAvatar />
                  <div>
                    <div className="chat-bubble-user">{t.text}</div>
                    <p className="chat-timestamp">{formatTime(t.at)}</p>
                  </div>
                </div>
              )
            )}
            {typing && (
              <div className="flex items-start justify-end gap-2" role="status" aria-label="Your mentor is typing">
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
                <MentorAvatar />
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

      {/* the mentor's identity — a living presence, not a static icon. The
          floating robot reacts in real time to what's actually happening
          in the conversation (thinking while composing, listening while
          it's your turn, responding as a line lands), so the panel reads
          as someone attentive rather than a decorative brand mark. */}
      <div className="relative flex flex-row items-center gap-4 overflow-hidden px-6 py-5 sm:w-[260px] sm:flex-col sm:justify-center sm:px-6 sm:py-10">
        <div className="relative z-10 flex shrink-0 flex-col items-center gap-2 sm:flex-col-reverse">
          <MentorPresence state={presenceState} size={140} />
          <div
            key={presenceState}
            className="mentor-bubble animate-fade-up rounded-2xl rounded-bl-sm border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink sm:rounded-bl-2xl sm:rounded-br-sm"
          >
            {MENTOR_CAPTIONS[presenceState]}
          </div>
        </div>
        <div className="relative z-10 min-w-0 sm:mt-1 sm:text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-soft">
            Your product mentor
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {stage.label}
          </p>
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
