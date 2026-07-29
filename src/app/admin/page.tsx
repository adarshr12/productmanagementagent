"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabaseClient";

type DocRow = {
  id: string;
  title: string;
  file_name: string;
  status: string;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
};

const ACCEPTED: Record<string, "pdf" | "docx" | "txt"> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
};

export default function AdminUploadPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from("documents")
      .select("id, title, file_name, status, chunk_count, error_message, created_at")
      .order("created_at", { ascending: false });
    setDocs((data ?? []) as DocRow[]);
  }, []);

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
      setReady(true);
      await loadDocs();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError("Please choose a file.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const sourceType = ACCEPTED[ext];
    if (!sourceType) {
      setError("Only PDF, DOCX, or TXT files are supported.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createBrowserClient();
      const base64 = await fileToBase64(file);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim() || file.name,
          file_name: file.name,
          source_type: sourceType,
          content_base64: base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed.");

      setMessage(`Indexed "${title || file.name}" — ${data.chunk_count} chunks.`);
      setTitle("");
      setFile(null);
      (document.getElementById("file") as HTMLInputElement).value = "";
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (!ready) {
    return <main className="p-10 text-sm text-slate-500">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge base</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/completions" className="font-medium text-brand-600">
            Completion rates →
          </Link>
          <button onClick={signOut} className="text-slate-500 hover:text-slate-800">
            Sign out
          </button>
        </div>
      </div>

      <form onSubmit={handleUpload} className="card mb-8 space-y-4">
        <h2 className="font-semibold">Upload a resource</h2>
        <div>
          <label className="field-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            className="field-input"
            placeholder="e.g. Breaking into Product Management — Guide"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="file">
            File (PDF, DOCX, or TXT)
          </label>
          <input
            id="file"
            type="file"
            accept=".pdf,.docx,.txt"
            className="field-input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Processing…" : "Upload & index"}
        </button>
      </form>

      <h2 className="mb-3 font-semibold">Uploaded documents</h2>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Chunks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-slate-400">{d.file_name}</div>
                    {d.error_message && (
                      <div className="text-xs text-red-500">{d.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-2">{d.chunk_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    indexed: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-700",
    pending: "bg-slate-100 text-slate-600",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
