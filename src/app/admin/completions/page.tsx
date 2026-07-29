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
    return <main className="p-10 text-sm text-slate-500">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Completion rates</h1>
        <Link href="/admin" className="text-sm font-medium text-brand-600">
          ← Back to knowledge base
        </Link>
      </div>

      {/* headline metric — this is the core success metric */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat label="Roadmaps" value={String(rows.length)} />
        <Stat
          label="Steps completed"
          value={`${overall.completed} / ${overall.total}`}
        />
        <Stat label="Overall completion" value={`${overall.pct}%`} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No roadmaps generated yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Roadmap</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium">Progress</th>
                <th className="px-4 py-2 font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.roadmap_id}>
                  <td className="px-4 py-2 font-medium">
                    {r.title || "(untitled)"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {r.completed_steps} / {r.total_steps}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {r.completion_pct ?? 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function summarize(rows: CompletionRow[]) {
  const total = rows.reduce((sum, r) => sum + (r.total_steps || 0), 0);
  const completed = rows.reduce((sum, r) => sum + (r.completed_steps || 0), 0);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pct };
}
