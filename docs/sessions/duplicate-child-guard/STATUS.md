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

## Open
- **Hat-3** (emulator): add same child twice → dialog fires; "Add another" creates, "Open" doesn't; delete child works post-fix.
- **Hat-4**: real-device confirm.
- **FLAG (out of scope):** `create_default_tasks_for_child` trigger front-runs the `generateStarterTasks` engine → personalized starter tasks never land (owned by `pkg/starter-task-engine`).
- **FLAG (out of scope):** `stubParser.test.ts` has 1 pre-existing failing test on `origin/main`.
