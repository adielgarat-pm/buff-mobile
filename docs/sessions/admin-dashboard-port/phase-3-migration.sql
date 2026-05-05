-- =====================================================
-- admin-dashboard-port Phase 3 — Auth Foundation
-- Run this in Supabase Dashboard → SQL Editor
-- Project: buff-production (gfrongfnyigxsexuofrg)
-- Date run: 2026-05-05
--
-- IMPORTANT: Do NOT run any section twice without reading the notes.
--            Use the verification queries (section 7) before section 6.
--
-- NOTE on user_roles vs admin_users:
--   user_roles is an existing table (confirmed present in mobile DB).
--   It manages app-level roles for the mobile product (e.g. parent/child).
--   admin_users is a NEW table we create here — it is the ADMIN GATE only.
--   These are separate concerns and do not conflict with each other.
--   admin_users does not replace user_roles; they coexist.
-- =====================================================

-- =====================================================
-- SECTION 1: Create admin_users table (new)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT
);

-- =====================================================
-- SECTION 2: Enable RLS on admin_users
-- =====================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 3: Self-validating read policy on admin_users
-- (Only users already in admin_users can read admin_users)
-- =====================================================

CREATE POLICY "Admins can read admin_users"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- =====================================================
-- SECTION 4: Helper function is_admin()
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = uid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- =====================================================
-- SECTION 5: Read-only admin policies on all 15 existing tables
--
-- NOTE: These tables already exist in the mobile schema and
-- should already have RLS enabled with policies for the mobile app.
-- These admin policies are ADDITIVE (OR logic in Supabase) — they
-- add a new allowed case without removing existing mobile app access.
--
-- If any table does NOT yet have RLS enabled, the admin policy will
-- be created but will not be enforced until RLS is enabled on that
-- table. Check: SELECT tablename, rowsecurity FROM pg_tables WHERE
-- schemaname = 'public' ORDER BY tablename;
-- =====================================================

CREATE POLICY "Admins can read families"
  ON public.families FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read tasks"
  ON public.tasks FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read store_rewards"
  ON public.store_rewards FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read notifications"
  ON public.notifications FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read timetables"
  ON public.timetables FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read child_vibes"
  ON public.child_vibes FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read credit_vault"
  ON public.credit_vault FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read daily_progress"
  ON public.daily_progress FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read stickers"
  ON public.stickers FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read app_settings"
  ON public.app_settings FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read push_subscriptions"
  ON public.push_subscriptions FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read user_roles"
  ON public.user_roles FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read email_logs"
  ON public.email_logs FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can read reviews"
  ON public.reviews FOR SELECT USING (public.is_admin());

-- =====================================================
-- SECTION 6: Adi self-insert (run AFTER first Magic Link sign-in)
--
-- ⚠️  DO NOT RUN THIS SECTION until Adi has:
--   1. Completed sections 1-5 above
--   2. Signed in at least once via Magic Link at http://localhost:5173
--      (this creates her row in auth.users)
--   3. Confirmed she sees /access-denied (correct — she is not yet in admin_users)
--
-- After those 3 steps, un-comment and run:
-- =====================================================

-- INSERT INTO public.admin_users (user_id, email, notes)
-- SELECT id, email, 'Founder, primary admin'
-- FROM auth.users
-- WHERE email = 'adi.elgarat@gmail.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SECTION 7: Verification queries
-- Run after sections 1-5. Expect: 3 rows returned.
-- =====================================================

SELECT 'admin_users table exists' AS check_1
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'admin_users' AND table_schema = 'public'
);

SELECT 'is_admin function exists' AS check_2
WHERE EXISTS (
  SELECT 1 FROM pg_proc
  WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);

SELECT 'RLS enabled on admin_users' AS check_3
WHERE EXISTS (
  SELECT 1 FROM pg_tables
  WHERE tablename = 'admin_users'
  AND schemaname = 'public'
  AND rowsecurity = true
);

-- Expected output: 3 rows, one per check.
-- If any check returns 0 rows, that section did not execute correctly.
