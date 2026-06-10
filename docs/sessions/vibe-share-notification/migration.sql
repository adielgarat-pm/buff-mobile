-- Reference copy of migration 025 (applied 2026-06-09).
-- Canonical file: migrations/025_vibe_shared_notification.sql
--
-- Migration 025: child_vibe_shared notification (pkg/vibe-share-notification)
-- Kid-initiated, non-SOS "share my mood with my parent" path — the positive
-- counterpart of the SOS path. Structural copy of migration 011 (parent_sos),
-- plus entity_name carrying the mood (vibe_level as text).
--
-- Existing-user impact: NONE. The new column defaults to false on every
-- existing child_vibes row. No backfill. No change to SOS behavior.
-- (Renumbered from the 2026-06-05 draft's 019 → 025: main's migration max is
--  024 and 019/021 numbers already collided across parallel packages.)

ALTER TABLE public.child_vibes
  ADD COLUMN IF NOT EXISTS vibe_shared_with_parent boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_vibe_shared()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_name TEXT;
BEGIN
  IF (COALESCE(OLD.vibe_shared_with_parent, false) = false)
     AND COALESCE(NEW.vibe_shared_with_parent, false) = true THEN

    SELECT display_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.child_id;

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
