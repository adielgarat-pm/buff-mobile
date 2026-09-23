-- Freemium v2 — logic test for supabase/migrations/058_trial_on_first_real_completion.sql
--
-- Runs on a THROWAWAY local Postgres (never prod): builds the minimal slice of
-- the schema the trigger touches, installs 037 exactly as it is in prod, seeds
-- fixture families, applies 058, then asserts behaviour with ASSERT.
--
--   psql -v ON_ERROR_STOP=1 -h <sock> -p <port> -U postgres -d <db> \
--        -v migration=supabase/migrations/058_trial_on_first_real_completion.sql \
--        -f docs/sessions/freemium-v2/trial_migration_test.sql
--
-- Passes silently and prints 'ALL TRIAL MIGRATION TESTS PASSED'; any failure
-- aborts with the failing ASSERT message.

\set ON_ERROR_STOP 1
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
END $$;
GRANT USAGE ON SCHEMA public TO authenticated;

CREATE TABLE public.families (
  id uuid PRIMARY KEY, created_at timestamptz NOT NULL, trial_started_at timestamptz
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, family_id uuid, role text,
  premium_until timestamptz, is_lifetime_access boolean DEFAULT false, is_lifetime_founding boolean DEFAULT false
);
CREATE TABLE public.daily_progress (
  family_id uuid, child_id uuid, date text, task_id uuid, completed boolean, source text,
  PRIMARY KEY (family_id, child_id, date, task_id)
);
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 037 (verbatim prod body) ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_family_trial_column()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
      RAISE EXCEPTION 'trial_started_at is not client-writable' USING errcode = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_guard_family_trial BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.guard_family_trial_column();

CREATE OR REPLACE FUNCTION public.start_trial_on_activation()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_rows int := 0;
BEGIN
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed IS TRUE THEN RETURN NEW; END IF;
  PERFORM 1 FROM public.families WHERE id = NEW.family_id AND trial_started_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF (SELECT COUNT(DISTINCT date) FROM public.daily_progress
        WHERE family_id = NEW.family_id AND completed = true) < 2 THEN
    RETURN NEW;
  END IF;
  UPDATE public.families SET trial_started_at = now() WHERE id = NEW.family_id AND trial_started_at IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows > 0 THEN
    UPDATE public.profiles SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + interval '14 days'
      WHERE family_id = NEW.family_id AND role = 'parent';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'start_trial_on_activation failed for family %: %', NEW.family_id, SQLERRM;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_start_trial_on_activation AFTER INSERT OR UPDATE OF completed ON public.daily_progress
  FOR EACH ROW WHEN (NEW.completed IS TRUE) EXECUTE FUNCTION public.start_trial_on_activation();

-- Fixtures (ids: f1..f9 families, p* parents, c* children) --------------------
-- f1 backfilled pre-037, no grants                → RESET (eligible again)
-- f2 backfilled pre-037, lifetime parent          → keep clock
-- f3 backfilled pre-037, founding parent          → keep clock
-- f4 backfilled pre-037, parent has premium_until → keep clock (referral grant)
-- f5 real trial ran (clock != created_at)         → keep clock
-- f6 new family, no clock                         → trial at first real completion
-- f7 new family, no clock, referral premium_until → trial stacks on referral
-- f8 created AFTER backfill moment, exact match   → keep clock (not a backfill)
-- f9 backfilled pre-037, no parent profile at all → reset (harmless)
INSERT INTO public.families VALUES
 ('00000000-0000-0000-0000-0000000000f1','2026-05-01 10:00:00+00','2026-05-01 10:00:00+00'),
 ('00000000-0000-0000-0000-0000000000f2','2026-05-02 10:00:00+00','2026-05-02 10:00:00+00'),
 ('00000000-0000-0000-0000-0000000000f3','2026-05-03 10:00:00+00','2026-05-03 10:00:00+00'),
 ('00000000-0000-0000-0000-0000000000f4','2026-05-04 10:00:00+00','2026-05-04 10:00:00+00'),
 ('00000000-0000-0000-0000-0000000000f5','2026-07-10 10:00:00+00','2026-07-15 11:52:29+00'),
 ('00000000-0000-0000-0000-0000000000f6','2026-09-20 10:00:00+00',NULL),
 ('00000000-0000-0000-0000-0000000000f7','2026-09-21 10:00:00+00',NULL),
 ('00000000-0000-0000-0000-0000000000f8','2026-08-01 10:00:00+00','2026-08-01 10:00:00+00'),
 ('00000000-0000-0000-0000-0000000000f9','2026-06-01 10:00:00+00','2026-06-01 10:00:00+00');
INSERT INTO public.profiles (id, family_id, role, premium_until, is_lifetime_access, is_lifetime_founding) VALUES
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000f1','parent',NULL,false,false),
 ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000f1','parent',NULL,false,false),
 ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000f1','child', NULL,false,false),
 ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000f2','parent',NULL,true, false),
 ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000f3','parent',NULL,false,true),
 ('00000000-0000-0000-0000-0000000000a4','00000000-0000-0000-0000-0000000000f4','parent',now() + interval '5 days',false,false),
 ('00000000-0000-0000-0000-0000000000a5','00000000-0000-0000-0000-0000000000f5','parent',NULL,false,false),
 ('00000000-0000-0000-0000-0000000000a6','00000000-0000-0000-0000-0000000000f6','parent',NULL,false,false),
 ('00000000-0000-0000-0000-0000000000c6','00000000-0000-0000-0000-0000000000f6','child', NULL,false,false),
 ('00000000-0000-0000-0000-0000000000a7','00000000-0000-0000-0000-0000000000f7','parent',now() + interval '10 days',false,false),
 ('00000000-0000-0000-0000-0000000000a8','00000000-0000-0000-0000-0000000000f8','parent',NULL,false,false);

-- Apply the migration under test ----------------------------------------------
\i :migration

-- ── Reset (Q5) ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f1') IS NULL, 'f1 backfilled/no grant must be reset';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f2') IS NOT NULL, 'f2 lifetime must keep clock';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f3') IS NOT NULL, 'f3 founding must keep clock';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f4') IS NOT NULL, 'f4 with premium_until must keep clock';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f5') = '2026-07-15 11:52:29+00', 'f5 real trial untouched';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f8') IS NOT NULL, 'f8 post-backfill exact match untouched';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f9') IS NULL, 'f9 no-parent backfill reset';
  ASSERT (SELECT count(*) FROM public.profiles WHERE premium_until IS NOT NULL) = 2, 'reset must not write premium_until';
END $$;

-- ── Q3: onboarding seed row does NOT start the trial ─────────────────────────
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f6','00000000-0000-0000-0000-0000000000c6','2026-09-20','00000000-0000-0000-0000-000000000001',true,'onboarding_first_task');
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f6','00000000-0000-0000-0000-0000000000c6','2026-09-20','00000000-0000-0000-0000-000000000002',true,'seed');
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f6') IS NULL, 'seed rows must not start trial';
  ASSERT (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a6') IS NULL, 'seed rows must not grant';
END $$;

-- A not-completed row never starts it either.
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f6','00000000-0000-0000-0000-0000000000c6','2026-09-21','00000000-0000-0000-0000-000000000003',false,'child_device');
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f6') IS NULL, 'incomplete row must not start trial';
END $$;

-- ── First REAL completion (false -> true UPDATE) starts it — on day ONE ─────
UPDATE public.daily_progress SET completed = true
 WHERE family_id='00000000-0000-0000-0000-0000000000f6' AND task_id='00000000-0000-0000-0000-000000000003';
DO $$
DECLARE v_start timestamptz; v_until timestamptz;
BEGIN
  SELECT trial_started_at INTO v_start FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f6';
  SELECT premium_until INTO v_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a6';
  ASSERT v_start IS NOT NULL, 'first real completion must start trial';
  ASSERT v_until BETWEEN now() + interval '14 days' - interval '1 minute' AND now() + interval '14 days' + interval '1 minute', 'parent gets 14 days';
  ASSERT (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000c6') IS NULL, 'child profile never granted';
END $$;

-- Second completion is a no-op (once ever).
CREATE TEMP TABLE snap AS
  SELECT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f6') AS s,
         (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a6') AS u;
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f6','00000000-0000-0000-0000-0000000000c6','2026-09-22','00000000-0000-0000-0000-000000000004',true,NULL);
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f6') = (SELECT s FROM snap), 'second completion must not move clock';
  ASSERT (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a6') = (SELECT u FROM snap), 'second completion must not extend';
END $$;

-- ── Referral stacking: 10 days referral left + 14 trial ─────────────────────
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f7','00000000-0000-0000-0000-0000000000c6','2026-09-22','00000000-0000-0000-0000-000000000005',true,'view_as_child');
DO $$ BEGIN
  ASSERT (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a7')
         BETWEEN now() + interval '24 days' - interval '1 minute' AND now() + interval '24 days' + interval '1 minute',
         'trial stacks on an active referral grant (view_as_child counts)';
END $$;

-- ── Reset family f1: next real completion starts its trial for BOTH parents ──
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f1','00000000-0000-0000-0000-0000000000c1','2026-09-23','00000000-0000-0000-0000-000000000006',true,'child_device');
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f1') IS NOT NULL, 'reset family gets trial';
  ASSERT (SELECT count(*) FROM public.profiles WHERE family_id='00000000-0000-0000-0000-0000000000f1' AND role='parent' AND premium_until > now() + interval '13 days') = 2, 'both parents granted';
END $$;

-- ── Families that keep their clock never get a (second) trial ────────────────
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000f5','00000000-0000-0000-0000-0000000000c1','2026-09-23','00000000-0000-0000-0000-000000000007',true,NULL),
 ('00000000-0000-0000-0000-0000000000f2','00000000-0000-0000-0000-0000000000c1','2026-09-23','00000000-0000-0000-0000-000000000008',true,NULL);
DO $$ BEGIN
  ASSERT (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a5') IS NULL, 'f5 already had its trial';
  ASSERT (SELECT premium_until FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000a2') IS NULL, 'f2 lifetime not re-granted';
END $$;

-- ── Fail-safe: a failure inside the trigger never blocks the completion ──────
ALTER TABLE public.profiles RENAME COLUMN premium_until TO premium_until_x;
INSERT INTO public.families VALUES ('00000000-0000-0000-0000-0000000000fa','2026-09-23 10:00:00+00',NULL);
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000fa','00000000-0000-0000-0000-0000000000c1','2026-09-23','00000000-0000-0000-0000-000000000009',true,'child_device');
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM public.daily_progress WHERE family_id='00000000-0000-0000-0000-0000000000fa') = 1, 'completion written despite trigger failure';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000fa') IS NULL, 'failed grant rolled back with its clock';
END $$;
ALTER TABLE public.profiles RENAME COLUMN premium_until_x TO premium_until;

-- ── Client role still cannot touch the clock (037 guard intact) ──────────────
SET ROLE authenticated;
DO $$ BEGIN
  BEGIN
    UPDATE public.families SET trial_started_at = NULL WHERE id='00000000-0000-0000-0000-0000000000f5';
    RAISE EXCEPTION 'guard did not fire';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;

-- ── Rollback SQL from the migration header restores 037 behaviour ────────────
CREATE OR REPLACE FUNCTION public.start_trial_on_activation()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_rows int := 0;
BEGIN
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed IS TRUE THEN RETURN NEW; END IF;
  PERFORM 1 FROM public.families WHERE id = NEW.family_id AND trial_started_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF (SELECT COUNT(DISTINCT date) FROM public.daily_progress
        WHERE family_id = NEW.family_id AND completed = true) < 2 THEN
    RETURN NEW;
  END IF;
  UPDATE public.families SET trial_started_at = now()
    WHERE id = NEW.family_id AND trial_started_at IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows > 0 THEN
    UPDATE public.profiles
      SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + interval '14 days'
      WHERE family_id = NEW.family_id AND role = 'parent';
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'start_trial_on_activation failed for family %: %', NEW.family_id, SQLERRM;
  RETURN NEW;
END; $$;
UPDATE public.families SET trial_started_at = created_at
  WHERE trial_started_at IS NULL
    AND created_at <= '2026-07-01 14:07:28.447602+00';
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f9') = '2026-06-01 10:00:00+00', 'rollback re-closes reset family';
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000f1') IS NOT NULL, 'started trial kept on rollback';
END $$;
INSERT INTO public.families VALUES ('00000000-0000-0000-0000-0000000000fb','2026-09-23 11:00:00+00',NULL);
INSERT INTO public.daily_progress VALUES
 ('00000000-0000-0000-0000-0000000000fb','00000000-0000-0000-0000-0000000000c1','2026-09-23','00000000-0000-0000-0000-00000000000a',true,'child_device');
DO $$ BEGIN
  ASSERT (SELECT trial_started_at FROM public.families WHERE id='00000000-0000-0000-0000-0000000000fb') IS NULL, 'after rollback, 1 date is not enough again';
END $$;

\echo 'ALL TRIAL MIGRATION TESTS PASSED'
