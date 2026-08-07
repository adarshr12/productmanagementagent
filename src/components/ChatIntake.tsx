"use client";

import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/questions";

type ChatMsg = { id: string; from: "mentor" | "user"; text: string };

const GREETING =
  "Hey — welcome. I'm going to ask a handful of quick questions so I can score you against every product role and tell you exactly why — not just guess. Answer with a tap, or just type — whatever's faster.";

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
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [typing, setTyping] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  function pushMentor(text: string) {
    setMessages((m) => [...m, { id: uid(), from: "mentor", text }]);
  }
  function pushUser(text: string) {
    setMessages((m) => [...m, { id: uid(), from: "user", text }]);
  }

  useEffect(() => {
    // Guard (not the effect's cleanup) is what prevents this from running
    // twice under React 18 Strict Mode's dev double-invoke — a cleanup that
    // clears this timer would race with the guard and cancel the only
    // scheduled run, leaving the chat stuck on the typing indicator forever.
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
      }, 1000);
    }, 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  function advance(rawValue: string) {
    const q = questions[step];
    const value = rawValue.trim();
    if (!value && q.required) {
      setError("Go ahead and answer this one — even a short answer helps.");
      return;
    }
    setError(null);
    pushUser(value || "(skipped)");
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
        setTimeout(() => onComplete(nextAnswers), 850);
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
      600 + Math.random() * 350
    );
  }

  const currentQuestion =
    step >= 0 && step < questions.length ? questions[step] : null;

  return (
    <div className="chat-shell flex h-[600px] flex-col overflow-hidden sm:h-[640px]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="chat-avatar">🎯</div>
          <div>
            <p className="text-sm font-semibold text-white">Your product mentor</p>
            <p className="text-xs text-white/45">Usually replies instantly</p>
          </div>
        </div>
        {step >= 0 && (
          <div className="flex gap-1" aria-hidden="true">
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

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.map((m) =>
          m.from === "mentor" ? (
            <div key={m.id} className="flex items-start gap-2.5">
              <div className="chat-avatar mt-0.5 h-7 w-7 text-sm">🎯</div>
              <div className="chat-bubble-mentor">{m.text}</div>
            </div>
          ) : (
            <div key={m.id} className="flex">
              <div className="chat-bubble-user">{m.text}</div>
            </div>
          )
        )}
        {typing && (
          <div className="flex items-start gap-2.5">
            <div className="chat-avatar mt-0.5 h-7 w-7 text-sm">🎯</div>
            <div className="chat-bubble-mentor flex items-center gap-1 py-4">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-white/60" />
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-white/60"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-white/60"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {currentQuestion && !typing && (
        <div className="border-t border-white/10 px-5 py-4">
          {error && <p className="mb-2 text-xs text-accent-200">{error}</p>}
          {currentQuestion.type === "select" && currentQuestion.options && (
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
    </div>
  );
}
