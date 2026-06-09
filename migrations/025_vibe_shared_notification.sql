-- Migration 025: child_vibe_shared notification (pkg/vibe-share-notification)
--
-- Kid-initiated, non-SOS "share my mood with my parent" path — the positive
-- counterpart of the SOS path. Structural copy of migration 011 (parent_sos):
--   parent_sos_sent          -> vibe_shared_with_parent
--   type 'parent_sos'        -> 'child_vibe_shared'
--   trg_handle_parent_sos_sent -> trg_handle_vibe_shared
-- plus entity_name carrying the mood (vibe_level as text).
--
-- Existing-user impact: NONE. The new column defaults to false on every
-- existing child_vibes row — i.e. "not shared", the correct historical state.
-- No backfill. No change to existing SOS behavior or any read path.
--
-- Numbered 025 (main's migration max is 024; 019/021 numbers already collided
-- across parallel packages, so this takes the next free monotonic slot).

-- 1) New consent flag on the daily vibe row.
ALTER TABLE public.child_vibes
  ADD COLUMN IF NOT EXISTS vibe_shared_with_parent boolean NOT NULL DEFAULT false;

-- 2) Trigger function: on false->true of vibe_shared_with_parent, insert one
--    child_vibe_shared notification per parent in the family.
--    SECURITY DEFINER — the child user has no RLS INSERT on notifications.
CREATE OR REPLACE FUNCTION public.handle_vibe_shared()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_name TEXT;
BEGIN
  -- Only fire on the specific transition false (or NULL) -> true.
  IF (COALESCE(OLD.vibe_shared_with_parent, false) = false)
     AND COALESCE(NEW.vibe_shared_with_parent, false) = true THEN

    SELECT display_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.child_id;

    -- One row per parent in the family. entity_name carries the mood
    -- (vibe_level as text); the client maps it to a localized word.
    -- entity_id = child_vibes.id (unique per daily row) -> dedup key.
    INSERT INTO notifications (
      family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read
    )
    SELECT
      NEW.family_id,
      p.id,
      'child_vibe_shared',
      NEW.child_id,
      COALESCE(v_child_name, ''),
      NEW.id,
      COALESCE(NEW.vibe_level::text, ''),
      false
    FROM profiles p
    WHERE p.family_id = NEW.family_id
      AND p.role = 'parent'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_id = NEW.id
          AND n.type = 'child_vibe_shared'
          AND n.parent_id = p.id
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_vibe_shared ON public.child_vibes;
CREATE TRIGGER trg_handle_vibe_shared
AFTER UPDATE OF vibe_shared_with_parent ON public.child_vibes
FOR EACH ROW
EXECUTE FUNCTION public.handle_vibe_shared();

COMMENT ON FUNCTION public.handle_vibe_shared() IS
  'pkg/vibe-share-notification (025): fires when child_vibes.vibe_shared_with_parent flips false to true. Inserts one child_vibe_shared (INFO) notification per parent in the family. Kid-initiated, non-SOS. SECURITY DEFINER; NOT EXISTS dedup on (entity_id, type, parent_id). Mirrors migration 011.';
