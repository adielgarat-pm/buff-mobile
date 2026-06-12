-- ============================================================================
-- 022_soft_delete_child.sql
-- Lets a parent remove a single child from their family. SOFT delete: the child
-- profile is hidden (is_deleted=true), not destroyed — so the stable child
-- identity (migration 018) is preserved if the child later re-joins.
-- Generated: 2026-06-12
-- Source: docs/sessions/ios-testflight/ (account & child management)
-- ============================================================================
--
-- profiles.is_deleted already exists in the live schema (drift); this formalizes
-- it in repo history. ADD COLUMN IF NOT EXISTS is idempotent.
--
-- soft_delete_child(p_child_id): the CALLER must be a parent, and the target
-- must be a child in the SAME family. Returns the number of remaining
-- (non-deleted) children so the client can offer to delete the family account
-- when the last child was just removed.
--
-- Return shape: { success: bool, remaining_children?: int, reason?: text }
--   reasons: not_authenticated | not_a_parent | child_not_found | not_your_child
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.soft_delete_child(p_child_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       uuid := auth.uid();
  v_caller_family uuid;
  v_caller_role   text;
  v_child_family  uuid;
  v_remaining     int;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;

  SELECT family_id, role INTO v_caller_family, v_caller_role
  FROM profiles WHERE user_id = v_user_id LIMIT 1;

  IF v_caller_family IS NULL OR v_caller_role <> 'parent' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_a_parent');
  END IF;

  SELECT family_id INTO v_child_family
  FROM profiles WHERE id = p_child_id AND role = 'child' AND is_deleted = false;

  IF v_child_family IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'child_not_found');
  END IF;

  IF v_child_family <> v_caller_family THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_your_child');
  END IF;

  UPDATE profiles SET is_deleted = true, updated_at = now() WHERE id = p_child_id;

  SELECT count(*) INTO v_remaining
  FROM profiles
  WHERE family_id = v_caller_family AND role = 'child' AND is_deleted = false;

  RETURN jsonb_build_object('success', true, 'remaining_children', v_remaining);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_child(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.soft_delete_child(uuid) TO authenticated;

COMMENT ON FUNCTION public.soft_delete_child(uuid) IS
  'Parent removes one child (soft: is_deleted=true). Caller must be a parent in the same family. Returns remaining_children so the client can offer family-account deletion after the last child.';
