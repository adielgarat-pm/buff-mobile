-- pkg/buddy-success-count — BUDDY EOD fix
-- 2026-06-14
--
-- WHY (see docs/sessions/buddy-success-count/SPEC.md and memory project_buddy_overload_success_count):
--   1. "Successful day" was rate >= 0.70 over the FULL assigned list. Kids carry
--      a median of 9 (up to 20) tasks/day, so 70% ≈ 100% and BUDDY almost never
--      grows. Fix: success = an absolute small count, completed >= LEAST(3, assigned).
--   2. compute_buddy_eod_for_child early-returned on pause_mode_active WITHOUT writing
--      a row, and the flag never auto-cleared when pause_until passed → families
--      stuck-paused had BUDDY frozen and real completions lost. Fix: honor pause only
--      while pause_until >= now(); clear the stale flags; backfill the lost days.
--   3. Recompute successful_days_count + friendship_level from the corrected truth
--      (never downgrades — GREATEST with current level — so seeded/demo rows are safe).

-- ============================================================
-- PART 1 (DDL — apply_migration): replace the EOD function
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_buddy_eod_for_child(p_child_id uuid, p_check_date date DEFAULT ((now() AT TIME ZONE 'Asia/Jerusalem'::text))::date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_family_id UUID;
  v_pause_active BOOLEAN;
  v_dow INT;
  v_tasks_assigned INT;
  v_tasks_completed INT;
  v_rate DECIMAL(3,2);
  v_successful BOOLEAN;
  v_rel public.buddy_relationships%ROWTYPE;
  v_new_level INT;
  v_gift_type TEXT;
BEGIN
  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = p_child_id;
  IF v_family_id IS NULL THEN RETURN; END IF;

  -- Pause guard: honor an active pause ONLY while it has not expired.
  -- pause_until NULL = indefinite pause (honored); a past pause_until is stale (ignored).
  SELECT (COALESCE(pause_mode_active, false)
          AND (pause_until IS NULL OR pause_until >= now()))
    INTO v_pause_active
  FROM public.app_settings WHERE family_id = v_family_id;
  IF v_pause_active THEN RETURN; END IF;

  v_dow := EXTRACT(DOW FROM p_check_date)::int;

  SELECT COUNT(*) INTO v_tasks_assigned
  FROM public.tasks t
  WHERE t.family_id = v_family_id
    AND (t.assigned_to = p_child_id OR t.assigned_to IS NULL)
    AND v_dow = ANY(t.schedule_days);

  SELECT COUNT(*) INTO v_tasks_completed
  FROM public.daily_progress dp
  WHERE dp.child_id = p_child_id
    AND dp.date = p_check_date::text
    AND dp.completed = true
    AND dp.revoked_at IS NULL;

  IF v_tasks_completed > v_tasks_assigned THEN
    v_tasks_completed := v_tasks_assigned;
  END IF;

  v_rate := CASE
    WHEN v_tasks_assigned = 0 THEN 0.00
    ELSE ROUND(v_tasks_completed::decimal / v_tasks_assigned, 2)
  END;

  -- Success = an absolute small count of tasks done (not a percentage of the whole
  -- list), so large task loads no longer make a successful day unreachable.
  v_successful := (v_tasks_assigned > 0 AND v_tasks_completed >= LEAST(3, v_tasks_assigned));

  INSERT INTO public.buddy_daily_check
    (child_profile_id, check_date, tasks_assigned, tasks_completed, completion_rate, is_successful_day)
  VALUES
    (p_child_id, p_check_date, v_tasks_assigned, v_tasks_completed, v_rate, v_successful)
  ON CONFLICT (child_profile_id, check_date) DO UPDATE SET
    tasks_assigned   = EXCLUDED.tasks_assigned,
    tasks_completed  = EXCLUDED.tasks_completed,
    completion_rate  = EXCLUDED.completion_rate,
    is_successful_day = EXCLUDED.is_successful_day;

  IF NOT v_successful OR v_tasks_assigned = 0 THEN RETURN; END IF;

  SELECT * INTO v_rel FROM public.buddy_relationships WHERE child_profile_id = p_child_id;

  IF v_rel.id IS NULL THEN
    INSERT INTO public.buddy_relationships (child_profile_id) VALUES (p_child_id);
    SELECT * INTO v_rel FROM public.buddy_relationships WHERE child_profile_id = p_child_id;
  END IF;

  IF v_rel.last_successful_day_date = p_check_date THEN RETURN; END IF;

  UPDATE public.buddy_relationships
  SET successful_days_count = v_rel.successful_days_count + 1,
      last_successful_day_date = p_check_date,
      updated_at = now()
  WHERE child_profile_id = p_child_id;

  v_rel.successful_days_count := v_rel.successful_days_count + 1;

  v_new_level := NULL;
  v_gift_type := NULL;

  IF v_rel.successful_days_count = 3 AND v_rel.friendship_level < 2 THEN
    v_new_level := 2;
    v_gift_type := 'theme_color';
  ELSIF v_rel.successful_days_count = 10 AND v_rel.friendship_level < 3 THEN
    v_new_level := 3;
    v_gift_type := 'double_buffs';
  END IF;

  IF v_new_level IS NOT NULL THEN
    UPDATE public.buddy_relationships
    SET friendship_level = v_new_level,
        last_level_up_at = now(),
        has_pending_gift = true,
        updated_at = now()
    WHERE child_profile_id = p_child_id;

    INSERT INTO public.buddy_gifts_history (child_profile_id, gift_type, given_at_level)
    VALUES (p_child_id, v_gift_type, v_new_level);
  END IF;
END;
$function$;

-- ============================================================
-- PART 2 (DATA — execute_sql): cleanup + recompute from truth
-- ============================================================

-- 2a. Clear stale pause flags (pause expired but flag stuck true).
UPDATE public.app_settings
SET pause_mode_active = false, updated_at = now()
WHERE pause_mode_active = true
  AND pause_until IS NOT NULL
  AND pause_until < now();

-- 2b. Recompute is_successful_day on existing rows with the new rule.
UPDATE public.buddy_daily_check
SET is_successful_day = (tasks_assigned > 0 AND tasks_completed >= LEAST(3, tasks_assigned));

-- 2c. Backfill daily_check rows that were never written (pause-skipped days)
--     for any child/date with real completions since V0.5 launch.
--     (DOW is computed from the grouped date alias to satisfy GROUP BY.)
WITH g AS (
  SELECT dp.child_id, dp.date::date AS d, p.family_id,
         count(*) FILTER (WHERE dp.completed AND dp.revoked_at IS NULL) AS completed
  FROM public.daily_progress dp
  JOIN public.profiles p ON p.id = dp.child_id
  WHERE dp.date::date >= '2026-05-15' AND dp.date::date < current_date
  GROUP BY dp.child_id, dp.date::date, p.family_id
),
x AS (
  SELECT g.child_id, g.d, g.completed,
         (SELECT count(*) FROM public.tasks t
            WHERE t.family_id = g.family_id
              AND (t.assigned_to = g.child_id OR t.assigned_to IS NULL)
              AND EXTRACT(DOW FROM g.d)::int = ANY(t.schedule_days)) AS assigned
  FROM g
  WHERE g.completed > 0
)
INSERT INTO public.buddy_daily_check
  (child_profile_id, check_date, tasks_assigned, tasks_completed, completion_rate, is_successful_day)
SELECT x.child_id, x.d, x.assigned,
       LEAST(x.completed, x.assigned),
       CASE WHEN x.assigned = 0 THEN 0.00
            ELSE ROUND(LEAST(x.completed, x.assigned)::decimal / x.assigned, 2) END,
       (x.assigned > 0 AND LEAST(x.completed, x.assigned) >= LEAST(3, x.assigned))
FROM x
WHERE NOT EXISTS (
  SELECT 1 FROM public.buddy_daily_check b
  WHERE b.child_profile_id = x.child_id AND b.check_date = x.d);

-- 2d. Ensure a relationship row exists for any newly-successful child.
INSERT INTO public.buddy_relationships (child_profile_id)
SELECT DISTINCT b.child_profile_id
FROM public.buddy_daily_check b
WHERE b.is_successful_day
  AND NOT EXISTS (SELECT 1 FROM public.buddy_relationships r WHERE r.child_profile_id = b.child_profile_id);

-- 2e. Recompute counts + level from truth (level capped at 3 — levels 4-5 are
--     Phase 2 / not yet granted by the EOD). This also normalizes any pre-existing
--     seeded/demo rows (e.g. a hand-set friendship_level=5) down to their real level.
WITH agg AS (
  SELECT child_profile_id,
         count(*) FILTER (WHERE is_successful_day) AS days,
         max(check_date) FILTER (WHERE is_successful_day) AS last_day
  FROM public.buddy_daily_check
  GROUP BY child_profile_id
)
UPDATE public.buddy_relationships r
SET successful_days_count = a.days,
    last_successful_day_date = a.last_day,
    friendship_level = CASE WHEN a.days >= 10 THEN 3
                            WHEN a.days >= 3  THEN 2
                            ELSE 1 END,
    updated_at = now()
FROM agg a
WHERE r.child_profile_id = a.child_profile_id;
