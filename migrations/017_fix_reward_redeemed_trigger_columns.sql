-- 017_fix_reward_redeemed_trigger_columns.sql
--
-- Reward-edit save fix (discovered during pkg/dashboard-insight-declutter
-- emulator verification of the parent add/edit/delete reward feature).
--
-- The AFTER UPDATE trigger `trg_notify_reward_redeemed` on `store_rewards`
-- runs `notify_parent_on_reward_redeemed()`, which referenced columns that do
-- not exist on the table:
--   NEW.claimed / OLD.claimed  -> the column is actually `is_redeemed` (boolean)
--   NEW.assigned_to            -> the column is actually `child_id` (uuid)
--
-- Result: EVERY UPDATE to store_rewards failed at runtime with
--   `record "new" has no field "claimed"`.
-- It stayed latent because nothing updated the table before — child
-- reward-redemption is still an Alert placeholder
-- (src/screens/child/ChildRewardsScreen.tsx handleClaim). The new parent
-- edit-reward flow (src/screens/parent/ParentRewardsScreen.tsx) is the first
-- code path to issue a real UPDATE, which surfaced the broken trigger.
--
-- This rewrites the function to use the correct column names. Behavior is
-- otherwise unchanged: notify the family's first parent once per day when a
-- reward flips to redeemed.
--
-- Applied to the mobile Supabase project (gfrongfnyigxsexuofrg) via MCP
-- apply_migration on 2026-06-01 as migration
-- `fix_notify_parent_on_reward_redeemed_columns`.

CREATE OR REPLACE FUNCTION public.notify_parent_on_reward_redeemed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_child_name TEXT;
  v_parent_id UUID;
BEGIN
  -- Only act when is_redeemed flips false -> true
  IF NEW.is_redeemed = true AND (OLD.is_redeemed IS DISTINCT FROM true) AND NEW.child_id IS NOT NULL THEN
    -- Get child name
    SELECT display_name INTO v_child_name
    FROM profiles WHERE id = NEW.child_id;

    -- Get the first parent in the family
    SELECT id INTO v_parent_id
    FROM profiles
    WHERE family_id = NEW.family_id AND role = 'parent'
    LIMIT 1;

    IF v_parent_id IS NOT NULL THEN
      -- Dedup
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE family_id = NEW.family_id
          AND entity_id = NEW.id
          AND type = 'reward_redeemed'
          AND created_at::date = CURRENT_DATE
      ) THEN
        INSERT INTO notifications (family_id, parent_id, type, child_id, child_name, entity_id, entity_name, is_read)
        VALUES (NEW.family_id, v_parent_id, 'reward_redeemed', NEW.child_id, COALESCE(v_child_name, ''), NEW.id, COALESCE(NEW.title, ''), false);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
