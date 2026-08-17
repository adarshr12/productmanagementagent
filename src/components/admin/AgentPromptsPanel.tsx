"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabaseClient";

type Agent = {
  agent_key: string;
  label: string;
  description: string | null;
  system_prompt: string;
  use_knowledge_base: boolean;
  agent_type: "flow" | "conversational" | "orchestrator";
  routing_hint: string | null;
  is_active: boolean;
  updated_at: string;
};

const AGENT_TYPE_LABEL: Record<Agent["agent_type"], string> = {
  flow: "triggered by a specific action, not routed",
  conversational: "chat — routed by the orchestrator",
  orchestrator: "routes messages to conversational agents",
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
    return <p className="text-sm text-slate">Loading agents…</p>;
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
  const [routingHint, setRoutingHint] = useState(agent.routing_hint || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTest, setShowTest] = useState(false);

  const dirty =
    prompt !== agent.system_prompt ||
    useKb !== agent.use_knowledge_base ||
    routingHint !== (agent.routing_hint || "");

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
          ...(agent.agent_type === "conversational" ? { routing_hint: routingHint } : {}),
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="tag text-accent-500">{agent.agent_key}</p>
            <span className="tag border border-line px-2 py-0.5">
              {AGENT_TYPE_LABEL[agent.agent_type]}
            </span>
          </div>
          <h3 className="font-display mt-1 text-lg font-semibold text-ink">
            {agent.label}
          </h3>
          {agent.description && (
            <p className="mt-1 max-w-lg text-sm text-slate">
              {agent.description}
            </p>
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2">
          <span className="text-xs font-medium text-slate">
            Use knowledge base
          </span>
          <span
            onClick={() => setUseKb((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              useKb ? "bg-accent-500" : "bg-line"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                useKb ? "left-4" : "left-0.5"
              }`}
            />
          </span>
        </label>
      </div>

      {!useKb && (
        <p className="tag mt-3 text-amber-700">
          off, this agent answers from general knowledge only, ignoring uploaded documents
        </p>
      )}

      {agent.agent_type === "conversational" && (
        <div className="mt-4">
          <label className="field-label" htmlFor={`routing-${agent.agent_key}`}>
            Routing hint — when should the orchestrator hand a message to this agent?
          </label>
          <textarea
            id={`routing-${agent.agent_key}`}
            value={routingHint}
            onChange={(e) => setRoutingHint(e.target.value)}
            rows={2}
            className="field-input mt-1 w-full resize-y text-xs leading-relaxed"
            placeholder='e.g. "The student explicitly wants to learn a concept step by step."'
          />
        </div>
      )}

      <label className="field-label mt-4 block" htmlFor={`prompt-${agent.agent_key}`}>
        System prompt
      </label>
      <textarea
        id={`prompt-${agent.agent_key}`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={10}
        spellCheck={false}
        className="field-input mt-1 w-full resize-y font-mono text-xs leading-relaxed"
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
          <span className="tag text-emerald-700">{message}</span>
        )}
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
        <button
          type="button"
          onClick={() => setShowTest((v) => !v)}
          className="ml-auto text-sm font-medium text-accent-500 hover:text-accent-600"
        >
          {showTest ? "Hide test console" : "Test this prompt →"}
        </button>
      </div>

      {showTest && (
        <PromptPlayground systemPrompt={prompt} useKnowledgeBase={useKb} />
      )}
    </div>
  );
}

function PromptPlayground({
  systemPrompt,
  useKnowledgeBase,
}: {
  systemPrompt: string;
  useKnowledgeBase: boolean;
}) {
  const [sampleInput, setSampleInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    output: string;
    latency_ms: number;
    retrieved_chunks: { title: string; similarity: number; preview: string }[];
  } | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/agents/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          user_content: sampleInput,
          use_knowledge_base: useKnowledgeBase,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Test run failed.");
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Test run failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-paper p-4">
      <p className="tag mb-2">
        iteration console — runs the prompt above (as currently edited, even
        unsaved) against a sample input
      </p>
      <label className="field-label" htmlFor="sample-input">
        Sample user input
      </label>
      <textarea
        id="sample-input"
        value={sampleInput}
        onChange={(e) => setSampleInput(e.target.value)}
        rows={4}
        placeholder="Paste the kind of content this agent normally receives, e.g. a person's intake answers or a target role."
        className="field-input mt-1 w-full resize-y font-mono text-xs"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy || !sampleInput.trim()}
          className="btn-ghost px-4 py-2 text-sm"
        >
          {busy ? "Running…" : "Run test"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          <p className="tag">{result.latency_ms}ms</p>

          {useKnowledgeBase && (
            <div>
              <p className="tag mb-1.5">
                retrieved chunks ({result.retrieved_chunks.length})
              </p>
              {result.retrieved_chunks.length === 0 ? (
                <p className="text-xs text-slate-soft">
                  Nothing matched — the knowledge base may be empty, or
                  nothing relevant was found.
                </p>
              ) : (
                <div className="space-y-2">
                  {result.retrieved_chunks.map((c, i) => (
                    <div key={i} className="rounded-lg border border-line bg-white px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">{c.title}</span>
                        <span className="text-slate-soft">
                          {c.similarity.toFixed(3)}
                        </span>
                      </div>
                      <p className="mt-1 text-slate">{c.preview}…</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="tag mb-1.5">model output</p>
            <pre className="max-h-96 overflow-auto rounded-lg border border-line bg-white p-3 text-xs text-ink">
              {result.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
