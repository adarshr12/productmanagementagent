"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";

export default function SaveBar({
  shareToken,
  totalSteps,
}: {
  shareToken: string;
  totalSteps?: number;
}) {
  const [state, setState] = useState<"checking" | "saved" | "anon">("checking");

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setState("anon");
        return;
      }
      try {
        await fetch("/api/roadmap/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ shareToken }),
        });
      } catch {
        /* ignore — page still works via the link */
      }
      setState("saved");
    })();
  }, [shareToken]);

  if (state === "checking") return null;

  if (state === "saved") {
    return (
      <div className="mb-6 flex items-center justify-between border-b border-line/60 pb-3 font-mono text-xs text-slate">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-ink">Synced to your profile</span>
          <span className="text-slate-soft hidden sm:inline">• All milestones accessible</span>
        </div>
        <Link
          href="/me"
          className="font-sans font-medium text-accent-500 hover:text-accent-600 hover:underline"
        >
          My roadmaps →
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between border-b border-line/60 pb-3 text-xs">
      <div className="flex items-center gap-2 font-mono">
        <span className="flex h-2 w-2 rounded-full bg-amber-400" />
        <span className="font-semibold text-ink">Preview Mode</span>
        {totalSteps ? (
          <span className="text-slate-soft hidden sm:inline">
            • 1 of {totalSteps} milestones active
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-slate hidden sm:inline">Unsaved draft</span>
        <Link
          href={`/signup?next=/r/${shareToken}`}
          className="font-semibold text-ink hover:text-accent-500 transition underline underline-offset-4"
        >
          Save to account →
        </Link>
      </div>
    </div>
  );
}
