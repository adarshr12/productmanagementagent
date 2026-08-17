"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";

type CompletionRow = {
  roadmap_id: string;
  title: string | null;
  created_at: string;
  total_steps: number;
  completed_steps: number;
  completion_pct: number | null;
};

export default function CompletionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CompletionRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      const res = await fetch("/api/admin/completions", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setRows(data.rows ?? []);
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overall = summarize(rows);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="tag">loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            <span className="text-accent-500">◆</span> Admin
          </span>
          <Link
            href="/admin"
            className="text-sm font-medium text-slate transition hover:text-ink"
          >
            ← Back
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="tag mb-2 text-accent-500">success metric</p>
        <h1 className="font-display mb-8 text-2xl font-semibold text-ink">
          Completion rates
        </h1>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <Stat label="Roadmaps" value={String(rows.length)} />
          <Stat
            label="Steps completed"
            value={`${overall.completed} / ${overall.total}`}
          />
          <Stat label="Overall completion" value={`${overall.pct}%`} />
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-slate-soft">No roadmaps generated yet.</p>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-slate-soft">
                  <th className="px-5 py-3 font-medium">Roadmap</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.roadmap_id}>
                    <td className="px-5 py-3 font-medium text-ink">
                      {r.title || "(untitled)"}
                    </td>
                    <td className="px-5 py-3 text-slate">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-slate">
                      {r.completed_steps} / {r.total_steps}
                    </td>
                    <td className="px-5 py-3 font-semibold text-accent-500">
                      {r.completion_pct ?? 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="tag">{label}</div>
      <div className="font-display mt-1 text-2xl font-semibold text-ink">
        {value}
      </div>
    </div>
  );
}

function summarize(rows: CompletionRow[]) {
  const total = rows.reduce((sum, r) => sum + (r.total_steps || 0), 0);
  const completed = rows.reduce((sum, r) => sum + (r.completed_steps || 0), 0);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct };
}
