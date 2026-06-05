-- ============================================================================
-- 018_child_login_stable_identity.sql
-- Adds list_family_children + link_child_profile RPCs for the pick-from-list
-- child entry flow, keying identity on the immutable profiles.id instead of a
-- typed display name.
-- Generated:   2026-06-04
-- Source SPEC: docs/sessions/child-login-stable-identity/SPEC.md (v3, own-auth)
-- Source PLAN: docs/sessions/child-login-stable-identity/ROADMAP.md (Phase 1)
-- ============================================================================
--
-- Root cause (Phase 0, code-confirmed):
--   Child credentials were derived from the *typed display name* + typed family
--   code:  email = <ascii(name)>@buff.app,  password = <name>_<CODE>_buff2026
--   (src/screens/auth/ChildJoinScreen.tsx:58-65). The flow calls auth.signUp
--   FIRST and only falls back to signIn on "already registered". So any variance
--   in the re-typed name (Hebrew "ליה" vs Latin "Liah", spacing, spelling) — or
--   the second derivation formula in SignupScreen.tsx:66 — produces a DIFFERENT
--   email, which signs UP a brand-new auth user + orphan profile instead of
--   signing INTO the existing account. (NOT "random credentials" as the early
--   SPEC framing assumed — they are deterministic but keyed on a variable input.)
--
-- Fix (Adi-approved 2026-06-04): resolve the child to their canonical
--   profiles.id via a pick-from-list step BEFORE any auth call, then derive
--   credentials from that immutable id. Typed name never touches credentials.
--
--   list_family_children(p_family_code)
--     - Anon-callable, read-only. Returns the family's non-deleted children
--       (id, display_name, avatar) so the child can pick their own card.
--     - SECURITY DEFINER so it works pre-auth and is scoped to one family.
--
--   link_child_profile(p_profile_id, p_family_code)
--     - Authenticated-only. Sets the picked profile's user_id = auth.uid(),
--       guarded by user_id IS NULL (race-safe, mirrors claim_orphan_profile)
--       and family + role + not-deleted scoping. Never inserts a profile.
--
-- Back-compat (Option A, Adi-approved): the 35 already-linked children are NOT
--   re-keyed here. The client reconstructs their LEGACY email/password from the
--   DB-stored display_name + code (deterministic, server-known — not typed) and
--   signs in. link_child_profile only handles the user_id IS NULL case; if an
--   already-linked profile is passed it returns not_linkable and the client uses
--   the legacy path. No auth.users rows are abandoned.
--
-- Security posture (MVP, documented limitation): because the password is
--   deterministically derivable from the profile id, and list_family_children
--   exposes ids to anyone holding the family code, knowing the family code lets
--   one enter as any child in that family. This matches the EXISTING posture
--   (the old scheme let anyone with the code + a guessed name do the same). The
--   hardened fix is a service-role edge function that mints the session without
--   a client-derivable password — deferred as a follow-up package per Adi.
--
-- ============================================================================

-- ── list_family_children ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_family_children(
  p_family_code text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id uuid;
  v_children  jsonb;
BEGIN
  IF p_family_code IS NULL OR length(trim(p_family_code)) = 0 THEN
    RETURN jsonb_build_object('found', false, 'reason', 'invalid_input', 'children', '[]'::jsonb);
  END IF;

  SELECT id INTO v_family_id
  FROM families
  WHERE upper(short_code) = upper(trim(p_family_code))
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'family_not_found', 'children', '[]'::jsonb);
  END IF;

  SELECT coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id',           c.id,
               'display_name', c.display_name,
               'avatar',       c.avatar,
               'linked',       (c.user_id IS NOT NULL)
             )
             ORDER BY c.display_name
           ),
           '[]'::jsonb
         )
  INTO v_children
  FROM profiles c
  WHERE c.family_id = v_family_id
    AND c.role = 'child'
    AND c.is_deleted = false;

  RETURN jsonb_build_object('found', true, 'children', v_children);
END;
$$;

-- ── link_child_profile ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.link_child_profile(
  p_profile_id   uuid,
  p_family_code  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_family_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'not_authenticated');
  END IF;

  IF p_profile_id IS NULL OR p_family_code IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'invalid_input');
  END IF;

  SELECT id INTO v_family_id
  FROM families
  WHERE upper(short_code) = upper(trim(p_family_code))
  LIMIT 1;

  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'family_not_found');
  END IF;

  -- This auth user must not already own a profile (profiles.user_id is
  -- unique-enforced). On the intended path the user was just created by signUp
  -- and owns nothing yet; this guard turns a would-be unique violation into a
  -- clean reason code.
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'auth_user_already_linked');
  END IF;

  -- Race-safe claim: only an unlinked child profile in the matching family is
  -- linkable. NOT FOUND covers already-linked / wrong-family / deleted / race.
  UPDATE profiles
  SET user_id    = v_user_id,
      updated_at = now()
  WHERE id        = p_profile_id
    AND family_id = v_family_id
    AND role      = 'child'
    AND is_deleted = false
    AND user_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'not_linkable');
  END IF;

  RETURN jsonb_build_object('linked', true, 'profile_id', p_profile_id);
END;
$$;

-- ── Grants ───────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.list_family_children(text)      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_child_profile(uuid, text)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.list_family_children(text)      TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.link_child_profile(uuid, text)  TO authenticated;

COMMENT ON FUNCTION public.list_family_children(text) IS
  'child-login-stable-identity Phase 1: anon-callable list of a family''s non-deleted children (id, display_name, avatar) for the pick-from-list entry screen. Scoped to one family by short_code.';

COMMENT ON FUNCTION public.link_child_profile(uuid, text) IS
  'child-login-stable-identity Phase 1: links a picked orphan child profile to the freshly authenticated auth user. Race-guarded by user_id IS NULL; family/role/not-deleted scoped. Does not insert profiles or re-key already-linked ones.';
