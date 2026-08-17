-- ============================================================================
-- Career-Transition MVP — initial schema (v0)
--
-- Six lean tables. Row-Level Security is ON everywhere. Only the logged-in
-- admin can touch documents/chunks; everything the public touches goes through
-- server endpoints using the service-role key (which bypasses RLS on purpose),
-- so the browser can never read or write the raw tables.
--
-- The full "enterprise" model (tenants, users, roles, permissions, credits,
-- memory, feedback) is intentionally NOT built here. See docs/future-data-model.md
-- for how these tables grow into that later without a rewrite.
-- ============================================================================

create extension if not exists vector;

-- Shared helper: auto-stamp updated_at on every UPDATE. -----------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) documents — one row per file the admin uploads. --------------------------
create table documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  file_name     text not null,
  source_type   text not null check (source_type in ('pdf', 'docx', 'txt')),
  status        text not null default 'pending'
                  check (status in ('pending', 'processing', 'indexed', 'error')),
  error_message text,
  chunk_count   int  not null default 0,
  embedding_model text,
  uploaded_by   uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_documents_updated
  before update on documents for each row execute function set_updated_at();

-- 2) chunks — the ~500-token pieces + their embeddings. -----------------------
create table chunks (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references documents(id) on delete cascade,
  chunk_index  int  not null,
  content      text not null,
  embedding    vector(1024),          -- must match VOYAGE_DIM (voyage-3.5-lite = 1024)
  token_count  int,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_chunks_updated
  before update on chunks for each row execute function set_updated_at();
-- Approximate-nearest-neighbour index for fast cosine similarity search.
create index chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);
create index chunks_document_id_idx on chunks (document_id);

-- 3) intake_responses — one row per person who fills the public form. ---------
create table intake_responses (
  id                uuid primary key default gen_random_uuid(),
  experience_level  text,
  "current_role"    text,   -- quoted: current_role is a reserved word in Postgres
  current_domain    text,
  target_role       text,
  biggest_skill_gap text,
  answers           jsonb not null default '{}'::jsonb,  -- all 10-15 raw answers
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_intake_updated
  before update on intake_responses for each row execute function set_updated_at();

-- 4) roadmaps — one generated roadmap per intake. -----------------------------
create table roadmaps (
  id                  uuid primary key default gen_random_uuid(),
  intake_response_id  uuid not null references intake_responses(id) on delete cascade,
  share_token         text unique not null,   -- powers the shareable /r/<token> link
  title               text,
  content             text,                    -- overview / narrative of the roadmap
  model               text,                    -- which Groq model produced it
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_roadmaps_updated
  before update on roadmaps for each row execute function set_updated_at();

-- 5) roadmap_steps — the trackable steps. THIS IS THE CORE SUCCESS METRIC. ----
create table roadmap_steps (
  id            uuid primary key default gen_random_uuid(),
  roadmap_id    uuid not null references roadmaps(id) on delete cascade,
  step_order    int  not null,
  title         text not null,
  description   text,
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_roadmap_steps_updated
  before update on roadmap_steps for each row execute function set_updated_at();
create index roadmap_steps_roadmap_id_idx on roadmap_steps (roadmap_id);

-- 6) rate_limits — timestamped tallies to cap public-form spam. ---------------
create table rate_limits (
  id         bigserial primary key,
  bucket     text not null,          -- hashed visitor identifier (IP-derived)
  created_at timestamptz not null default now()
);
create index rate_limits_bucket_time_idx on rate_limits (bucket, created_at);

-- ---------------------------------------------------------------------------
-- Completion-rate view: powers the admin "completions" table.
-- ---------------------------------------------------------------------------
create view roadmap_completion as
select
  r.id                                                          as roadmap_id,
  r.title,
  r.created_at,
  count(s.*)                                                    as total_steps,
  count(s.*) filter (where s.is_completed)                      as completed_steps,
  round(100.0 * count(s.*) filter (where s.is_completed)
        / nullif(count(s.*), 0), 1)                             as completion_pct
from roadmaps r
left join roadmap_steps s on s.roadmap_id = r.id
group by r.id;

-- ---------------------------------------------------------------------------
-- Vector search used during roadmap generation. Returns the most relevant
-- chunks for a query embedding. Called by the server (service role) only.
-- ---------------------------------------------------------------------------
create or replace function match_chunks(
  query_embedding vector(1024),
  match_count     int default 6
)
returns table (id uuid, content text, document_id uuid, similarity float)
language sql stable as $$
  select
    c.id,
    c.content,
    c.document_id,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table documents        enable row level security;
alter table chunks           enable row level security;
alter table intake_responses enable row level security;
alter table roadmaps         enable row level security;
alter table roadmap_steps    enable row level security;
alter table rate_limits      enable row level security;

-- documents + chunks: the logged-in admin has full access.
create policy admin_all_documents on documents
  for all to authenticated using (true) with check (true);
create policy admin_all_chunks on chunks
  for all to authenticated using (true) with check (true);

-- Security hardening (from Supabase advisor):
-- 1) completion view respects the querying user's RLS (service role still sees all)
-- 2) pin function search_path to prevent injection
alter view roadmap_completion set (security_invoker = on);
alter function set_updated_at() set search_path = public;
alter function match_chunks(vector, int) set search_path = public;

-- intake_responses, roadmaps, roadmap_steps, rate_limits:
-- NO policies on purpose => the browser (anon) and even logged-in users get
-- zero direct access. Only the server's service-role key reaches these tables.
-- (RLS is enabled so nothing leaks if a table is ever exposed by accident.)
