-- ============================================================================
-- 008_childjoin_preflight_returning_user_fix.sql
-- Hotfix for two regressions discovered during Adi's emulator test of
-- migration 007:
--
--   1. Returning users blocked: an existing child (non-orphan profile in
--      the family with matching name) re-attempting ChildJoin was blocked
--      by cross_script_candidate_exists logic, instead of falling through
--      to the legacy signUp→signIn flow.
--
--   2. New sibling blocked: a brand-new child joining a family that has
--      orphans for OTHER children (no NFC match against any orphan) was
--      blocked, because cross_script_candidate_exists fired any time
--      orphans existed and the input matched none of them.
--
-- Fixes:
--
--   • Add an existing-profile pre-check at the top of preflight. If a
--     non-orphan profile in the family matches the input (NFC + lower +
--     trim), return new reason `existing_profile_match`. Client falls
--     through to auth.signUp, which returns "already registered", and
--     ChildJoinScreen's signIn fallback signs the user in.
--
--   • Constrain cross_script_candidate_exists to fire only when
--     orphan_total = 1. With 2+ orphans and no NFC match, return
--     no_orphan_match (INSERT) instead. Multi-child families now allow
--     new siblings to join cleanly. The rare cross-script case in a
--     multi-orphan family creates a duplicate that is recovered via the
--     existing useUnlinkedChildren.linkChild parent banner — same fallback
--     as the original IN-2026-05-14-03 bug used pre-fix.
--
-- Generated:    2026-05-16
-- Source:       docs/sessions/childjoin-claim-orphans/STATUS.md § hotfix-2026-05-16
-- Triggered by: Adi's emulator test discovered existing-user regression
-- Live applied: childjoin_preflight_returning_user_and_multi_orphan
-- ============================================================================

CREATE OR REPLACE FUNCTION public.preflight_claim_orphan(
  p_family_code text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id              uuid;
  v_orphan_id              uuid;
  v_match_count            int;
  v_normalized             text;
  v_orphan_total           int;
  v_existing_profile_count int;
BEGIN
  IF p_family_code IS NULL OR p_display_name IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'invalid_input');
  END IF;

  SELECT id INTO v_family_id
  FROM families
  WHERE upper(short_code) = upper(trim(p_family_code))
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'family_not_found');
  END IF;

  v_normalized := lower(normalize(trim(p_display_name), NFC));

  -- Returning-user check (new): non-orphan profile with matching name = returning
  -- user; let signUp→already-registered→signIn handle it instead of blocking.
  SELECT count(*) INTO v_existing_profile_count
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NOT NULL
    AND lower(normalize(trim(display_name), NFC)) = v_normalized;

  IF v_existing_profile_count > 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'existing_profile_match');
  END IF;

  SELECT count(*) INTO v_orphan_total
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NULL;

  IF v_orphan_total = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_orphan_match');
  END IF;

  SELECT count(*) INTO v_match_count
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NULL
    AND lower(normalize(trim(display_name), NFC)) = v_normalized;

  IF v_match_count > 1 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'ambiguous_match', 'count', v_match_count);
  ELSIF v_match_count = 1 THEN
    SELECT id INTO v_orphan_id
    FROM profiles
    WHERE family_id = v_family_id
      AND role = 'child'
      AND user_id IS NULL
      AND lower(normalize(trim(display_name), NFC)) = v_normalized
    LIMIT 1;
    RETURN jsonb_build_object('claimed', false, 'reason', 'match_found', 'profile_id', v_orphan_id);
  ELSE
    -- v_match_count = 0 AND v_orphan_total > 0
    -- Block cross-script only when there is exactly 1 orphan (the classic
    -- single-child-family case from the original bug brief). With 2+ orphans,
    -- treat as new sibling — fall through to INSERT. Rare real cross-script
    -- in multi-orphan family is recoverable via useUnlinkedChildren.linkChild.
    IF v_orphan_total = 1 THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'cross_script_candidate_exists');
    ELSE
      RETURN jsonb_build_object('claimed', false, 'reason', 'no_orphan_match');
    END IF;
  END IF;
END;
$$;

-- claim_orphan_profile body unchanged; only preflight was wrong. Migration 007's
-- claim_orphan_profile remains correct (called only after preflight returns
-- match_found, and its own match logic is conservative).
