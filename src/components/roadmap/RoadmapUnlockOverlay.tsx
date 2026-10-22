"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

interface RoadmapUnlockOverlayProps {
  shareToken: string;
  role?: string;
  totalSteps: number;
}

export function RoadmapUnlockOverlay({
  shareToken,
  role,
  totalSteps,
}: RoadmapUnlockOverlayProps) {
  const roleName = role || "Product Management";
  const remainingSteps = Math.max(1, totalSteps - 1);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-paper/40 via-paper/90 to-paper">
      {/* Double-Bezel Architectural Container */}
      <div className="w-full max-w-xl rounded-3xl border border-line/80 bg-surface-raised/90 p-1.5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.16)] backdrop-blur-md">
        <div className="rounded-[calc(1.5rem-2px)] border border-line/60 bg-white p-7 sm:p-9 text-left">
          
          {/* Eyebrow Status */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/70">
              Workspace Activation
            </span>
            <span className="font-mono text-[11px] text-slate-soft">
              {remainingSteps} milestones queued
            </span>
          </div>

          {/* Heading & Subheading */}
          <h3 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-ink leading-snug">
            Save this roadmap to your profile to continue.
          </h3>
          <p className="mt-2.5 text-sm text-slate leading-relaxed">
            Your customized path to <span className="font-medium text-ink">{roleName}</span> is mapped into {totalSteps} actionable milestones with recommended artifacts and timelines. Connect a free account to unlock the full track and save progress.
          </p>

          {/* Specs / Deliverables Bar */}
          <div className="my-6 grid grid-cols-3 gap-2.5 border-y border-line/70 py-4 font-mono text-[11px]">
            <div>
              <p className="text-slate-soft">Total Scope</p>
              <p className="font-semibold text-ink mt-0.5">{totalSteps} Milestones</p>
            </div>
            <div>
              <p className="text-slate-soft">Workspace</p>
              <p className="font-semibold text-ink mt-0.5">Kanban + Notes</p>
            </div>
            <div>
              <p className="text-slate-soft">Access</p>
              <p className="font-semibold text-ink mt-0.5">100% Free</p>
            </div>
          </div>

          {/* Button-in-Button CTA Architecture */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
            <Link
              href={`/signup?next=/r/${shareToken}`}
              className="group inline-flex items-center justify-between gap-4 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90 active:scale-[0.99]"
            >
              <span>Create account to continue</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </span>
            </Link>

            <Link
              href={`/login?next=/r/${shareToken}`}
              className="text-xs font-semibold text-slate hover:text-ink transition underline-offset-4 hover:underline"
            >
              Sign in to existing account →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
