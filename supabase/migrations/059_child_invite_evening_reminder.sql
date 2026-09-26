-- 059_child_invite_evening_reminder.sql
--
-- Child-access-paths Phase 2 ("day-1 push", DG3), approved by Adi 2026-09-26,
-- with her change: the evening time follows the PARENT's own time zone.
--
-- A parent who finished onboarding and chose "computer / tablet at home"
-- ("open it together tonight") or "their own phone" gets ONE evening reminder
-- if the child has not joined yet. Server-side on purpose, not a device-local
-- notification: a local one exists only on Android — the web PWA cannot
-- schedule anything while its tab is closed (platform parity rule). The row
-- goes through the existing notifications → push-notification-fanout path
-- (Expo push on Android, Web Push on web, and the in-app bell on both).
--
-- 1. profiles.timezone — IANA zone of the parent's device (e.g. 'Asia/Jerusalem'),
--    written by the app at the end of onboarding (UStep8_Complete). Nullable;
--    NULL (older rows, or a device that reported none) falls back to
--    Asia/Jerusalem, where every existing family is today. Existing rows: NULL,
--    no behaviour change for them (the scan only looks at children created in
--    the last 30 hours).
--
-- 2. scan_for_child_invite_reminder() — inserts a 'child_invite_reminder'
--    notification (entity_name = the chosen access_mode, for the copy) when:
--      - the child profile was created 1–30 hours ago (so: the same evening, or
--        the next one if onboarding ended after the window), with access_mode
--        home_device or own_phone;
--      - the child has NOT joined: user_id IS NULL (link_child_profile sets it);
--      - it is 19:30–19:59 in the parent's time zone now;
--      - the parent has not opted out (day1_push_optout) and the family is not
--        in Pause Mode;
--      - cap 1: no child_invite_reminder was ever sent for this child.
--    The fanout's own gates still apply (notif_activation_nudges preference,
--    5-minute activity suppression, idempotency).
--
-- 3. pg_cron every 30 minutes, so :30-offset zones (India, parts of Australia)
--    get their 19:30 too.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text;

CREATE OR REPLACE FUNCTION public.scan_for_child_invite_reminder()
RETURNS TABLE(child_invite_reminder_inserts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  insert_count INT := 0;
BEGIN
  WITH candidates AS (
    SELECT
      c.id AS child_id, c.family_id, c.display_name AS child_name, c.access_mode,
      (SELECT pp.id FROM public.profiles pp
       WHERE pp.family_id = c.family_id AND pp.role = 'parent'
         AND COALESCE(pp.is_deleted, false) = false
       ORDER BY pp.created_at ASC LIMIT 1) AS parent_id
    FROM public.profiles c
    WHERE c.role = 'child'
      AND c.family_id IS NOT NULL
      AND COALESCE(c.is_deleted, false) = false
      AND c.user_id IS NULL
      AND c.access_mode IN ('home_device', 'own_phone')
      AND c.created_at <= now() - INTERVAL '1 hour'
      AND c.created_at >= now() - INTERVAL '30 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'child_invite_reminder' AND n.child_id = c.id
      )
  ),
  eligible AS (
    SELECT ca.*
    FROM candidates ca
    JOIN public.profiles p ON p.id = ca.parent_id
    LEFT JOIN public.app_settings aps ON aps.family_id = ca.family_id
    WHERE COALESCE(p.day1_push_optout, false) = false
      AND NOT (
        COALESCE(aps.pause_mode_active, FALSE) = TRUE
        AND (aps.pause_until IS NULL OR aps.pause_until > now())
      )
      AND (now() AT TIME ZONE COALESCE(
            CASE WHEN p.timezone IN (SELECT name FROM pg_timezone_names) THEN p.timezone END,
            'Asia/Jerusalem'))::time >= TIME '19:30'
      AND (now() AT TIME ZONE COALESCE(
            CASE WHEN p.timezone IN (SELECT name FROM pg_timezone_names) THEN p.timezone END,
            'Asia/Jerusalem'))::time <  TIME '20:00'
  ),
  inserted_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_id, child_name, entity_name)
    SELECT family_id, parent_id, 'child_invite_reminder', child_id, child_name, access_mode
    FROM eligible
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO insert_count FROM inserted_rows;
  RETURN QUERY SELECT insert_count;
END;
$function$;

DO $cron$
BEGIN
  PERFORM cron.unschedule('scan_for_child_invite_reminder');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$cron$;

SELECT cron.schedule('scan_for_child_invite_reminder', '*/30 * * * *', 'SELECT public.scan_for_child_invite_reminder();');
