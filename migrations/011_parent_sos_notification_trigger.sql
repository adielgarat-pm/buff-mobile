-- Migration 011: parent_sos notification trigger
--
-- pkg/daily-vibe-check Phase 4a.
--
-- When child_vibes.parent_sos_sent flips false→true, insert ONE notification
-- row per parent in the family with type='parent_sos'. The mobile app's
-- parent dashboard reads these rows and surfaces banner+badge.
--
-- Idempotency:
--   - Trigger fires only on UPDATE of parent_sos_sent (not other columns)
--   - Function only acts when the value actually transitions false→true
--   - NOT EXISTS guard prevents duplicate inserts if the flag is re-flipped
--     for any reason (defense in depth — the app UI already gates the
--     SosButton on sosSent state)
--
-- SECURITY DEFINER: the calling child user has no RLS access to other
-- profiles or INSERT on notifications. Function runs as table owner.
--
-- Migration numbering note: 009 + 010 in the DB ledger are unrelated
-- (applied and reverted in a separate session); the repo never had them.
--
-- Applied to live project gfrongfnyigxsexuofrg on 2026-05-17.

CREATE OR REPLACE FUNCTION public.handle_parent_sos_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_name TEXT;
BEGIN
  -- Only fire on the specific transition false (or NULL) → true.
  IF (COALESCE(OLD.parent_sos_sent, false) = false)
     AND COALESCE(NEW.parent_sos_sent, false) = true THEN

    -- Denormalize the child's display_name into the notification row
    -- (mirrors existing notifications.child_name column convention).
    SELECT display_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.child_id;

    -- One row per parent in the family. Guarded against duplicates by
    -- entity_id (= child_vibes.id, unique per vibe row).
    INSERT INTO notifications (
      family_id, parent_id, type, child_id, child_name, entity_id, is_read
    )
    SELECT
      NEW.family_id,
      p.id,
      'parent_sos',
      NEW.child_id,
      COALESCE(v_child_name, ''),
      NEW.id,
      false
    FROM profiles p
    WHERE p.family_id = NEW.family_id
      AND p.role = 'parent'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.entity_id = NEW.id
          AND n.type = 'parent_sos'
          AND n.parent_id = p.id
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_parent_sos_sent ON child_vibes;
CREATE TRIGGER trg_handle_parent_sos_sent
AFTER UPDATE OF parent_sos_sent ON child_vibes
FOR EACH ROW
EXECUTE FUNCTION public.handle_parent_sos_sent();

COMMENT ON FUNCTION public.handle_parent_sos_sent() IS
  'pkg/daily-vibe-check Phase 4: fires when child_vibes.parent_sos_sent flips false to true. Inserts one parent_sos notification per parent in the family. SECURITY DEFINER (child has no profile read/notification insert access via RLS). Guard against dupes via NOT EXISTS on (entity_id, type, parent_id).';
