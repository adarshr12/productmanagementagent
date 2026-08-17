import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { retrieveChunks } from "@/lib/retrieve";
import { groqJSON } from "@/lib/groq";

// Admin-only. Runs a DRAFT system prompt (not yet saved) against a sample
// input, so an admin can iterate on prompt wording and immediately see the
// model's real output — including which knowledge-base chunks were pulled in
// — instead of round-tripping through the actual end-user flow to check
// every edit.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const systemPrompt = String(body?.system_prompt || "").trim();
  const userContent = String(body?.user_content || "").trim();
  const useKnowledgeBase = Boolean(body?.use_knowledge_base);

  if (!systemPrompt || !userContent) {
    return NextResponse.json(
      { error: "Provide both a system prompt and a sample input." },
      { status: 400 }
    );
  }

  try {
    const chunks = useKnowledgeBase ? await retrieveChunks(userContent, 6) : [];
    const context = chunks
      .map((c, i) => `[${i + 1}] (Source: "${c.document_title}") ${c.content}`)
      .join("\n\n");
    const finalUserContent = context
      ? `${userContent}\n\nCONTEXT:\n${context}`
      : userContent;

    const start = Date.now();
    const output = await groqJSON(systemPrompt, finalUserContent, 3000);
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      output,
      latency_ms: latencyMs,
      retrieved_chunks: chunks.map((c) => ({
        title: c.document_title,
        similarity: c.similarity,
        preview: c.content.slice(0, 220),
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Test run failed." },
      { status: 500 }
    );
  }
}
