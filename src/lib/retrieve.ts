import { getSupabaseAdmin } from "./supabaseAdmin";
import { embedQuery } from "./voyage";

export type RetrievedChunk = {
  id: string;
  content: string;
  document_id: string;
  document_title: string;
  similarity: number;
};

// Finds the most relevant knowledge-base chunks for a query string, combining
// vector similarity with keyword/full-text search (see match_chunks_hybrid)
// so exact terms the embedding model doesn't cluster closely — acronyms,
// framework names — still surface.
export async function retrieveChunks(
  query: string,
  matchCount = 6
): Promise<RetrievedChunk[]> {
  const embedding = await embedQuery(query);

  const { data, error } = await getSupabaseAdmin().rpc("match_chunks_hybrid", {
    query_embedding: embedding,
    query_text: query,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }
  return (data ?? []) as RetrievedChunk[];
}
