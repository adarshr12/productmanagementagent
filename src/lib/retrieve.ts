import { getSupabaseAdmin } from "./supabaseAdmin";
import { embedQuery } from "./voyage";

export type RetrievedChunk = {
  id: string;
  content: string;
  document_id: string;
  similarity: number;
};

// Finds the most relevant knowledge-base chunks for a query string.
export async function retrieveChunks(
  query: string,
  matchCount = 6
): Promise<RetrievedChunk[]> {
  const embedding = await embedQuery(query);

  const { data, error } = await getSupabaseAdmin().rpc("match_chunks", {
    query_embedding: embedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }
  return (data ?? []) as RetrievedChunk[];
}
