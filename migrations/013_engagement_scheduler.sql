-- Migration 013: Engagement scheduler (E5, E6)
--
-- pkg/fcm-push-notifications Phase 7.
--
-- Detects disengaged kids (5d/14d) and parents (weekly) and inserts
-- notification rows. The Edge Function (Phase 3) picks them up and
-- dispatches push; the bell feed (sister package) renders them too.
--
-- Per locked SPEC § Cadence:
--   * E5 (kid disengagement) — fires at 5d, again at 14d if still ignored.
--     Capped at 2 per absence period. Counter resets on app open
--     (last_seen_at). Body-doubling copy.
--   * E6 (parent disengagement) — fires once per 7-day window if
--     last_seen_at ≥ 5d. Declarative/connection-not-rescue copy.
--
-- The Edge Function reads notifications.type to apply the right copy
-- (push.kid_engagement.* / push.parent_engagement.* i18n keys, Phase 4).
--
-- Cap logic in v1 uses a simple "no prior engagement row for this profile
-- in the last N days" check. Future v1.1: explicit engagement_state table
-- to track consecutive-ignored counts for "stop after 3 ignored".
--
-- Idempotent: re-running the function is safe (NOT EXISTS guards on inserts).
-- pg_cron schedule replaces itself on re-run (drop + add pattern).
--
-- Applied to live project gfrongfnyigxsexuofrg on 2026-05-20.

-- =================================================================
-- 1. scan_disengaged_users() — runs daily, inserts notifications
-- =================================================================

CREATE OR REPLACE FUNCTION public.scan_disengaged_users()
RETURNS TABLE (kid_engagement_inserts INT, parent_engagement_inserts INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kid_count INT := 0;
  parent_count INT := 0;
BEGIN
  -- E5: kids whose last_seen_at >= 5 days ago AND no kid_engagement notification in last 14 days
  --     (covers both first 5d push and second 14d push — the 14d gap matches the spec cadence)
  WITH eligible_kids AS (
    SELECT p.id, p.family_id, p.display_name
    FROM public.profiles p
    WHERE p.role = 'child'
      AND p.last_seen_at <= (now() - INTERVAL '5 days')
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'kid_engagement'
          AND n.child_id = p.id
          AND n.created_at > (now() - INTERVAL '14 days')
      )
  ),
  inserted_kid_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_id, child_name)
    SELECT
      ek.family_id,
      ek.id,                  -- parent_id field repurposed as recipient profile_id for kid-recipient rows
      'kid_engagement',
      ek.id,
      ek.display_name
    FROM eligible_kids ek
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO kid_count FROM inserted_kid_rows;

  -- E6: parents whose last_seen_at >= 5 days ago AND no parent_engagement in last 7 days
  WITH eligible_parents AS (
    SELECT p.id, p.family_id, p.display_name
    FROM public.profiles p
    WHERE p.role = 'parent'
      AND p.last_seen_at <= (now() - INTERVAL '5 days')
      AND p.family_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'parent_engagement'
          AND n.parent_id = p.id
          AND n.created_at > (now() - INTERVAL '7 days')
      )
  ),
  inserted_parent_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_name)
    SELECT
      ep.family_id,
      ep.id,
      'parent_engagement',
      ''
    FROM eligible_parents ep
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO parent_count FROM inserted_parent_rows;

  RETURN QUERY SELECT kid_count, parent_count;
END;
$$;

COMMENT ON FUNCTION public.scan_disengaged_users() IS
  'Engagement scheduler entry point. Inserts kid_engagement (5d, then 14d cooldown) and parent_engagement (5d, then 7d cooldown) notification rows for disengaged users. Called daily by pg_cron. The Edge Function (Phase 3) picks up the inserted rows and dispatches push with body-doubling copy (kid) or declarative copy (parent).';

-- =================================================================
-- 2. pg_cron daily job — runs at 09:00 Israel time (06:00 UTC)
-- =================================================================
-- Note: pg_cron schedules in UTC. IL is UTC+2 winter / UTC+3 summer.
-- For v1 we lock to 06:00 UTC (= 08:00 IL winter / 09:00 IL summer).
-- This is "morning" enough across both. Future v1.1 can handle DST or
-- per-user timezone if international users land.

-- Drop existing job (idempotent re-run)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan_disengaged_users_daily') THEN
    PERFORM cron.unschedule('scan_disengaged_users_daily');
  END IF;
END $$;

-- Schedule new job: daily at 06:00 UTC
SELECT cron.schedule(
  'scan_disengaged_users_daily',
  '0 6 * * *',
  $cron$ SELECT public.scan_disengaged_users(); $cron$
);
