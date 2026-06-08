-- pkg/notifications-hardening Phase 2 — cron split: churned vs never-activated
-- Applied to mobile project gfrongfnyigxsexuofrg via Supabase MCP apply_migration.
-- Recorded here for the PR (repo has no supabase/migrations tree).
--
--  (1) scan_for_anchor_recovery: add ever-active gate + graduated threshold
--      (L2: 3 days if < 5 completions, else 5 days) + stop-after-3 guard (OQ3=3).
--  (2) scan_for_activation_nudge: NEW — never-activated families, 2–14 day window
--      (L5), deduped per (family, child_name) to absorb duplicate child profiles.
--  (3) pg_cron job for the activation scan (06:10 UTC, staggered after anchor 06:05).

-- ── (1) anchor_recovery — churned kids only, graduated threshold ──────────────
CREATE OR REPLACE FUNCTION public.scan_for_anchor_recovery()
RETURNS TABLE(anchor_recovery_inserts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  insert_count INT := 0;
BEGIN
  WITH eligible_kids AS (
    SELECT p.id AS child_id, p.family_id, p.display_name AS child_name
    FROM public.profiles p
    JOIN public.families f ON f.id = p.family_id
    LEFT JOIN public.app_settings aps ON aps.family_id = p.family_id
    WHERE p.role = 'child'
      AND p.family_id IS NOT NULL
      AND COALESCE(p.is_deleted, false) = false
      -- runway: skip families younger than 7 days
      AND f.created_at <= (now() - INTERVAL '7 days')
      -- respect Pause Mode
      AND COALESCE(aps.pause_mode_active, FALSE) = FALSE
      -- ever-active gate (L8): must have at least one daily_progress ever.
      -- Never-activated families are handled by scan_for_activation_nudge instead.
      AND EXISTS (SELECT 1 FROM public.daily_progress dp WHERE dp.child_id = p.id)
      -- graduated idle window (L2): established kids (>=5 completed) need 5 idle
      -- days; barely-established kids need only 3. Prevents nagging a solid user
      -- on a normal short gap.
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_progress dp
        WHERE dp.child_id = p.id
          AND dp.created_at > (now() - (
            CASE WHEN (
              SELECT count(*) FROM public.daily_progress d2
              WHERE d2.child_id = p.id AND d2.completed = true AND d2.revoked_at IS NULL
            ) >= 5 THEN INTERVAL '5 days' ELSE INTERVAL '3 days' END))
      )
      -- re-fire gate: at most one anchor_recovery per kid per 7 days
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'anchor_recovery' AND n.child_id = p.id
          AND n.created_at > (now() - INTERVAL '7 days')
      )
      -- stop-after-3 (OQ3): give up after 3 nudges since the kid's last activity,
      -- so a truly-churned family is not nagged forever.
      AND (
        SELECT count(*) FROM public.notifications n
        WHERE n.type = 'anchor_recovery' AND n.child_id = p.id
          AND n.created_at > COALESCE(
            (SELECT max(dp.created_at) FROM public.daily_progress dp WHERE dp.child_id = p.id),
            '-infinity'::timestamptz)
      ) < 3
  ),
  parents_for_kids AS (
    SELECT ek.child_id, ek.family_id, ek.child_name,
      (SELECT pp.id FROM public.profiles pp
       WHERE pp.family_id = ek.family_id AND pp.role = 'parent'
       ORDER BY pp.created_at ASC LIMIT 1) AS parent_id
    FROM eligible_kids ek
  ),
  inserted_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_id, child_name)
    SELECT family_id, parent_id, 'anchor_recovery', child_id, child_name
    FROM parents_for_kids
    WHERE parent_id IS NOT NULL
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO insert_count FROM inserted_rows;
  RETURN QUERY SELECT insert_count;
END;
$function$;

-- ── (2) activation_nudge — never-activated families (NEW) ─────────────────────
CREATE OR REPLACE FUNCTION public.scan_for_activation_nudge()
RETURNS TABLE(activation_nudge_inserts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  insert_count INT := 0;
BEGIN
  WITH eligible_kids AS (
    SELECT DISTINCT ON (p.family_id, p.display_name)
      p.id AS child_id, p.family_id, p.display_name AS child_name
    FROM public.profiles p
    JOIN public.families f ON f.id = p.family_id
    LEFT JOIN public.app_settings aps ON aps.family_id = p.family_id
    WHERE p.role = 'child'
      AND p.family_id IS NOT NULL
      AND COALESCE(p.is_deleted, false) = false
      -- never activated: zero daily_progress ever
      AND NOT EXISTS (SELECT 1 FROM public.daily_progress dp WHERE dp.child_id = p.id)
      -- L5 (beta override, Adi 2026-06-08): protect testers — do NOT nudge during
      -- their 14-day trial (early nudges risk uninstalls that wreck the test).
      -- Fire only AFTER the trial: family 14–21 days old, once. The "strike while
      -- warm" day-2 window is the post-beta target, deferred.
      -- Superseded by migration notifications_hardening_p2_activation_window_post_trial.
      AND f.created_at <= (now() - INTERVAL '14 days')
      AND f.created_at >= (now() - INTERVAL '21 days')
      -- respect Pause Mode
      AND COALESCE(aps.pause_mode_active, FALSE) = FALSE
      -- once per child ever
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.type = 'activation_nudge' AND n.child_id = p.id
      )
    ORDER BY p.family_id, p.display_name, p.created_at ASC  -- dedup duplicate child profiles
  ),
  parents_for_kids AS (
    SELECT ek.child_id, ek.family_id, ek.child_name,
      (SELECT pp.id FROM public.profiles pp
       WHERE pp.family_id = ek.family_id AND pp.role = 'parent'
       ORDER BY pp.created_at ASC LIMIT 1) AS parent_id
    FROM eligible_kids ek
  ),
  inserted_rows AS (
    INSERT INTO public.notifications (family_id, parent_id, type, child_id, child_name)
    SELECT family_id, parent_id, 'activation_nudge', child_id, child_name
    FROM parents_for_kids
    WHERE parent_id IS NOT NULL
    RETURNING 1
  )
  SELECT COUNT(*)::INT INTO insert_count FROM inserted_rows;
  RETURN QUERY SELECT insert_count;
END;
$function$;

-- ── (3) schedule the activation scan (06:10 UTC, after anchor at 06:05) ───────
DO $cron$
BEGIN
  PERFORM cron.unschedule('scan_for_activation_nudge_daily');
EXCEPTION WHEN OTHERS THEN NULL;
END
$cron$;

SELECT cron.schedule('scan_for_activation_nudge_daily', '10 6 * * *', 'SELECT public.scan_for_activation_nudge();');
