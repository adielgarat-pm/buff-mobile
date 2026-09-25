-- first-win-funnel.sql — pkg/first-win measurement (docs/sessions/first-win/TESTS.md §A)
-- Read-only. Run in the Supabase SQL editor or via MCP execute_sql.
--
-- Definitions (Adi, 2026-09-24):
--   first win  = first completed, non-revoked daily_progress row whose source is
--                child_device, legacy NULL, view_as_child or onboarding_handoff (D1).
--                Never: onboarding_first_task, seed, parent.
--   primary    = first_win_48h among STRANGER families that created a child.
--   secondary  = the same, child_device only (independence).
--   stranger   = no parent with is_lifetime_access (proxy) AND not in the friend
--                list below AND not a concierge family (tapped the in-app call
--                offer or booked a call — pkg/concierge-call; reported as its own
--                'concierge' audience so founder coaching can't inflate the metric). Adi keeps the real list OUTSIDE the repo and pastes
--                family ids into `friend_ids` locally. Never commit ids.
--   timestamp  = least(first_task_complete event, first counted row). The event is
--                immutable (P0 onward); the row covers pre-P0 families and old app
--                builds. A row can only move later on re-mark, so least() is safe.
--
-- NULL trap: every source comparison is COALESCE-d. `source NOT IN (...)` silently
-- drops legacy NULL rows (first-win REVIEW.md F15).
--
-- Self-check (TESTS.md §B P0): on 2026-09-24 section 1 must reproduce the baseline:
--   51 real families since 2026-06-01, 5 first wins <=48h;
--   strangers with a child: 19, of which 2 with a first win <=48h.

-- ── Parameters ──────────────────────────────────────────────────────────────
with params as (
  select timestamptz '2026-06-01' as since
),
friend_ids(id) as (
  values (null::uuid)          -- paste Adi's friend family ids here, locally only
),
concierge_ids(id) as (
  values (null::uuid)          -- families who BOOKED a call with Adi (from Cal.com), locally only
),

-- ── Cohort: real families (same filter as REWARD_LOOP_2026-09.md §7) ────────
real_families as (
  select f.id, f.created_at, f.platform
  from families f
  left join auth.users u on u.id = f.created_by
  cross join params
  where f.created_at >= params.since
    and f.created_at <  now() - interval '48 hours'        -- full 48h window observed
    and coalesce(f.name,'')      !~* '(test|e2e|demo|dummy|qa)'
    and coalesce(u.email,'') not ilike '%buffadhd.com'
    and not exists (select 1 from profiles p2
                    where p2.family_id = f.id
                      and p2.display_name ~* '(test|e2e|demo|dummy|qa)')
),
fam as (
  select rf.*,
    (exists (select 1 from profiles p where p.family_id = rf.id and p.role = 'parent'
                                        and coalesce(p.is_lifetime_access, false))
     or rf.id in (select id from friend_ids where id is not null))            as is_friend,
    exists (select 1 from profiles p where p.family_id = rf.id and p.role = 'child') as has_child,
    -- pkg/concierge-call: founder-coached families are the H3 confound, so they
    -- get their own audience bucket (tapped the in-app offer, or booked).
    (exists (select 1 from onboarding_events e where e.family_id = rf.id
                                             and e.event_type = 'concierge_offer_tapped')
     or rf.id in (select id from concierge_ids where id is not null))         as is_concierge,
    -- first win = the earliest of (event, row). A row's completed_at can only
    -- move LATER when re-marked, never earlier, and pre-P0 families / old app
    -- builds have rows but no event, so least() is correct and coalesce() is not.
    -- Events only count while their child still has a non-revoked counted row
    -- (a first win the parent revoked is excluded on both paths).
    least(
      (select min(e.occurred_at) from onboarding_events e
        where e.family_id = rf.id and e.event_type = 'first_task_complete'
          and coalesce(e.source,'') in ('child_device','view_as_child','onboarding_handoff')
          and exists (select 1 from daily_progress d2
                      where d2.child_id = e.child_id and d2.completed and d2.revoked_at is null
                        and coalesce(d2.source,'child_device') in ('child_device','view_as_child','onboarding_handoff'))),
      (select min(dp.completed_at) from daily_progress dp
        where dp.family_id = rf.id and dp.completed and dp.revoked_at is null
          and coalesce(dp.source,'child_device') in ('child_device','view_as_child','onboarding_handoff'))
    ) as first_win_at,
    least(
      (select min(e.occurred_at) from onboarding_events e
        where e.family_id = rf.id and e.event_type = 'first_task_complete'
          and e.source = 'child_device'
          and exists (select 1 from daily_progress d2
                      where d2.child_id = e.child_id and d2.completed and d2.revoked_at is null
                        and coalesce(d2.source,'child_device') = 'child_device')),
      (select min(dp.completed_at) from daily_progress dp
        where dp.family_id = rf.id and dp.completed and dp.revoked_at is null
          and coalesce(dp.source,'child_device') = 'child_device')
    ) as first_child_device_at,
    (select min(e.occurred_at) from onboarding_events e
      where e.family_id = rf.id and e.event_type = 'child_first_open'
        and e.source = 'child_device') as child_open_own_device_at,
    -- view_as_child opens include a parent casually previewing, not only a handover
    (select min(e.occurred_at) from onboarding_events e
      where e.family_id = rf.id and e.event_type = 'child_first_open'
        and e.source = 'view_as_child') as child_open_parent_device_at
  from real_families rf
)

-- ── 1. Primary + secondary metric by signup month and friend/stranger ──────
select
  to_char(date_trunc('month', created_at), 'YYYY-MM')                    as signup_month,
  case when is_friend then 'friend'
       when is_concierge then 'concierge'
       else 'stranger' end                                               as audience,
  count(*)                                                               as families,
  count(*) filter (where has_child)                                      as with_child,
  count(*) filter (where has_child and first_win_at <= created_at + interval '48 hours')
                                                                         as first_win_48h,
  count(*) filter (where has_child and first_child_device_at <= created_at + interval '48 hours')
                                                                         as first_win_48h_child_device,
  count(*) filter (where child_open_own_device_at <= created_at + interval '48 hours')
                                                                         as child_open_own_device_48h,
  count(*) filter (where child_open_parent_device_at <= created_at + interval '48 hours')
                                                                         as child_screens_on_parent_device_48h
from fam
group by 1, 2
order by 1, 2;

-- ── 2. Post-save onboarding funnel (P0 events; families created after deploy) ─
-- select
--   count(distinct family_id) filter (where event_type = 'onboarding_step_reached' and variant = '5_preview')   as reached_5,
--   count(distinct family_id) filter (where event_type = 'onboarding_step_reached' and variant = '6_first_task') as reached_6,
--   count(distinct family_id) filter (where event_type = 'presence_answered' and method = 'together')            as said_together,
--   count(distinct family_id) filter (where event_type = 'presence_answered' and method = 'not_now')             as said_not_now,
--   count(distinct family_id) filter (where event_type = 'onboarding_step_reached' and variant = '7_access')     as reached_7,
--   count(distinct family_id) filter (where event_type = 'onboarding_step_reached' and variant = '8_complete')   as reached_8,
--   count(distinct family_id) filter (where event_type = 'onboarding_complete_cta')                              as tapped_final_cta,
--   count(distinct family_id) filter (where event_type = 'child_first_open')                                      as child_opened,
--   count(distinct family_id) filter (where event_type = 'first_task_complete'
--                                       and coalesce(source,'') <> 'onboarding_first_task')                       as first_win
-- from onboarding_events
-- where occurred_at >= '<P0 deploy date>';

-- ── 3. Per-family timeline (review weekly with Adi; minutes from signup) ────
-- select f.id, f.created_at::date, f.platform,
--   (select string_agg(e.event_type || coalesce(':' || e.variant, '') || coalesce(':' || e.method, '')
--                      || coalesce(':' || e.source, '') || ' +'
--                      || round(extract(epoch from e.occurred_at - f.created_at) / 60)::text || 'm',
--                      ' → ' order by e.occurred_at)
--      from onboarding_events e where e.family_id = f.id
--        and e.event_type not in ('parent_tab_viewed','insight_viewed','capture_entry_seen','activities_entry_seen')) as timeline
-- from families f where f.created_at >= '<P0 deploy date>' order by f.created_at;

-- ── 4. Counter-metrics (anti-gaming, TESTS.md §A) ───────────────────────────
-- Share of day 0–14 counted completions made on the parent's device, and families
-- whose counted completions were ALL on the parent's device (no child_device yet).
-- select
--   count(*) filter (where coalesce(dp.source,'child_device') in ('view_as_child','onboarding_handoff'))::numeric
--     / nullif(count(*), 0)                                       as share_parent_device_d0_14,
--   count(distinct dp.family_id) filter (where not exists (
--     select 1 from daily_progress d2 where d2.family_id = dp.family_id and d2.completed
--       and d2.revoked_at is null and coalesce(d2.source,'child_device') = 'child_device'))
--                                                                 as families_parent_device_only
-- from daily_progress dp join families f on f.id = dp.family_id
-- where f.created_at >= '<P0 deploy date>' and dp.completed and dp.revoked_at is null
--   and dp.completed_at <= f.created_at + interval '14 days'
--   and coalesce(dp.source,'child_device') in ('child_device','view_as_child','onboarding_handoff');
