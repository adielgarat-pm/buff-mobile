# STATUS — fix/duplicate-child-guard

| State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|
| code-complete (pending Hat-3/4) | 2026-06-07 | _pending push_ | tsc ✓ · jest 333/334 (1 pre-existing `stubParser` fail on origin/main, unrelated) · i18n ✓ · DB end-to-end ✓ (simulated parent, rolled back) | INTEGRATION_LEARNINGS.md → IN-2026-06-07-01 |

## Scope delivered
- **Migration 021** (`create_child_profile` atomic guard + `delete_child_profile` fix) — **applied live**.
- **Live data fix** — soft-deleted the empty "פלד" twin (`e9d9378a`), restoring the child's real profile to the connect list. Reversible.
- **Client** — `UStep5_Preview` routes child creation through the RPC + 3-button duplicate dialog (he/en); `is_deleted=false` filter added to 6 parent-facing child-list reads.

## Architect decision honored
Atomic RPC guard + friendly confirm dialog. **No hard unique constraint.**

## Values Check — PASS
- **Pillar 1 (Intrinsic Motivation):** N/A — parent-facing data-integrity guard, no child-reward mechanic.
- **Pillar 2 (Positive Coaching):** PASS — dialog copy ("{name} is already here") is reassuring; no shaming, comparison, or failure-framing; no BUDDY-suffers mechanic.
- **Pillar 3 (Independence):** PASS — reduces parent confusion + child data loss; remains useful long-term.

## Test results
- **Hat-1:** `tsc` ✓ · `jest` 333/334 (1 pre-existing `stubParser` fail on origin/main) · `i18n:check` ✓.
- **DB end-to-end (strongest evidence):** under a simulated real-parent JWT in a rolled-back txn — create→`created`, repeat→`duplicate` (returns existing id/name), force→`created` (count=2), `buddy_relationships` seeded=2; dup-detection returns the correct active twin; delete columns all resolve. 0 rows persisted.
- **Hat-3 smoke:** ✅ booted the worktree JS on emulator-5554 via Metro (port 8083) on a debug dev-client (no native changes in this package). App bundles + renders with no crash from the changed modules (UStep5, ManageChildren, 4 hooks, i18n).
- **Hat-3 dialog UI:** ⚠️ **BLOCKED on emulator.** The duplicate dialog only fires for an already-authenticated parent via "Add another child"; the only UI auth path is Google OAuth (no email-login affordance in the welcome flow), which is the skill's documented Hat-4 boundary. First-run onboarding can't trigger it (no `user` at UStep5 yet).

## Open — Hat-4 (real device, Adi)
On a real device signed in as a parent who already has a child named e.g. "Dana":
1. Settings → Manage Children → "+ Add another child" → enter "Dana" → reach the plan-ready step → **expect the dialog** "Dana is already here" with Open / Add another / Cancel.
2. "Add another" → a 2nd Dana is created; "Open Dana" → returns to Tasks with no new profile; "Cancel" → backs out.
3. Manage Children → tap a child → Delete → **expect it actually deletes** (the `delete_child_profile` fix).
- **FLAG (out of scope):** `create_default_tasks_for_child` trigger front-runs the `generateStarterTasks` engine → personalized starter tasks never land (owned by `pkg/starter-task-engine`).
- **FLAG (out of scope):** `stubParser.test.ts` has 1 pre-existing failing test on `origin/main`.
