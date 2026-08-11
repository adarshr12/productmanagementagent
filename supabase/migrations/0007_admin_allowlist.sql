-- ============================================================================
-- Admin allowlist
--   verifyAdmin previously only checked "is this a valid logged-in Supabase
--   user" -- fine while the only Supabase users were admins, but that breaks
--   the moment public sign-up ships (any signed-up visitor would then pass).
--   admin_users is an explicit allowlist checked in addition to a valid
--   session. No RLS policy on purpose, same pattern as intake_responses/
--   roadmaps -- only the server's service-role key reaches this table. The
--   owner adds more admins later via SQL (or a future admin-only UI), never
--   through the public app.
-- ============================================================================

create table admin_users (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

insert into admin_users (user_id, email)
values ('c6bd842a-b11f-49cc-a97e-867ebeb57361', 'adarshrajoria11303@gmail.com');
