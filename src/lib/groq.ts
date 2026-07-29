// Makes the single LLM call to Groq that generates the roadmap.
// Asks for a JSON object back so we can split it into trackable steps.
export async function generateRoadmapJSON(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
