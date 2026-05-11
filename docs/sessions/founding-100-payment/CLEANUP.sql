-- ============================================================================
-- BUFF DB Cleanup — Remove Lovable-era ghost data
-- Generated: 2026-05-11
-- Author: drafted by Claude Code under pkg/founding-100-payment
-- ============================================================================
--
-- WHY THIS EXISTS:
-- Investigation on 2026-05-11 revealed that the BUFF Supabase project contains
-- a large amount of "ghost" data — profile rows (and their downstream tasks /
-- rewards / progress) that have NO corresponding auth.users record. These are
-- artifacts of the Lovable POC migration (per project_lovable.md memory: "49
-- users backed up but no migration planned; sunset after mobile prod").
--
-- INVESTIGATION RESULT:
--   Total profiles:            275 (1 real user + 274 ghosts incl. their kids)
--   Total parent profiles:     188 (1 real:'עדי', 187 ghost)
--   Ghost families:            186 of 190 (no parent has auth)
--   Tasks in ghost families:   944 (effectively ALL tasks in DB)
--   Rewards in ghost families: 1034 (effectively ALL rewards)
--   Progress in ghost families: 1372 (effectively ALL progress)
--
-- ACTIVE USER FAMILIES (preserved by this script):
--   family_id 37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8 — Adi (עדי, adi.elgarat@gmail.com)
--   + any other family where at least one parent has an auth.users row
--
-- ============================================================================
-- ⚠ BEFORE RUNNING THIS SCRIPT:
-- ============================================================================
-- 1. Take a FULL backup of the Supabase project (Supabase Dashboard → Settings
--    → Backups → Download). This deletion is irreversible.
-- 2. Verify the "ghost families" definition matches your intent:
--    - Default: family has NO parent with an auth.users record
--    - This INCLUDES the 14 named multi-child parents we identified
--      (Adi old, hadasvc, רעות, קארין, רחל, חנה לקס, שירן, Karen Roffe,
--       Merav, Peled, יעל, yuval raz, Hila Adler, Henry)
--    - These users existed in the Lovable POC and may still be valid prospects
--      (handled separately via Founding 100 outreach — see CROSS_REFERENCE.md)
-- 3. Run the PREVIEW queries (Section A below) FIRST. Verify counts match
--    expectations before running the DELETE block (Section B).
-- 4. Run Section B inside a transaction. Inspect counts. Commit or rollback.
-- 5. After cleanup, re-run the verification queries (Section C).
--
-- ============================================================================
-- SECTION A — PREVIEW (read-only, run first)
-- ============================================================================

-- A.1: Which family_ids will be deleted?
WITH ghost_families AS (
  SELECT f.id AS family_id
  FROM families f
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.family_id = f.id AND p.role = 'parent'
  )
)
SELECT
  COUNT(*) AS families_to_delete,
  (SELECT COUNT(*) FROM families) AS total_families,
  (SELECT COUNT(*) FROM families) - COUNT(*) AS families_to_keep
FROM ghost_families;

-- A.2: What downstream data will cascade-delete?
WITH ghost_families AS (
  SELECT f.id AS family_id
  FROM families f
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.family_id = f.id AND p.role = 'parent'
  )
)
SELECT
  (SELECT COUNT(*) FROM profiles WHERE family_id IN (SELECT family_id FROM ghost_families)) AS profiles_to_delete,
  (SELECT COUNT(*) FROM tasks WHERE family_id IN (SELECT family_id FROM ghost_families)) AS tasks_to_delete,
  (SELECT COUNT(*) FROM store_rewards WHERE family_id IN (SELECT family_id FROM ghost_families)) AS rewards_to_delete,
  (SELECT COUNT(*) FROM daily_progress WHERE family_id IN (SELECT family_id FROM ghost_families)) AS progress_to_delete,
  (SELECT COUNT(*) FROM credit_vault WHERE family_id IN (SELECT family_id FROM ghost_families)) AS credit_vault_to_delete,
  (SELECT COUNT(*) FROM lesson_progress WHERE family_id IN (SELECT family_id FROM ghost_families)) AS lesson_progress_to_delete,
  (SELECT COUNT(*) FROM timetables WHERE family_id IN (SELECT family_id FROM ghost_families)) AS timetables_to_delete,
  (SELECT COUNT(*) FROM child_vibes WHERE family_id IN (SELECT family_id FROM ghost_families)) AS vibes_to_delete,
  (SELECT COUNT(*) FROM notifications WHERE family_id IN (SELECT family_id FROM ghost_families)) AS notifications_to_delete;

-- A.3: Confirm Adi's family is NOT in the deletion set
SELECT
  '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8' AS adi_family_id,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8'
        AND NOT EXISTS (
          SELECT 1 FROM profiles p
          JOIN auth.users u ON u.id = p.user_id
          WHERE p.family_id = f.id AND p.role = 'parent'
        )
    ) THEN '⚠ WOULD BE DELETED — STOP'
    ELSE '✅ SAFE — Adi family is preserved'
  END AS safety_check;

-- ============================================================================
-- SECTION B — DELETE (destructive, run inside a transaction)
-- ============================================================================
-- ⚠ Only run after Section A counts match expectations AND Section A.3 shows
--   "SAFE — Adi family is preserved".
-- ⚠ The BEGIN/COMMIT pattern lets you inspect counts before committing.
--   Replace COMMIT with ROLLBACK if anything looks wrong.

BEGIN;

-- B.1: Capture the ghost family_ids into a temp table
CREATE TEMP TABLE ghost_families_to_delete AS
SELECT f.id AS family_id
FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.family_id = f.id AND p.role = 'parent'
);

-- B.2: Delete downstream data (FK-safe order)
DELETE FROM tasks            WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM store_rewards    WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM daily_progress   WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM credit_vault     WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM lesson_progress  WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM timetables       WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM child_vibes      WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);
DELETE FROM notifications    WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);

-- B.3: Delete profile rows in ghost families (parents AND children)
DELETE FROM profiles WHERE family_id IN (SELECT family_id FROM ghost_families_to_delete);

-- B.4: Delete the family rows themselves
DELETE FROM families WHERE id IN (SELECT family_id FROM ghost_families_to_delete);

-- B.5: Inspect remaining state before committing
SELECT
  (SELECT COUNT(*) FROM families) AS families_remaining,
  (SELECT COUNT(*) FROM profiles) AS profiles_remaining,
  (SELECT COUNT(*) FROM profiles WHERE role = 'parent') AS parents_remaining,
  (SELECT COUNT(*) FROM tasks) AS tasks_remaining,
  (SELECT COUNT(*) FROM store_rewards) AS rewards_remaining;

-- B.6: COMMIT or ROLLBACK
-- After verifying the remaining counts look right (Adi's family preserved,
-- ghost data gone), execute one of these on a separate line:
--   COMMIT;     -- to make changes permanent
--   ROLLBACK;   -- to undo this transaction
-- ⚠ Don't leave the transaction hanging — pick one explicitly.

-- ============================================================================
-- SECTION C — POST-CLEANUP VERIFICATION (read-only, run AFTER commit)
-- ============================================================================

-- C.1: Confirm no ghost families remain
SELECT COUNT(*) AS remaining_ghost_families
FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.family_id = f.id AND p.role = 'parent'
);
-- Expected: 0

-- C.2: Confirm Adi's family + data is intact
SELECT
  p.display_name,
  p.role,
  p.is_lifetime_access,
  u.email,
  (SELECT COUNT(*) FROM tasks WHERE family_id = p.family_id) AS task_count_in_family
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.family_id = '37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8'
ORDER BY p.role DESC, p.created_at ASC;
-- Expected: 4 rows (Adi parent + 3 child profiles), tasks may be 0 if Adi
-- hasn't created any in her real account yet.

-- C.3: Total DB shape after cleanup
SELECT
  (SELECT COUNT(*) FROM families) AS total_families,
  (SELECT COUNT(*) FROM profiles WHERE role = 'parent') AS total_parents,
  (SELECT COUNT(*) FROM profiles WHERE role = 'child') AS total_children,
  (SELECT COUNT(*) FROM tasks) AS total_tasks,
  (SELECT COUNT(*) FROM store_rewards) AS total_rewards;

-- ============================================================================
-- END OF CLEANUP SCRIPT
-- ============================================================================
