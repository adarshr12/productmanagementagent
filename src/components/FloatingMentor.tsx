"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AssistantChat } from "@/components/AssistantChat";
import { RobotAvatar } from "@/components/RobotAvatar";

export function FloatingMentor() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const pathname = usePathname();

  // If already on the dedicated /assistant page, don't overlay the floating chat
  const isAssistantPage = pathname === "/assistant";

  // Hide the teaser tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (isAssistantPage) return null;

  return (
    <>
      {/* Floating Chat Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat with AI Product Mentor"
          className="fixed inset-x-3 bottom-3 top-20 z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl sm:inset-auto sm:bottom-22 sm:right-6 sm:h-[620px] sm:w-[420px] sm:rounded-3xl animate-in fade-in zoom-in-95 duration-200"
        >
          <AssistantChat isModal={true} onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Floating Action Button (FAB) at bottom-right */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        {/* Subtle proactive bubble when closed */}
        {!open && showTooltip && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="animate-fade-up rounded-2xl rounded-br-xs border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-lg hover:bg-slate-50 transition active:scale-95 text-left max-w-[210px]"
          >
            <span>Ask your AI Product Mentor anything ✨</span>
          </button>
        )}

        {/* Floating robot launcher button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close chat with Product Mentor" : "Open chat with Product Mentor"}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white border border-slate-200 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 overflow-visible"
        >
          {open ? (
            <span className="text-xl font-bold text-slate-700 leading-none">✕</span>
          ) : (
            <RobotAvatar size="xl" />
          )}
        </button>
      </div>
    </>
  );
}
