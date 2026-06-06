-- ============================================================================
-- 020_switch_user_family.sql
-- Adds switch_user_family RPC: lets a logged-in parent move into another
-- family by its short_code (role preserved), enabling a second parent to join
-- an existing family. Cleans up the caller's now-empty old family.
-- Generated: 2026-06-06
-- Source SPEC:     docs/sessions/co-parent-join/SPEC.md
-- Source ROADMAP:  docs/sessions/co-parent-join/ROADMAP.md (phase 1)
-- Live migration:  switch_user_family (applied 2026-06-06)
-- ============================================================================
--
-- Context:
--
-- A family is identified by families.short_code (6 chars). RLS is entirely
-- family-scoped, so once a profile shares a family_id, it can read/manage that
-- family's children, tasks, rewards, etc. There is no UNIQUE(family_id, role)
-- constraint, so a family can hold multiple parents.
--
-- This RPC lets an already-authenticated user (typically a parent who signed up
-- and got their own empty family) move into another family by entering its
-- code in Parent Settings. The caller's role is PRESERVED (a parent stays a
-- parent), so there is no privilege escalation — and the join UI is parent-only.
--
-- Old-family cleanup: if the caller was the last member, the old (now empty)
-- family is removed. Most family-scoped tables are ON DELETE CASCADE; three are
-- not (child_suggestions, push_subscriptions, stickers), so they are cleared
-- explicitly first to guarantee the DELETE can never hit an FK violation.
-- In the normal 0-member case those tables are already empty.
--
-- Return shape: { success: bool, new_family_id?: uuid, reason?: text }
--   reasons: not_authenticated | profile_not_found | invalid_input
--          | code_not_found | already_member
-- ============================================================================

CREATE OR REPLACE FUNCTION public.switch_user_family(p_new_family_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id           uuid := auth.uid();
  v_profile_id        uuid;
  v_current_family_id uuid;
  v_new_family_id     uuid;
  v_member_count      int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;

  SELECT id, family_id INTO v_profile_id, v_current_family_id
  FROM profiles WHERE user_id = v_user_id LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'profile_not_found');
  END IF;

  IF p_new_family_code IS NULL OR length(trim(p_new_family_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_input');
  END IF;

  SELECT id INTO v_new_family_id
  FROM families WHERE upper(short_code) = upper(trim(p_new_family_code)) LIMIT 1;

  IF v_new_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'code_not_found');
  END IF;

  IF v_new_family_id = v_current_family_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_member');
  END IF;

  -- Move the caller into the new family. Role is preserved (a parent stays a
  -- parent). app_settings for the target family already exists (created by the
  -- first parent), so nothing to create here.
  UPDATE profiles
  SET family_id = v_new_family_id, updated_at = now()
  WHERE id = v_profile_id;

  -- Clean up the old family if the caller was its last remaining member.
  IF v_current_family_id IS NOT NULL THEN
    SELECT count(*) INTO v_member_count
    FROM profiles WHERE family_id = v_current_family_id;

    IF v_member_count = 0 THEN
      -- Most family-scoped tables are ON DELETE CASCADE; these three are not,
      -- so clear them first to guarantee the family DELETE cannot hit an FK
      -- violation (they are empty in the normal 0-member case anyway).
      DELETE FROM child_suggestions  WHERE family_id = v_current_family_id;
      DELETE FROM push_subscriptions WHERE family_id = v_current_family_id;
      DELETE FROM stickers           WHERE family_id = v_current_family_id;
      DELETE FROM families           WHERE id = v_current_family_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'new_family_id', v_new_family_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.switch_user_family(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.switch_user_family(text) TO authenticated;

COMMENT ON FUNCTION public.switch_user_family(text) IS
  'co-parent-join: moves the calling user into another family by short_code (role preserved), enabling a second parent to join. Cleans up the caller''s old family if it becomes empty. SECURITY DEFINER; authenticated-only.';
