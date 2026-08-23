import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { retrieveChunks } from "@/lib/retrieve";
import { groqJSON } from "@/lib/groq";
import { getAgentConfig } from "@/lib/agentConfig";
import { checkAndRecordRateLimit, clientIdentifier } from "@/lib/rateLimit";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import {
  backgroundQuery,
  buildRoleMatchUserContent,
  parseMatches,
} from "@/lib/roleMatch";

import { verifyUser } from "@/lib/verifyUser";

// Step 1 of the flow: take the person's background, score every product role for
// transition fit, and return the ranked list. Reusable backend API.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const user = await verifyUser(req);

    const allowed = await checkAndRecordRateLimit(
      `role_match:${clientIdentifier(req.headers)}`
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "You've made several requests recently. Please try again in a bit." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const answers: Record<string, string> = body?.answers ?? {};

    for (const q of INTAKE_QUESTIONS) {
      if (q.required && !String(answers[q.id] ?? "").trim()) {
        return NextResponse.json(
          { error: `Please answer: ${q.label}` },
          { status: 400 }
        );
      }
    }

    // save the intake (dedicated columns + full answers blob)
    const intakeRow: Record<string, unknown> = {
      answers,
      user_id: user?.id ?? null,
    };
    for (const q of INTAKE_QUESTIONS) {
      if (q.column) {
        intakeRow[q.column] = String(answers[q.id] ?? "").trim() || null;
      }
    }
    const { data: intake, error: intakeErr } = await supabaseAdmin
      .from("intake_responses")
      .insert(intakeRow)
      .select("id")
      .single();
    if (intakeErr) throw new Error(`Saving intake failed: ${intakeErr.message}`);

    const agent = await getAgentConfig("role_match");

    // retrieve grounding context only while this agent's knowledge-base
    // toggle is on (off by default until the admin has collated documents)
    const chunks = agent.useKnowledgeBase
      ? await retrieveChunks(backgroundQuery(answers), 6)
      : [];
    const context = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");

    const raw = await groqJSON(
      agent.systemPrompt,
      buildRoleMatchUserContent(answers, context),
      3000
    );
    const matches = parseMatches(raw);

    // persist the scored roles on the intake for analytics
    await supabaseAdmin
      .from("intake_responses")
      .update({ role_matches: matches })
      .eq("id", intake.id);

    return NextResponse.json({ intakeId: intake.id, matches });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Something went wrong scoring roles." },
      { status: 500 }
    );
  }
}
