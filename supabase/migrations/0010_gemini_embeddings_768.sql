-- ============================================================================
-- Switch embeddings from Voyage (1024-d) to Google Gemini gemini-embedding-001
-- (768-d, free tier). Safe to drop/rebuild the vector column because the
-- knowledge base is empty — nothing to re-embed. Re-upload documents in /admin
-- after this to index them with the new model.
-- ============================================================================

-- Functions that reference the old 1024-d signature must be dropped first.
drop function if exists match_chunks_hybrid(vector, text, int, int);
drop function if exists match_chunks(vector, int);

-- Resize the embedding column (dropping it also drops its HNSW index).
alter table chunks drop column if exists embedding;
alter table chunks add column embedding vector(768);
create index chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);

-- Recreate the hybrid retrieval function at the new dimension (same RRF logic).
create function match_chunks_hybrid(
  query_embedding vector(768),
  query_text      text,
  match_count     int default 6,
  rrf_k           int default 60
)
returns table (
  id uuid, content text, document_id uuid, document_title text, similarity float
)
language sql stable as $$
  with vector_matches as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rank
    from chunks c
    where c.embedding is not null
    order by c.embedding <=> query_embedding
    limit greatest(match_count * 4, 20)
  ),
  keyword_matches as (
    select
      c.id,
      row_number() over (order by ts_rank(c.content_tsv, plainto_tsquery('english', query_text)) desc) as rank
    from chunks c
    where query_text is not null
      and query_text <> ''
      and c.content_tsv @@ plainto_tsquery('english', query_text)
    order by ts_rank(c.content_tsv, plainto_tsquery('english', query_text)) desc
    limit greatest(match_count * 4, 20)
  ),
  fused as (
    select id, sum(1.0 / (rrf_k + rank)) as fused_score
    from (
      select id, rank from vector_matches
      union all
      select id, rank from keyword_matches
    ) both_ranks
    group by id
  )
  select
    c.id,
    c.content,
    c.document_id,
    d.title as document_title,
    f.fused_score as similarity
  from fused f
  join chunks c on c.id = f.id
  join documents d on d.id = c.document_id
  order by f.fused_score desc
  limit match_count;
$$;

alter function match_chunks_hybrid(vector, text, int, int) set search_path = public;
