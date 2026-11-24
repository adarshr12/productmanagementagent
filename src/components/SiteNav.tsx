"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Shield } from "lucide-react";
import { createBrowserClient } from "@/lib/supabaseClient";
import { apiUrl } from "@/lib/api";

export function SiteNav() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function checkUser(session: any) {
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
      if (session?.access_token) {
        try {
          const res = await fetch(apiUrl("/api/admin/whoami"), {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          setIsAdmin(res.ok);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="border-b border-line bg-paper/90 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link
          href={isAdmin ? "/admin" : userId ? `/user/${userId}` : "/"}
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("reset-landing"));
            }
          }}
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 border border-accent-500/20">
            <Compass className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <span>ProductPath</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/assistant"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate transition hover:bg-accent-50 hover:text-ink"
          >
            Ask AI
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-600 transition hover:bg-accent-100"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}

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
                href="/login"
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate transition hover:bg-accent-50 hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
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
