"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";

// Shown on the roadmap page. If the visitor is logged in, it claims the roadmap
// to their account. If not, it invites them to sign up to save & track progress.
export default function SaveBar({ shareToken }: { shareToken: string }) {
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
      // logged in → claim this roadmap (idempotent)
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
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
        <span className="text-sm font-medium text-green-800">
          ✓ Saved to your account
        </span>
        <Link href="/me" className="text-sm font-semibold text-green-800 underline">
          My roadmaps
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-ink">Save your roadmap</p>
        <p className="text-sm text-muted">
          Sign up to keep this and track your progress across visits.
        </p>
      </div>
      <Link
        href={`/login?next=/r/${shareToken}`}
        className="btn-primary shrink-0"
      >
        Sign up / Log in
      </Link>
    </div>
  );
}
