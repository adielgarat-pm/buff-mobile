-- 031_child_insights.sql
-- pkg/ai-insights Phase 1-2
--
-- Stores pre-computed weekly insights per child.
-- Basic tier (rule-based) → all children, generated every Friday night.
-- Smart tier (LLM) → premium/lifetime only, generated every Friday + Tuesday night.
-- The Edge Function `generate-child-insights` writes here; the client reads + falls
-- back to real-time computation when no row exists (new child, first week).

-- ─── 1. Table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.child_insights (
  child_id         UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  family_id        UUID        NOT NULL REFERENCES public.families(id)   ON DELETE CASCADE,

  -- 'basic' = rule-based (insightFraming.ts logic ported server-side)
  -- 'smart' = LLM-generated (Phase 3, premium only)
  tier             TEXT        NOT NULL DEFAULT 'basic'
                               CHECK (tier IN ('basic', 'smart')),

  -- Layer B — weekly framing (always present)
  weekly           JSONB       NOT NULL,

  -- Layer C — the single tip (null when C5 = no problem found)
  tip              JSONB,

  -- When this was generated (used to decide staleness / re-generation cadence)
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- The last date of the 7-day window used to compute this insight
  window_end       DATE        NOT NULL DEFAULT CURRENT_DATE,

  PRIMARY KEY (child_id)
);

-- ─── 2. Index ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS child_insights_family_idx ON public.child_insights(family_id);

-- ─── 3. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.child_insights ENABLE ROW LEVEL SECURITY;

-- Parents read their own family's insights
CREATE POLICY "parent can read family insights"
  ON public.child_insights FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

-- Edge Function (service role) writes — no policy needed for service role,
-- but we add an explicit anon-block policy so the client can never write.
CREATE POLICY "no client write"
  ON public.child_insights FOR INSERT
  WITH CHECK (false);

CREATE POLICY "no client update"
  ON public.child_insights FOR UPDATE
  USING (false);

-- ─── 4. Grants ───────────────────────────────────────────────────────────────

GRANT SELECT ON public.child_insights TO authenticated;
-- Service role (Edge Function) gets full access via Supabase default grants.

-- ─── 5. Server-side insight generation ──────────────────────────────────────
--
-- Mirrors the TypeScript logic in insightFraming.ts / useParentInsights.ts.
-- Called by the Edge Function for each child; also directly by pg_cron via
-- the wrapper below.

CREATE OR REPLACE FUNCTION public.compute_basic_insight(p_child_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id    UUID;
  v_dates        DATE[];
  v_active_days  INT;
  v_days_data    INT;

  -- category completion rates
  v_learning_rate   NUMERIC := 100;
  v_selfcare_rate   NUMERIC := 100;
  v_learning_count  INT := 0;
  v_selfcare_count  INT := 0;

  -- phase completion (morning, school, afternoon, evening)
  v_phase_rates  JSONB := '{}'::JSONB;

  -- weakest phase
  v_weakest_key  TEXT := NULL;
  v_weakest_rate NUMERIC := 101;

  -- result
  v_weekly_id    TEXT;
  v_weekly_key   TEXT;
  v_tip_case     TEXT;
  v_tip_key      TEXT;
  v_tip_cta      TEXT;

  -- reward loop
  v_rewards_count   INT;
  v_cheapest_cost   INT;
  v_balance         INT;
  v_redemptions_14d INT;
  v_is_active       BOOLEAN;

  r RECORD;
BEGIN
  -- Resolve family_id
  SELECT family_id INTO v_family_id FROM public.profiles WHERE id = p_child_id;
  IF v_family_id IS NULL THEN RETURN NULL; END IF;

  -- Last 7 dates
  SELECT ARRAY(
    SELECT (CURRENT_DATE - i)::DATE FROM generate_series(0,6) i
  ) INTO v_dates;

  -- ── Active days (days with ≥1 completed task) ────────────────────────────
  SELECT COUNT(DISTINCT date) INTO v_active_days
  FROM public.daily_progress
  WHERE family_id = v_family_id
    AND child_id  = p_child_id
    AND date      = ANY(v_dates)
    AND completed = true;

  SELECT COUNT(DISTINCT date) INTO v_days_data
  FROM public.daily_progress
  WHERE family_id = v_family_id
    AND child_id  = p_child_id
    AND date      = ANY(v_dates);

  -- ── Per-task completion rates → category & phase buckets ─────────────────
  FOR r IN
    SELECT
      t.id                                                       AS task_id,
      t.category,
      t.time,
      COALESCE(
        SUM(CASE WHEN dp.completed THEN 1 ELSE 0 END)::NUMERIC
        / NULLIF(COUNT(dp.date), 0), 0
      ) * 100                                                    AS completion_rate
    FROM public.tasks t
    LEFT JOIN public.daily_progress dp
           ON dp.task_id   = t.id
          AND dp.family_id = v_family_id
          AND dp.child_id  = p_child_id
          AND dp.date      = ANY(v_dates)
    WHERE t.family_id   = v_family_id
      AND (t.assigned_to IS NULL OR t.assigned_to = p_child_id)
    GROUP BY t.id, t.category, t.time
  LOOP
    -- Category buckets
    IF r.category = 'learning' THEN
      v_learning_rate  := (v_learning_rate * v_learning_count + r.completion_rate)
                          / (v_learning_count + 1);
      v_learning_count := v_learning_count + 1;
    ELSIF r.category = 'self-care' THEN
      v_selfcare_rate  := (v_selfcare_rate * v_selfcare_count + r.completion_rate)
                          / (v_selfcare_count + 1);
      v_selfcare_count := v_selfcare_count + 1;
    END IF;

    -- Phase bucket (time-of-day → morning/school/afternoon/evening)
    -- Mirrors getPhaseForTime() in types/phase.ts:
    --   morning    06:00-11:59 (360-719 min)
    --   school     08:00-14:59 (480-899) — overlaps; use start hour heuristic
    --   afternoon  12:00-17:59 (720-1079)
    --   evening    18:00-23:59 (1080-1439)
    DECLARE
      v_phase TEXT;
      v_hour  INT := EXTRACT(HOUR FROM r.time::TIME)::INT;
    BEGIN
      v_phase := CASE
        WHEN v_hour >= 6  AND v_hour < 12 THEN 'morning'
        WHEN v_hour >= 12 AND v_hour < 18 THEN 'afternoon'
        WHEN v_hour >= 18               THEN 'evening'
        ELSE 'morning'  -- overnight / no time defaults to morning
      END;

      v_phase_rates := jsonb_set(
        v_phase_rates,
        ARRAY[v_phase],
        to_jsonb(
          COALESCE((v_phase_rates ->> v_phase)::NUMERIC, 0) *
          COALESCE((v_phase_rates -> (v_phase || '_count'))::INT, 0) +
          r.completion_rate
        ) / NULLIF(
          COALESCE((v_phase_rates -> (v_phase || '_count'))::INT, 0) + 1, 0
        ),
        true
      );
      v_phase_rates := jsonb_set(
        v_phase_rates,
        ARRAY[v_phase || '_count'],
        to_jsonb(COALESCE((v_phase_rates -> (v_phase || '_count'))::INT, 0) + 1),
        true
      );
    END;
  END LOOP;

  -- ── Weakest phase ─────────────────────────────────────────────────────────
  FOR r IN SELECT key, value::NUMERIC AS rate
           FROM jsonb_each_text(v_phase_rates)
           WHERE key NOT LIKE '%_count'
  LOOP
    IF r.rate < v_weakest_rate THEN
      v_weakest_rate := r.rate;
      v_weakest_key  := r.key || '-low';
    END IF;
  END LOOP;
  IF v_weakest_rate >= 50 THEN v_weakest_key := NULL; END IF;

  -- ── Reward loop signals ───────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_rewards_count
  FROM public.rewards WHERE family_id = v_family_id;

  SELECT MIN(cost) INTO v_cheapest_cost
  FROM public.rewards WHERE family_id = v_family_id;

  SELECT COALESCE(total_balance, 0) INTO v_balance
  FROM public.credit_vault
  WHERE family_id = v_family_id AND child_id = p_child_id;

  SELECT COUNT(*) INTO v_redemptions_14d
  FROM public.redemptions
  WHERE family_id = v_family_id
    AND child_id  = p_child_id
    AND status    = 'approved'
    AND created_at >= now() - INTERVAL '14 days';

  v_is_active := v_active_days > 0;

  -- ── Layer B — weekly framing ──────────────────────────────────────────────
  IF v_days_data < 3 THEN
    v_weekly_id  := 'B5'; v_weekly_key := 'comingSoon';
  ELSIF v_active_days >= 5 THEN
    v_weekly_id  := 'B1'; v_weekly_key := 'strong';
  ELSIF v_active_days >= 3 THEN
    v_weekly_id  := 'B2'; v_weekly_key := 'building';
  ELSIF v_active_days >= 1 THEN
    v_weekly_id  := 'B3'; v_weekly_key := 'growing';
  ELSE
    v_weekly_id  := 'B4'; v_weekly_key := 'quiet';
  END IF;

  -- ── Layer C0 — reward loop ────────────────────────────────────────────────
  IF v_rewards_count = 0 OR v_cheapest_cost IS NULL THEN
    v_tip_case := 'C0a'; v_tip_key := 'insights.weekly.rewardLoop.noRewards'; v_tip_cta := 'open-rewards';
  ELSIF v_redemptions_14d > 0 THEN
    NULL; -- healthy loop → fall through to C1-C5
  ELSIF v_balance >= v_cheapest_cost THEN
    IF v_balance >= v_cheapest_cost * 2 THEN
      v_tip_case := 'C0c'; v_tip_key := 'insights.weekly.rewardLoop.hoarding'; v_tip_cta := 'open-rewards';
    ELSIF v_is_active THEN
      v_tip_case := 'C0b'; v_tip_key := 'insights.weekly.rewardLoop.notRedeeming'; v_tip_cta := 'open-rewards';
    END IF;
  END IF;

  -- ── Layer C1-C5 — completion tips (only if no C0 fired) ──────────────────
  IF v_tip_case IS NULL THEN
    IF v_learning_count > 0 AND v_learning_rate < 50 THEN
      v_tip_case := 'C2'; v_tip_key := 'insights.homework-low'; v_tip_cta := 'start-conversation';
    ELSIF v_weakest_key IS NOT NULL THEN
      v_tip_case := 'C3'; v_tip_key := 'insights.' || v_weakest_key; v_tip_cta := 'start-conversation';
    ELSIF v_selfcare_count > 0 AND v_selfcare_rate < 50 THEN
      v_tip_case := 'C4'; v_tip_key := 'insights.hygiene-low'; v_tip_cta := 'start-conversation';
    END IF;
  END IF;

  -- ── Assemble result JSON ──────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'weekly', jsonb_build_object(
      'id',      v_weekly_id,
      'i18nKey', v_weekly_key,
      'isEmpty', v_weekly_id = 'B5',
      'ctaType', CASE v_weekly_id
                   WHEN 'B1' THEN 'send-bonus'
                   WHEN 'B2' THEN 'send-sticker'
                   WHEN 'B3' THEN 'send-sticker'
                   WHEN 'B4' THEN 'set-anchor'
                   ELSE 'none'
                 END
    ),
    'tip', CASE WHEN v_tip_case IS NOT NULL THEN
      jsonb_build_object(
        'layer',   CASE WHEN v_tip_case LIKE 'C0%' THEN 'C0' ELSE 'C' END,
        'caseId',  v_tip_case,
        'i18nKey', v_tip_key,
        'ctaType', v_tip_cta
      )
    ELSE NULL END,
    'active_days',  v_active_days,
    'days_with_data', v_days_data
  );
END;
$$;

-- ─── 6. Batch runner called by pg_cron ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.refresh_all_basic_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_result JSONB;
BEGIN
  -- All active children (not deleted, has a family)
  FOR r IN
    SELECT id AS child_id, family_id
    FROM public.profiles
    WHERE role       = 'child'
      AND is_deleted = false
      AND family_id  IS NOT NULL
  LOOP
    BEGIN
      v_result := public.compute_basic_insight(r.child_id);
      IF v_result IS NULL THEN CONTINUE; END IF;

      -- Only overwrite if no 'smart' tier row exists (smart tier is never
      -- replaced by basic — it stays until the next smart-tier run).
      INSERT INTO public.child_insights
        (child_id, family_id, tier, weekly, tip, generated_at, window_end)
      VALUES (
        r.child_id, r.family_id, 'basic',
        v_result -> 'weekly',
        v_result -> 'tip',
        now(),
        CURRENT_DATE
      )
      ON CONFLICT (child_id) DO UPDATE
        SET tier         = EXCLUDED.tier,
            weekly       = EXCLUDED.weekly,
            tip          = EXCLUDED.tip,
            generated_at = EXCLUDED.generated_at,
            window_end   = EXCLUDED.window_end
        WHERE child_insights.tier = 'basic';  -- never overwrite smart with basic
    EXCEPTION WHEN OTHERS THEN
      -- Log and continue — one bad child doesn't block the rest
      RAISE WARNING 'refresh_all_basic_insights: child % failed: %', r.child_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- ─── 7. pg_cron schedules ────────────────────────────────────────────────────
-- Friday 22:00 IL (UTC+3 summer) = 19:00 UTC → cron '0 19 * * 5'
-- IL is UTC+2 winter / UTC+3 summer; 19 UTC is 21:00 winter / 22:00 summer.
-- Close enough for a weekly batch — no real-time sensitivity here.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_basic_insights_friday') THEN
    PERFORM cron.unschedule('refresh_basic_insights_friday');
  END IF;
END $$;

SELECT cron.schedule(
  'refresh_basic_insights_friday',
  '0 19 * * 5',
  $cron$ SELECT public.refresh_all_basic_insights(); $cron$
);

COMMENT ON TABLE  public.child_insights IS
  'Pre-computed weekly insight per child. basic = rule-based (every Friday); smart = LLM (every Friday + Tuesday, premium only). Client falls back to real-time computation when no row exists.';
COMMENT ON FUNCTION public.compute_basic_insight(UUID) IS
  'Server-side port of insightFraming.ts selectInsightFraming(). Returns JSONB with weekly + tip fields.';
COMMENT ON FUNCTION public.refresh_all_basic_insights() IS
  'Batch runner: computes basic insights for all active children. Called by pg_cron every Friday night.';
