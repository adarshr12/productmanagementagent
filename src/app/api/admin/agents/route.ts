import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { listAgentConfigs, updateAgentConfig, type AgentConfig } from "@/lib/agentConfig";

// Admin-only. Lets the dashboard read/edit each agent's system prompt,
// knowledge-base toggle, and routing hint without a code deploy.
export const runtime = "nodejs";

// The client speaks snake_case (matches the DB columns); the lib speaks
// camelCase (idiomatic JS). This is the one seam where they're bridged.
function serialize(agent: AgentConfig) {
  return {
    agent_key: agent.agentKey,
    label: agent.label,
    description: agent.description,
    system_prompt: agent.systemPrompt,
    use_knowledge_base: agent.useKnowledgeBase,
    agent_type: agent.agentType,
    routing_hint: agent.routingHint,
    is_active: agent.isActive,
    updated_at: agent.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const agents = await listAgentConfigs();
    return NextResponse.json({ agents: agents.map(serialize) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load agents." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    const agentKey = String(body?.agent_key || "");
    const systemPrompt = String(body?.system_prompt || "").trim();
    const useKnowledgeBase = Boolean(body?.use_knowledge_base);
    const routingHint =
      body?.routing_hint === undefined ? undefined : String(body.routing_hint || "").trim();

    if (!agentKey || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing agent_key or system_prompt." },
        { status: 400 }
      );
    }

    const agent = await updateAgentConfig(agentKey, {
      systemPrompt,
      useKnowledgeBase,
      routingHint,
    });
    return NextResponse.json({ agent: serialize(agent) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save agent." }, { status: 500 });
  }
}
