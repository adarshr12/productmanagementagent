"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";
import { ROLE_CATALOG } from "@/lib/roles";
import { SiteNav } from "@/components/SiteNav";

type Row = {
  shareToken: string;
  title: string | null;
  role: string | null;
  created_at: string;
  total: number;
  done: number;
  pct: number;
};

export default function MyRoadmapsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?next=/me");
        return;
      }
      setEmail(session.user.email ?? null);
      const res = await fetch("/api/my/roadmaps", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setRows(data.roadmaps ?? []);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="min-h-screen">
        <SiteNav />
        <p className="mx-auto max-w-6xl px-5 py-10 text-sm text-slate sm:px-8">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="tag text-accent-500">your account</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-ink">
              My roadmaps
            </h1>
            {email && <p className="mt-1 text-sm text-slate">{email}</p>}
          </div>
          <button onClick={signOut} className="btn-ghost">
            Sign out
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="card text-center">
            <p className="text-slate">
              You haven&apos;t saved any roadmaps yet.
            </p>
            <Link href="/" className="btn-primary mt-4 inline-flex">
              Find my best-fit role →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => {
              const emoji =
                ROLE_CATALOG.find((x) => x.label === r.role)?.emoji ?? "🗺️";
              return (
                <Link
                  key={r.shareToken}
                  href={`/r/${r.shareToken}`}
                  className="card flex items-center gap-4 transition duration-200 hover:-translate-y-1 hover:border-accent-500/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-xl">
                    {emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display font-semibold text-ink">
                      {r.title || "Career roadmap"}
                    </h3>
                    {r.role && (
                      <p className="tag mt-0.5">{r.role}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-accent-500">
                      {r.pct}%
                    </div>
                    <div className="text-[11px] text-slate-soft">
                      {r.done}/{r.total} done
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
