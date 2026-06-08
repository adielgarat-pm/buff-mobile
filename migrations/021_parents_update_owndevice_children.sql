-- 021: Allow parents to update their family's child profiles even when the
-- child owns a device (user_id IS NOT NULL).
--
-- The prior policy "Parents can update child profiles in their family" required
-- user_id IS NULL, so an own-device child (ChildJoin -> persistent auth session,
-- user_id populated) could not be edited by the parent: the UPDATE matched 0
-- rows and returned NO error, silently dropping name/avatar/birthday/age_group/
-- language changes made in EditChild. This relaxes the policy to any child row
-- in a family where the actor is a parent. WITH CHECK still pins the row to
-- role = 'child' and the parent's own family, so a parent cannot promote a child
-- to parent or move them into another family. The child can still update their
-- own row via the separate "Users can update their own profile" policy.
--
-- See memory project_editchild_rls_blocks_owndevice + IN (Emmy, 2026-06-08).

DROP POLICY IF EXISTS "Parents can update child profiles in their family" ON public.profiles;

CREATE POLICY "Parents can update child profiles in their family"
ON public.profiles
FOR UPDATE
USING (
  role = 'child'
  AND EXISTS (
    SELECT 1 FROM public.profiles parent_profile
    WHERE parent_profile.user_id = auth.uid()
      AND parent_profile.role = 'parent'
      AND parent_profile.family_id = profiles.family_id
  )
)
WITH CHECK (
  role = 'child'
  AND EXISTS (
    SELECT 1 FROM public.profiles parent_profile
    WHERE parent_profile.user_id = auth.uid()
      AND parent_profile.role = 'parent'
      AND parent_profile.family_id = profiles.family_id
  )
);
