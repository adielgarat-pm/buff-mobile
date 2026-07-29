-- 051_families_rls_lockdown_phase_b.sql
-- PROPOSAL — NOT YET APPLIED. Apply ONLY after:
--   (a) 050 is applied, AND
--   (b) the client change (AuthContext child-join lookup -> lookup_family_by_code
--       RPC) has shipped via OTA and old binaries have had time to pick it up.
--       Gate: check that direct authenticated SELECTs on families filtered by
--       short_code have stopped appearing in API logs, or accept that a child
--       joining from a stale binary sees "code not found" until the app updates.
--
-- Phase B closes the last hole: the blanket authenticated SELECT that lets any
-- logged-in user read every family's name/short_code/language/platform.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "Members can view own family" ON public.families;
--   CREATE POLICY "Authenticated users can view families" ON public.families
--     FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view families" ON public.families;

-- Member read (own family via profile membership) OR creator read (covers the
-- INSERT..RETURNING window during onboarding, before the profile row exists).
-- "Admins can read families" (is_admin) remains as a separate policy.
CREATE POLICY "Members can view own family" ON public.families
  FOR SELECT TO authenticated
  USING (id = public.get_my_family_id() OR created_by = auth.uid());
