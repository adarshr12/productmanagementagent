# PM/PjM/BA Knowledge Agent — Architecture & Build Plan

Solution-architect pass on a RAG-based assistant for product, project, business-analyst, ops and
other non-coding roles. Covers document ingestion, embeddings, vector DB choice, retrieval,
caching, auth/chat, voice, and the interview-practice agent — with a free-tier MVP path and a
scaling path once there are paying users.

---

## 1. System overview

```
                         ┌──────────────────────────────────────────┐
                         │              Frontend (Web)               │
                         │  Next.js — signup/login, chat UI, voice,  │
                         │  doc upload (admin), interview mode,      │
                         │  analysis-report view                    │
                         └───────────────┬────────────────────────────┘
                                          │ HTTPS
                         ┌───────────────▼────────────────────────────┐
                         │            API layer (Next.js API /        │
                         │            FastAPI backend)                │
                         │  - auth middleware                         │
                         │  - chat orchestration (RAG + agent tools)  │
                         │  - rate limiting / usage metering          │
                         └───────┬───────────────┬──────────────┬─────┘
                                 │               │              │
                    ┌────────────▼───┐   ┌───────▼──────┐  ┌────▼─────────┐
                    │ Postgres        │   │ Vector DB     │  │ Redis cache  │
                    │ (Supabase)      │   │ (pgvector →   │  │ (Upstash)    │
                    │ users, chats,   │   │  Qdrant later)│  │ embeddings + │
                    │ docs metadata,  │   │ chunk vectors │  │ LLM response │
                    │ interview logs  │   │ + metadata    │  │ cache        │
                    └─────────────────┘   └───────────────┘  └──────────────┘
                                 ▲
                         ┌───────┴────────────────────────────┐
                         │        Ingestion pipeline           │
                         │ upload → parse → clean → chunk →    │
                         │ embed → upsert (batch or on-upload) │
                         └──────────────────────────────────────┘
                                          │
                         ┌───────────────▼────────────────────┐
                         │     LLM provider (Claude / GPT)      │
                         │  generation, evaluation, agent loop  │
                         └───────────────────────────────────────┘
```

---

## 2. Answers to your specific questions (quick reference)

| Question | Recommendation |
|---|---|
| Where to upload docs | Admin-only upload screen in the app → object storage (Supabase Storage, free 1GB) → triggers ingestion job |
| Chunk size (tokens) | 400–600 tokens per chunk, ~15% overlap (60–90 tokens). Smaller (200–300) for FAQ/Q&A style content, larger (600–800) for long-form blogs |
| Embedding model | Start with **open-source `BAAI/bge-small-en-v1.5`** (384-dim, free, runs on CPU) or **`bge-base-en-v1.5`** (768-dim) for better recall. Upgrade path: **OpenAI `text-embedding-3-small`** (1536-dim, $0.02/1M tokens) once budget allows — noticeably better retrieval quality |
| Vector size | 384 (bge-small) or 1536 (OpenAI 3-small) depending on choice above — pick one and don't mix models in the same index |
| Algorithm to build embeddings | Sentence-transformers bi-encoder (bge/e5 family) for chunk + query embeddings; optionally add a cross-encoder reranker (`bge-reranker-base`) on top-k results before sending to the LLM |
| Vector DB | **pgvector inside your existing Supabase Postgres** for MVP (free, zero extra infra, HNSW index support). Migrate to **Qdrant** (self-host free or Qdrant Cloud free 1GB) when you outgrow Postgres write/read latency at scale |
| How to pull out data | Vector similarity search (cosine) top-k (8–15) → optional BM25 keyword search in parallel (hybrid) → merge/rerank → top 4–6 chunks into the LLM context window |
| Ingestion pipeline | See §4 below — parse → clean → chunk → embed → upsert, idempotent per document version |
| Caching | Redis: (a) cache embeddings by content hash so re-ingesting unchanged docs is free, (b) cache LLM responses for identical/near-identical queries, (c) cache session/user context |

---

## 3. Free-tier MVP stack

Everything below has a genuinely free tier sufficient for a prototype + first ~100s of users.

| Layer | Choice | Why |
|---|---|---|
| Frontend hosting | **Vercel** (free) | Next.js first-class, generous free tier, edge functions |
| Frontend framework | **Next.js 14 (App Router) + Tailwind** | SSR for SEO on your existing content site, React ecosystem |
| Auth | **Supabase Auth** (free) | Email/password + OAuth (Google) out of the box, integrates directly with the same Postgres you'll use for data |
| Relational DB | **Supabase Postgres** (free, 500MB) | Users, chat sessions, messages, document metadata, interview-practice logs |
| Vector DB | **pgvector extension on the same Supabase Postgres** | No separate service to run/pay for at MVP scale; HNSW/IVFFlat index; good up to low-single-digit millions of vectors |
| Object storage | **Supabase Storage** (free 1GB) | Raw uploaded PDFs/docs/blog exports |
| Embeddings (MVP) | **bge-small-en-v1.5** via `sentence-transformers`, run in your own ingestion worker (CPU is fine) | $0 cost, decent quality for a focused PM/BA corpus |
| LLM (chat + agent) | **Claude Haiku 4.5** for most turns, **Claude Sonnet 5** for interview evaluation/analysis reports | Cheap + fast for everyday Q&A, stronger model reserved for judged/scored tasks |
| Cache | **Upstash Redis** (free tier) | Embedding cache + response cache + rate limiting counters |
| Background jobs (ingestion) | **Supabase Edge Functions** or a small **FastAPI worker on Render free tier** | Parses/chunks/embeds uploaded docs asynchronously |
| Voice (STT/TTS) | **Web Speech API** (browser-native, free) for MVP; upgrade to Whisper API / ElevenLabs later | Zero cost, works today in Chrome/Edge |
| Observability | **Sentry free tier** + Supabase logs | Error tracking without extra spend |

**Total infra cost at MVP: $0–5/mo** (only real spend is LLM API calls, pay-as-you-go).

---

## 4. Data ingestion pipeline

1. **Upload** — admin uploads PDF/DOCX/MD/HTML/blog export via the app → stored in Supabase
   Storage → row inserted in `documents` table (`status = pending`).
2. **Parse** — worker picks up the job (queue table or Supabase Edge Function trigger):
   - PDFs → `pymupdf` / `unstructured`
   - DOCX → `python-docx` / `unstructured`
   - Blog/HTML → `readability` + `BeautifulSoup` to strip nav/boilerplate
3. **Clean** — strip headers/footers, dedupe boilerplate, normalize whitespace, detect language.
4. **Chunk** — recursive splitter (LangChain's `RecursiveCharacterTextSplitter` or a hand-rolled
   token-based splitter using `tiktoken`) at 400–600 tokens, 15% overlap. Split on semantic
   boundaries first (headings, paragraphs) before falling back to hard token limits.
5. **Tag metadata per chunk** — `source_doc_id`, `title`, `topic` (product/project/BA/ops/
   interview/etc.), `content_type` (blog/framework/interview-QA/case-study), `url`, `created_at`.
   This metadata is what lets you filter retrieval by role/topic later.
6. **Embed** — batch chunks through the embedding model (cache by SHA-256 of chunk text in Redis
   so unchanged content is never re-embedded).
7. **Upsert** — write `(vector, metadata, chunk_text)` into pgvector table, keyed by
   `chunk_id = hash(doc_id + chunk_index)` so re-ingestion is idempotent (update, not duplicate).
8. **Mark document `status = indexed`**, store chunk count + embedding model version used (so you
   can detect and re-embed everything if you switch embedding models later).

### Suggested schema (Postgres + pgvector)

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text, source_type text, topic text[],
  storage_path text, status text default 'pending',
  embedding_model text, created_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index int, content text,
  embedding vector(384),          -- match your embedding model's dim
  topic text[], content_type text,
  created_at timestamptz default now()
);

create index on chunks using hnsw (embedding vector_cosine_ops);
```

---

## 5. Retrieval strategy

- **Hybrid search**: vector similarity (cosine, top 10–15) + Postgres full-text search (`tsvector`)
  for keyword hits, merged and deduped.
- **Metadata filters**: if the user's question implies a role ("as a BA...") or mode (interview
  practice vs. concept explanation), filter/boost by `topic`/`content_type` before ranking.
- **Rerank**: cross-encoder (`bge-reranker-base`, free/local) on the merged candidates, keep top
  4–6 chunks — this matters a lot once you have hundreds of docs, since raw cosine similarity
  alone gets noisy.
- **Context assembly**: top chunks + short conversation history + system prompt defining tone/role
  → sent to the LLM. Keep total context lean (relevance > recall) to control cost and reduce
  hallucination.
- **Answer with citations**: return which source doc(s) backed the answer — builds trust and lets
  users click through to your original content (good for driving traffic back to your site too).

---

## 6. Agent layer (beyond plain RAG)

Three agent "modes" on top of the same retrieval core:

1. **Concept Q&A** — standard RAG: retrieve → answer → cite sources.
2. **Interview practice loop** — stateful multi-turn agent:
   `user picks/gets a question → user answers → agent retrieves relevant frameworks/model answers
   → evaluates the user's answer (rubric: structure, clarity, use of frameworks, examples) → gives
   a scored critique + an improved model answer → user retries → repeat.`
   Use the stronger model (Sonnet) here since evaluation quality matters most; store each attempt
   in `interview_attempts` so the user (and you) can see improvement over time.
3. **Analysis / benchmarking report** — user answers a set of questions or uploads their approach
   to a case; agent compares against your curated "top PM" reference answers/frameworks in the
   corpus and produces a structured gap-analysis report (strengths, gaps, suggested resources from
   your own content).

Implementation-wise this is just system-prompt + tool orchestration on top of the same retrieval
pipeline — no need for a heavyweight agent framework at MVP. Claude's native tool-use (function
calling) is enough: one tool = `search_knowledge_base(query, topic_filter)`, one tool =
`log_interview_attempt(...)`. Add the Claude Agent SDK later only if you need more complex
multi-step planning.

---

## 7. Chat, auth, voice

- **Auth**: Supabase Auth (email/password + Google OAuth). JWT passed to API layer; row-level
  security in Postgres so users only see their own chats/attempts.
- **Chat**: streaming responses (SSE or Vercel AI SDK) for a fast-feeling UI; persist
  `chat_sessions` + `messages` tables so users can resume prior conversations (your "context
  window" requirement — keep last N turns + a rolling summary of older turns once the conversation
  gets long, so cost doesn't blow up).
- **Voice**: browser Web Speech API for STT input and TTS output at MVP (free, no server round
  trip). When you need multi-language or better accuracy, swap STT to Whisper API and TTS to
  ElevenLabs/OpenAI TTS — both drop-in without changing the surrounding architecture.

---

## 8. Caching strategy

- **Embedding cache** (Redis, key = content hash): skip re-embedding unchanged chunks on re-runs.
- **Response cache** (Redis, key = hash of normalized query + topic filter): short TTL (e.g. 1h)
  for common/FAQ-style questions — cuts LLM spend meaningfully once you have real traffic.
- **Retrieval cache**: cache the top-k chunk IDs for a query hash separately from the final LLM
  answer, so you can regenerate answers (e.g. after a prompt tweak) without re-running retrieval.

---

## 9. Scaling path (once you have paying users / real traffic)

| Concern | MVP (free) | Scaled |
|---|---|---|
| Vector DB | pgvector on Supabase | Qdrant Cloud (managed) or self-hosted Qdrant/Weaviate cluster — better ANN performance, filtering, horizontal scale past a few million vectors |
| Relational DB | Supabase free (500MB) | Supabase Pro / dedicated Postgres, read replicas |
| Embeddings | Local bge-small (CPU) | OpenAI `text-embedding-3-small/large` or Cohere embed-v3, or self-hosted GPU inference for bge-large at volume |
| Ingestion | Single worker | Queue-based (SQS/Cloud Tasks) + horizontally scaled workers |
| Caching | Upstash free | Upstash paid tier / dedicated Redis cluster |
| LLM | Pay-as-you-go Anthropic API | Same, add prompt caching (Anthropic supports this natively — cache your system prompt + retrieved context prefix to cut repeat-cost significantly) |
| Observability | Sentry free + logs | Add proper tracing (e.g. Langfuse/Helicone) for LLM call tracing, latency, cost per user |
| Eval | Manual spot-checks | Automated retrieval/answer eval harness (RAGAS-style: faithfulness, answer relevance, context precision) run against a golden set before shipping prompt/model changes |

Migration between tiers is designed to be non-disruptive: metadata schema stays the same, only the
vector store backend and embedding model change — plan one "re-embed all chunks" job for whenever
you switch embedding models (dimension changes require a full re-index, so batch this
deliberately rather than incrementally).

---

## 10. Suggested build order

1. **Phase 0** — ingestion pipeline + pgvector store + a bare-bones retrieval script (no UI yet).
   Validate retrieval quality against a handful of real PM questions before building anything else.
2. **Phase 1** — auth + chat UI + streaming RAG answers with citations.
3. **Phase 2** — interview-practice loop (question bank + evaluation agent).
4. **Phase 3** — voice input/output.
5. **Phase 4** — analysis/benchmarking reports vs. "top PM" reference answers.
6. **Phase 5** — scale-out per §9 once usage justifies it.
