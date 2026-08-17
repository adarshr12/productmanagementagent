"use client";

import { useCallback, useEffect, useState } from "react";
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

type Mode = "upload" | "paste" | "bulk";

type BulkItem = { title: string; content: string; slug?: string };

type BulkProgress = {
  total: number;
  done: number;
  skipped: number;
  errors: string[];
};

export function KnowledgeBasePanel() {
  const [mode, setMode] = useState<Mode>("upload");
  const [docs, setDocs] = useState<DocRow[]>([]);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);

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
    loadDocs();
  }, [loadDocs]);

  async function ingest(payload: {
    title: string;
    file_name: string;
    source_type: "pdf" | "docx" | "txt";
    content_base64: string;
  }) {
    const supabase = createBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch("/api/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Ingestion failed.");
    return data as { document_id: string; chunk_count: number };
  }

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
      const base64 = await fileToBase64(file);
      const data = await ingest({
        title: title.trim() || file.name,
        file_name: file.name,
        source_type: sourceType,
        content_base64: base64,
      });
      setMessage(`Indexed "${title || file.name}", ${data.chunk_count} chunks.`);
      setTitle("");
      setFile(null);
      const input = document.getElementById("file") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const text = pasteText.trim();
    if (!title.trim()) {
      setError("Give this a title.");
      return;
    }
    if (!text) {
      setError("Paste some text first.");
      return;
    }

    setBusy(true);
    try {
      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) || "note";
      const base64 = textToBase64(text);
      const data = await ingest({
        title: title.trim(),
        file_name: `${slug}.txt`,
        source_type: "txt",
        content_base64: base64,
      });
      setMessage(`Indexed "${title.trim()}", ${data.chunk_count} chunks.`);
      setTitle("");
      setPasteText("");
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || "Ingestion failed.");
    } finally {
      setBusy(false);
    }
  }

  function parseBulkFile(raw: string): BulkItem[] {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Expected a JSON array of {title, content_md} objects.");
    }
    return parsed.map((item, i) => {
      const t = String(item?.title || "").trim();
      const c = String(item?.content_md ?? item?.text ?? item?.content ?? "").trim();
      const slug = String(item?.slug || "").trim();
      if (!t || !c) {
        throw new Error(`Item ${i + 1} is missing a title or content.`);
      }
      return { title: t, content: c, slug };
    });
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!bulkFile) {
      setError("Choose a JSON file first.");
      return;
    }

    setBusy(true);
    try {
      const raw = await bulkFile.text();
      const items = parseBulkFile(raw);
      const alreadyIndexed = new Set(
        docs.filter((d) => d.status === "indexed").map((d) => d.title)
      );
      const todo = items.filter((item) => !alreadyIndexed.has(item.title));
      const progress: BulkProgress = {
        total: items.length,
        done: 0,
        skipped: items.length - todo.length,
        errors: [],
      };
      setBulkProgress({ ...progress });

      for (const item of todo) {
        const slug =
          (item.slug || item.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) ||
          "note";
        try {
          await ingest({
            title: item.title,
            file_name: `${slug}.txt`,
            source_type: "txt",
            content_base64: textToBase64(item.content),
          });
        } catch (err: any) {
          progress.errors.push(`${item.title}: ${err?.message || "failed"}`);
        }
        progress.done += 1;
        setBulkProgress({ ...progress });
      }

      setMessage(
        `Bulk import finished: ${progress.done - progress.errors.length} indexed, ` +
          `${progress.skipped} already indexed, ${progress.errors.length} failed.`
      );
      setBulkFile(null);
      const input = document.getElementById("bulk-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || "Bulk import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="card">
        <div className="mb-4 flex gap-2">
          <TabButton active={mode === "upload"} onClick={() => setMode("upload")}>
            Upload a file
          </TabButton>
          <TabButton active={mode === "paste"} onClick={() => setMode("paste")}>
            Paste text
          </TabButton>
          <TabButton active={mode === "bulk"} onClick={() => setMode("bulk")}>
            Bulk import (JSON)
          </TabButton>
        </div>

        {mode === "upload" ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                className="field-input"
                placeholder="e.g. Breaking into Product Management, Guide"
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
            <Feedback error={error} message={message} />
            <button type="submit" className="btn-gold px-5 py-2.5 text-sm" disabled={busy}>
              {busy ? "Processing…" : "Upload & index"}
            </button>
          </form>
        ) : mode === "paste" ? (
          <form onSubmit={handlePaste} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="paste-title">
                Title
              </label>
              <input
                id="paste-title"
                type="text"
                className="field-input"
                placeholder="e.g. Notes from mentor call, RACI framework"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="paste-text">
                Text
              </label>
              <textarea
                id="paste-text"
                rows={8}
                className="field-input w-full resize-y"
                placeholder="Paste any text you want the mentor to draw on…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
            </div>
            <Feedback error={error} message={message} />
            <button type="submit" className="btn-gold px-5 py-2.5 text-sm" disabled={busy}>
              {busy ? "Processing…" : "Save & index"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulk} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="bulk-file">
                JSON file — an array of objects, each with a title and content_md (or text)
                field
              </label>
              <input
                id="bulk-file"
                type="file"
                accept=".json"
                className="field-input"
                onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-slate-soft">
                Each item becomes its own indexed document. Titles that are already indexed
                are skipped, so it's safe to re-run this on the same file if it gets
                interrupted. Keep this tab open until it finishes — items run one at a time
                and can take a while under Voyage's rate limits.
              </p>
            </div>
            {bulkProgress && (
              <div className="rounded-lg border border-line bg-paper p-3 text-sm">
                <div className="mb-1.5 flex justify-between text-slate">
                  <span>
                    {bulkProgress.done} / {bulkProgress.total} processed
                  </span>
                  <span>{bulkProgress.skipped} already indexed</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-accent-500"
                    style={{
                      width: `${
                        bulkProgress.total
                          ? Math.round((bulkProgress.done / bulkProgress.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                {bulkProgress.errors.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-red-700">
                    {bulkProgress.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <Feedback error={error} message={message} />
            <button type="submit" className="btn-gold px-5 py-2.5 text-sm" disabled={busy}>
              {busy ? "Processing…" : "Import & index all"}
            </button>
          </form>
        )}
      </div>

      <h2 className="font-display mb-3 mt-8 text-lg font-semibold text-ink">
        Uploaded documents
      </h2>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-soft">Nothing indexed yet.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-slate-soft">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Chunks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-ink">{d.title}</div>
                    <div className="tag mt-0.5">{d.file_name}</div>
                    {d.error_message && (
                      <div className="mt-1 text-xs text-red-700">{d.error_message}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-slate">{d.chunk_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "chip chip-selected" : "chip"}
    >
      {children}
    </button>
  );
}

function Feedback({ error, message }: { error: string | null; message: string | null }) {
  if (error) {
    return (
      <p className="alert-error">{error}</p>
    );
  }
  if (message) {
    return <p className="alert-success">{message}</p>;
  }
  return null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    indexed: "bg-emerald-500/10 text-emerald-700",
    processing: "bg-amber-500/10 text-amber-700",
    pending: "bg-line text-slate",
    error: "bg-red-500/10 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] || "bg-line text-slate"
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

function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
