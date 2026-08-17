-- ============================================================================
-- Mentor guidance upgrade
--   - roadmap_steps gains estimated_time + resource_note, so each step can be
--     delivered the way a mentor would say it ("~4-6 hours, best resource: X")
--     instead of a bare title/description.
--   - match_chunks now also returns the source document's title, so the
--     roadmap prompt can name a real resource instead of a numbered citation.
-- ============================================================================

alter table roadmap_steps
  add column estimated_time text,
  add column resource_note  text;

drop function if exists match_chunks(vector, int);

create function match_chunks(
  query_embedding vector(1024),
  match_count     int default 6
)
returns table (
  id uuid, content text, document_id uuid, document_title text, similarity float
)
language sql stable as $$
  select
    c.id,
    c.content,
    c.document_id,
    d.title as document_title,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join documents d on d.id = c.document_id
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

alter function match_chunks(vector, int) set search_path = public;
