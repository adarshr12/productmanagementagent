"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Mic, Send, Eye, Compass, Navigation } from "lucide-react";
import { RobotAvatar } from "@/components/RobotAvatar";

type Message = {
  role: "user" | "assistant";
  content: string;
  agentLabel?: string;
  at: number;
  showCards?: boolean;
  chips?: string[];
};

const GREETING =
  "Hey, I am your mentor. Ask me anything about product management roles, transitioning from your background, frameworks, or how to tackle real PM situations.";

const DEFAULT_CHIPS = [
  "Which PM role fits my tech background?",
  "Difference between AI PM & Technical PM?",
  "How do I break into PM without direct experience?",
  "Show me roadmap for Product Analyst",
];

const RECOMMENDED_ROLES = [
  {
    initials: "APM",
    match: "95% match",
    title: "Associate Product Manager",
    detail: "Best starter role for engineers & analysts",
    selected: true,
  },
  {
    initials: "AI",
    match: "91% match",
    title: "AI Product Manager",
    detail: "High demand · ML products & generative apps",
    selected: false,
  },
  {
    initials: "GPM",
    match: "87% match",
    title: "Growth Product Manager",
    detail: "Data-driven experimentation & acquisition",
    selected: false,
  },
];

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function emitMentorPresence(
  state: "idle" | "listening" | "thinking" | "responding"
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("mentor-presence", { detail: { state } })
  );
}

export function AssistantChat({
  onClose,
  isModal = false,
}: {
  onClose?: () => void;
  isModal?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: GREETING,
      at: 0,
      showCards: true,
      chips: DEFAULT_CHIPS,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("Associate Product Manager");
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emitMentorPresence("listening");
    setMessages((m) =>
      m[0]?.at === 0 ? [{ ...m[0], at: Date.now() }, ...m.slice(1)] : m
    );
  }, []);

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
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [messages]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;

    setError(null);
    const userMsg: Message = { role: "user", content: text, at: Date.now() };
    const next: Message[] = [...messages, userMsg];
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

      // Contextual follow-up suggestion chips
      const followUps = [
        "What key skills should I learn first?",
        "How do I prepare for PM interviews?",
        "Show me real roadmap steps",
      ];

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply,
          agentLabel: data.agent?.label,
          at: Date.now(),
          chips: followUps,
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

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend();
  }

  function handleRoleClick(roleTitle: string) {
    setSelectedRole(roleTitle);
    handleSend(`Can you tell me about the ${roleTitle} role and how I should prepare for it?`);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#f8fafc]">
      {/* Top Header matching reference screenshot */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5 shadow-xs shrink-0">
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
              Finds roles and shows you how to transition
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <span className="text-lg leading-none font-bold">✕</span>
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="flex items-start justify-start gap-2.5">
              <RobotAvatar size="sm" />
              <div className="flex flex-col items-start max-w-[90%]">
                {m.agentLabel && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#0a3258]">
                    {m.agentLabel}
                  </p>
                )}
                {/* AI Message Bubble */}
                <div className="chat-bubble-mentor">
                  {m.content}
                </div>

                {/* Structured Cards (Reference design style: PE, SP, PZ cards) */}
                {m.showCards && (
                  <div className="mt-3 w-full space-y-2">
                    {RECOMMENDED_ROLES.map((item) => {
                      const isSelected = selectedRole === item.title;
                      return (
                        <div
                          key={item.title}
                          className={`flex items-center justify-between rounded-xl border bg-white p-3 shadow-xs transition-all ${
                            isSelected
                              ? "border-teal-400 ring-2 ring-teal-400/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#feebe3] to-[#feded2] border border-[#fcd7c8] text-xs font-bold text-[#b45309] tracking-wider">
                              {item.initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0f766e]">
                                {item.match}
                              </p>
                              <p className="text-xs font-medium text-slate-700">
                                {item.title}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRoleClick(item.title)}
                            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
                              isSelected
                                ? "bg-[#0a3258] text-white shadow-xs hover:bg-[#072440]"
                                : "border border-[#0a3258] text-[#0a3258] hover:bg-[#0a3258]/5"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Compass className="h-3.5 w-3.5" />
                                <span>Showing</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                <span>Show me</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}

                    {/* Social proof / Footnote */}
                    <p className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-[#64748b]">
                      <Navigation className="h-3 w-3 rotate-45 text-[#64748b]" />
                      <span>Candidates with similar backgrounds reviewed these roles</span>
                    </p>
                  </div>
                )}

                {/* Suggestion Chips */}
                {m.chips && m.chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.chips.map((chipText) => (
                      <button
                        key={chipText}
                        type="button"
                        onClick={() => handleSend(chipText)}
                        className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:border-slate-400 hover:bg-slate-50 transition active:scale-[0.98]"
                      >
                        {chipText}
                      </button>
                    ))}
                  </div>
                )}

                {m.at > 0 && <p className="chat-timestamp pl-1">{formatTime(m.at)}</p>}
              </div>
            </div>
          ) : (
            /* User Message on the RIGHT */
            <div key={i} className="flex w-full justify-end">
              <div className="flex max-w-[85%] sm:max-w-[75%] flex-col items-end">
                <div className="chat-bubble-user">{m.content}</div>
                {m.at > 0 && (
                  <p className="chat-timestamp pr-1 text-right">{formatTime(m.at)}</p>
                )}
              </div>
            </div>
          )
        )}

        {sending && (
          <div className="flex items-start justify-start gap-2.5" role="status" aria-label="Product Mentor is typing">
            <RobotAvatar size="sm" />
            <div className="chat-bubble-mentor flex items-center gap-1.5 py-3.5 px-4">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Bottom Composer matching reference screenshot */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6 shrink-0">
        {error && (
          <p role="alert" className="mb-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <label htmlFor="assistant-input" className="sr-only">
              Ask about any role or career transition
            </label>
            <input
              id="assistant-input"
              ref={inputRef}
              autoFocus={!isModal}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any role, skills, roadmap…"
              className="w-full rounded-full border border-slate-300 bg-white pl-4 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:border-[#0a3258] focus:outline-none focus:ring-1 focus:ring-[#0a3258]/20 transition"
            />
            <button
              type="button"
              aria-label="Voice input"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#0a3258] text-white shadow-sm hover:bg-[#072440] transition active:scale-95 disabled:opacity-40 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 -translate-y-px translate-x-px" />
          </button>
        </form>
      </div>
    </div>
  );
}
