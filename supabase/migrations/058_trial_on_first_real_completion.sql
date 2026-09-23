-- 058_trial_on_first_real_completion.sql
--
-- Freemium v2 reverse trial (D: Adi 2026-09-23, docs/sessions/freemium-v2/SPEC.md).
-- Approved as a function change + one-time data reset (Q3, Q5, Q7).
--
-- 1. start_trial_on_activation() (037): the 14-day BUFF Coach trial now starts at
--    the family's FIRST real completed task instead of the 2nd distinct
--    completion date. Rows that are not a real completion never start it:
--      - source = 'onboarding_first_task' — the onboarding "first task together"
--        seed (UStep6_FirstTask). Starting there would start the trial at signup,
--        which the strategy rejects (Q3).
--      - source = 'seed' — scripted/demo data, never a real completion.
--    Everything else (child_device, view_as_child = shared-device families,
--    parent, legacy NULL) counts. Grant is unchanged: once per family,
--    premium_until = GREATEST(premium_until, now()) + 14 days on every parent,
--    fail-safe (a failure never aborts the child's completion write).
--    No table, column, trigger or policy changes — body only.
--
-- 2. One-time reset (Q5): families whose trial clock was only BACKFILLED by 037
--    (trial_started_at = created_at EXACTLY, the literal backfill value) and whose
--    trial therefore never ran become eligible again: their clock is cleared and
--    the trial starts at their next real completion. Conservative guards:
--      - exact equality with created_at (a real activation writes now() at the
--        completion, which can never equal the family's created_at);
--      - created_at <= the 037 backfill moment (latest backfilled family was
--        created 2026-07-01 14:07:28.447602+00; verified 2026-09-23: 221 such
--        families, 0 real trials among them, 0 families after it with an exact
--        match);
--      - NO parent in the family holds premium_until (no grant of any kind to
--        disturb), is_lifetime_access or is_lifetime_founding (they already have
--        BUFF Coach; a trial would only muddy the admin board).
--    premium_until itself is never written here.
--
-- Pre-apply check (2026-09-23, prod): backfilled_exact=221, with_lifetime=29,
-- with_premium_until=0, real trials=3 (all after 2026-07-15, untouched).
--
-- ROLLBACK (restores 037 exactly):
--   -- a) function body back to the 2-distinct-dates bar
--   CREATE OR REPLACE FUNCTION public.start_trial_on_activation()
--     RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
--   AS $$
--   DECLARE v_rows int := 0;
--   BEGIN
--     IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;
--     IF TG_OP = 'UPDATE' AND OLD.completed IS TRUE THEN RETURN NEW; END IF;
--     PERFORM 1 FROM public.families WHERE id = NEW.family_id AND trial_started_at IS NULL;
--     IF NOT FOUND THEN RETURN NEW; END IF;
--     IF (SELECT COUNT(DISTINCT date) FROM public.daily_progress
--           WHERE family_id = NEW.family_id AND completed = true) < 2 THEN
--       RETURN NEW;
--     END IF;
--     UPDATE public.families SET trial_started_at = now()
--       WHERE id = NEW.family_id AND trial_started_at IS NULL;
--     GET DIAGNOSTICS v_rows = ROW_COUNT;
--     IF v_rows > 0 THEN
--       UPDATE public.profiles
--         SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + interval '14 days'
--         WHERE family_id = NEW.family_id AND role = 'parent';
--     END IF;
--     RETURN NEW;
--   EXCEPTION WHEN OTHERS THEN
--     RAISE WARNING 'start_trial_on_activation failed for family %: %', NEW.family_id, SQLERRM;
--     RETURN NEW;
--   END; $$;
--   -- b) re-close the reset families that have NOT started a trial since
--   --    (every family created before the backfill moment was backfilled by 037,
--   --    so any still-NULL one was cleared by this migration).
--   UPDATE public.families SET trial_started_at = created_at
--     WHERE trial_started_at IS NULL
--       AND created_at <= '2026-07-01 14:07:28.447602+00';
--   -- Families that DID start a trial after this migration keep it (their
--   -- parents already hold the 14-day premium_until; revoking it would be a
--   -- product decision, not a rollback).

-- ── 1. Trial starts at the first real completion ────────────────────────────
CREATE OR REPLACE FUNCTION public.start_trial_on_activation()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_rows int := 0;
BEGIN
  -- Only when a completion just became true (INSERT true, or false->true UPDATE).
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.completed IS TRUE THEN RETURN NEW; END IF;

  -- Not a real completion: the onboarding seed row and scripted seed data.
  IF NEW.source IN ('onboarding_first_task', 'seed') THEN RETURN NEW; END IF;

  -- Cheap early-exit (one pkey lookup): family already has a trial clock.
  PERFORM 1 FROM public.families
    WHERE id = NEW.family_id AND trial_started_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Atomic once-ever: single-row conditional UPDATE (families has one row per id).
  UPDATE public.families
    SET trial_started_at = now()
    WHERE id = NEW.family_id AND trial_started_at IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows > 0 THEN
    UPDATE public.profiles
      SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + interval '14 days'
      WHERE family_id = NEW.family_id AND role = 'parent';
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- NEVER break the child's completion write. Log and let the write proceed.
  RAISE WARNING 'start_trial_on_activation failed for family %: %', NEW.family_id, SQLERRM;
  RETURN NEW;
END; $$;

-- ── 2. Re-open the trial for families whose clock was only backfilled ───────
UPDATE public.families f
   SET trial_started_at = NULL
 WHERE f.trial_started_at = f.created_at
   AND f.created_at <= '2026-07-01 14:07:28.447602+00'
   AND NOT EXISTS (
     SELECT 1 FROM public.profiles p
      WHERE p.family_id = f.id
        AND p.role = 'parent'
        AND (p.premium_until IS NOT NULL
             OR COALESCE(p.is_lifetime_access, false)
             OR COALESCE(p.is_lifetime_founding, false))
   );
