-- ============================================================================
-- 021_delete_account.sql
-- Adds delete_my_account RPC: in-app account deletion (Apple Guideline 5.1.1(v),
-- required for App Store / external TestFlight). A logged-in user permanently
-- deletes their own account and data.
-- Generated: 2026-06-12
-- Source: docs/sessions/ios-testflight/ (Phase 1 — App Store readiness)
-- ============================================================================
--
-- Deletion scope (decided 2026-06-12, "context-dependent"):
--   * SOLE PARENT (no other parent in the family) → delete the ENTIRE family:
--     all children, all family data, and the auth.users login of every member.
--     This is the GDPR/COPPA "delete all my data" expectation — the parent is the
--     data controller for the children.
--   * CO-PARENT PRESENT (>=1 other parent) → delete ONLY the calling profile +
--     its auth login. The family and children stay for the remaining parent.
--   * A child calling this deletes only their own profile (parents remain).
--
-- FK facts (verified against live schema 2026-06-12):
--   * profiles.user_id has NO FK to auth.users → deleting one does NOT cascade to
--     the other; both must be deleted explicitly.
--   * Family-scoped tables are mostly ON DELETE CASCADE from families(id). NOT
--     cascade (must be cleared first): child_suggestions, push_subscriptions,
--     stickers (all by family_id).
--   * Profile-referencing NO-ACTION FKs that can block a profile delete:
--     stickers(from_parent_id,to_child_id), child_suggestions(resolved_by,child_id),
--     email_logs(profile_id). These are cleared before the profile/family DELETE.
--
-- Return shape: { success: bool, scope?: 'family'|'profile'|'auth_only', reason?: text }
--   reasons: not_authenticated
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid := auth.uid();
  v_profile_id    uuid;
  v_family_id     uuid;
  v_other_parents int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;

  SELECT id, family_id INTO v_profile_id, v_family_id
  FROM profiles WHERE user_id = v_user_id LIMIT 1;

  -- No profile row (orphaned auth user): still remove the login so the account is gone.
  IF v_profile_id IS NULL THEN
    DELETE FROM auth.users WHERE id = v_user_id;
    RETURN jsonb_build_object('success', true, 'scope', 'auth_only');
  END IF;

  -- Other parents in the same family (excluding the caller).
  SELECT count(*) INTO v_other_parents
  FROM profiles
  WHERE family_id = v_family_id AND role = 'parent' AND id <> v_profile_id;

  IF v_other_parents > 0 OR v_family_id IS NULL THEN
    -- ── DELETE ONLY THIS PROFILE (co-parent present, or child) ───────────────
    -- Clear NO-ACTION references to this profile first.
    DELETE FROM stickers          WHERE from_parent_id = v_profile_id OR to_child_id = v_profile_id;
    DELETE FROM child_suggestions WHERE child_id = v_profile_id;
    UPDATE child_suggestions SET resolved_by = NULL WHERE resolved_by = v_profile_id;
    DELETE FROM email_logs        WHERE profile_id = v_profile_id;
    -- device_tokens, push_subscriptions(profile_id), notifications(parent_id|child_id)
    -- are ON DELETE CASCADE from profiles, so they go automatically.
    DELETE FROM profiles  WHERE id = v_profile_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    RETURN jsonb_build_object('success', true, 'scope', 'profile');
  END IF;

  -- ── DELETE THE ENTIRE FAMILY (caller is the sole parent) ───────────────────
  -- Clear NO-ACTION family/profile-scoped tables before the family DELETE.
  DELETE FROM stickers          WHERE family_id = v_family_id;
  DELETE FROM push_subscriptions WHERE family_id = v_family_id;
  DELETE FROM child_suggestions WHERE family_id = v_family_id;
  DELETE FROM email_logs WHERE profile_id IN (SELECT id FROM profiles WHERE family_id = v_family_id);

  -- Remove the auth login of every family member that has one (must read the ids
  -- BEFORE the family DELETE cascades the profiles away).
  DELETE FROM auth.users
  WHERE id IN (SELECT user_id FROM profiles WHERE family_id = v_family_id AND user_id IS NOT NULL);

  -- Delete the family → cascades profiles + all ON DELETE CASCADE family tables.
  DELETE FROM families WHERE id = v_family_id;

  RETURN jsonb_build_object('success', true, 'scope', 'family');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

COMMENT ON FUNCTION public.delete_my_account() IS
  'Account deletion (Apple 5.1.1(v)): caller deletes their own account. Sole parent => whole family + all members'' auth.users; co-parent/child => only the caller''s profile + auth.users. SECURITY DEFINER; authenticated-only.';
