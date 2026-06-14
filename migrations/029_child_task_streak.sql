-- ============================================================
-- BUFF Mobile — per-child daily streak (server-derived)
-- File: migrations/029_child_task_streak.sql
-- Session: pkg/streak-per-child (fix B — follow-up to pkg/fix-streak-counter)
-- Date: 2026-06-13
--
-- Why: the day-streak shown on the child dashboards was stored per-DEVICE
-- (AsyncStorage pet_state.daily_streak). On shared devices (~65% of families,
-- View-as-Child) all siblings shared one streak. This moves the streak to a
-- per-child value computed on read from daily_progress — the table completeTask
-- writes to live — so it is correct per child with no stored counter to drift
-- and no backfill (existing testers get their real streak from history).
--
-- Definition: the run of consecutive calendar days, ending today or yesterday
-- (UTC, matching how daily_progress.date is keyed via toISOString), on which the
-- child completed >=1 task. If the most recent completion is older than
-- yesterday, the streak is 0 (broken). Classic gaps-and-islands: for days in
-- descending order, day + row_number() is constant within a consecutive run.
--
-- daily_progress.date is TEXT (ISO "YYYY-MM-DD"); cast to date for arithmetic.
-- SECURITY INVOKER (default): daily_progress RLS already scopes rows to the
-- caller's family, so an arbitrary child_id the caller can't see yields 0.
-- Idempotent.
-- ============================================================

CREATE OR REPLACE FUNCTION public.child_task_streak(p_child_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH d AS (
    SELECT DISTINCT "date"::date AS day
    FROM daily_progress
    WHERE child_id = p_child_id
      AND completed = true
  ),
  grouped AS (
    SELECT day,
           day + (row_number() OVER (ORDER BY day DESC))::int AS grp
    FROM d
  )
  SELECT CASE
    WHEN (SELECT max(day) FROM d) >= ((now() AT TIME ZONE 'utc')::date - 1)
      THEN (
        SELECT count(*)::int
        FROM grouped
        WHERE grp = (SELECT grp FROM grouped ORDER BY day DESC LIMIT 1)
      )
    ELSE 0
  END;
$$;

GRANT EXECUTE ON FUNCTION public.child_task_streak(uuid) TO anon, authenticated;
