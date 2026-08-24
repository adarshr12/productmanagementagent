// Text embeddings via Google Gemini (`gemini-embedding-001`), on the free tier.
// (File name kept as voyage.ts to avoid touching import sites; the provider is
// now Gemini, not Voyage.) Query vs document use different taskTypes — Gemini
// optimizes each, and getting it backwards quietly degrades retrieval quality.
const MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const DIM = parseInt(process.env.GEMINI_EMBED_DIM || "768", 10);
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const BATCH_SIZE = 100;
const MAX_RETRIES = 5;

// Gemini's Matryoshka embeddings must be L2-normalized when a non-default
// output size (< 3072) is requested, or cosine distances come out wrong.
function normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (const x of vec) sumSq += x * x;
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((x) => x / norm);
}

async function geminiEmbed(
  texts: string[],
  taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY environment variable.");

  const out: number[][] = [];
  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const body = JSON.stringify({
      requests: batch.map((t) => ({
        model: `models/${MODEL}`,
        content: { parts: [{ text: t }] },
        taskType,
        outputDimensionality: DIM,
      })),
    });

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(`${BASE}/models/${MODEL}:batchEmbedContents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        for (const e of data.embeddings as { values: number[] }[]) {
          out.push(normalize(e.values));
        }
        break;
      }

      if (res.status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 2000));
        continue;
      }
      throw new Error(`Gemini embedding error ${res.status}: ${await res.text()}`);
    }
  }
  return out;
}

// Embeds a single search query (used at retrieval time).
export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await geminiEmbed([text], "RETRIEVAL_QUERY");
  return embedding;
}

// Embeds knowledge-base chunks at ingestion time.
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  return geminiEmbed(texts, "RETRIEVAL_DOCUMENT");
}
