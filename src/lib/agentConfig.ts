import { getSupabaseAdmin } from "./supabaseAdmin";

export type AgentConfig = {
  agentKey: string;
  label: string;
  description: string | null;
  systemPrompt: string;
  useKnowledgeBase: boolean;
  updatedAt: string;
};

function mapRow(row: any): AgentConfig {
  return {
    agentKey: row.agent_key,
    label: row.label,
    description: row.description,
    systemPrompt: row.system_prompt,
    useKnowledgeBase: row.use_knowledge_base,
    updatedAt: row.updated_at,
  };
}

// Server-side read used by the role-match and roadmap API routes — the
// system prompt and the knowledge-base toggle both live here now, editable
// from /admin, instead of being baked into a code deploy.
export async function getAgentConfig(agentKey: string): Promise<AgentConfig> {
  const { data, error } = await getSupabaseAdmin()
    .from("agent_configs")
    .select("agent_key, label, description, system_prompt, use_knowledge_base, updated_at")
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
    .select("agent_key, label, description, system_prompt, use_knowledge_base, updated_at")
    .order("agent_key", { ascending: true });

  if (error) throw new Error(`Loading agent configs failed: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function updateAgentConfig(
  agentKey: string,
  patch: { systemPrompt: string; useKnowledgeBase: boolean }
): Promise<AgentConfig> {
  const { data, error } = await getSupabaseAdmin()
    .from("agent_configs")
    .update({
      system_prompt: patch.systemPrompt,
      use_knowledge_base: patch.useKnowledgeBase,
    })
    .eq("agent_key", agentKey)
    .select("agent_key, label, description, system_prompt, use_knowledge_base, updated_at")
    .single();

  if (error || !data) throw new Error(`Saving agent config failed: ${error?.message}`);
  return mapRow(data);
}
