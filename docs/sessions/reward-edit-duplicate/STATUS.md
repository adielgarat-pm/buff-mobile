# STATUS — pkg/reward-edit-duplicate

Closes two parent-app parity gaps found in the Lovable↔mobile audit (Surface 2, Matrix G):
edit an existing reward, and copy a task/reward to another child.

| State | Date | Tests | Notes |
|---|---|---|---|
| code-complete-pending-device-test | 2026-06-19 | tsc 0 · jest 425/425 (isolated) | Hat-3 pending; no schema change |

## What shipped

1. **Edit / delete an existing reward** (`ParentRewardsScreen`) — tapping a catalog reward card opens
   the modal in edit mode (emoji / title / size / credits, or cash amount for a cash reward). Save
   does an UPDATE in place; a Delete button (with confirm) removes the reward. Create flow unchanged.
2. **Copy task/reward to another child** — new reusable `DuplicateToChildModal` (ported from Lovable):
   lists the other children with checkboxes + an "all children" shortcut, inserts one fresh row per
   target child. Wired into both `ParentRewardsScreen` (📋 on each reward card) and `ParentTasksScreen`
   (📋 on each task row); the affordance only appears when the family has >1 child.

## Notes

- **No schema change, no migration.** Pure UI + existing `store_rewards` / `tasks` inserts/updates.
- The `duplicate.*` i18n keys already existed in the catalog (orphaned from an earlier port with no
  component) — reused them; only added `{{count}}` to `duplicate.copy`. Caught by the
  `i18nCatalogIntegrity` duplicate-key guard.
- Task copy carries title/time/category/credits/schedule_days/hide_on_weekend/icon/description.
  Reward copy carries title(+title_he)/emoji/size/credits_needed/cash_value, `is_redeemed=false`.

## Verification

- Hat 1: `tsc --noEmit` 0 errors; `jest` 425/425 (3 heavy render suites time out only under full-suite
  parallel load — they pass with `--runInBand`; unrelated to this change).
- Hat 3 (emulator): **pending** — blocked by the same stale dev-client APK (`SplashScreenManager`,
  IN-2026-06-16). Verify on a build / device: edit a reward saves; deleting removes it; 📋 copies a
  task/reward to the chosen sibling(s).

## Values Check (BUFF_VALUES)

- **Pillar 1 / 2 / 3:** parent-side catalog management; no child-facing economy change, no PII. Editing
  a typo'd reward and copying a working setup to a sibling reduce parent friction. PASS.
