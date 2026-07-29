-- ============================================================================
-- insight-usage.sql — value report for the AI coach insight (dashboard-ai-insight)
--
-- Run each block separately (Supabase SQL editor or MCP execute_sql).
-- Read-only. Safe to run in production.
--
-- North Star:  Insight-Attributed Action Rate (72h) — of the insights a parent
--              was SHOWN, how many were followed within 72h by the specific
--              action the insight asked for. A thumbs-up is politeness; an
--              action is value.
--
-- Supporting:  Delivery Rate  = generated / eligible      (does it fire?)
--              Eligibility    = eligible / active          (can it fire at all?)
--              View Rate      = viewed / generated         (does it reach a screen?)
--              Vote sentiment = 👍 / (👍+👎)
--              Activity Lift  = child's active days 7d AFTER vs 7d BEFORE
--
-- WHY THIS IS A REPORT AND NOT CLIENT INSTRUMENTATION
-- ---------------------------------------------------
-- `smart_insight_feedback` ships columns for this (tasks_added, rewards_added,
-- wow_delta, category_delta) and they are 100% NULL — nothing ever wrote them
-- (red team 2026-07-28, F4). Rather than wire five client write-paths, note that
-- four of them are DERIVABLE after the fact from state we already keep:
--
--     set-anchor / add-task  -> public.tasks.created_at
--     open-rewards           -> public.store_rewards.created_at
--     send-sticker           -> public.stickers.created_at
--     (activity lift)        -> public.daily_progress
--
-- Deriving them costs nothing, carries zero client risk, and works RETROACTIVELY
-- on every insight ever generated. The columns stay unused on purpose.
--
-- The two things that are NOT derivable — a card being rendered and a button
-- being tapped — leave no trace in any table, so those (and only those) are
-- logged as events: `insight_viewed` / `insight_cta_clicked` in
-- public.onboarding_events, source = 'dashboard' | 'insights_screen'
-- (src/hooks/useInsightViewLog.ts). 'send-bonus' is in the second group by
-- necessity: bonuses mutate credit_vault.total_balance with no ledger row, so a
-- bonus cannot be dated from state at all.
--
-- CAVEAT ON n: as of 2026-07-28 this reads 3 insights across 3 children. Every
-- rate below is a FACT ABOUT WHAT HAPPENED, not an estimate of what will happen.
-- Do not extrapolate from a denominator this small.
-- ============================================================================


-- ── 1. Eligibility — can the feature fire at all? ───────────────────────────
-- The auto-generate gate is `activeDays >= 2` (src/hooks/useAutoCoachInsight.ts).
-- This block sizes the population that gate admits. Red team F2: if
-- eligible_children is a small fraction of active_children, the feature is gated
-- on the very behaviour it is supposed to produce, and no amount of prompt work
-- will move the North Star.
WITH kids AS (
  SELECT p.id, p.family_id
  FROM public.profiles p
  WHERE p.role = 'child' AND COALESCE(p.is_deleted, false) = false
),
act AS (
  SELECT dp.child_id, count(DISTINCT dp.date) AS days_14
  FROM public.daily_progress dp
  WHERE dp.date::date > CURRENT_DATE - 14
  GROUP BY 1
)
SELECT
  count(*)                                                    AS children_total,
  count(*) FILTER (WHERE COALESCE(a.days_14, 0) > 0)          AS active_children_14d,
  count(*) FILTER (WHERE COALESCE(a.days_14, 0) >= 2)         AS eligible_children,
  round(100.0 * count(*) FILTER (WHERE COALESCE(a.days_14, 0) >= 2)
        / NULLIF(count(*) FILTER (WHERE COALESCE(a.days_14, 0) > 0), 0), 1)
                                                              AS eligibility_pct
FROM kids k
LEFT JOIN act a ON a.child_id = k.id;


-- ── 2. Delivery + View funnel ───────────────────────────────────────────────
-- generated -> viewed -> voted -> cta clicked.
-- `viewed` counts DISTINCT (child, insight date) so a parent re-opening the
-- dashboard cannot inflate it; the client already de-dupes per JS session, this
-- is the belt to that suspenders.
WITH generated AS (
  SELECT ci.child_id, ci.computed_at::date AS insight_date
  FROM public.child_insights ci
  WHERE ci.smart_insight IS NOT NULL
),
viewed AS (
  SELECT DISTINCT e.child_id, e.variant AS insight_date, e.source
  FROM public.onboarding_events e
  WHERE e.event_type = 'insight_viewed'
),
clicked AS (
  SELECT DISTINCT e.child_id, e.variant AS cta_type, e.source
  FROM public.onboarding_events e
  WHERE e.event_type = 'insight_cta_clicked'
)
SELECT
  (SELECT count(*) FROM generated)                                  AS generated,
  (SELECT count(*) FROM viewed)                                     AS viewed,
  round(100.0 * (SELECT count(*) FROM viewed)
        / NULLIF((SELECT count(*) FROM generated), 0), 1)           AS view_rate_pct,
  (SELECT count(*) FROM public.smart_insight_feedback
    WHERE explicit_vote IS NOT NULL)                                AS votes,
  (SELECT count(*) FROM clicked)                                    AS cta_clicks,
  round(100.0 * (SELECT count(*) FROM clicked)
        / NULLIF((SELECT count(*) FROM viewed), 0), 1)              AS cta_rate_pct;


-- ── 3. North Star — Insight-Attributed Action Rate (72h) ────────────────────
-- "Did the parent do the thing the insight asked for, within 72h of it being
-- computed?" Each cta_type maps to the table that records its action. An insight
-- whose cta_type has no observable action ('none' / 'start-conversation' — the
-- action is an in-person conversation) is EXCLUDED from the denominator rather
-- than counted as a miss: we cannot see an IRL talk, and scoring it as failure
-- would understate the feature.
--
-- 'send-bonus' resolves via the click event only (no ledger to date a bonus).
WITH ins AS (
  SELECT ci.child_id,
         p.family_id,
         ci.computed_at,
         COALESCE(ci.smart_insight ->> 'cta_type', 'none') AS cta_type
  FROM public.child_insights ci
  JOIN public.profiles p ON p.id = ci.child_id
  WHERE ci.smart_insight IS NOT NULL
    AND ci.computed_at IS NOT NULL
),
scored AS (
  SELECT i.*,
         CASE i.cta_type
           WHEN 'set-anchor' THEN EXISTS (
             SELECT 1 FROM public.tasks t
             WHERE t.assigned_to = i.child_id
               AND t.created_at > i.computed_at
               AND t.created_at <= i.computed_at + interval '72 hours')
           WHEN 'open-rewards' THEN EXISTS (
             SELECT 1 FROM public.store_rewards r
             WHERE r.child_id = i.child_id
               AND r.created_at > i.computed_at
               AND r.created_at <= i.computed_at + interval '72 hours')
           WHEN 'send-sticker' THEN EXISTS (
             SELECT 1 FROM public.stickers s
             WHERE s.to_child_id = i.child_id
               AND s.created_at > i.computed_at
               AND s.created_at <= i.computed_at + interval '72 hours')
           WHEN 'send-bonus' THEN EXISTS (
             SELECT 1 FROM public.onboarding_events e
             WHERE e.child_id = i.child_id
               AND e.event_type = 'insight_cta_clicked'
               AND e.variant = 'send-bonus'
               AND e.occurred_at > i.computed_at
               AND e.occurred_at <= i.computed_at + interval '72 hours')
           ELSE NULL          -- unobservable CTA: excluded, not failed
         END AS acted
  FROM ins i
)
SELECT
  count(*)                                        AS insights_total,
  count(*) FILTER (WHERE acted IS NOT NULL)       AS insights_scoreable,
  count(*) FILTER (WHERE acted)                   AS insights_acted_on,
  round(100.0 * count(*) FILTER (WHERE acted)
        / NULLIF(count(*) FILTER (WHERE acted IS NOT NULL), 0), 1)
                                                  AS attributed_action_rate_pct
FROM scored;


-- ── 3b. Same, broken out by cta_type — which recommendation actually lands ──
WITH ins AS (
  SELECT ci.child_id, ci.computed_at,
         COALESCE(ci.smart_insight ->> 'cta_type', 'none') AS cta_type
  FROM public.child_insights ci
  WHERE ci.smart_insight IS NOT NULL AND ci.computed_at IS NOT NULL
)
SELECT cta_type,
       count(*) AS insights,
       min(computed_at::date) AS first_seen,
       max(computed_at::date) AS last_seen
FROM ins
GROUP BY 1
ORDER BY 2 DESC;


-- ── 4. Post-Insight Activity Lift ───────────────────────────────────────────
-- The metric that would justify the price: does an insight buy an extra active
-- day? Compares the child's active days in the 7d AFTER the insight against the
-- 7d BEFORE. Positive mean = the insight moved behaviour.
--
-- Confound to keep in mind: insights are generated FOR active children
-- (activeDays >= 2), so the "before" window is selected for activity and
-- regression to the mean pushes this negative. Treat a flat result as neutral,
-- not as failure, until n is large enough to compare against a control.
WITH ins AS (
  SELECT ci.child_id, ci.computed_at
  FROM public.child_insights ci
  WHERE ci.smart_insight IS NOT NULL AND ci.computed_at IS NOT NULL
),
windows AS (
  SELECT i.child_id,
         i.computed_at::date AS insight_date,
         (SELECT count(DISTINCT dp.date) FROM public.daily_progress dp
           WHERE dp.child_id = i.child_id
             AND dp.date::date >  i.computed_at::date - 7
             AND dp.date::date <= i.computed_at::date)          AS days_before,
         (SELECT count(DISTINCT dp.date) FROM public.daily_progress dp
           WHERE dp.child_id = i.child_id
             AND dp.date::date >  i.computed_at::date
             AND dp.date::date <= i.computed_at::date + 7)      AS days_after
  FROM ins i
)
SELECT child_id, insight_date, days_before, days_after,
       days_after - days_before AS lift
FROM windows
ORDER BY insight_date DESC;

-- Aggregate lift (run after 4 for the headline number).
WITH ins AS (
  SELECT ci.child_id, ci.computed_at
  FROM public.child_insights ci
  WHERE ci.smart_insight IS NOT NULL AND ci.computed_at IS NOT NULL
),
windows AS (
  SELECT (SELECT count(DISTINCT dp.date) FROM public.daily_progress dp
           WHERE dp.child_id = i.child_id
             AND dp.date::date >  i.computed_at::date - 7
             AND dp.date::date <= i.computed_at::date)          AS days_before,
         (SELECT count(DISTINCT dp.date) FROM public.daily_progress dp
           WHERE dp.child_id = i.child_id
             AND dp.date::date >  i.computed_at::date
             AND dp.date::date <= i.computed_at::date + 7)      AS days_after
  FROM ins i
)
SELECT count(*)                                  AS insights,
       round(avg(days_before), 2)                AS avg_days_before,
       round(avg(days_after), 2)                 AS avg_days_after,
       round(avg(days_after - days_before), 2)   AS avg_lift
FROM windows;


-- ── 5. Free-tier exposure (red team F1) ─────────────────────────────────────
-- How many NON-entitled families have ever been shown a real AI insight. Before
-- pkg/ai-taste-gate this is 0 on native by construction: useAutoCoachInsight
-- returns early unless hasRealEntitlement (or web). This block is the before/after
-- measurement for that package — if the taste gate works, non_entitled_viewers
-- climbs off zero.
WITH ent AS (
  SELECT family_id,
         bool_or(is_lifetime_access OR is_lifetime_founding
                 OR (premium_until IS NOT NULL AND premium_until > now())) AS entitled
  FROM public.profiles WHERE role = 'parent' GROUP BY 1
),
viewers AS (
  SELECT DISTINCT e.family_id, e.platform
  FROM public.onboarding_events e
  WHERE e.event_type = 'insight_viewed'
)
SELECT COALESCE(v.platform, 'unknown')                       AS platform,
       count(*)                                              AS families_viewed,
       count(*) FILTER (WHERE ent.entitled)                  AS entitled_viewers,
       count(*) FILTER (WHERE NOT ent.entitled)              AS non_entitled_viewers
FROM viewers v
LEFT JOIN ent ON ent.family_id = v.family_id
GROUP BY 1
ORDER BY 2 DESC;
