# Career-Transition Roadmap — v0 (MVP)

A small web app that gives people a personalized, step-by-step learning roadmap to
move into **Product Manager, Project Manager, Product Analyst, or Business Analyst**
roles in India — grounded in a curated library of resources the owner uploads.

This is a deliberately narrow v0. See `docs/future-data-model.md` for the (not yet
built) enterprise direction.

## What it does

1. **Admin page** (`/admin`) — you log in and upload PDF/DOCX/TXT resources.
2. **Ingestion** — each file is parsed, split into ~500-token chunks, embedded with
   Voyage AI, and stored in Supabase (pgvector).
3. **Public intake form** (`/`) — a fixed 12-question form, no login required.
4. **Roadmap generation** — on submit, the app retrieves the most relevant chunks
   and makes ONE Groq call to produce a personalized roadmap, shown at a shareable
   link (`/r/<token>`).
5. **Progress tracking** — visitors tick steps complete; you see completion rates at
   `/admin/completions` (your core success metric).

## Tech

- **Next.js** (pages + JS API) and a **Python** ingestion function — hosted on
  **Vercel** (subdomain of your domain; your existing Netlify site is untouched).
- **Supabase** — Postgres + pgvector + Auth, with Row-Level Security on every table.
- **Voyage AI** (`voyage-3.5-lite`) for embeddings · **Groq**
  (`llama-3.3-70b-versatile`) for the roadmap.

## Architecture notes

- The roadmap logic is a self-contained API (`POST /api/roadmap`) — a future mobile
  app can call the exact same endpoint. The web pages are a thin layer on top.
- **No secrets in the browser.** The service-role key, Voyage key, and Groq key are
  server-only environment variables. The browser only ever gets the public Supabase
  URL + anon key (used solely for admin login).
- Public visitors never touch the database directly — all reads/writes go through
  server endpoints. RLS is on everywhere as a second line of defense.

## Setup

1. **Database** — follow `supabase/README.md` (run the migration, create your admin
   user, enable email login).
2. **Environment variables** — copy `.env.example` to `.env.local` and fill in your
   Supabase, Voyage, and Groq keys. On Vercel, add the same variables in
   Project → Settings → Environment Variables.
3. **Install & run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000 (public form) and http://localhost:3000/admin.
4. **Sanity-check quality** — see `evals/README.md` (`npm run eval`).

## Deploy (Vercel)

1. Push this repo to GitHub and import it into Vercel.
2. Add all environment variables from `.env.example` (real values).
3. Point a subdomain (e.g. `start.yourdomain.com`) at the Vercel project via DNS.

### Note on the Python ingestion function

`api/ingest.py` runs on Vercel's Python runtime (declared via `requirements.txt` and
`vercel.json`). It does **not** run under plain `npm run dev` — to test ingestion
locally, use `vercel dev`, or just test it on the deployed site. Roadmap generation
and everything else work under `npm run dev`.

## Project layout

```
prompts/     editable system prompt(s)
evals/       hand-run quality checks
supabase/    database migration + setup guide
api/         Python ingestion function (Vercel)
src/app/     pages + JS API routes
src/lib/     shared server helpers
docs/        architecture + future data-model blueprint
```
