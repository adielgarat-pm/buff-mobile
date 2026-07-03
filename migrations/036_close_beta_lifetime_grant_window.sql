-- 036_close_beta_lifetime_grant_window.sql
--
-- Close the beta lifetime auto-grant window.
--
-- The window (grant_lifetime_if_in_window) auto-granted is_lifetime_access=true to every
-- new role='parent' signup between 2026-05-30 and 2026-07-17. It was a launch safety net for
-- the Lovable-migrant beta cohort while billing was not yet configured. RevenueCat + Google
-- Play billing is now configured and verified (project a26e9a08 — offering/entitlements/
-- products/service-account all green, webhook live), so new parents must go through the real
-- paywall instead of receiving a free lifetime grant. Left open, the window converts the
-- upcoming AI-trial funnel to $0 and masks on-device purchase verification.
--
-- Safety:
--   * Grant-only function — its sole mutation is `UPDATE ... SET is_lifetime_access = true`.
--     CREATE OR REPLACE swaps the body only; the ~32 parents already granted during the open
--     window are NOT revoked and keep their access. CREATE OR REPLACE preserves existing ACL
--     (the EXECUTE-from-PUBLIC revoke from the original migration stays in place).
--   * The trigger tg_profiles_after_insert_grants and grant_lifetime_if_pending are untouched
--     (the pending-email lifetime path stays alive).
--   * Reversible: re-widen the upper bound to re-open.
--
-- Only change vs the prior definition: upper bound 2026-07-17 23:59:59+03 -> 2026-06-30 23:59:59+03.
-- Applied live to gfrongfnyigxsexuofrg 2026-07-01 (migration close_beta_lifetime_grant_window).

CREATE OR REPLACE FUNCTION public.grant_lifetime_if_in_window(p_profile_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_now      timestamptz := now();
  v_role     text;
  v_lifetime boolean;
BEGIN
  IF v_now < '2026-05-30 00:00:00+03'::timestamptz
     OR v_now > '2026-06-30 23:59:59+03'::timestamptz THEN
    RETURN false;
  END IF;

  SELECT role, is_lifetime_access
    INTO v_role, v_lifetime
    FROM public.profiles
   WHERE id = p_profile_id;

  IF v_role IS DISTINCT FROM 'parent' OR v_lifetime IS NULL OR v_lifetime = true THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
     SET is_lifetime_access = true
   WHERE id = p_profile_id;

  RETURN true;
END;
$function$;
