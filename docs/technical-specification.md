# Technical Specification — PM/PjM/BA Knowledge & Practice Agent

Status: **planning document — no infrastructure has been created yet.** Nothing here has been
deployed; this is the full spec to review/edit before anything gets built. Open decisions that
need your input are called out explicitly in §13.

---

## 1. Product overview

A RAG-based assistant, trained on your own product/project/BA content (blogs, frameworks,
templates, resources), serving non-coding roles (Product, Project, Business Analysis, Ops).

Core capabilities:
1. **Knowledge chat** — ask any PM/PjM/BA concept question, get an answer grounded in your content
   with citations.
2. **Interview practice loop** — get a question, answer it, get scored + critiqued + a model
   answer, retry.
3. **Gap-analysis / benchmarking reports** — compare a user's approach/answers against curated
   reference answers in your corpus.
4. **Email studio** — browse curated email templates (status updates, escalations, exec summaries)
   extracted from your content, or have the agent draft a custom email grounded in that content.
5. **Super-admin console** (single operator — you) — upload documents, watch ingestion status,
   inspect embedding quality/clustering, correct or re-index content.

Two user classes: **end users** (signup/login, use the four user-facing features) and **super
admin** (you — everything end users have, plus the admin console). No other admin tiers at MVP.

---

## 2. User flows

### 2.1 End-user flow
```
Land on site → Sign up / log in (email+password or Google OAuth)
  → Chat: type or speak a question → streamed answer + source citations
  → optionally switch mode: Interview practice | Email studio | Analysis report
  → Interview: pick topic → get question → answer → see score + rubric breakdown + model
    answer → retry or next question → history visible over time
  → Email studio: browse templates by category, or describe a situation → AI drafts an email →
    edit/copy
  → Account settings: view/download own data (GDPR export), delete account, manage consent
```

### 2.2 Super-admin flow
```
Log in (flagged as super_admin in profiles table) → Admin console
  → Upload document(s) (PDF/DOCX/MD/HTML/URL) → see ingestion status (pending → parsing →
    chunking → embedding → indexed / failed)
  → Inspect a document: chunk count, chunk previews, which embedding model/version was used
  → Embedding visualization: 2D projection of chunk embeddings (colored by topic) to spot
    clusters, duplicates, or topic gaps
  → Model performance panel: retrieval quality on a fixed eval set (precision/recall proxy),
    average chat latency, LLM cost per day/week
  → Correct: edit a chunk's topic/metadata tags, mark a chunk as excluded from retrieval, or
    trigger re-ingestion of a document after editing the source file
  → Manage interview question bank and email template gallery (add/edit/retire entries)
```

### 2.3 Technical flow (request-level)
```
Browser (Next.js) → Netlify Function (API layer, stateless)
  → auth check (Supabase JWT verification)
  → [chat] embed query → Supabase RPC match_chunks() → assemble context → call Claude → stream
    tokens back over SSE → persist message + citations
  → [ingestion] triggered by admin upload → background job (Netlify Background Function) → parse
    → chunk → embed (batched) → upsert into chunks table → update document status
```

---

## 3. System architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend — Next.js on Netlify                                          │
│  Auth pages | Chat | Interview mode | Email studio | Admin console      │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ HTTPS (JWT in Authorization header)
┌───────────────────────────────▼───────────────────────────────────────────┐
│  API layer — Netlify Functions (stateless, horizontally scalable)        │
│  /api/chat  /api/interview  /api/email  /api/analysis  /api/admin/*      │
│  /api/account/*  (export/delete/consent)                                 │
└───────┬───────────────────┬────────────────────┬─────────────────┬───────┘
        │                   │                    │                 │
┌───────▼───────┐  ┌────────▼─────────┐  ┌───────▼────────┐  ┌─────▼──────┐
│ Supabase       │  │ Supabase Storage  │  │ Upstash Redis   │  │ LLM /      │
│ Postgres        │  │ raw uploaded      │  │ embedding cache │  │ Embedding  │
│ (Auth + tables  │  │ documents          │  │ response cache  │  │ APIs       │
│  + pgvector,     │  │                    │  │ rate limiting   │  │ (Claude +  │
│  via Supavisor   │  │                    │  │                 │  │  Voyage/   │
│  pooler)         │  │                    │  │                 │  │  OpenAI)   │
└─────────────────┘  └───────────────────┘  └─────────────────┘  └────────────┘
        ▲
┌───────┴───────────────────────────────────────────────┐
│  Ingestion worker — Netlify Background Function         │
│  parse → clean → chunk → embed (batched, cached) →      │
│  upsert chunks → update document.status                 │
└───────────────────────────────────────────────────────────┘
```

**Why this shape:**
- Everything server-side is stateless → scales horizontally with zero session affinity concerns;
  concurrent users don't contend with each other beyond normal DB connection limits.
- All DB access from serverless functions goes through Supabase's **Supavisor pooler in
  transaction mode**, not direct Postgres connections — this is what actually prevents "multiple
  people logged in at once" from exhausting connections, not the schema itself.
- Single source of truth (Postgres) for both relational and vector data — one less moving part
  than running a separate vector DB service, and transactionally consistent (a chunk write and its
  metadata write can't get out of sync).

---

## 4. Data model

Design principles applied throughout: every table has RLS enabled and an explicit policy (no
table ships without one — this is what was missing on your existing `templates` table); PII lives
in a table separate from operational/content data; every table uses UUID PKs; foreign keys are
indexed; timestamps are `timestamptz`; nothing is ever hard-deleted for tables subject to audit
requirements (append-only `audit_log`).

### 4.1 Identity & consent

```sql
-- Supabase Auth already provides auth.users (id, email, encrypted_password, etc.) — not
-- duplicated here. Everything below references auth.users(id).

create type user_role as enum ('user', 'super_admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PII kept deliberately separate from profiles/operational tables per enterprise data
-- minimization practice — narrower blast radius if this table is ever compromised, and makes
-- GDPR export/delete a single well-scoped operation.
create table public.user_pii (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  billing_name text,
  billing_address jsonb,
  updated_at timestamptz not null default now()
);

create type consent_type as enum ('terms', 'privacy_policy', 'marketing_email');

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type consent_type not null,
  policy_version text not null,
  consented_at timestamptz not null default now(),
  ip_address inet
);

create type data_request_type as enum ('export', 'deletion');
create type data_request_status as enum ('pending', 'processing', 'completed', 'failed');

create table public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type data_request_type not null,
  status data_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
```

### 4.2 Knowledge base (documents + vectors)

```sql
create extension if not exists vector;

create type document_status as enum ('pending', 'parsing', 'chunking', 'embedding', 'indexed', 'failed');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null,               -- 'pdf' | 'docx' | 'md' | 'html' | 'url'
  storage_path text,                       -- Supabase Storage path, null if ingested from URL/text
  topic text[] not null default '{}',      -- e.g. {'product','frameworks'}
  status document_status not null default 'pending',
  embedding_model text,                    -- e.g. 'voyage-3-lite' — recorded per doc for migration safety
  embedding_dim int,
  chunk_count int not null default 0,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dimension fixed at 1024 by default (Voyage voyage-3-lite / voyage-3). Change before first
-- migration if you pick OpenAI text-embedding-3-small instead (1536) — see §13.
create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_count int,
  embedding vector(1024),
  topic text[] not null default '{}',
  content_type text,                       -- 'blog' | 'framework' | 'interview_qa' | 'case_study'
  excluded_from_retrieval boolean not null default false,  -- admin correction lever
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index chunks_embedding_hnsw on public.chunks
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
create index chunks_document_id_idx on public.chunks (document_id);
create index chunks_topic_gin on public.chunks using gin (topic);

-- Server-side similarity search, called via supabase-js .rpc()
create or replace function public.match_chunks(
  query_embedding vector(1024),
  match_count int default 10,
  topic_filter text[] default null
) returns table (
  id uuid, document_id uuid, content text, topic text[], content_type text, similarity float
)
language sql stable as $$
  select c.id, c.document_id, c.content, c.topic, c.content_type,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  where c.excluded_from_retrieval = false
    and (topic_filter is null or c.topic && topic_filter)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
```

### 4.3 Chat

```sql
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type message_role as enum ('user', 'assistant');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role message_role not null,
  content text not null,
  citations jsonb not null default '[]',   -- [{document_id, title, chunk_id}]
  token_usage jsonb,                       -- {input, output} for cost tracking
  created_at timestamptz not null default now()
);

create index messages_session_id_idx on public.messages (session_id, created_at);
create index chat_sessions_user_id_idx on public.chat_sessions (user_id, updated_at desc);
```

### 4.4 Interview practice

```sql
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,                     -- 'product' | 'project' | 'ba' | 'ops'
  role_type text not null,
  question_text text not null,
  difficulty text not null default 'medium',
  reference_chunk_ids uuid[] default '{}', -- grounds the model-answer/eval in real content
  created_at timestamptz not null default now()
);

create table public.interview_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.interview_questions(id),
  attempt_number int not null default 1,
  user_answer text not null,
  score numeric(4,1),                      -- 0-10
  rubric_breakdown jsonb,                  -- {structure, clarity, frameworks, examples}
  feedback text,
  model_answer text,
  created_at timestamptz not null default now()
);

create index interview_attempts_user_idx on public.interview_attempts (user_id, created_at desc);
```

### 4.5 Email studio

```sql
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null,                  -- 'status_update' | 'escalation' | 'exec_summary'
  title text not null,
  body_template text not null,
  source_document_id uuid references public.documents(id),
  created_at timestamptz not null default now()
);

create table public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  situation_input text not null,
  tone text,
  generated_draft text not null,
  created_at timestamptz not null default now()
);
```

### 4.6 Analysis reports

```sql
create table public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb not null,                    -- the answers/approach submitted
  report jsonb not null,                   -- {strengths, gaps, recommended_resources}
  created_at timestamptz not null default now()
);
```

### 4.7 Audit log (enterprise requirement — append-only, never updated/deleted)

```sql
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,                    -- 'document.upload' | 'chunk.exclude' | 'user.delete_requested'
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_actor_idx on public.audit_log (actor_user_id, created_at desc);
```

### 4.8 RLS policy pattern (applied per-table, not shown for every table for brevity)

```sql
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);
create policy "admin reads all profiles" on public.profiles
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

alter table public.user_pii enable row level security;
create policy "own pii only" on public.user_pii
  for select using (auth.uid() = user_id);
-- no user-initiated update/delete policy on user_pii: changes go through the
-- data_subject_requests flow, processed by the service role, so there's an audit trail.

alter table public.chunks enable row level security;
create policy "authenticated read" on public.chunks
  for select using (auth.role() = 'authenticated');
-- writes to documents/chunks only via service_role (admin API), no direct client write policy.

alter table public.chat_sessions enable row level security;
create policy "own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id);

alter table public.messages enable row level security;
create policy "own messages" on public.messages
  for all using (exists (select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));

alter table public.audit_log enable row level security;
create policy "admin reads audit log" on public.audit_log
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));
-- inserts only via service_role (no client insert policy at all).
```

Same owner-scoped pattern applies to `interview_attempts`, `email_drafts`, `analysis_reports`,
`consent_records`, `data_subject_requests`. `interview_questions` and `email_templates` are
public-read (authenticated), admin-write-only, same as `documents`/`chunks`.

---

## 5. Ingestion pipeline — algorithms

1. **Parse**: `pymupdf` (PDF), `mammoth`/`python-docx` (DOCX), `readability` + `BeautifulSoup`
   (HTML/blog), plain read (MD/TXT).
2. **Clean**: strip nav/boilerplate, normalize whitespace, drop near-duplicate paragraphs.
3. **Chunk**: recursive splitter — try paragraph boundaries first, then sentence boundaries, then
   hard token cutoff. Target **500 tokens/chunk, 15% overlap** (~75 tokens), counted with the
   embedding model's tokenizer.
4. **Embed**: batch chunks (e.g. 100 at a time) through the embedding API. **Cache by
   SHA-256(chunk text) in Redis** — re-ingesting an unchanged document costs zero embedding calls.
5. **Upsert**: `chunk_id` derived from `(document_id, chunk_index)` via the table's unique
   constraint — re-running ingestion updates in place rather than duplicating.
6. **Status transitions**: `pending → parsing → chunking → embedding → indexed`, or `→ failed`
   with `error_message` set — surfaced in the admin console.

## 6. Retrieval & generation — algorithms

1. Embed the user's query with the same model used for chunks.
2. Call `match_chunks()` (cosine similarity via HNSW index) → top 10-15 candidates.
3. Optional: **cross-encoder rerank** (`bge-reranker-base` or Cohere rerank) → top 4-6.
4. Assemble prompt: system instructions (role/tone) + numbered source chunks (with doc titles for
   citation) + last N turns of conversation (older turns replaced by a rolling summary once the
   session gets long, to bound context size/cost).
5. Call Claude, **stream** the response back over SSE.
6. Persist the assistant message with `citations` = the chunk/document IDs actually used.

## 7. Interview-evaluation algorithm

LLM-as-judge with a fixed rubric, not free-form grading:
- Retrieve reference chunks tied to the question (`interview_questions.reference_chunk_ids`).
- Prompt Claude (Sonnet, not Haiku — judgment quality matters here) with: the question, the
  reference material, the user's answer, and an explicit rubric: **structure, clarity, correct use
  of frameworks, use of concrete examples** (each 0-10).
- Output structured JSON: `{scores: {...}, overall, feedback, model_answer}` — parsed and stored in
  `interview_attempts`. Structured output (not prose parsing) keeps this reliable.

## 8. Embedding visualization algorithm (admin console)

- Batch-fetch chunk embeddings for a document or the whole corpus.
- Dimensionality reduction: **UMAP** (better cluster separation than PCA for this use case) down
  to 2D, computed in a small on-demand job (not real-time per request — cache the projection and
  recompute on a schedule or on-demand button in the admin console).
- Render as a scatter plot colored by `topic`, point size by chunk length — lets you visually spot
  topic clusters, outliers, and duplicate/near-duplicate content.

---

## 9. API specification

| Method & Path | Auth | Purpose |
|---|---|---|
| `POST /api/chat/message` | user | Send a message, get streamed answer + citations |
| `GET /api/chat/sessions` | user | List own chat sessions |
| `GET /api/chat/sessions/:id/messages` | user | Session history |
| `DELETE /api/chat/sessions/:id` | user | Delete a session |
| `GET /api/interview/questions?topic=` | user | Fetch a practice question |
| `POST /api/interview/attempts` | user | Submit an answer, get scored evaluation |
| `GET /api/interview/attempts` | user | Own attempt history |
| `GET /api/email/templates?category=` | user | Browse template gallery |
| `POST /api/email/draft` | user | AI-draft an email from a described situation |
| `POST /api/analysis/report` | user | Submit answers/approach, get gap-analysis report |
| `GET /api/analysis/reports/:id` | user | Fetch a prior report |
| `POST /api/account/export` | user | Request a GDPR data export (async) |
| `POST /api/account/delete` | user | Request account deletion (async, grace period) |
| `GET/POST /api/account/consent` | user | View/record consent |
| `POST /api/admin/documents` | super_admin | Upload a document, enqueue ingestion |
| `GET /api/admin/documents` | super_admin | List documents + status |
| `GET /api/admin/documents/:id` | super_admin | Detail + chunk previews |
| `PATCH /api/admin/chunks/:id` | super_admin | Correct topic/metadata, toggle exclusion |
| `POST /api/admin/documents/:id/reindex` | super_admin | Re-run ingestion |
| `DELETE /api/admin/documents/:id` | super_admin | Remove doc + cascade its chunks |
| `GET /api/admin/embeddings/projection` | super_admin | 2D projection data for visualization |
| `GET /api/admin/metrics` | super_admin | Retrieval quality, latency, LLM cost dashboard data |
| `POST /api/admin/interview-questions` | super_admin | Manage question bank |
| `POST /api/admin/email-templates` | super_admin | Manage template gallery |

All endpoints authenticate via Supabase JWT (verified server-side); admin endpoints additionally
check `profiles.role = 'super_admin'`. Every write to `documents`/`chunks`/question bank/templates
also inserts an `audit_log` row.

---

## 10. Frontend components

```
AuthPages          — SignupForm, LoginForm, OAuthButtons
ChatWindow         — MessageList, MessageBubble(with CitationChips), MessageInput, VoiceInputButton
InterviewMode      — TopicPicker, QuestionCard, AnswerInput, ScoreBreakdownPanel, AttemptHistory
EmailStudio        — TemplateGallery, TemplateCard, AIDraftForm, DraftPreview
AnalysisReport     — SubmissionForm, ReportView(strengths/gaps/resources)
AccountSettings    — ProfileForm, ConsentManager, ExportDataButton, DeleteAccountButton
AdminConsole
  ├─ DocumentUploadModal
  ├─ DocumentTable (status, chunk_count, actions)
  ├─ DocumentDetail (chunk previews, correction controls)
  ├─ EmbeddingProjectionChart (UMAP scatter, topic-colored)
  ├─ ModelPerformancePanel (retrieval eval scores, latency, cost)
  ├─ InterviewQuestionManager
  └─ EmailTemplateManager
```

---

## 11. Security, privacy & compliance

- **RLS on every table, no exceptions** — including fixing the gap found on your existing
  `templates` table (separate from this project, flagged earlier, still unresolved — your call).
- **PII isolation**: `user_pii` is a distinct table from `profiles`/operational data, no
  user-initiated update/delete policy (changes flow through `data_subject_requests`, processed by
  the service role, so there's always an audit trail of who changed what).
- **Secrets**: service_role key and all API provider keys live only in Netlify/Supabase environment
  variables, never in client bundles or code.
- **Encryption**: TLS in transit (default), AES-256 at rest (Supabase default). Field-level
  encryption (`pgcrypto`) is available for `user_pii` columns if you ever store something more
  sensitive than contact info — not needed for the current scope.
- **Audit log**: append-only, insert-only via service role, readable only by super_admin — covers
  admin actions and data-subject-request processing.
- **Rate limiting**: per-user token bucket in Redis, protects both DB and LLM spend from a single
  runaway user/session.

### GDPR
Directly implementable now, no extra cost:
- `consent_records` captures what was agreed to and when, versioned by policy text.
- `data_subject_requests` + `/api/account/export` and `/api/account/delete` implement the right to
  access and right to erasure — export compiles the user's rows across `profiles`, `user_pii`,
  `chat_sessions`/`messages`, `interview_attempts`, `email_drafts`, `analysis_reports` into a JSON
  bundle; deletion cascades via `on delete cascade` from `auth.users`, run by the service role after
  a short grace period.
- Data minimization: only `user_pii` fields you actually use should exist — don't collect fields
  "just in case."
- **Data residency**: if your users are meaningfully EU-based, host the new Supabase project in an
  EU region (`eu-central-1` or `eu-west-1`) rather than defaulting to the region your existing
  project uses (`ap-south-1`). This is a region picklist choice at project-creation time — see §13.

### HIPAA — reality check, not sugar-coated
HIPAA governs **Protected Health Information (PHI)** specifically — medical records, health
insurance data, treatment info tied to an identifiable person. A product/project/BA knowledge and
interview-practice tool has **no PHI in its stated scope**. Two honest paths:
1. **If you will never process health data**: HIPAA doesn't apply to this product, and building
   toward it would be effort spent on a non-requirement. GDPR-grade practices above (which do
   apply, since you'll have EU users' personal data) cover the real obligation.
2. **If you anticipate a future scope that does touch health data**: true HIPAA compliance is not
   a schema feature — it requires a **signed Business Associate Agreement (BAA) with Supabase**,
   available only on their **paid Team/Enterprise plan**, plus additional operational controls
   (access logging, breach notification procedures, workforce training) that live outside the
   codebase entirely. I'd rather flag this clearly now than build something and label it "HIPAA
   compliant" when it isn't — that label requires a contract, not just good schema design.

---

## 12. Scalability & concurrency

- Netlify Functions are stateless and scale horizontally by default — "2-3 people logged in at
  once" is not a load Postgres or serverless functions notice; this architecture is built to hold
  far past that without changes.
- **Supavisor pooler (transaction mode)** connection string used by all serverless DB access —
  this, not the schema, is what prevents connection exhaustion under concurrent load.
- Every foreign key and every filter/sort column used by the API has an index (see DDL above);
  `chunks.embedding` uses HNSW for sub-linear vector search.
- Redis cache absorbs repeat embedding calls and common-query LLM responses, reducing both latency
  and cost under concurrent load.
- Scale-out path when real traffic arrives: Supabase Pro tier (more DB resources, PITR backups),
  move `chunks` to a dedicated vector DB (Qdrant) if corpus grows past low-millions of vectors,
  add a queue (instead of direct background functions) for ingestion at high upload volume.

---

## 13. Open decisions — need your input before I create anything

| Decision | Options | My default if you don't have a preference |
|---|---|---|
| Supabase project region | Any region; matters for GDPR data residency and latency to your users | `eu-central-1` (Frankfurt) if you expect EU users, else `ap-south-1` to match your existing project's latency profile |
| Embedding provider | Voyage AI (1024-dim, free tier, RAG-tuned) vs OpenAI (`text-embedding-3-small`, 1536-dim) | Voyage AI — free tier covers MVP volume entirely, purpose-built for retrieval |
| LLM provider for generation/evaluation | Anthropic Claude (assumed, given this session) | Claude Haiku for chat, Sonnet for interview evaluation |
| HIPAA scope | Does this product ever touch health-related data? | Assume **no** — build to GDPR only, skip BAA/paid-plan cost, unless you say otherwise |
| Anonymous chat allowed? | Require login for all chat, or allow a limited anonymous/free trial mode | Require login (simpler RLS, matches "signup module" ask) |

Once you confirm/adjust these, the next step is provisioning (new Supabase project + this schema
as a migration) and building the ingestion + chat API — nothing gets created until you say go.
