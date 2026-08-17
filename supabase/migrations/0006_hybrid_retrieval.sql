-- ============================================================================
-- Hybrid retrieval (vector + keyword)
--   Pure cosine-similarity search (match_chunks) misses exact-term matches
--   that don't cluster near the query in embedding space (acronyms, proper
--   nouns, framework names like "RACI" or "JTBD"). match_chunks_hybrid adds a
--   full-text search pass and fuses the two rankings with Reciprocal Rank
--   Fusion (RRF) — a parameter-light, order-of-magnitude-robust way to
--   combine ranked lists without having to tune a similarity-score blend
--   weight by hand. The original match_chunks is left in place, untouched.
-- ============================================================================

alter table chunks
  add column content_tsv tsvector generated always as (to_tsvector('english', content)) stored;

create index chunks_content_tsv_idx on chunks using gin (content_tsv);

create function match_chunks_hybrid(
  query_embedding vector(1024),
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
