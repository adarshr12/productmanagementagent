# Supabase setup

This folder holds the database schema for the app.

## What's here

- `migrations/0001_init.sql` — creates all 6 tables, security rules (Row-Level
  Security), the vector-search function, and the completion-rate view.

## How to apply it (one-time, ~2 minutes)

1. Go to your Supabase project → **SQL Editor**.
2. Open a **New query**.
3. Copy the entire contents of `migrations/0001_init.sql` and paste it in.
4. Click **Run**.

That's it. You should see the tables under **Table Editor**.

## Enable email/password login (for the admin page)

1. Supabase → **Authentication** → **Providers** → make sure **Email** is enabled.
2. Supabase → **Authentication** → **Users** → **Add user** → create ONE user with
   your email + a password. That's your admin login. (There is no public sign-up.)

## Notes

- The `chunks.embedding` column is sized `vector(1024)` to match `voyage-3.5-lite`.
  If you ever switch embedding models, change **both** the column size here and
  `VOYAGE_DIM` in your environment variables, then re-embed existing documents.
- You do not need Supabase Storage for v0 — uploaded files are parsed in memory
  during ingestion and only the extracted chunks are stored.
