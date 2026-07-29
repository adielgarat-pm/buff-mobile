-- ============================================================================
-- capture-discovery.sql — does anyone outside this household find the Smart
--                         Organizer? (docs/sessions/smart-organizer-discovery)
--
-- Run each block separately (Supabase SQL editor or MCP execute_sql).
-- Read-only. Safe to run in production.
--
-- WHY THIS FILE EXISTS
-- --------------------
-- On 2026-07-29, the capture feature's problem was framed as "0% of parents come
-- back for a second run". The truth was worse and simpler: of 9 capture runs
-- EVER recorded, 8 were Adi's own family and 1 was a test account. Zero real
-- families had ever run it. The framing survived for days because nobody asked
-- WHO the 9 runs belonged to.
--
-- So block 1 is the baseline, and it excludes the house. Every later reading of
-- this feature's health re-runs the same query rather than trusting a memory of
-- what the number was.
-- ============================================================================

-- Families to exclude from every block below: the founder's own family and any
-- test account. Keep this list in one place so no block silently forgets it.
-- Adi's family: 37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8
-- Test account: 8f669dbf-fbca-4417-b834-7501c0477185 (ParentTest520)


-- ── 1. BASELINE — real usage, house excluded ────────────────────────────────
-- Taken 2026-07-29 before the discovery fix shipped. Expected result: all zeros.
-- If a later run still shows zeros, the fix did not work — that is the point.
select
  count(*)                                   as runs,
  count(distinct cr.family_id)               as families,
  count(*) filter (where cr.outcome = 'ok')  as parsed_ok,
  min(cr.created_at)::date                   as first_run,
  max(cr.created_at)::date                   as last_run
from capture_runs cr
where cr.family_id not in (
  '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8',
  '8f669dbf-fbca-4417-b834-7501c0477185'
);


-- ── 2. THE FUNNEL — where it breaks ─────────────────────────────────────────
-- The four stages, house excluded. Read the DROP between rows, not the rows.
--   entry_seen   → the card rendered on a dashboard
--   entry_tapped → the copy convinced her
--   capture_opened → the navigation survived
--   confirmed    → she went through with it
--
-- Reading guide (SPEC §3):
--   seen high, tapped ~0      → the copy is the problem, not the plumbing
--   tapped high, opened low   → navigation regression, look at the route
--   opened high, confirmed 0  → the screen itself loses her (parse wait? review?)
--   seen itself near zero     → parents are not reaching the dashboard at all;
--                               this feature is not the place to invest
with scoped as (
  select * from onboarding_events
  where family_id not in (
    '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8',
    '8f669dbf-fbca-4417-b834-7501c0477185'
  )
)
select
  '1. entry_seen'    as stage,
  count(*)           as events,
  count(distinct family_id) as families
from scoped where event_type = 'capture_entry_seen'
union all
select '2. entry_tapped', count(*), count(distinct family_id)
from scoped where event_type = 'capture_entry_tapped'
union all
select '3. capture_opened', count(*), count(distinct family_id)
from scoped where event_type = 'capture_opened'
union all
select '4. confirmed_run', count(*), count(distinct family_id)
from capture_runs
where outcome = 'confirmed'
  and family_id not in (
    '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8',
    '8f669dbf-fbca-4417-b834-7501c0477185'
  )
order by stage;


-- ── 3. THE CEILING — how many parents could possibly see any of this ────────
-- Context for every number above. On 2026-07-29 this returned 23 parents in 30
-- days and 4 in 7. A discovery fix inside the app cannot address more than this.
-- If block 2 shows a healthy rate against a tiny ceiling, the next investment is
-- distribution, not another in-app surface.
select
  (select count(*) from families) as families_total,
  (select count(distinct family_id) from profiles
    where role = 'parent' and last_seen_at > now() - interval '30 days') as parents_30d,
  (select count(distinct family_id) from profiles
    where role = 'parent' and last_seen_at > now() - interval '7 days')  as parents_7d;


-- ── 4. SANITY — is the session dedup holding? ───────────────────────────────
-- `capture_entry_seen` is deduped per app session in the client
-- (src/lib/parentCapture/entryTelemetry.ts). A family showing many events on one
-- day is not necessarily wrong — cold starts are separate sessions — but a family
-- showing dozens in one day means the dedup broke, and every rate above it is
-- then meaningless. Check this BEFORE drawing conclusions from block 2.
select
  family_id,
  occurred_at::date as day,
  count(*)          as seen_events
from onboarding_events
where event_type = 'capture_entry_seen'
group by family_id, occurred_at::date
having count(*) > 10
order by seen_events desc;
