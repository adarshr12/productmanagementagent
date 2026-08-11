"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabaseClient";

type Agent = {
  agent_key: string;
  label: string;
  description: string | null;
  system_prompt: string;
  use_knowledge_base: boolean;
  updated_at: string;
};

export function AgentPromptsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      try {
        const res = await fetch("/api/admin/agents", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load agents.");
        setAgents(data.agents ?? []);
      } catch (err: any) {
        setError(err?.message || "Failed to load agents.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-cream/50">Loading agents…</p>;
  }
  if (error) {
    return (
      <p className="alert-error">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {agents.map((agent) => (
        <AgentCard
          key={agent.agent_key}
          agent={agent}
          onSaved={(updated) =>
            setAgents((all) =>
              all.map((a) => (a.agent_key === updated.agent_key ? updated : a))
            )
          }
        />
      ))}
    </div>
  );
}

function AgentCard({
  agent,
  onSaved,
}: {
  agent: Agent;
  onSaved: (agent: Agent) => void;
}) {
  const [prompt, setPrompt] = useState(agent.system_prompt);
  const [useKb, setUseKb] = useState(agent.use_knowledge_base);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = prompt !== agent.system_prompt || useKb !== agent.use_knowledge_base;

  async function save() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          agent_key: agent.agent_key,
          system_prompt: prompt,
          use_knowledge_base: useKb,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed.");
      onSaved(data.agent);
      setMessage("Saved.");
    } catch (err: any) {
      setError(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tag text-accent-500">{agent.agent_key}</p>
          <h3 className="font-display mt-1 text-lg font-semibold text-cream">
            {agent.label}
          </h3>
          {agent.description && (
            <p className="mt-1 max-w-lg text-sm text-cream/55">
              {agent.description}
            </p>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-xs font-medium text-cream/70">
            Use knowledge base
          </span>
          <span
            onClick={() => setUseKb((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              useKb ? "bg-accent-500" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition ${
                useKb ? "left-4" : "left-0.5"
              }`}
            />
          </span>
        </label>
      </div>

      {!useKb && (
        <p className="tag mt-3 text-amber-300">
          off, this agent answers from general knowledge only, ignoring uploaded documents
        </p>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={10}
        spellCheck={false}
        className="field-input mt-4 w-full resize-y font-mono text-xs leading-relaxed"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="btn-gold px-4 py-2 text-sm"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {dirty && !busy && <span className="tag">unsaved changes</span>}
        {message && !dirty && (
          <span className="tag text-emerald-400">{message}</span>
        )}
        {error && (
          <span className="text-xs text-red-300">{error}</span>
        )}
      </div>
    </div>
  );
}
