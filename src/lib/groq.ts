// LLM calls via Google Gemini (free tier). This used to call Groq, but Groq's
// free tier throttles hard (8k tokens/minute), which surfaced as a 429 on the
// roadmap and role-match screens. The file name is kept as groq.ts, and the
// exported function names (groqJSON / groqChat) are unchanged, so every import
// site — roadmap, role-match, assistant chat, the orchestrator router, and the
// admin agent test — keeps working without edits. Provider is now Gemini.
//
// Default model is gemini-3.6-flash: the free-tier flash model Google's API
// currently points callers to (gemini-2.0-flash was retired with a 404 that
// named 3.6-flash as its replacement). Override with GEMINI_CHAT_MODEL in the
// environment to move to a newer one without a code change when this is retired.
const MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.6-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_RETRIES = 4;

// One call to Gemini's generateContent endpoint, returning the text of the
// first candidate. Retries on 429 with exponential backoff so a brief rate-limit
// blip doesn't fail the user's request outright.
async function geminiGenerate(body: Record<string, unknown>): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY environment variable.");

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      return Array.isArray(parts)
        ? parts.map((p: { text?: string }) => p?.text ?? "").join("")
        : "";
    }

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 2000));
      continue;
    }
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }
}

// Makes a single JSON-returning call. Used for both role matching and roadmap
// generation. responseMimeType pins the output to a JSON object, so callers can
// JSON.parse the returned string exactly as they did with Groq's JSON mode.
export async function groqJSON(
  systemPrompt: string,
  userContent: string,
  maxTokens = 2048
): Promise<string> {
  return geminiGenerate({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
    },
  });
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Plain-text, multi-turn call — used by the AI assistant chat, where the reply
// is conversational prose, not a single JSON object. Gemini takes the system
// prompt in a separate field and labels model turns "model" (not "assistant"),
// so we split those out here while keeping the ChatMessage shape callers pass.
export async function groqChat(
  messages: ChatMessage[],
  maxTokens = 1024
): Promise<string> {
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens },
  };
  if (systemText) body.system_instruction = { parts: [{ text: systemText }] };

  return geminiGenerate(body);
}
