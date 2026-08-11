// Embeds a search query with Voyage AI (server-side only). Used at roadmap time
// to turn the person's intake answers into a vector we can search chunks with.
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await voyageEmbed([text], "query");
  return embedding;
}

// Embeds knowledge-base chunks at ingestion time. Separate `input_type` from
// embedQuery ("document" vs "query") — Voyage optimizes each differently, and
// getting this backwards quietly degrades retrieval quality rather than
// erroring, so the two call sites are kept explicit instead of sharing one
// default.
const DOCUMENT_BATCH_SIZE = 96;

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += DOCUMENT_BATCH_SIZE) {
    const batch = texts.slice(i, i + DOCUMENT_BATCH_SIZE);
    out.push(...(await voyageEmbed(batch, "document")));
  }
  return out;
}

async function voyageEmbed(
  input: string[],
  inputType: "query" | "document"
): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      model: process.env.VOYAGE_MODEL || "voyage-3.5-lite",
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.data as { embedding: number[] }[]).map((d) => d.embedding);
}
