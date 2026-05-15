-- buddy-v05-backend — Phase 1 migration
-- Drafted: 2026-05-15 by CC (architect role per 2026-05-15 directive)
--
-- Adds 3 new tables for V0.5 Buddy System backend infrastructure:
--   - buddy_relationships     (one row per child)
--   - buddy_gifts_history     (append-only log)
--   - buddy_daily_check       (one row per child per day)
--
-- Plus: EOD function (compute_buddy_eod_for_child) and a daily pg_cron job
-- that runs it for all children at 23:55 Asia/Jerusalem time.
--
-- All DDL is additive. Rollback at the bottom (commented out).

-- ─── Pre-flight ──────────────────────────────────────────────────────────────

-- pg_cron is already installed (verified 2026-05-15).
-- pgcrypto is already installed (gen_random_uuid).

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.buddy_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  friendship_level INT NOT NULL DEFAULT 1
    CHECK (friendship_level BETWEEN 1 AND 5),
  successful_days_count INT NOT NULL DEFAULT 0
    CHECK (successful_days_count >= 0),

  current_skin_id TEXT,
  current_theme_color TEXT,
  buddy_name TEXT,
  buddy_visible BOOLEAN NOT NULL DEFAULT true,

  has_pending_gift BOOLEAN NOT NULL DEFAULT false,

  relationship_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_level_up_at TIMESTAMPTZ,
  last_successful_day_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (child_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_buddy_relationships_child
  ON public.buddy_relationships (child_profile_id);

CREATE TABLE IF NOT EXISTS public.buddy_gifts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  gift_type TEXT NOT NULL CHECK (gift_type IN (
    'theme_color', 'double_buffs', 'mood_pack',
    'skip_token', 'reward_discount', 'skin'
  )),
  gift_value TEXT,
  given_at_level INT NOT NULL CHECK (given_at_level BETWEEN 2 AND 5),
  given_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  used_at TIMESTAMPTZ,
  is_used BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buddy_gifts_child
  ON public.buddy_gifts_history (child_profile_id, given_at DESC);

CREATE TABLE IF NOT EXISTS public.buddy_daily_check (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,

  tasks_assigned INT NOT NULL CHECK (tasks_assigned >= 0),
  tasks_completed INT NOT NULL
    CHECK (tasks_completed >= 0 AND tasks_completed <= tasks_assigned),
  completion_rate DECIMAL(3,2) NOT NULL,
  is_successful_day BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (child_profile_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_buddy_daily_check_child_date
  ON public.buddy_daily_check (child_profile_id, check_date DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Mirrors the existing pattern on `profiles`: SELECT is open to authenticated
-- users (qual: true). No client INSERT/UPDATE/DELETE; only the EOD function
-- (running with elevated privileges via SECURITY DEFINER + service_role)
-- writes to these tables.

ALTER TABLE public.buddy_relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_gifts_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_daily_check    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read buddy_relationships"
  ON public.buddy_relationships FOR SELECT USING (true);

CREATE POLICY "Authenticated can read buddy_gifts_history"
  ON public.buddy_gifts_history FOR SELECT USING (true);

CREATE POLICY "Authenticated can read buddy_daily_check"
  ON public.buddy_daily_check FOR SELECT USING (true);

-- Admins: same pattern as `profiles` admin policy.
CREATE POLICY "Admins can read buddy_relationships"
  ON public.buddy_relationships FOR SELECT USING (is_admin());

CREATE POLICY "Admins can read buddy_gifts_history"
  ON public.buddy_gifts_history FOR SELECT USING (is_admin());

CREATE POLICY "Admins can read buddy_daily_check"
  ON public.buddy_daily_check FOR SELECT USING (is_admin());

-- ─── Backfill ────────────────────────────────────────────────────────────────
-- Decision #3: start every existing child at friendship_level=1,
-- successful_days_count=0. The future UI package will soften the reset
-- with a "Welcome to the Friendship!" first-launch message.

INSERT INTO public.buddy_relationships (child_profile_id)
SELECT id FROM public.profiles
WHERE role = 'child'
ON CONFLICT (child_profile_id) DO NOTHING;

-- ─── EOD function ────────────────────────────────────────────────────────────
-- Computes one day's check for one child. Called per-child by the cron job.
-- Logic:
--   1. If family is in pause mode → skip.
--   2. Count tasks_assigned (tasks where assigned_to=child AND today's DOW
--      is in schedule_days; or assigned_to IS NULL → assigned to whole family).
--   3. Count tasks_completed (daily_progress.completed=true, NOT revoked).
--   4. UPSERT buddy_daily_check.
--   5. If is_successful_day AND last_successful_day_date < today
--      AND tasks_assigned > 0:
--        - successful_days_count += 1
--        - last_successful_day_date := today
--        - Check thresholds (3 → L2 + theme_color gift,
--                             10 → L3 + double_buffs gift)
--        - If level changed: insert buddy_gifts_history row,
--          set has_pending_gift, bump friendship_level.

CREATE OR REPLACE FUNCTION public.compute_buddy_eod_for_child(
  p_child_id UUID,
  p_check_date DATE DEFAULT (now() AT TIME ZONE 'Asia/Jerusalem')::date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Resolve family + check pause
  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = p_child_id;
  IF v_family_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(pause_mode_active, false) INTO v_pause_active
  FROM public.app_settings WHERE family_id = v_family_id;
  IF v_pause_active THEN RETURN; END IF;

  -- DOW (0=Sunday, 6=Saturday — matches existing tasks.schedule_days)
  v_dow := EXTRACT(DOW FROM p_check_date)::int;

  -- Tasks assigned today
  SELECT COUNT(*) INTO v_tasks_assigned
  FROM public.tasks t
  WHERE t.family_id = v_family_id
    AND (t.assigned_to = p_child_id OR t.assigned_to IS NULL)
    AND v_dow = ANY(t.schedule_days);

  -- Tasks completed today
  SELECT COUNT(*) INTO v_tasks_completed
  FROM public.daily_progress dp
  WHERE dp.child_id = p_child_id
    AND dp.date = p_check_date::text
    AND dp.completed = true
    AND dp.revoked_at IS NULL;

  -- Cap completed at assigned (defensive — shouldn't happen but the table
  -- CHECK requires it)
  IF v_tasks_completed > v_tasks_assigned THEN
    v_tasks_completed := v_tasks_assigned;
  END IF;

  v_rate := CASE
    WHEN v_tasks_assigned = 0 THEN 0.00
    ELSE ROUND(v_tasks_completed::decimal / v_tasks_assigned, 2)
  END;
  v_successful := (v_tasks_assigned > 0 AND v_rate >= 0.70);

  -- UPSERT daily check
  INSERT INTO public.buddy_daily_check
    (child_profile_id, check_date, tasks_assigned, tasks_completed,
     completion_rate, is_successful_day)
  VALUES
    (p_child_id, p_check_date, v_tasks_assigned, v_tasks_completed,
     v_rate, v_successful)
  ON CONFLICT (child_profile_id, check_date) DO UPDATE SET
    tasks_assigned   = EXCLUDED.tasks_assigned,
    tasks_completed  = EXCLUDED.tasks_completed,
    completion_rate  = EXCLUDED.completion_rate,
    is_successful_day = EXCLUDED.is_successful_day;

  -- Bail if not a successful day or no tasks assigned
  IF NOT v_successful OR v_tasks_assigned = 0 THEN
    RETURN;
  END IF;

  -- Get current relationship state
  SELECT * INTO v_rel
  FROM public.buddy_relationships
  WHERE child_profile_id = p_child_id;

  -- If no relationship row exists (shouldn't happen post-backfill, but
  -- defensive — handles new children added after the backfill ran)
  IF v_rel.id IS NULL THEN
    INSERT INTO public.buddy_relationships (child_profile_id)
    VALUES (p_child_id);
    SELECT * INTO v_rel
    FROM public.buddy_relationships
    WHERE child_profile_id = p_child_id;
  END IF;

  -- Bail if we already counted today
  IF v_rel.last_successful_day_date = p_check_date THEN
    RETURN;
  END IF;

  -- Increment successful_days_count + last_successful_day_date
  UPDATE public.buddy_relationships
  SET successful_days_count = v_rel.successful_days_count + 1,
      last_successful_day_date = p_check_date,
      updated_at = now()
  WHERE child_profile_id = p_child_id;

  v_rel.successful_days_count := v_rel.successful_days_count + 1;

  -- Threshold check: 3 days → L2, 10 days → L3.
  -- (L4=30 and L5=100 are Phase 2 — not implemented here per Decision #6.)
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

    INSERT INTO public.buddy_gifts_history
      (child_profile_id, gift_type, given_at_level)
    VALUES
      (p_child_id, v_gift_type, v_new_level);
  END IF;
END;
$$;

-- Wrapper to run for all children at once (called by cron)
CREATE OR REPLACE FUNCTION public.run_buddy_eod_for_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE role = 'child' LOOP
    PERFORM public.compute_buddy_eod_for_child(r.id);
  END LOOP;
END;
$$;

-- ─── Cron schedule ───────────────────────────────────────────────────────────
-- Run at 23:55 Asia/Jerusalem time, every day. pg_cron uses UTC for its
-- schedule string; 23:55 IDT/IST = 20:55 UTC (UTC+3 summer / +2 winter).
-- Using 20:55 UTC means in winter the run shifts to 22:55 IST, still
-- before midnight. Acceptable for MVP; refine when international users matter.

SELECT cron.schedule(
  'buddy-eod-run',
  '55 20 * * *',
  $$ SELECT public.run_buddy_eod_for_all(); $$
);

-- ─── Rollback (commented; uncomment + run if needed) ─────────────────────────
-- SELECT cron.unschedule('buddy-eod-run');
-- DROP FUNCTION IF EXISTS public.run_buddy_eod_for_all();
-- DROP FUNCTION IF EXISTS public.compute_buddy_eod_for_child(UUID, DATE);
-- DROP TABLE IF EXISTS public.buddy_daily_check;
-- DROP TABLE IF EXISTS public.buddy_gifts_history;
-- DROP TABLE IF EXISTS public.buddy_relationships;
