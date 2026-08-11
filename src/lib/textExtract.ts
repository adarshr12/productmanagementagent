// Turns an uploaded file's raw bytes into plain text, then splits that text
// into overlapping chunks sized for retrieval (small enough to be a precise
// match, with enough overlap that an idea split across a chunk boundary
// still appears whole in at least one chunk).

export async function extractText(
  buffer: Buffer,
  sourceType: "pdf" | "docx" | "txt"
): Promise<string> {
  if (sourceType === "txt") {
    return buffer.toString("utf-8");
  }
  if (sourceType === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  // pdf
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

const CHUNK_SIZE_WORDS = 380; // ~500 tokens of English prose
const CHUNK_OVERLAP_WORDS = 60;

// Word-count-based chunking (not char-based) so chunk size tracks token count
// reasonably well without pulling in a real tokenizer for a v0 pipeline.
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;
  const step = CHUNK_SIZE_WORDS - CHUNK_OVERLAP_WORDS;
  while (start < words.length) {
    const slice = words.slice(start, start + CHUNK_SIZE_WORDS);
    const chunk = slice.join(" ").trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (start + CHUNK_SIZE_WORDS >= words.length) break;
    start += step;
  }
  return chunks;
}
