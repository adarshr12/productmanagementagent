import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { listAgentConfigs, updateAgentConfig } from "@/lib/agentConfig";

// Admin-only. Lets the dashboard read/edit each agent's (role-match,
// roadmap) system prompt and knowledge-base toggle without a code deploy.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const agents = await listAgentConfigs();
    return NextResponse.json({ agents });
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

    if (!agentKey || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing agent_key or system_prompt." },
        { status: 400 }
      );
    }

    const agent = await updateAgentConfig(agentKey, {
      systemPrompt,
      useKnowledgeBase,
    });
    return NextResponse.json({ agent });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save agent." }, { status: 500 });
  }
}
