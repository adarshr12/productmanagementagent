import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { retrieveChunks } from "@/lib/retrieve";
import { generateRoadmapJSON } from "@/lib/groq";
import { loadPrompt } from "@/lib/prompts";
import { checkAndRecordRateLimit, clientIdentifier } from "@/lib/rateLimit";
import { INTAKE_QUESTIONS } from "@/lib/questions";
import { buildQuery, buildUserContent, parseRoadmap } from "@/lib/roadmap";

// This is the reusable backend API. A future mobile app can call this same
// endpoint with the same JSON body and get back a shareToken.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1) spam protection
    const allowed = await checkAndRecordRateLimit(clientIdentifier(req.headers));
    if (!allowed) {
      return NextResponse.json(
        { error: "You've made several requests recently. Please try again in a bit." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const answers: Record<string, string> = body?.answers ?? {};

    // 2) validate required answers
    for (const q of INTAKE_QUESTIONS) {
      if (q.required && !String(answers[q.id] ?? "").trim()) {
        return NextResponse.json(
          { error: `Please answer: ${q.label}` },
          { status: 400 }
        );
      }
    }

    // 3) save the intake response (dedicated columns + full answers blob)
    const intakeRow: Record<string, unknown> = { answers };
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

    // 4) retrieve relevant knowledge-base chunks
    const chunks = await retrieveChunks(buildQuery(answers), 6);
    const context = chunks
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join("\n\n");

    // 5) ONE Groq call to generate the roadmap
    const systemPrompt = await loadPrompt("roadmap-system.txt");
    const raw = await generateRoadmapJSON(
      systemPrompt,
      buildUserContent(answers, context)
    );
    const roadmap = parseRoadmap(raw);

    // 6) save roadmap + steps
    const shareToken = crypto.randomBytes(9).toString("base64url");
    const { data: savedRoadmap, error: rmErr } = await supabaseAdmin
      .from("roadmaps")
      .insert({
        intake_response_id: intake.id,
        share_token: shareToken,
        title: roadmap.title,
        content: roadmap.overview,
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
