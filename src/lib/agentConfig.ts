import { getSupabaseAdmin } from "./supabaseAdmin";

export type AgentType = "flow" | "conversational" | "orchestrator";

export type AgentConfig = {
  agentKey: string;
  label: string;
  description: string | null;
  systemPrompt: string;
  useKnowledgeBase: boolean;
  agentType: AgentType;
  routingHint: string | null;
  isActive: boolean;
  updatedAt: string;
};

const COLUMNS =
  "agent_key, label, description, system_prompt, use_knowledge_base, agent_type, routing_hint, is_active, updated_at";

function mapRow(row: any): AgentConfig {
  return {
    agentKey: row.agent_key,
    label: row.label,
    description: row.description,
    systemPrompt: row.system_prompt,
    useKnowledgeBase: row.use_knowledge_base,
    agentType: row.agent_type,
    routingHint: row.routing_hint,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

// Server-side read used by the role-match, roadmap, and assistant API
// routes — the system prompt and the knowledge-base toggle both live here
// now, editable from /admin, instead of being baked into a code deploy.
export async function getAgentConfig(agentKey: string): Promise<AgentConfig> {
  const { data, error } = await getSupabaseAdmin()
    .from("agent_configs")
    .select(COLUMNS)
    .eq("agent_key", agentKey)
    .single();

  if (error || !data) {
    throw new Error(`Missing agent config for "${agentKey}". Run the latest migration.`);
  }
  return mapRow(data);
}

export async function listAgentConfigs(): Promise<AgentConfig[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("agent_configs")
    .select(COLUMNS)
    .order("agent_key", { ascending: true });

  if (error) throw new Error(`Loading agent configs failed: ${error.message}`);
  return (data ?? []).map(mapRow);
}

// The orchestrator's routing pool: every active conversational agent, with
// the routing_hint that tells the router when to pick it.
export async function listConversationalAgents(): Promise<AgentConfig[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("agent_configs")
    .select(COLUMNS)
    .eq("agent_type", "conversational")
    .eq("is_active", true)
    .order("agent_key", { ascending: true });

  if (error) throw new Error(`Loading conversational agents failed: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function updateAgentConfig(
  agentKey: string,
  patch: { systemPrompt: string; useKnowledgeBase: boolean; routingHint?: string | null }
): Promise<AgentConfig> {
  const update: Record<string, unknown> = {
    system_prompt: patch.systemPrompt,
    use_knowledge_base: patch.useKnowledgeBase,
  };
  if (patch.routingHint !== undefined) update.routing_hint = patch.routingHint;

  const { data, error } = await getSupabaseAdmin()
    .from("agent_configs")
    .update(update)
    .eq("agent_key", agentKey)
    .select(COLUMNS)
    .single();

  if (error || !data) throw new Error(`Saving agent config failed: ${error?.message}`);
  return mapRow(data);
}
