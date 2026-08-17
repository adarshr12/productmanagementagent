-- ============================================================================
-- End-user accounts: link roadmaps + intakes to a Supabase Auth user.
-- Nullable, so anonymous roadmaps still work and get "claimed" on login.
-- Access stays server-mediated (service key), so no new RLS policies are needed.
-- ============================================================================

alter table roadmaps add column user_id uuid references auth.users(id);
alter table intake_responses add column user_id uuid references auth.users(id);
create index roadmaps_user_id_idx on roadmaps (user_id);
