-- ============================================================================
-- 015_pending_lifetime_grants.sql
-- Auto-grant `profiles.is_lifetime_access=true` for Lovable migrants and
-- beta-window signups, via an AFTER INSERT trigger on `public.profiles`.
-- Generated: 2026-05-25
-- Source SPEC:     docs/sessions/pending-lifetime-grants/SPEC.md
-- Source ROADMAP:  docs/sessions/pending-lifetime-grants/ROADMAP.md (phase 1)
-- Source ORIGIN:   docs/sessions/beta-2026-06-01/TRACK_5_findings.md (Option B)
-- ============================================================================
--
-- Context:
--
-- BUFF launches a beta APK to a WhatsApp group of Lovable POC users on
-- 2026-05-30/06-01. There is no Lovable -> mobile auth migration; Lovable
-- users will re-sign up via Google OAuth on the mobile app. We need to
-- auto-grant lifetime access on their first signup so the paywall never
-- bothers them. No manual flagging, no support ticket.
--
-- Decisions approved by Adi 2026-05-25 (see SPEC.md):
--   D1 -- Open beta window 2026-05-30 .. 2026-06-30: any new parent signup
--         in this window gets lifetime, even without an email match. Covers
--         WhatsApp newcomers + the 8 cohort members with no recoverable email.
--   D2 -- One-time backfill inside this migration for any existing matched
--         profile (idempotent).
--   D3 -- Trigger location is AFTER INSERT on `public.profiles` (not on
--         `auth.users`, not client-side). At profile-insert time both user_id
--         and profile row exist, so the JOIN to auth.users.email is clean,
--         and the trigger works for every auth path (Google OAuth, email/pw,
--         future providers).
--
-- ============================================================================
-- 1. pending_lifetime_grants table
-- ============================================================================
--
-- Storage for emails that should auto-grant on next signup.
-- PK enforces uniqueness; CHECK constraints enforce lowercase + trimmed so
-- the trigger functions never need to canonicalize on the read side.
-- RLS enabled with NO policies -> anon and authenticated have zero access.
-- service_role bypasses RLS (default Supabase behavior) and SECURITY DEFINER
-- functions (declared below) run as the table owner.

CREATE TABLE public.pending_lifetime_grants (
  email      text PRIMARY KEY,
  source     text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  notes      text,
  CONSTRAINT email_lowercase     CHECK (email = lower(email)),
  CONSTRAINT email_no_whitespace CHECK (email = btrim(email)),
  CONSTRAINT source_valid        CHECK (source IN ('mailing_list_49', 'whatsapp_new_join', 'manual'))
);

CREATE INDEX pending_lifetime_grants_source_idx
  ON public.pending_lifetime_grants (source);

ALTER TABLE public.pending_lifetime_grants ENABLE ROW LEVEL SECURITY;
-- (Intentionally no policies; service_role + SECURITY DEFINER only.)

COMMENT ON TABLE public.pending_lifetime_grants IS
  'Emails that should auto-grant is_lifetime_access on next profile insert. Consumed by tg_profiles_after_insert_grants. Source pending-lifetime-grants package (2026-05-25).';

-- ============================================================================
-- 2. grant_lifetime_if_pending(profile_id)
-- ============================================================================
--
-- Looks up the profile's auth.users.email (case-insensitive, trim-safe) in
-- pending_lifetime_grants. If matched: atomically DELETE the pending row
-- and UPDATE the profile to is_lifetime_access=true. Returns true on grant.
-- No-op (returns false) if profile has no user_id, no auth.users row, or
-- the email is not in the pending table.

CREATE OR REPLACE FUNCTION public.grant_lifetime_if_pending(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_deleted boolean := false;
BEGIN
  SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(btrim(email)) INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL OR v_email = '' THEN
    RETURN false;
  END IF;

  DELETE FROM public.pending_lifetime_grants
   WHERE email = v_email
  RETURNING true INTO v_deleted;

  IF v_deleted THEN
    UPDATE public.profiles
       SET is_lifetime_access = true
     WHERE id = p_profile_id
       AND is_lifetime_access = false;
  END IF;

  RETURN COALESCE(v_deleted, false);
END;
$$;

COMMENT ON FUNCTION public.grant_lifetime_if_pending(uuid) IS
  'If the profile''s auth.users.email is in pending_lifetime_grants, deletes the pending row and sets is_lifetime_access=true. Returns true if granted.';

-- ============================================================================
-- 3. grant_lifetime_if_in_window(profile_id)
-- ============================================================================
--
-- If NOW() is between 2026-05-30 00:00 +03 and 2026-06-30 23:59:59 +03
-- (Asia/Jerusalem), and the profile.role='parent', and not already lifetime,
-- sets is_lifetime_access=true. Returns true on grant. Hard-coded window;
-- self-disables silently after 2026-06-30 with no migration cleanup needed.

CREATE OR REPLACE FUNCTION public.grant_lifetime_if_in_window(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
$$;

COMMENT ON FUNCTION public.grant_lifetime_if_in_window(uuid) IS
  'Auto-grants is_lifetime_access to any new parent profile inserted between 2026-05-30 and 2026-06-30 (Asia/Jerusalem). Self-disables after the window closes.';

-- ============================================================================
-- 4. Trigger function and trigger
-- ============================================================================
--
-- AFTER INSERT on public.profiles. Tries pending-grant first (specific);
-- falls back to in-window grant (broader, parent-only). Both calls are
-- safe no-ops when their conditions aren't met.

CREATE OR REPLACE FUNCTION public.tg_profiles_after_insert_grant_lifetime()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF public.grant_lifetime_if_pending(NEW.id) THEN
    RETURN NEW;
  END IF;
  PERFORM public.grant_lifetime_if_in_window(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_profiles_after_insert_grants
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_profiles_after_insert_grant_lifetime();

COMMENT ON TRIGGER tg_profiles_after_insert_grants ON public.profiles IS
  'On profile insert, auto-grant is_lifetime_access if email matches pending_lifetime_grants OR signup is in the beta window. Source pending-lifetime-grants package (2026-05-25).';

-- ============================================================================
-- 5. Seed -- 16 recoverable cohort emails
-- ============================================================================
--
-- Sources email_to from public.email_logs for every qualifying parent
-- (marketing_consent=true AND family has >=1 child). DISTINCT + lowercase
-- + trim. ON CONFLICT keeps the migration idempotent on re-run.

INSERT INTO public.pending_lifetime_grants (email, source, notes)
SELECT DISTINCT
       lower(btrim(el.email_to)) AS email,
       'mailing_list_49' AS source,
       'seeded from email_logs cohort (TRACK_5 2026-05-25, pkg/pending-lifetime-grants)' AS notes
  FROM public.email_logs el
  JOIN public.profiles p ON p.id = el.profile_id
 WHERE p.role = 'parent'
   AND p.marketing_consent = true
   AND EXISTS (
     SELECT 1
       FROM public.profiles c
      WHERE c.family_id = p.family_id
        AND c.role = 'child'
   )
   AND el.email_to IS NOT NULL
   AND btrim(el.email_to) <> ''
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 6. Backfill -- existing matched profiles get the flag NOW
-- ============================================================================
--
-- For any existing profile whose auth.users.email matches a seeded pending
-- email, set is_lifetime_access=true and remove the matched pending row.
-- Idempotent: re-running finds no eligible profiles (because either the
-- flag is already true or the pending row was already deleted).

WITH matched AS (
  SELECT p.id AS profile_id, lower(btrim(au.email)) AS email
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.user_id
   WHERE p.is_lifetime_access = false
     AND lower(btrim(au.email)) IN (SELECT email FROM public.pending_lifetime_grants)
),
upd AS (
  UPDATE public.profiles
     SET is_lifetime_access = true
   WHERE id IN (SELECT profile_id FROM matched)
  RETURNING id
)
DELETE FROM public.pending_lifetime_grants
 WHERE email IN (SELECT email FROM matched);

-- ============================================================================
-- 7. Lock down SECURITY DEFINER functions
-- ============================================================================
--
-- These functions are intended to be called by the AFTER INSERT trigger
-- (which runs as the inserting role, with the function executing under
-- SECURITY DEFINER) or by service_role for manual maintenance. They have
-- no purpose being directly callable by anon or authenticated, and the
-- Supabase security advisor flags them under
-- `anon_security_definer_function_executable` /
-- `authenticated_security_definer_function_executable` if left open.
--
-- The actual exploit surface is low (calling them grants the same lifetime
-- access that the trigger would grant anyway, to the same profile id), but
-- the advisor recommends explicit REVOKE so the principle of least
-- privilege is upheld and the warning stays clean.

-- REVOKE from PUBLIC (default grant); anon + authenticated inherit from PUBLIC,
-- so revoking only those two is insufficient. service_role still keeps EXECUTE
-- via the per-role grant set up in migration 014, so internal calls + the
-- trigger continue to work.
REVOKE EXECUTE ON FUNCTION public.grant_lifetime_if_pending(uuid)              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_lifetime_if_in_window(uuid)            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_profiles_after_insert_grant_lifetime()    FROM PUBLIC;

-- ============================================================================
-- End of migration 015
-- ============================================================================
