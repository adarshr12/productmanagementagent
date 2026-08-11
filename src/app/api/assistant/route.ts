import { NextRequest, NextResponse } from "next/server";
import { retrieveChunks } from "@/lib/retrieve";
import { groqChat, type ChatMessage } from "@/lib/groq";
import { getAgentConfig } from "@/lib/agentConfig";
import { checkAndRecordRateLimit, clientIdentifier } from "@/lib/rateLimit";

// Public, chat-based "ask a product expert" endpoint. Stateless: the client
// holds the conversation and resends it each turn, so there's no server-side
// session/thread to manage for a v0 feature.
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_TURNS = 20; // messages kept from the client-sent history
const MAX_MESSAGE_LENGTH = 4000;
const ASSISTANT_RATE_LIMIT_PER_HOUR = parseInt(
  process.env.ASSISTANT_RATE_LIMIT_PER_HOUR || "40",
  10
);

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAndRecordRateLimit(
      `assistant:${clientIdentifier(req.headers)}`,
      ASSISTANT_RATE_LIMIT_PER_HOUR
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "You've sent a lot of messages recently. Please try again in a bit." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];

    const history: ChatMessage[] = rawMessages
      .filter(
        (m: any) =>
          (m?.role === "user" || m?.role === "assistant") &&
          typeof m?.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-MAX_TURNS)
      .map((m: any) => ({
        role: m.role,
        content: String(m.content).slice(0, MAX_MESSAGE_LENGTH),
      }));

    const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) {
      return NextResponse.json({ error: "No message to respond to." }, { status: 400 });
    }

    const agent = await getAgentConfig("product_assistant");

    const chunks = agent.useKnowledgeBase
      ? await retrieveChunks(lastUserMessage.content, 6)
      : [];
    const context = chunks
      .map((c, i) => `[${i + 1}] (Source: "${c.document_title}") ${c.content}`)
      .join("\n\n");

    const systemContent = context
      ? `${agent.systemPrompt}\n\nCONTEXT:\n${context}`
      : agent.systemPrompt;

    const reply = await groqChat(
      [{ role: "system", content: systemContent }, ...history],
      1024
    );

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
