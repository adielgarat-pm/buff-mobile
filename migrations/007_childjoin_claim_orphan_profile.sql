-- ============================================================================
-- 007_childjoin_claim_orphan_profile.sql
-- Adds preflight_claim_orphan + claim_orphan_profile RPCs for atomic
-- ChildJoin orphan-profile reconciliation.
-- Generated: 2026-05-16
-- Source SPEC:     docs/sessions/childjoin-claim-orphans/SPEC.md
-- Source ROADMAP:  docs/sessions/childjoin-claim-orphans/ROADMAP.md (phase 1)
-- Source FLAG:     IN-2026-05-14-03 (docs/INTEGRATION_LEARNINGS.md)
-- Live migrations: 20260516082239_childjoin_claim_orphan_profile
--                  20260516082341_childjoin_claim_orphan_profile_fix_max_uuid
--                  (this file is the final consolidated state)
-- ============================================================================
--
-- Context:
--
-- ChildJoin signup created a duplicate profile when an orphan (parent-created,
-- user_id IS NULL) already existed for the same family + display_name. RLS
-- blocked the freshly-authenticated child user from UPDATE-ing the orphan
-- directly (only parents had that policy), so the duplicate was the silent
-- outcome. This migration adds two SECURITY DEFINER RPCs:
--
--   preflight_claim_orphan(p_family_code, p_display_name)
--     - Anon-callable. Read-only. Returns one of:
--         no_orphan_match | match_found | ambiguous_match
--       | cross_script_candidate_exists | family_not_found | invalid_input
--     - Called BEFORE supabase.auth.signUp so we don't create an orphan
--       auth.users row if validation will block.
--
--   claim_orphan_profile(p_family_code, p_display_name)
--     - Authenticated-only. Mutates: sets orphan.user_id = auth.uid().
--     - Returns: claimed:true,profile_id:... on success, or any of the
--       preflight reasons + not_authenticated + claim_race_lost.
--
-- Matching strategy (Adi 2026-05-16 Q3): lower(normalize(trim(x), NFC)).
-- Robust for Hebrew diacritics and Latin casing; intentionally does NOT
-- cross scripts (Hebrew "דני" will not auto-match Latin "Dani"). Cross-script
-- ambiguity falls through to cross_script_candidate_exists, which the client
-- surfaces as a blocking "ask your parent" error (Q4).
--
-- Race condition: claim_orphan_profile's UPDATE includes "AND user_id IS NULL"
-- in the WHERE clause, so a parallel claim wins via the row lock and the
-- loser gets claim_race_lost rather than silently overwriting.
--
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
  v_family_id    uuid;
  v_orphan_id    uuid;
  v_match_count  int;
  v_normalized   text;
  v_orphan_total int;
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

  IF v_match_count = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'cross_script_candidate_exists');
  ELSIF v_match_count > 1 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'ambiguous_match', 'count', v_match_count);
  END IF;

  SELECT id INTO v_orphan_id
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NULL
    AND lower(normalize(trim(display_name), NFC)) = v_normalized
  LIMIT 1;

  RETURN jsonb_build_object('claimed', false, 'reason', 'match_found', 'profile_id', v_orphan_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_orphan_profile(
  p_family_code text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id   uuid;
  v_orphan_id   uuid;
  v_match_count int;
  v_normalized  text;
  v_user_id     uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'not_authenticated');
  END IF;

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

  SELECT count(*) INTO v_match_count
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NULL
    AND lower(normalize(trim(display_name), NFC)) = v_normalized;

  IF v_match_count = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_orphan_match');
  ELSIF v_match_count > 1 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'ambiguous_match', 'count', v_match_count);
  END IF;

  SELECT id INTO v_orphan_id
  FROM profiles
  WHERE family_id = v_family_id
    AND role = 'child'
    AND user_id IS NULL
    AND lower(normalize(trim(display_name), NFC)) = v_normalized
  LIMIT 1;

  UPDATE profiles
  SET user_id    = v_user_id,
      updated_at = now()
  WHERE id = v_orphan_id
    AND user_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'claim_race_lost');
  END IF;

  RETURN jsonb_build_object('claimed', true, 'profile_id', v_orphan_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.preflight_claim_orphan(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_orphan_profile(text, text)   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.preflight_claim_orphan(text, text) TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_orphan_profile(text, text)   TO authenticated;

COMMENT ON FUNCTION public.preflight_claim_orphan(text, text) IS
  'childjoin-claim-orphans Phase 1: dry-run check before ChildJoin signup. Returns reason code without mutating. Anon-callable so the client can pre-validate before auth.signUp creates an orphan auth user.';

COMMENT ON FUNCTION public.claim_orphan_profile(text, text) IS
  'childjoin-claim-orphans Phase 1: atomic claim of an orphan child profile by a freshly authenticated child user. NFC + lower + trim matching on display_name; family_code matched case-insensitively. Race-condition guarded by user_id IS NULL in UPDATE WHERE.';
