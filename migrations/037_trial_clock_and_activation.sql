-- 037_trial_clock_and_activation.sql
-- Applied via Supabase MCP during pkg/ai-trial-and-referral session (2026-07-01), Phase B.
--
-- 14-day trial clock on families.trial_started_at, started ONCE per family when a
-- child activates. Activation bar (Adi decision): a child in the family completed
-- tasks on >= 2 DISTINCT calendar dates (harder to fake in View-as-Child than a
-- single tap). On activation the trigger grants premium_until = now()+14d to all
-- parent profiles — which the existing useSubscription / family_is_entitled ladder
-- already honors, so the gate (Phase A) opens for trial families automatically.
--
-- SAFETY: the activation trigger sits on the child's hot completion path. Its body
-- is wrapped in EXCEPTION WHEN OTHERS so a failure NEVER aborts the child's
-- daily_progress write / BUFFs / BUDDY. It early-exits with one indexed lookup when
-- the family already has a trial clock (i.e. always, after backfill, except brand-new
-- families pre-activation).
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS trg_start_trial_on_activation ON public.daily_progress;
--   DROP FUNCTION IF EXISTS public.start_trial_on_activation();
--   DROP TRIGGER IF EXISTS trg_guard_family_trial ON public.families;
--   DROP FUNCTION IF EXISTS public.guard_family_trial_column();
--   ALTER TABLE public.families DROP COLUMN IF EXISTS trial_started_at;

-- 1. Trial clock column
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT NULL;

-- 2. Backfill existing families so they do NOT get a fresh trial (Adi decision #2:
--    no premium/token gift to families that have been free for weeks). New families
--    created after this migration keep trial_started_at = NULL → eligible.
UPDATE public.families
SET trial_started_at = created_at
WHERE trial_started_at IS NULL;

-- 3. Guard: block client (authenticated/anon) from setting trial_started_at, mirroring
--    the profiles entitlement guard (035). Server writers (this SECURITY DEFINER
--    trigger, service_role) run as non-client roles and pass.
CREATE OR REPLACE FUNCTION public.guard_family_trial_column()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
      RAISE EXCEPTION 'trial_started_at is not client-writable'
        USING errcode = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_family_trial ON public.families;
CREATE TRIGGER trg_guard_family_trial
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.guard_family_trial_column();

-- 4. Activation → trial start. Fail-safe, idempotent, SECURITY DEFINER (must UPDATE
--    families + other parents' profiles even when the writer is an own-device child
--    session whose RLS forbids it).
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

  -- Cheap early-exit (one pkey lookup): family already has a trial clock.
  PERFORM 1 FROM public.families
    WHERE id = NEW.family_id AND trial_started_at IS NULL;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Activation bar: >= 2 distinct completed calendar dates for this family.
  IF (SELECT COUNT(DISTINCT date) FROM public.daily_progress
        WHERE family_id = NEW.family_id AND completed = true) < 2 THEN
    RETURN NEW;
  END IF;

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

DROP TRIGGER IF EXISTS trg_start_trial_on_activation ON public.daily_progress;
CREATE TRIGGER trg_start_trial_on_activation
  AFTER INSERT OR UPDATE OF completed ON public.daily_progress
  FOR EACH ROW
  WHEN (NEW.completed IS TRUE)
  EXECUTE FUNCTION public.start_trial_on_activation();
