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

const MAX_RATE_LIMIT_RETRIES = 5;

async function voyageEmbed(
  input: string[],
  inputType: "query" | "document"
): Promise<number[][]> {
  for (let attempt = 0; ; attempt++) {
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

    if (res.ok) {
      const data = await res.json();
      return (data.data as { embedding: number[] }[]).map((d) => d.embedding);
    }

    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfterHeader = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : 2 ** attempt * 5000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    throw new Error(`Voyage error ${res.status}: ${await res.text()}`);
  }
}
