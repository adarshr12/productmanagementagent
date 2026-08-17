-- ============================================================================
-- Role-match + Kanban upgrade
--   - roadmap_steps.status: To Do / In Progress / Done (drives the Kanban board)
--   - intake_responses.role_matches: the AI's scored role recommendations
--   - roadmaps.role: which product role a roadmap was generated for
--   - completion view now counts steps in the 'done' column
-- ============================================================================

alter table roadmap_steps
  add column status text not null default 'todo'
  check (status in ('todo', 'in_progress', 'done'));

-- backfill existing steps from the old boolean
update roadmap_steps set status = case when is_completed then 'done' else 'todo' end;

alter table intake_responses add column role_matches jsonb;
alter table roadmaps add column role text;

create or replace view roadmap_completion as
select
  r.id                                                     as roadmap_id,
  r.title,
  r.created_at,
  count(s.*)                                               as total_steps,
  count(s.*) filter (where s.status = 'done')             as completed_steps,
  round(100.0 * count(s.*) filter (where s.status = 'done')
        / nullif(count(s.*), 0), 1)                        as completion_pct,
  r.role
from roadmaps r
left join roadmap_steps s on s.roadmap_id = r.id
group by r.id;

alter view roadmap_completion set (security_invoker = on);
