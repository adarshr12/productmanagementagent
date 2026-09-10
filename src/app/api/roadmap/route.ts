import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { retrieveChunks } from "@/lib/retrieve";
import { groqJSON } from "@/lib/groq";
import { getAgentConfig } from "@/lib/agentConfig";
import { getRole } from "@/lib/roles";
import { buildRoadmapUserContent, roadmapQuery } from "@/lib/roleMatch";
import { parseRoadmap } from "@/lib/roadmap";

// Step 2 of the flow: given a saved intake + the chosen role, generate a roadmap.
// Reusable backend API — a mobile app can call this with { intakeId, roleId }.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json().catch(() => null);
    const intakeId = String(body?.intakeId || "");
    const roleId = String(body?.roleId || "");

    const role = getRole(roleId);
    if (!intakeId || !role) {
      return NextResponse.json(
        { error: "Missing or invalid intakeId / roleId." },
        { status: 400 }
      );
    }

    // fetch the saved intake answers
    const { data: intake, error: intakeErr } = await supabaseAdmin
      .from("intake_responses")
      .select("id, answers")
      .eq("id", intakeId)
      .single();
    if (intakeErr || !intake) {
      return NextResponse.json({ error: "Intake not found." }, { status: 404 });
    }
    const answers: Record<string, string> = (intake.answers as any) ?? {};

    const agent = await getAgentConfig("roadmap");

    // Retrieval is optional here (the prompt is written to work well from
    // general knowledge alone), so a failure — including the embedding
    // provider's own daily quota running out — should just mean no context,
    // not a broken roadmap generation.
    let chunks: Awaited<ReturnType<typeof retrieveChunks>> = [];
    if (agent.useKnowledgeBase) {
      try {
        chunks = await retrieveChunks(roadmapQuery(answers, role), 8);
      } catch (err) {
        console.error("Knowledge-base retrieval failed, generating without it:", err);
      }
    }
    const context = chunks
      .map((c, i) => `[${i + 1}] (Source: "${c.document_title}") ${c.content}`)
      .join("\n\n");

    // ONE Groq call for the roadmap — a much more detailed roadmap needs
    // more room than the 2048-token default.
    const raw = await groqJSON(
      agent.systemPrompt,
      buildRoadmapUserContent(answers, role, context),
      6000
    );
    const roadmap = parseRoadmap(raw);

    // save roadmap + steps (steps start in the To Do column)
    const shareToken = crypto.randomBytes(9).toString("base64url");
    const { data: savedRoadmap, error: rmErr } = await supabaseAdmin
      .from("roadmaps")
      .insert({
        intake_response_id: intake.id,
        share_token: shareToken,
        title: roadmap.title,
        content: roadmap.overview,
        role: role.label,
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      })
      .select("id")
      .single();
    if (rmErr) throw new Error(`Saving roadmap failed: ${rmErr.message}`);

    const stepRows = roadmap.steps.map((s, i) => ({
      roadmap_id: savedRoadmap.id,
      step_order: i,
      title: s.title,
      description: s.description,
      estimated_time: s.estimated_time || null,
      resource_note: s.resource_note || null,
      status: "todo",
    }));
    const { error: stepErr } = await supabaseAdmin
      .from("roadmap_steps")
      .insert(stepRows);
    if (stepErr) throw new Error(`Saving steps failed: ${stepErr.message}`);

    return NextResponse.json({ shareToken });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Something went wrong generating your roadmap." },
      { status: 500 }
    );
  }
}
