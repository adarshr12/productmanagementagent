"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, User, MapPin } from "lucide-react";
import { createBrowserClient } from "@/lib/supabaseClient";

export function SiteNav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="border-b border-line bg-paper/90 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a
          href="/"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.location.pathname === "/") {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("reset-landing"));
            }
          }}
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 border border-accent-500/20">
            <Compass className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <span>ProductPath</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/assistant"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate transition hover:bg-accent-50 hover:text-ink"
          >
            Ask AI
          </Link>

          {userEmail ? (
            <Link
              href="/me"
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-ink shadow-sm transition hover:border-accent-500/40 hover:bg-accent-50/50"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-bold">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">My Roadmaps</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login?next=/me"
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate transition hover:bg-accent-50 hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup?next=/me"
                className="btn-primary text-xs sm:text-sm px-3.5 py-1.5 sm:py-2"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
