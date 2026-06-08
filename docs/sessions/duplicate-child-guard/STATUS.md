# STATUS — fix/duplicate-child-guard

| State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|
| Hat-3 verified (Hat-4 optional) | 2026-06-07 | `25890aa` | tsc ✓ · jest 333/334 (1 pre-existing `stubParser` fail, unrelated) · i18n ✓ · DB end-to-end ✓ · **Hat-3 emulator ✓ (dialog live, force, delete, guard-no-insert)** | INTEGRATION_LEARNINGS.md → IN-2026-06-07-01 |

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
- **Hat-3 dialog UI: ✅ VERIFIED LIVE** on emulator-5554 (worktree JS via Metro 8083, authenticated parent `ParentTest520` with existing child "Itay"; test account granted temp premium to pass the >1-child paywall, reverted after). Add child → "Itay" → at the plan-ready step the dialog **"Itay is already here / You already have a child named Itay in your family. Want to open Itay, or add another child with the same name?"** appeared with **OPEN ITAY / ADD ANOTHER / CANCEL** (EN, name interpolated). DB checked while dialog open: still 1 active Itay → guard returns `duplicate` **without inserting**.
  - **ADD ANOTHER** → 2nd "Itay" created live (buddy/tasks/rewards seeded by triggers). ✅
  - **CANCEL** → originally `goBack()` **stranded the parent on the transient "Building plan" loading screen** (BUG found in Hat-3) → **fixed** to exit to ParentApp/Tasks (commit `25890aa`). No profile created on cancel (count stayed 1).
  - **`delete_child_profile`** exercised live on the forced 2nd Itay → `{success:true}`, fully removed incl. cascaded buddy rows (would have thrown on the old `assigned_to` bug). ✅
  - Cleanup: 2nd Itay deleted, premium flags reverted, family restored to original single Itay, 0 orphan rows.

## Open — Hat-4 (real device, Adi)
Optional real-device confirmation (everything above verified on emulator):
- On your own device/family, add a child whose name already exists → confirm the dialog feels right and the 3 buttons behave (Open / Add another / Cancel).
- **FLAG (out of scope):** `create_default_tasks_for_child` trigger front-runs the `generateStarterTasks` engine → personalized starter tasks never land (owned by `pkg/starter-task-engine`).
- **FLAG (out of scope):** `stubParser.test.ts` has 1 pre-existing failing test on `origin/main`.
