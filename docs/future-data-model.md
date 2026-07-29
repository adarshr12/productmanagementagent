# Future Data Model — Enterprise Blueprint (NOT built in v0)

This document exists so your longer-term thinking is captured and shareable with
clients/investors. **None of the tables below are built in v0.** They are the map
for *later*, once there are real users and real demand. The point of writing this
down is to prove one thing: the lean v0 schema does **not** paint us into a corner —
every enterprise capability bolts onto what we're building now, without a rewrite.

> Golden rule we're following: build the machinery for a capability only when there
> is a real user for it. Today there is one account (you, the admin) and anonymous
> public visitors — so roles, tenants, credits, memory, and chat have nobody to
> attach to yet.

---

## How today's 6 tables grow into the enterprise model

| v0 table (built now) | Grows into / gains later |
|---|---|
| `documents`, `chunks` | Gain a nullable `tenant_id` so each client org has its own knowledge base. Nothing else changes. |
| `intake_responses` | Optionally links to a real `user_id` once end-users have logins. Stays valid for anonymous use too. |
| `roadmaps`, `roadmap_steps` | Gain `user_id` / `tenant_id`; feed the `generated_documents`, `feedback`, and `usage_events` tables. |
| `rate_limits` | Replaced or supplemented by per-tenant `credits` accounting. |

The only structural change to existing tables is **adding nullable columns**
(`tenant_id`, `user_id`) — a cheap, non-breaking operation in Postgres.

---

## The enterprise tables (build later, in roughly this order)

### Group A — Identity & multi-tenancy
Separated into small tables on purpose (your instinct was right: don't cram user +
role + permission into one table).

- **`tenants`** — one row per client organization.
  `id, name, slug, plan, status, created_at, updated_at`
- **`users`** — one row per human. (Mirrors Supabase `auth.users`, adds profile.)
  `id (=auth uid), email, full_name, avatar_url, created_at, updated_at`
- **`tenant_members`** — which users belong to which tenant (many-to-many).
  `id, tenant_id, user_id, invited_by, joined_at`
- **`roles`** — named roles, scoped per tenant (e.g. Owner, Admin, Coach, Member).
  `id, tenant_id, name, description, is_system, created_at`
- **`permissions`** — the atomic capabilities (e.g. `documents.upload`,
  `roadmaps.view_all`, `billing.manage`).
  `id, key, description`
- **`role_permissions`** — which permissions each role grants (many-to-many).
  `role_id, permission_id`
- **`member_roles`** — which roles a tenant member holds (many-to-many).
  `tenant_member_id, role_id`

> This 4-table split (roles / permissions / role_permissions / member_roles) is the
> standard, scalable RBAC shape. It lets you add a permission without touching users,
> and change a user's access without touching roles.

### Group B — Credits & billing
- **`credit_wallets`** — current balance per tenant (or per user).
  `id, tenant_id, balance, updated_at`
- **`credit_ledger`** — append-only history of every credit change (grant, spend,
  refund). Balance is derived from this; never edit rows, only add them.
  `id, wallet_id, delta, reason, related_entity, created_at`
- **`credit_products`** — what a credit buys and what actions cost.
  `id, action_key, cost, description`

### Group C — Conversation, context & memory
(Only relevant once the product becomes a back-and-forth assistant — v0 is a
one-shot form, so none of this applies yet.)

- **`conversations`** — a chat thread per user.
  `id, user_id, tenant_id, title, created_at, updated_at`
- **`messages`** — every turn in a conversation.
  `id, conversation_id, role (user/assistant), content, token_count, created_at`
- **`memories`** — durable facts about a user that persist across conversations
  (e.g. "targeting Product Analyst roles, weak on SQL"), each optionally embedded
  for retrieval. `id, user_id, kind, content, embedding, created_at, updated_at`
- **`context_snapshots`** — rolling summaries of long threads so cost stays bounded.
  `id, conversation_id, summary, up_to_message_id, created_at`

### Group D — Outputs, feedback & analytics
- **`generated_documents`** — stored artifacts produced for a user (multiple per
  user), e.g. exported roadmaps, reports.
  `id, user_id, tenant_id, kind, storage_path, meta, created_at`
- **`feedback`** — thumbs up/down and comments on any response or roadmap.
  `id, user_id, target_type, target_id, rating, comment, created_at`
- **`usage_events`** — one row per meaningful action (roadmap generated, step
  completed, document downloaded). Powers "how many times did the product respond,"
  retention, and per-tenant analytics.
  `id, tenant_id, user_id, event_type, entity_id, metadata, created_at`

---

## Cross-cutting conventions (already applied in v0 where they're cheap)

- **Every table** has `created_at` and, where it can change, `updated_at`
  (auto-stamped). v0 already does this.
- **Tenancy isolation** will be enforced with Row-Level Security keyed on
  `tenant_id` — the same RLS mechanism v0 already turns on.
- **Ledgers are append-only** (credits, usage) — you get history and auditability
  for free, and never lose data to an overwrite.
- **Embeddings live in the same Postgres** via pgvector (no separate vector DB),
  exactly as v0 does — so "vectors in the same database" scales with you.

---

## What NOT to do

Do not build any of Groups A–D until a concrete, paying need forces it. Building
RBAC, multi-tenancy, or a credit system before the core metric (do people finish
their roadmaps?) is validated is the most common way early products waste months on
plumbing nobody uses yet.
