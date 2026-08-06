# Technical Specification — Multi-Agent PM Career Copilot

Status: **planning document — no infrastructure has been created yet.** Nothing here has been
deployed; this is the full spec to review/edit before anything gets built. Open decisions that
need your input are called out explicitly in §16.

---

## 1. Product overview

A RAG-based, **multi-agent** assistant trained on your own content (blogs, frameworks, templates,
resources), serving **Product Managers, Project Managers, Product Owners, Business Analysts,
Scrum Masters**, and similar non-coding roles.

The product is one platform backed by several specialized **agents**, each with a distinct skill
set, all orchestrated the same way and all running on **one underlying LLM** (differentiated by
system prompt, tools, and retrieval scope — not by swapping model providers). See §4 for the full
multi-agent architecture. The agents at launch:

0. **Mentor Agent** (the front door — see §4.6) — does **not** wait for a form submission. It
   interviews the user conversationally ("what's your current role, what are you preparing for,
   what have you tried so far?"), diagnoses gaps against what a target role actually needs, and
   responds the way a real mentor would: *"I can see four gaps here — start with these two, that's
   roughly 6-8 hours, here's the best resource for it. Once that's solid, come back and we'll do
   interview practice on it."* It sequences and hands off to the other agents below rather than
   requiring the user to pick a tab and fill a form.
1. **Tutor Agent** — explains any PM/BA/Scrum concept in plain language, grounded in your content,
   with citations.
2. **Interviewer Agent** — runs the practice loop: asks a question, takes the answer, scores it
   against a rubric, gives a model answer, lets the user retry.
3. **Communication Coach Agent** — audits tone, clarity, and speaking/writing style on any text
   (or transcribed voice answer) the user submits — usable standalone, or invoked automatically by
   the Interviewer Agent as a sub-check.
4. **Resume Analyzer Agent** — parses an uploaded resume, evaluates it against role-specific best
   practices from the knowledge base, and returns structured, actionable feedback.
5. **Email Drafting Agent** — browses a curated template gallery, or drafts a custom email from a
   described situation, grounded in your content.
6. **Benchmark Agent** — compares a user's full answer/approach against curated reference material
   and produces a gap-analysis report.

The agent roster is designed to grow or shrink by **adding/removing a registry entry** (§4.2), not
by re-architecting the orchestration — the dispatch mechanism in §4.3 never changes shape.

Two user classes: **end users** (signup/login, use all agent-backed features) and **super admin**
(you — everything end users have, plus the admin console: upload documents, watch ingestion
status, inspect embedding quality/clustering, correct or re-index content). No other admin tiers
at MVP.

---

## 2. User flows

### 2.1 End-user flow
```
Land on site → Sign up / log in (email+password or Google OAuth)
  → Pick an agent: Tutor | Interview practice | Resume Analyzer | Email studio | Benchmark report
  → Tutor: type or speak a question → streamed answer + source citations
  → Interview: pick topic → get question → answer (typed or spoken) → Interviewer Agent scores it
    (internally calling the Communication Coach for a tone/clarity sub-score) → see full rubric
    breakdown + model answer → retry or next question → history visible over time
  → Communication Coach (standalone): paste/speak any text → get a tone/clarity/professionalism
    audit independent of the interview flow
  → Resume Analyzer: upload resume (PDF/DOCX) + target role → structured feedback (strengths,
    gaps, section-by-section notes, suggested rewrites)
  → Email studio: browse templates by category, or describe a situation → AI drafts an email →
    edit/copy
  → Benchmark: submit an approach/answer set → gap-analysis report vs. curated reference material
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
    average chat latency, LLM cost per day/week, per-agent usage breakdown
  → Correct: edit a chunk's topic/metadata tags, mark a chunk as excluded from retrieval, or
    trigger re-ingestion of a document after editing the source file
  → Manage interview question bank and email template gallery (add/edit/retire entries)
```

### 2.3 Technical flow (request-level)
```
Browser (Next.js) → Netlify Function (API layer, stateless)
  → auth check (Supabase JWT verification)
  → [any agent turn] look up AgentConfig(agentId) → run retrieval if configured → call Claude with
    that agent's system prompt + tools → tool calls executed in-loop (e.g. Interviewer calling the
    Communication Coach) → stream final answer over SSE → persist message with agent_type +
    citations + token usage
  → [ingestion] triggered by admin upload → background job (Netlify Background Function) → parse
    → chunk → embed (batched) → upsert into chunks table → update document status
```

---

## 3. System architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Frontend — Next.js on Netlify                                            │
│  Auth | Tutor chat | Interview mode | Resume Analyzer | Email studio |    │
│  Benchmark reports | Admin console                                        │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │ HTTPS (JWT in Authorization header)
┌───────────────────────────────▼───────────────────────────────────────────┐
│  API layer — Netlify Functions (stateless, horizontally scalable)         │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │  Agent Orchestrator (single dispatch function, §4.3)               │    │
│  │  registry → Tutor | Interviewer | Communication Coach |            │    │
│  │             Resume Analyzer | Email Drafter | Benchmark            │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│  /api/admin/*  /api/account/*  (export/delete/consent)                    │
└───────┬───────────────────┬────────────────────┬─────────────────┬────────┘
        │                   │                    │                 │
┌───────▼───────┐  ┌────────▼─────────┐  ┌───────▼────────┐  ┌─────▼──────┐
│ Supabase       │  │ Supabase Storage  │  │ Upstash Redis   │  │ LLM /      │
│ Postgres        │  │ raw uploaded      │  │ embedding cache │  │ Embedding  │
│ (Auth + tables  │  │ documents,         │  │ response cache  │  │ APIs       │
│  + pgvector,     │  │ resumes            │  │ rate limiting   │  │ (one LLM,  │
│  via Supavisor   │  │                    │  │                 │  │  e.g.      │
│  pooler)         │  │                    │  │                 │  │  Claude +  │
│                  │  │                    │  │                 │  │  Voyage/   │
│                  │  │                    │  │                 │  │  OpenAI)   │
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
- **One orchestrator, one LLM provider, many agent configs** — adding agent #7 never touches the
  API layer's shape, the DB access pattern, or the deployment topology.

---

## 4. Multi-agent architecture & orchestration

### 4.1 Core principle
One LLM, many skills. Every agent is a **configuration**, not a different model and not a
different codebase path: a system prompt, a tool allowlist, an optional retrieval topic filter,
and a model tier (cheaper/faster model for high-volume low-judgment agents, the stronger model
reserved for agents whose whole job is judgment). This is what keeps "the orchestration should be
the same" true as agents are added or removed — the dispatch function in §4.3 never changes
shape, only the registry in §4.2 grows.

### 4.2 Agent registry
```ts
type AgentId =
  | 'mentor' | 'tutor' | 'interviewer' | 'communication_coach'
  | 'resume_analyzer' | 'email_drafter' | 'benchmark';

type AgentConfig = {
  id: AgentId;
  systemPrompt: string;
  tools: ToolName[];
  retrievalTopics?: string[];     // narrows match_chunks()'s topic_filter, omit = unfiltered
  model: 'claude-haiku-4-5' | 'claude-sonnet-5';
};

const AGENTS: Record<AgentId, AgentConfig> = {
  mentor:              { tools: ['search_knowledge_base', 'get_user_progress',
                                 'create_roadmap', 'update_roadmap_item',
                                 'delegate_to_agent'], model: 'claude-sonnet-5', ... },
  tutor:               { tools: ['search_knowledge_base'], model: 'claude-haiku-4-5', ... },
  interviewer:         { tools: ['search_knowledge_base', 'call_communication_coach',
                                 'log_interview_attempt'], model: 'claude-sonnet-5', ... },
  communication_coach: { tools: [], model: 'claude-haiku-4-5', ... },
  resume_analyzer:     { tools: ['search_knowledge_base', 'parse_resume'],
                         model: 'claude-sonnet-5', ... },
  email_drafter:       { tools: ['search_knowledge_base'], model: 'claude-haiku-4-5', ... },
  benchmark:           { tools: ['search_knowledge_base'], model: 'claude-sonnet-5', ... },
};
```
Adding an 8th agent (say, a "Stakeholder Simulator" that role-plays a difficult stakeholder) means
adding one entry here plus its system prompt — nothing else in the system needs to change. The
Mentor's `delegate_to_agent` tool takes an `AgentId` — so extending the roster automatically
extends what the Mentor is able to route a user into, no separate wiring required.

### 4.3 Orchestrator (the one thing that never changes)
```
dispatch(agentId, userInput, sessionContext):
  1. look up AGENTS[agentId] — unknown agentId → 400, never silently falls back to a default agent
  2. build the system prompt from the config
  3. if config.retrievalTopics is set (or the agent's tools include search_knowledge_base):
       embed userInput → call match_chunks() with that topic filter → attach top chunks as context
  4. call the LLM (config.model) with config.tools bound as function-calling tools
  5. if the model emits a tool call (e.g. Interviewer calling call_communication_coach):
       execute the tool, feed the result back to the model, repeat until a final answer
  6. persist the turn — messages.agent_type = agentId, citations, token_usage
  7. stream the final answer back to the client
```
Every agent, present or future, goes through this exact function. The **Interviewer Agent**
demonstrates agent-to-agent composition directly: `call_communication_coach` is one of its bound
tools, so mid-evaluation it invokes the Coach's tone/clarity rubric as a sub-score instead of
duplicating that judgment logic itself — one skill reused by another agent, not copy-pasted.

### 4.4 Agent selection (how a turn gets routed to an agent)
**The Mentor is the default landing experience** — a new or returning user drops into the Mentor
by default, not a tab picker. The Mentor conducts the conversation itself (§4.6) and calls
`delegate_to_agent` when a specific skill is needed (e.g. it decides the user is ready for
interview practice and hands off to the Interviewer, carrying context with it). Direct tabs to
each specialist agent (Tutor / Interview / Resume / Email / Benchmark / Communication Coach)
still exist for a user who already knows exactly what they want and doesn't need guidance — both
paths go through the same `dispatch()` in §4.3, so "guided" vs. "direct" is just which `agentId`
the UI starts on, not a different code path.

### 4.5 Per-agent skill summary
| Agent | Skill | Primary tools | Model | Judgment-heavy? |
|---|---|---|---|---|
| Mentor | Diagnose gaps conversationally, sequence a roadmap with time estimates + resources, track progress, delegate to specialists | `search_knowledge_base`, `get_user_progress`, `create_roadmap`, `update_roadmap_item`, `delegate_to_agent` | Sonnet | Yes |
| Tutor | Explain concepts plainly, grounded in content, with citations | `search_knowledge_base` | Haiku | No — retrieval quality matters more than model IQ |
| Interviewer | Ask → score against fixed rubric → model answer → retry | `search_knowledge_base`, `call_communication_coach`, `log_interview_attempt` | Sonnet | Yes |
| Communication Coach | Audit tone/clarity/conciseness/professionalism on any text or voice transcript | — (pure judgment, no retrieval needed) | Haiku | Somewhat — kept cheap since it's called frequently (standalone + as an Interviewer sub-check) |
| Resume Analyzer | Parse resume, benchmark against role-specific best practice, structured feedback | `search_knowledge_base`, `parse_resume` | Sonnet | Yes |
| Email Drafter | Template retrieval, or custom draft grounded in content | `search_knowledge_base` | Haiku | No |
| Benchmark | Compare a full answer/approach vs. curated reference, gap report | `search_knowledge_base` | Sonnet | Yes |

### 4.6 Mentor Agent — the guided experience in detail
This is the direct answer to "it should feel like an expert guiding you, not a form": the Mentor
never opens with a blank input box. It runs a **diagnostic conversation** first —
role-appropriate questions about current experience, target role, what's already been tried — and
only after it has enough signal does it produce guidance, delivered the way a real mentor would
speak, e.g.:

> "Based on what you've told me, I can see four gaps: stakeholder communication, prioritization
> frameworks, a metrics-driven mindset, and interview structure (STAR method). Let's start with
> prioritization and metrics — that's roughly 6-8 hours of focused work. Here's the best resource
> in my library for it: [linked chunk/doc]. Once you've gone through that, come back and I'll run
> you through interview practice on exactly those two topics."

Mechanically:
1. **Diagnose** — a short structured Q&A (stored as a `skill_assessment`, §5.11) rather than a
   long form; each answer can prompt a natural follow-up question, same as a real conversation.
2. **Roadmap** — `create_roadmap` writes an ordered list of `roadmap_items`, each with an estimated
   time investment, a linked knowledge-base resource (via `search_knowledge_base`), and a
   completion criterion (e.g. "score 7+/10 on 3 interview questions in this topic").
3. **Guide, don't dump** — the Mentor surfaces one or two next steps at a time, not the whole
   roadmap at once, and re-explains *why* that order matters (matches how a mentor actually
   coaches, vs. handing over a checklist).
4. **Delegate** — when a roadmap item is best served by a specialist (practice questions →
   Interviewer, resume feedback → Resume Analyzer), the Mentor calls `delegate_to_agent`, which
   starts that agent's session pre-loaded with the relevant context (topic, target role) so the
   user never has to re-explain themselves.
5. **Follow up** — on return visits, the Mentor opens with progress (`get_user_progress`): what's
   done, what's next, whether it's time to reassess — closing the loop instead of resetting to a
   blank state every session.

---

## 5. Data model

Design principles applied throughout: every table has RLS enabled and an explicit policy (no
table ships without one — this is what was missing on your existing `templates` table); PII lives
in a table separate from operational/content data; every table uses UUID PKs; foreign keys are
indexed; timestamps are `timestamptz`; nothing is ever hard-deleted for tables subject to audit
requirements (append-only `audit_log`).

### 5.1 Identity & consent

```sql
-- Supabase Auth already provides auth.users (id, email, encrypted_password, etc.) — not
-- duplicated here. Everything below references auth.users(id).

create type user_role as enum ('user', 'super_admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  target_role text,                        -- 'product_manager' | 'project_manager' |
                                            -- 'product_owner' | 'business_analyst' | 'scrum_master'
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

### 5.2 Knowledge base (documents + vectors)

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
-- migration if you pick OpenAI text-embedding-3-small instead (1536) — see §16.
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

-- Server-side similarity search, called via supabase-js .rpc() — shared by every agent that
-- declares search_knowledge_base as a tool.
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

### 5.3 Chat (shared by every conversational agent)

```sql
create type agent_type as enum
  ('mentor', 'tutor', 'interviewer', 'communication_coach', 'resume_analyzer', 'email_drafter', 'benchmark');

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_type agent_type not null default 'mentor',
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type message_role as enum ('user', 'assistant');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role message_role not null,
  agent_type agent_type not null,          -- which agent produced/received this turn
  content text not null,
  citations jsonb not null default '[]',   -- [{document_id, title, chunk_id}]
  token_usage jsonb,                       -- {input, output} for cost tracking
  created_at timestamptz not null default now()
);

create index messages_session_id_idx on public.messages (session_id, created_at);
create index chat_sessions_user_id_idx on public.chat_sessions (user_id, updated_at desc);
```

### 5.4 Interviewer Agent

```sql
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,                     -- 'product' | 'project' | 'ba' | 'scrum'
  role_type text not null,                 -- target role this question is written for
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
  score numeric(4,1),                      -- 0-10 overall
  rubric_breakdown jsonb,                  -- {structure, clarity, frameworks, examples, communication}
  communication_audit_id uuid,             -- fk to communication_audits, set when the Coach sub-check ran
  feedback text,
  model_answer text,
  created_at timestamptz not null default now()
);

create index interview_attempts_user_idx on public.interview_attempts (user_id, created_at desc);
```

### 5.5 Communication Coach Agent

```sql
create table public.communication_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'standalone',  -- 'standalone' | 'interview_attempt'
  source_id uuid,                             -- interview_attempts.id when source = 'interview_attempt'
  input_text text not null,
  input_mode text not null default 'text',    -- 'text' | 'voice_transcript'
  scores jsonb,                               -- {clarity, confidence, conciseness, professionalism}
  flagged_phrases jsonb default '[]',         -- filler words/hedges/unclear phrasing, with positions
  feedback text,
  created_at timestamptz not null default now()
);

create index communication_audits_user_idx on public.communication_audits (user_id, created_at desc);

alter table public.interview_attempts
  add constraint interview_attempts_communication_audit_fk
  foreign key (communication_audit_id) references public.communication_audits(id);
```

### 5.6 Resume Analyzer Agent

```sql
create type resume_status as enum ('pending', 'parsing', 'analyzing', 'completed', 'failed');

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  target_role text,                        -- matches profiles.target_role vocabulary
  status resume_status not null default 'pending',
  parsed_text text,
  analysis jsonb,                          -- {strengths, gaps, section_feedback, suggested_rewrites}
  score numeric(4,1),
  error_message text,
  created_at timestamptz not null default now()
);

create index resumes_user_idx on public.resumes (user_id, created_at desc);
```

### 5.7 Email Drafting Agent

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

### 5.8 Benchmark Agent

```sql
create table public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb not null,                    -- the answers/approach submitted
  report jsonb not null,                   -- {strengths, gaps, recommended_resources}
  created_at timestamptz not null default now()
);
```

### 5.9 Mentor Agent — diagnostics, roadmap, progress

```sql
create table public.skill_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  qa_transcript jsonb not null,            -- [{question, answer}] — the diagnostic conversation
  identified_gaps jsonb not null,          -- [{topic, severity}]
  created_at timestamptz not null default now()
);

create type roadmap_item_status as enum ('locked', 'not_started', 'in_progress', 'completed');

create table public.learning_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.skill_assessments(id),
  target_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  sequence_order int not null,
  topic text not null,
  estimated_hours numeric(4,1),
  resource_chunk_ids uuid[] default '{}',  -- pulled via search_knowledge_base at roadmap creation
  completion_criteria text,                -- e.g. "score 7+/10 on 3 interview questions in this topic"
  delegate_agent agent_type,               -- which specialist agent fulfills this step, if any
  status roadmap_item_status not null default 'not_started',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (roadmap_id, sequence_order)
);

create index roadmap_items_roadmap_idx on public.roadmap_items (roadmap_id, sequence_order);
create index learning_roadmaps_user_idx on public.learning_roadmaps (user_id, updated_at desc);
```

`get_user_progress` (a Mentor tool) reads `learning_roadmaps` + `roadmap_items` for the current
user; `update_roadmap_item` flips status as the user completes items or as delegated agents report
back completion (e.g. the Interviewer logging a passing score against a roadmap item's
`completion_criteria` marks that item `completed` automatically).

### 5.10 Audit log (enterprise requirement — append-only, never updated/deleted)

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

### 5.11 RLS policy pattern (applied per-table, not shown for every table for brevity)

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

alter table public.resumes enable row level security;
create policy "own resumes" on public.resumes
  for all using (auth.uid() = user_id);

alter table public.communication_audits enable row level security;
create policy "own communication audits" on public.communication_audits
  for all using (auth.uid() = user_id);

alter table public.audit_log enable row level security;
create policy "admin reads audit log" on public.audit_log
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));
-- inserts only via service_role (no client insert policy at all).
```

Same owner-scoped pattern applies to `interview_attempts`, `email_drafts`, `analysis_reports`,
`consent_records`, `data_subject_requests`, `skill_assessments`, `learning_roadmaps`, and
`roadmap_items` (scoped via its parent `learning_roadmaps.user_id`, same join pattern as
`messages`). `interview_questions` and `email_templates` are public-read (authenticated),
admin-write-only, same as `documents`/`chunks`.

---

## 6. Ingestion pipeline — algorithms

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

## 7. Retrieval & generation — algorithms (shared `search_knowledge_base` tool)

1. Embed the user's query with the same model used for chunks.
2. Call `match_chunks()` (cosine similarity via HNSW index), optionally filtered by the calling
   agent's `retrievalTopics` → top 10-15 candidates.
3. Optional: **cross-encoder rerank** (`bge-reranker-base` or Cohere rerank) → top 4-6.
4. Assemble prompt: the calling agent's system instructions + numbered source chunks (with doc
   titles for citation) + last N turns of conversation (older turns replaced by a rolling summary
   once the session gets long, to bound context size/cost).
5. Call the LLM, **stream** the response back over SSE.
6. Persist the assistant message with `citations` = the chunk/document IDs actually used and
   `agent_type` = the calling agent.

## 8. Interviewer Agent — evaluation algorithm

LLM-as-judge with a fixed rubric, not free-form grading:
- Retrieve reference chunks tied to the question (`interview_questions.reference_chunk_ids`).
- Call the **Communication Coach** (via `call_communication_coach`, §9) on the raw answer text to
  get a clarity/tone sub-score — this becomes the `communication` dimension of the rubric rather
  than the Interviewer re-deriving it.
- Prompt the model (Sonnet — judgment quality matters here) with: the question, the reference
  material, the user's answer, the Coach's sub-score, and an explicit rubric: **structure,
  clarity, correct use of frameworks, use of concrete examples, communication** (each 0-10).
- Output structured JSON: `{scores: {...}, overall, feedback, model_answer}` — parsed and stored in
  `interview_attempts`, with `communication_audit_id` linking to the Coach's own record. Structured
  output (not prose parsing) keeps this reliable.

## 9. Communication Coach Agent — algorithm

- Input: raw text — either typed directly, or a transcript from voice input (STT).
- No retrieval needed; this is a judgment task, not a knowledge task.
- Prompt with a fixed audit rubric: **clarity, confidence, conciseness, professionalism**, plus
  detection of filler words/hedging language/unclear phrasing (especially relevant for
  transcripts, where "um", "like", "sort of" patterns are common).
- Output structured JSON: `{scores: {...}, flagged_phrases: [...], feedback}` — stored in
  `communication_audits` regardless of whether it was invoked standalone or as an Interviewer
  sub-check (`source` column distinguishes the two).

## 10. Resume Analyzer Agent — algorithm

- Parse the uploaded resume using the same parsers as document ingestion (§6).
- Retrieve role-specific best-practice chunks from the knowledge base, filtered to
  `target_role` (e.g. "what a strong PM resume bullet looks like", "ATS formatting pitfalls").
- Prompt the model (Sonnet) with the resume text + retrieved best practices + target role →
  structured output: `{strengths, gaps, section_feedback: {summary, experience, skills},
  suggested_rewrites, overall_score}`.
- Store in `resumes.analysis`; status transitions `pending → parsing → analyzing → completed`
  mirror the document ingestion pattern for consistency.

## 11. Embedding visualization algorithm (admin console)

- Batch-fetch chunk embeddings for a document or the whole corpus.
- Dimensionality reduction: **UMAP** (better cluster separation than PCA for this use case) down
  to 2D, computed in a small on-demand job (not real-time per request — cache the projection and
  recompute on a schedule or on-demand button in the admin console).
- Render as a scatter plot colored by `topic`, point size by chunk length — lets you visually spot
  topic clusters, outliers, and duplicate/near-duplicate content.

---

## 12. API specification

| Method & Path | Auth | Agent / area | Purpose |
|---|---|---|---|
| `POST /api/agents/:agentId/message` | user | any conversational agent | Send a message to the named agent, get streamed answer + citations (one endpoint shape for all of Mentor/Tutor/Interviewer/Email Drafter/Benchmark — `agentId` selects the registry entry; default landing experience uses `agentId=mentor`) |
| `GET /api/agents/:agentId/sessions` | user | any | List own sessions for that agent |
| `GET /api/agents/:agentId/sessions/:id/messages` | user | any | Session history |
| `DELETE /api/agents/:agentId/sessions/:id` | user | any | Delete a session |
| `GET /api/mentor/roadmap` | user | Mentor | Fetch the user's current roadmap + item statuses |
| `GET /api/interview/questions?topic=` | user | Interviewer | Fetch a practice question |
| `GET /api/interview/attempts` | user | Interviewer | Own attempt history |
| `POST /api/communication/audit` | user | Communication Coach | Standalone tone/clarity audit on submitted text |
| `POST /api/resume/upload` | user | Resume Analyzer | Upload a resume, enqueue parsing + analysis |
| `GET /api/resume/:id` | user | Resume Analyzer | Fetch analysis result/status |
| `GET /api/email/templates?category=` | user | Email Drafter | Browse template gallery |
| `GET /api/analysis/reports/:id` | user | Benchmark | Fetch a prior report |
| `POST /api/account/export` | user | — | Request a GDPR data export (async) |
| `POST /api/account/delete` | user | — | Request account deletion (async, grace period) |
| `GET/POST /api/account/consent` | user | — | View/record consent |
| `POST /api/admin/documents` | super_admin | — | Upload a document, enqueue ingestion |
| `GET /api/admin/documents` | super_admin | — | List documents + status |
| `GET /api/admin/documents/:id` | super_admin | — | Detail + chunk previews |
| `PATCH /api/admin/chunks/:id` | super_admin | — | Correct topic/metadata, toggle exclusion |
| `POST /api/admin/documents/:id/reindex` | super_admin | — | Re-run ingestion |
| `DELETE /api/admin/documents/:id` | super_admin | — | Remove doc + cascade its chunks |
| `GET /api/admin/embeddings/projection` | super_admin | — | 2D projection data for visualization |
| `GET /api/admin/metrics` | super_admin | — | Retrieval quality, latency, LLM cost, per-agent usage |
| `POST /api/admin/interview-questions` | super_admin | — | Manage question bank |
| `POST /api/admin/email-templates` | super_admin | — | Manage template gallery |

`POST /api/agents/:agentId/message` and the interview/communication/resume endpoints all route
through the single orchestrator (§4.3) internally — the API surface is agent-shaped, but there is
exactly one dispatch implementation behind all of it. All endpoints authenticate via Supabase JWT
(verified server-side); admin endpoints additionally check `profiles.role = 'super_admin'`. Every
write to `documents`/`chunks`/question bank/templates also inserts an `audit_log` row.

---

## 13. Frontend components

```
AuthPages          — SignupForm, LoginForm, OAuthButtons
MentorHome         — the default landing screen post-login
                       ├─ DiagnosticChat (conversational Q&A, not a form)
                       ├─ RoadmapTimeline (sequenced steps, time estimates, resource links, status)
                       ├─ NextStepCard (surfaces 1-2 steps at a time, not the whole roadmap at once)
                       └─ ProgressSummary (shown on return visits — what's done, what's next)
AgentSwitcher       — secondary nav for direct access (Tutor / Interview / Communication Coach /
                       Resume / Email / Benchmark) — for a user who already knows what they want
TutorChat          — MessageList, MessageBubble(with CitationChips), MessageInput, VoiceInputButton
InterviewMode      — TopicPicker, QuestionCard, AnswerInput(text or voice), ScoreBreakdownPanel
                       (shows Interviewer + Communication Coach sub-scores), AttemptHistory
CommunicationCoach — TextOrVoiceInput, ToneScorePanel, FlaggedPhraseHighlights
ResumeAnalyzer     — ResumeUpload, TargetRolePicker, AnalysisReport(strengths/gaps/rewrites)
EmailStudio        — TemplateGallery, TemplateCard, AIDraftForm, DraftPreview
BenchmarkReport    — SubmissionForm, ReportView(strengths/gaps/resources)
AccountSettings    — ProfileForm, ConsentManager, ExportDataButton, DeleteAccountButton
AdminConsole
  ├─ DocumentUploadModal
  ├─ DocumentTable (status, chunk_count, actions)
  ├─ DocumentDetail (chunk previews, correction controls)
  ├─ EmbeddingProjectionChart (UMAP scatter, topic-colored)
  ├─ ModelPerformancePanel (retrieval eval scores, latency, cost, per-agent usage)
  ├─ InterviewQuestionManager
  └─ EmailTemplateManager
```

---

## 14. Security, privacy & compliance

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
  runaway user/session — important with multiple agents in play, since a user could otherwise
  hammer the most expensive (Sonnet-backed) agents.

### GDPR
Directly implementable now, no extra cost:
- `consent_records` captures what was agreed to and when, versioned by policy text.
- `data_subject_requests` + `/api/account/export` and `/api/account/delete` implement the right to
  access and right to erasure — export compiles the user's rows across `profiles`, `user_pii`,
  `chat_sessions`/`messages`, `interview_attempts`, `communication_audits`, `resumes`,
  `email_drafts`, `analysis_reports` into a JSON bundle; deletion cascades via `on delete cascade`
  from `auth.users`, run by the service role after a short grace period.
- Data minimization: only `user_pii` fields you actually use should exist — don't collect fields
  "just in case."
- **Data residency**: if your users are meaningfully EU-based, host the new Supabase project in an
  EU region (`eu-central-1` or `eu-west-1`) rather than defaulting to the region your existing
  project uses (`ap-south-1`). This is a region picklist choice at project-creation time — see §16.

### HIPAA — reality check, not sugar-coated
HIPAA governs **Protected Health Information (PHI)** specifically — medical records, health
insurance data, treatment info tied to an identifiable person. A PM/PjM/BA/Scrum knowledge,
interview-practice, and resume-review tool has **no PHI in its stated scope**. Two honest paths:
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

## 15. Scalability & concurrency

- Netlify Functions are stateless and scale horizontally by default — "2-3 people logged in at
  once" is not a load Postgres or serverless functions notice; this architecture is built to hold
  far past that without changes.
- **Supavisor pooler (transaction mode)** connection string used by all serverless DB access —
  this, not the schema, is what prevents connection exhaustion under concurrent load.
- Every foreign key and every filter/sort column used by the API has an index (see DDL above);
  `chunks.embedding` uses HNSW for sub-linear vector search.
- Redis cache absorbs repeat embedding calls and common-query LLM responses, reducing both latency
  and cost under concurrent load.
- Multiple agents sharing one orchestrator means scaling is uniform — there's no per-agent
  infrastructure to separately provision or tune as the roster grows.
- Scale-out path when real traffic arrives: Supabase Pro tier (more DB resources, PITR backups),
  move `chunks` to a dedicated vector DB (Qdrant) if corpus grows past low-millions of vectors,
  add a queue (instead of direct background functions) for ingestion and resume-analysis at high
  volume.

---

## 16. Open decisions — need your input before I create anything

| Decision | Options | My default if you don't have a preference |
|---|---|---|
| Supabase project region | Any region; matters for GDPR data residency and latency to your users | `eu-central-1` (Frankfurt) if you expect EU users, else `ap-south-1` to match your existing project's latency profile |
| Embedding provider | Voyage AI (1024-dim, free tier, RAG-tuned) vs OpenAI (`text-embedding-3-small`, 1536-dim) | Voyage AI — free tier covers MVP volume entirely, purpose-built for retrieval |
| LLM provider for generation/evaluation | Anthropic Claude (assumed, given this session) | Claude Haiku for Tutor/Coach/Email Drafter, Sonnet for Interviewer/Resume Analyzer/Benchmark |
| HIPAA scope | Does this product ever touch health-related data? | Assume **no** — build to GDPR only, skip BAA/paid-plan cost, unless you say otherwise |
| Anonymous access allowed? | Require login for all agents, or allow a limited anonymous/free trial mode | Require login (simpler RLS, matches "signup module" ask) |
| Diagnostic depth | How many questions should the Mentor ask before it commits to a roadmap? | 5-7 targeted questions (role, experience level, target companies/timeline, what's been tried, self-rated confidence per topic area) — enough signal without feeling like an intake form |

Once you confirm/adjust these, the next step is provisioning (new Supabase project + this schema
as a migration) and building the orchestrator + first two agents (Mentor, Tutor) — nothing gets
created until you say go.
