"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { UserRound } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  agentLabel?: string;
  at: number;
};

const GREETING =
  "Hey, I'm your AI product assistant. Ask me anything about product management, AI PM, career moves, frameworks, or how you'd tackle a specific situation.";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Keeps the thread feeling like a real, ongoing conversation rather than a
// static log — a quiet timestamp under each bubble, not a running clock.
// Locale is pinned to en-US so the server-rendered greeting's markup can't
// drift from the client's first paint over a difference in environment
// locale (that mismatch, not the clock itself, was the hydration error).
function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// The mentor's own animation-bot character (same still MentorPresence
// uses), framed as a small avatar so every AI line is visibly the robot
// talking, not a generic label.
function MentorAvatar() {
  return (
    <span className="chat-avatar mt-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static
          avatar, not worth routing through next/image. */}
      <img src="/animations/animation-bot-poster.svg" alt="" aria-hidden="true" />
    </span>
  );
}

// A human mark for the person's own messages, mirrored on the opposite
// side from the mentor's robot avatar so it's immediately clear who's who.
function UserAvatar() {
  return (
    <span className="chat-avatar chat-avatar--user mt-0.5">
      <UserRound className="h-4 w-4" strokeWidth={2.25} />
    </span>
  );
}

// Fired whenever the assistant's own attention state changes, so the
// decorative side panel (a separate component, mounted alongside this one
// in /assistant's layout, not a parent) can show a living presence that
// tracks the real conversation instead of a static illustration. Same
// window-event pattern already used for "reset-landing" in app/page.tsx.
export function emitMentorPresence(
  state: "idle" | "listening" | "thinking" | "responding"
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("mentor-presence", { detail: { state } })
  );
}

export function AssistantChat() {
  // The greeting's timestamp can't be Date.now() here — this initializer
  // runs during both the server render and the client hydration pass, at
  // two different instants, so the rendered text would mismatch and trip
  // React's hydration check. Seed it at 0 (identical on both sides, so the
  // timestamp just doesn't render yet) and fill in the real time once
  // mounted, client-side only, below.
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING, at: 0 },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emitMentorPresence("listening");
    setMessages((m) =>
      m[0]?.at === 0 ? [{ ...m[0], at: Date.now() }, ...m.slice(1)] : m
    );
  }, []);

  // Lets the mentor side panel's "try asking" suggestions drop a question
  // straight into the composer instead of the user having to retype it.
  useEffect(() => {
    function onSuggest(e: Event) {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (!detail?.text) return;
      setInput(detail.text);
      inputRef.current?.focus();
    }
    window.addEventListener("mentor-suggest", onSuggest);
    return () => window.removeEventListener("mentor-suggest", onSuggest);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const last = scrollRef.current.lastElementChild;
    if (last) {
      gsap.fromTo(
        last,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    const next: Message[] = [
      ...messages,
      { role: "user", content: text, at: Date.now() },
    ];
    setMessages(next);
    setInput("");
    setSending(true);
    emitMentorPresence("thinking");

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          agentLabel: data.agent?.label,
          at: Date.now(),
        },
      ]);
      emitMentorPresence("responding");
      setTimeout(() => emitMentorPresence("listening"), 900);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      emitMentorPresence("listening");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-8 sm:px-12 sm:py-12"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex items-start gap-3">
              <MentorAvatar />
              <div className="min-w-0">
                {m.agentLabel && <p className="tag mb-1 text-accent-500">{m.agentLabel}</p>}
                <div className="chat-bubble-mentor whitespace-pre-wrap font-display text-base">
                  {m.content}
                </div>
                {m.at > 0 && <p className="chat-timestamp">{formatTime(m.at)}</p>}
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start justify-end gap-3">
              <div className="flex flex-col items-end">
                <div className="chat-bubble-user whitespace-pre-wrap">{m.content}</div>
                {m.at > 0 && <p className="chat-timestamp pr-1">{formatTime(m.at)}</p>}
              </div>
              <UserAvatar />
            </div>
          )
        )}
        {sending && (
          <div className="flex items-start gap-3" role="status" aria-label="Assistant is typing">
            <MentorAvatar />
            <div className="chat-bubble-mentor flex items-center gap-1 py-4">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" style={{ animationDelay: "0.15s" }} />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink/40" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line px-5 py-4 sm:px-8">
        {error && (
          <p role="alert" className="mb-2 text-xs text-red-600">
            {error}
          </p>
        )}
        <form onSubmit={send} className="flex items-center gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Ask a question
          </label>
          <input
            id="assistant-input"
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about PM roles, frameworks, career moves…"
            className="field-input flex-1"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-gold min-h-[44px] px-4 py-2.5"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
