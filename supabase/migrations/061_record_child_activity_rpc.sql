-- 061_record_child_activity_rpc.sql
--
-- Approved by Adi 2026-10-08.
--
-- useWelcomeBack stamps app_settings.last_child_activity on every child-screen
-- mount, but app_settings writes are parent-only under RLS ("Parents can manage
-- settings"). A child's UPDATE therefore matched 0 rows and returned 204 — the
-- value was never written by a child. The 21 non-null values in production came
-- from PARENTS in child preview, so the column meant "a parent last previewed",
-- and the 3-day Welcome Back modal could never fire for a real child.
--
-- Fix: a narrow SECURITY DEFINER RPC. Children may stamp ONLY this column, ONLY
-- on their own family's row, at most once per 5 minutes. Parents (incl. child
-- preview) are a no-op so the value means real child activity. RLS on
-- app_settings is unchanged — children still cannot edit family settings.
--
-- Existing parent-written values are left in place (Adi, 2026-10-08): they are
-- overwritten by the first real child stamp.

CREATE OR REPLACE FUNCTION public.record_child_activity()
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path TO ''
AS $$
  UPDATE public.app_settings
     SET last_child_activity = now()
   WHERE family_id = public.get_my_family_id()
     AND EXISTS (
       SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'child'
     )
     AND (last_child_activity IS NULL
          OR last_child_activity < now() - interval '5 minutes');
$$;

REVOKE ALL ON FUNCTION public.record_child_activity() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_child_activity() TO authenticated;
