-- ============================================================================
-- capture-usage.sql — usability report for parent capture ("Smart Organizer")
--
-- Run each block separately (Supabase SQL editor or MCP execute_sql).
-- Read-only. Safe to run in production.
--
-- North Star:  Repeat Capture Rate (7d) — of the families that ran capture once,
--              how many came back within a week. In a beta that is the only
--              honest usability signal: a parent who pastes a SECOND message
--              found value in the first one.
--
-- Supporting:  Trust Rate   = kept / returned      (is the AI output any good?)
--              Edit Rate    = edited / kept        (does it guess the wrong kid?)
--              Zero-yield   = runs that returned 0 items
--              Error Rate   = paywall / rate-limit / Gemini failures
--              Abandon Rate = reviewed but never confirmed
--              Reach-through= transferred items the CHILD actually completed
--
-- Instrumentation: migration 047_capture_usage_metrics.sql + captureMetrics.ts.
-- Runs before 047 have outcome ok/empty backfilled and NULL kept/edited counts,
-- so every rate below is computed over rows where the input actually exists.
-- ============================================================================


-- ── 1. Headline funnel ──────────────────────────────────────────────────────
-- One row per window. NULL rate = not enough data yet (never a fake 0%).
--
-- `instrumented_since` is discovered, not hardcoded: the first run that carries
-- a confirm summary marks the moment a client build could report one. Abandon
-- rate is computed ONLY from there on — otherwise every pre-instrumentation run
-- (and every run from an older build still in the field) reads as "abandoned"
-- and the rate sits at a meaningless 100%.
WITH instrumented AS (
  SELECT min(created_at) AS since
  FROM public.capture_runs
  WHERE kept_count IS NOT NULL
),
runs AS (
  SELECT r.*,
         (r.outcome LIKE 'error%')      AS is_error,
         (r.outcome IN ('ok', 'empty')) AS is_billable,
         (i.since IS NOT NULL AND r.created_at >= i.since) AS is_instrumented
  FROM public.capture_runs r
  CROSS JOIN instrumented i
),
windows AS (
  SELECT 'last 7d'  AS window, now() - interval '7 days'  AS since
  UNION ALL SELECT 'last 30d', now() - interval '30 days'
  UNION ALL SELECT 'all time', '-infinity'::timestamptz
)
SELECT
  w.window,
  count(r.id)                                                     AS runs_attempted,
  count(r.id) FILTER (WHERE r.is_billable)                        AS runs_ran,
  count(DISTINCT r.family_id)                                     AS families,
  count(r.id) FILTER (WHERE r.is_error)                           AS runs_failed,
  round(100.0 * count(r.id) FILTER (WHERE r.is_error)
        / nullif(count(r.id), 0), 1)                              AS error_rate_pct,
  round(100.0 * count(r.id) FILTER (WHERE r.outcome = 'empty')
        / nullif(count(r.id) FILTER (WHERE r.is_billable), 0), 1)  AS zero_yield_pct,
  sum(r.item_count) FILTER (WHERE r.is_billable)                  AS items_returned,
  sum(r.kept_count)                                               AS items_kept,
  round(100.0 * sum(r.kept_count)
        / nullif(sum(r.item_count) FILTER (WHERE r.confirmed_at IS NOT NULL), 0), 1)
                                                                  AS trust_rate_pct,
  round(100.0 * sum(r.edited_count)
        / nullif(sum(r.kept_count), 0), 1)                        AS edit_rate_pct,
  round(100.0 * count(r.id) FILTER (
          WHERE r.outcome = 'ok' AND r.is_instrumented AND r.confirmed_at IS NULL)
        / nullif(count(r.id) FILTER (WHERE r.outcome = 'ok' AND r.is_instrumented), 0), 1)
                                                                  AS abandon_rate_pct
FROM windows w
LEFT JOIN runs r ON r.created_at >= w.since
GROUP BY w.window
ORDER BY w.window;


-- ── 2. North Star: Repeat Capture Rate (7d) ─────────────────────────────────
-- A family counts as "repeat" if it has a second BILLABLE run within 7 days of
-- its first one. Families whose first run is younger than 7 days are excluded
-- from the denominator — they have not had their week yet.
WITH first_run AS (
  SELECT family_id, min(created_at) AS first_at
  FROM public.capture_runs
  WHERE outcome IN ('ok', 'empty')
  GROUP BY family_id
),
repeat_run AS (
  SELECT f.family_id,
         f.first_at,
         EXISTS (
           SELECT 1 FROM public.capture_runs c
           WHERE c.family_id = f.family_id
             AND c.outcome IN ('ok', 'empty')
             AND c.created_at > f.first_at
             AND c.created_at <= f.first_at + interval '7 days'
         ) AS came_back
  FROM first_run f
)
-- Numerator and denominator must cover the SAME families, or a family that came
-- back inside a window that has not closed yet pushes the rate above 100%.
SELECT
  count(*)                                                     AS families_ever_ran,
  count(*) FILTER (WHERE first_at < now() - interval '7 days')  AS families_with_full_week,
  count(*) FILTER (WHERE came_back AND first_at < now() - interval '7 days')
                                                               AS families_repeat,
  round(100.0 * count(*) FILTER (WHERE came_back AND first_at < now() - interval '7 days')
        / nullif(count(*) FILTER (WHERE first_at < now() - interval '7 days'), 0), 1)
                                                               AS repeat_rate_7d_pct,
  -- Early signal: window still open, already came back.
  count(*) FILTER (WHERE came_back AND first_at >= now() - interval '7 days')
                                                               AS repeat_pending_window
FROM repeat_run;


-- ── 3. Reach-through: did the household ACT on it? ──────────────────────────
-- A captured item is only worth something if it ended in a real action:
-- a parent item marked done, or a transferred item the child completed.
SELECT
  count(*)                                                          AS items_total,
  count(*) FILTER (WHERE pi.status = 'transferred')                 AS handed_to_child,
  count(*) FILTER (WHERE pi.status = 'done')                        AS parent_marked_done,
  count(*) FILTER (WHERE pi.status = 'archived')                    AS archived,
  count(DISTINCT pi.id) FILTER (WHERE dp.id IS NOT NULL)            AS child_completed,
  round(100.0 * count(DISTINCT pi.id) FILTER (WHERE dp.id IS NOT NULL)
        / nullif(count(*) FILTER (WHERE pi.status = 'transferred'), 0), 1)
                                                                    AS reach_through_pct
FROM public.parent_items pi
LEFT JOIN public.daily_progress dp
       ON dp.task_id = pi.child_task_id
      AND dp.completed IS TRUE
      AND dp.revoked_at IS NULL;


-- ── 4. Per-family detail (who is actually using it) ─────────────────────────
SELECT
  f.name                                                   AS family,
  f.platform,
  count(r.id)                                              AS runs,
  count(r.id) FILTER (WHERE r.outcome LIKE 'error%')        AS failed,
  sum(r.item_count)                                        AS items_returned,
  sum(r.kept_count)                                        AS items_kept,
  min(r.created_at)::date                                  AS first_run,
  max(r.created_at)::date                                  AS last_run,
  count(DISTINCT r.created_at::date)                       AS active_days
FROM public.capture_runs r
JOIN public.families f ON f.id = r.family_id
GROUP BY f.name, f.platform
ORDER BY runs DESC;


-- ── 5. Open→run drop-off (needs a build carrying capture_opened) ────────────
-- Parents who opened the screen and never pasted anything are invisible in
-- capture_runs. Events are tagged source='parent_capture' in onboarding_events.
SELECT
  count(*) FILTER (WHERE event_type = 'capture_opened')            AS opens,
  count(DISTINCT family_id) FILTER (WHERE event_type = 'capture_opened')
                                                                   AS families_opened,
  count(*) FILTER (WHERE event_type = 'capture_consent_granted')   AS consents,
  (SELECT count(DISTINCT family_id) FROM public.capture_runs)      AS families_ran
FROM public.onboarding_events
WHERE source = 'parent_capture';
