-- 035_protect_entitlement_columns.sql
-- Applied via Supabase MCP during pkg/ai-trial-and-referral session (2026-07-01), Phase 0.
--
-- WHY: audit found profiles grants table-level UPDATE to authenticated/anon with an
-- RLS policy that checks only ownership (user_id = auth.uid()), NOT which columns
-- changed. Any authenticated user could self-grant lifetime premium via the app's own
-- anon key:  UPDATE profiles SET premium_until = now()+'10y', is_lifetime_access=true
--            WHERE user_id = auth.uid();
-- This closed a live billing-bypass, independent of the AI-trial work.
--
-- APPROACH: a BEFORE UPDATE trigger that blocks changes to entitlement columns ONLY
-- when the executing role is a client role (authenticated/anon). Zero blast radius —
-- no existing grant is touched, so all benign client writes (display_name, settings,
-- last_seen_at, etc.) are unaffected. Server writers are unaffected because:
--   * SECURITY DEFINER RPCs (e.g. redeem_referral) run as postgres (the owner)
--   * rc-webhook + the daily nullify cron run as service_role
-- BEFORE UPDATE only — signup INSERT is unaffected.
--
-- VERIFIED (2026-07-01, rollback-only tests on a real parent row):
--   client premium_until write  -> BLOCKED (insufficient_privilege)  PASS
--   client display_name write    -> ALLOWED                          PASS
--   server-role premium_until     -> ALLOWED                          PASS
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS trg_guard_profile_entitlement ON public.profiles;
--   DROP FUNCTION IF EXISTS public.guard_profile_entitlement_columns();

CREATE OR REPLACE FUNCTION public.guard_profile_entitlement_columns()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''   -- pinned: closes function_search_path_mutable (fn uses no schema objects)
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.premium_until          IS DISTINCT FROM OLD.premium_until
    OR NEW.is_lifetime_access     IS DISTINCT FROM OLD.is_lifetime_access
    OR NEW.is_lifetime_founding   IS DISTINCT FROM OLD.is_lifetime_founding
    OR NEW.founding_member_number IS DISTINCT FROM OLD.founding_member_number
    THEN
      RAISE EXCEPTION 'entitlement columns are not client-writable'
        USING errcode = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_profile_entitlement ON public.profiles;
CREATE TRIGGER trg_guard_profile_entitlement
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_entitlement_columns();
