import { getAgentConfig, listConversationalAgents, type AgentConfig } from "./agentConfig";
import { groqJSON } from "./groq";
import type { ChatMessage } from "./groq";

// Decides which conversational agent should handle the current turn. New
// agents (a tutor, a future voice-practice agent, whatever comes next) join
// the routing pool automatically the moment they're added in /admin as
// agent_type='conversational' with a routing_hint — nothing here has to
// change to support them.
export async function pickAgent(
  history: ChatMessage[],
  latestUserMessage: string
): Promise<AgentConfig> {
  const candidates = await listConversationalAgents();
  const fallback =
    candidates.find((a) => a.agentKey === "product_assistant") ?? candidates[0];

  // With zero or one real candidate there's nothing to route between.
  if (candidates.length <= 1) {
    if (!fallback) throw new Error("No conversational agents are configured.");
    return fallback;
  }

  try {
    const orchestrator = await getAgentConfig("orchestrator");

    const agentList = candidates
      .map((a) => `- ${a.agentKey}: ${a.routingHint || a.description || "(no routing hint set)"}`)
      .join("\n");
    const recentHistory = history
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const userContent = [
      `AVAILABLE AGENTS:\n${agentList}`,
      recentHistory ? `CONVERSATION SO FAR:\n${recentHistory}` : "",
      `Latest user message: ${latestUserMessage}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const raw = await groqJSON(orchestrator.systemPrompt, userContent, 200);
    const parsed = JSON.parse(raw);
    const chosen = candidates.find((a) => a.agentKey === parsed?.agent_key);
    return chosen ?? fallback;
  } catch {
    // Routing is a best-effort optimization, never a hard dependency — any
    // failure here (bad JSON, missing orchestrator row, network hiccup)
    // just falls back to the general-purpose agent instead of erroring out
    // the whole chat turn.
    return fallback;
  }
}
