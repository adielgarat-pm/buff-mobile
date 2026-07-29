-- 050_families_rls_lockdown_phase_a.sql
-- PROPOSAL — NOT YET APPLIED. Awaiting Adi approval (CLAUDE.md schema gate).
--
-- Context (found during 2026-07-29 AI-gate hardening, PR #410 / Lesson 2026-07-29,
-- and independently in docs/sessions/child-login-stable-identity/RLS_FINDINGS.md):
-- families RLS is wide open. Any authenticated user can SELECT and UPDATE ANY
-- family row (name, short_code, preferred_language, platform), and anon can
-- enumerate the whole table. trial_started_at is trigger-guarded (037) but the
-- rest is a horizontal privilege escalation.
--
-- Client-path audit (2026-07-29, this package):
--   READS of families from clients:
--     1. AuthContext.fetchFamilyShortCode  — own family, member read.
--     2. AuthContext.signUp child join     — short_code -> id lookup, runs
--        POST auth.signUp (session exists; email confirmations are off),
--        but the child is NOT yet a family member -> needs the RPC below.
--     3. INSERT ... RETURNING in AuthContext.signUp (parent) and
--        AuthCallbackScreen.createProfile — creator has NO profile yet at
--        RETURNING time -> needs created_by (below) to pass a member-scoped
--        SELECT policy.
--   WRITES: no client code UPDATEs families at all (verified by grep).
--   NOT affected (SECURITY DEFINER / service_role): switch_user_family (020),
--   preflight_claim_orphan + claim_orphan_profile (007/008), trial activation
--   trigger (037), admin-board RPCs (043/045/046), all edge functions.
--   landing-web: zero families/short_code usage. Realtime: families is not in
--   the supabase_realtime publication. Admin SELECT policy (is_admin) kept.
--
-- Rollout is TWO-PHASE because shipped Android binaries still do the direct
-- short_code lookup (2). Phase A (this file) is fully backward compatible:
-- it adds the RPC + created_by, kills the anon policy and the blanket UPDATE,
-- but leaves the authenticated blanket SELECT in place. The client switches to
-- the RPC via OTA. Phase B (051) then tightens SELECT to members.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "Parents can update own family" ON public.families;
--   CREATE POLICY "Authenticated users can update families" ON public.families
--     FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon can lookup family by short_code" ON public.families
--     FOR SELECT TO anon USING (true);
--   DROP FUNCTION IF EXISTS public.lookup_family_by_code(text);
--   DROP FUNCTION IF EXISTS public.is_family_parent();
--   -- (created_by column is harmless; no need to drop on rollback)

-- 1. Creator stamp. DEFAULT auth.uid() fills it on every client INSERT (old and
--    new binaries alike, no payload change). Lets the creating parent read the
--    row back via INSERT..RETURNING before their profile row exists, once
--    Phase B scopes SELECT to members. Existing rows stay NULL (members cover them).
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

COMMENT ON COLUMN public.families.created_by IS
  'auth.uid() of the user who created the family (default-stamped). RLS: lets the creator read the row back before their profile exists. NULL for pre-050 rows.';

-- 2. Join-code lookup RPC — replaces both the anon blanket SELECT and the
--    authenticated direct lookup in the child-join flow. Exact-match only,
--    format-validated, returns ONLY the id (no name/language/platform), so it
--    cannot be used to enumerate or read family data. 36^6 ≈ 2.2B codes makes
--    blind guessing impractical.
CREATE OR REPLACE FUNCTION public.lookup_family_by_code(p_short_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.families
  WHERE trim(coalesce(p_short_code, '')) ~ '^[A-Za-z0-9]{6}$'
    AND upper(short_code) = upper(trim(p_short_code))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_family_by_code(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lookup_family_by_code(text) TO anon, authenticated;

COMMENT ON FUNCTION public.lookup_family_by_code(text) IS
  'families RLS lockdown (050): minimal join-code -> family id resolver for the child-join flow. Replaces the anon blanket SELECT policy. Returns NULL on bad format or no match.';

-- 3. Kill anon enumeration. Audit found NO client path using anon reads:
--    landing-web never touches families, pre-signup checks go through the
--    SECURITY DEFINER preflight RPC, and the post-signUp lookup runs with a
--    session (email confirmations are disabled).
DROP POLICY IF EXISTS "anon can lookup family by short_code" ON public.families;

-- 4. Parent-role helper (SECURITY DEFINER so the policy below can't recurse
--    into profiles RLS). Mirrors get_my_family_id (001).
CREATE OR REPLACE FUNCTION public.is_family_parent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'parent'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_family_parent() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_family_parent() TO authenticated;

-- 5. UPDATE: parents of the family only. Safe to apply immediately — no client
--    code path UPDATEs families today; trial_started_at writes come from the
--    037 SECURITY DEFINER trigger, which bypasses RLS.
DROP POLICY IF EXISTS "Authenticated users can update families" ON public.families;
CREATE POLICY "Parents can update own family" ON public.families
  FOR UPDATE TO authenticated
  USING (id = public.get_my_family_id() AND public.is_family_parent())
  WITH CHECK (id = public.get_my_family_id() AND public.is_family_parent());

-- 6. INSERT: still open to any authenticated user (onboarding creates the
--    family BEFORE the profile exists, so no membership check is possible),
--    but stamp the creator and forbid presetting the trial clock. Old binaries
--    pass both checks unchanged (created_by fills via DEFAULT; they never send
--    trial_started_at).
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
CREATE POLICY "Authenticated users can create families" ON public.families
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND trial_started_at IS NULL);
