"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient";

export default function UserRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(`/user/${session.user.id}`);
      } else {
        router.replace("/login?next=/user");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate">Loading your workspace…</p>
      </div>
    </div>
  );
}
