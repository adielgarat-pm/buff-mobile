-- onboarding-funnel.sql — where families leak in the onboarding wizard.
--
-- Background: `family_created` fires at signup, but the child is only persisted
-- at Step 5 (`child_created`). `onboarding_step_reached` (variant = step id) is
-- logged once per family per session on each data-entry step mount. This lets us
-- DERIVE the drop step: the deepest step a family reached without ever creating
-- a child. See src/hooks/useStepReachedLog.ts and
-- docs/sessions/onboarding-draft-and-funnel-telemetry/.
--
-- Run in the Supabase SQL editor (admin) or via the MCP execute_sql tool.

-- ── 1. Step-by-step reach counts (distinct families), last 60 days ──────────
-- How many families reached each wizard step. The gap between consecutive
-- steps is the inter-step leak.
select
  variant                              as step,
  count(distinct family_id)            as families_reached
from onboarding_events
where event_type = 'onboarding_step_reached'
  and occurred_at >= now() - interval '60 days'
group by variant
order by step;

-- ── 2. Reached the wizard vs. actually created a child ──────────────────────
-- The headline funnel: of families that entered the wizard (any step_reached),
-- how many fired child_created. The complement is the "family, no child" leak.
with reached as (
  select distinct family_id
  from onboarding_events
  where event_type = 'onboarding_step_reached'
    and occurred_at >= now() - interval '60 days'
),
created as (
  select distinct family_id
  from onboarding_events
  where event_type = 'child_created'
)
select
  (select count(*) from reached)                                     as entered_wizard,
  (select count(*) from reached r where exists
     (select 1 from created c where c.family_id = r.family_id))      as created_child,
  (select count(*) from reached r where not exists
     (select 1 from created c where c.family_id = r.family_id))      as abandoned_no_child;

-- ── 3. Drop step for abandoners ─────────────────────────────────────────────
-- For families that entered the wizard but never created a child, what is the
-- deepest step they reached? This is the actionable signal: cluster at
-- '1_child_profile' vs '4_motivator' calls for very different fixes.
with created as (
  select distinct family_id from onboarding_events where event_type = 'child_created'
),
abandoners as (
  select e.family_id, max(e.variant) as deepest_step
  from onboarding_events e
  where e.event_type = 'onboarding_step_reached'
    and e.occurred_at >= now() - interval '60 days'
    and not exists (select 1 from created c where c.family_id = e.family_id)
  group by e.family_id
)
select deepest_step, count(*) as families_abandoned_here
from abandoners
group by deepest_step
order by deepest_step;

-- ── 4. Split by platform (Android native vs Expo Web) ───────────────────────
-- Web loses nav params on refresh/tab-close, so its drop profile can differ.
select
  platform,
  variant as step,
  count(distinct family_id) as families_reached
from onboarding_events
where event_type = 'onboarding_step_reached'
  and occurred_at >= now() - interval '60 days'
group by platform, variant
order by platform, step;
