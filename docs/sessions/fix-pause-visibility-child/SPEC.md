# fix-pause-visibility-child — SPEC

> Branch: `pkg/fix-pause-visibility-child`
> Priority: **P0 — bug reported by a real user (Noa, 2026-07-06, WhatsApp 19:01)**
> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.

---

## Problem (user evidence)

> "שמתי משימה בהשהיה, היא עדין מופיעה אצל ליה" — Noa, 2026-07-06 19:01

The parent UI **promises**: `parentTasks.daysPausedHint` = "המשימה מושהית — לא תוצג לילד עד שתבחרי יום" (`src/i18n/he.json:1691`, shown at `ParentTasksScreen.tsx:483-485`). The child still sees the task. Investigation (2026-07-06, code-verified) found **two confirmed defects and one latent edge**, all breaking that promise:

### Defect 1 — Mint theme ignores family Pause Mode (confirmed)
- `GamerTasksScreen.tsx:174, 264-273` reads `isPauseActive` from `useAppSettings()` and short-circuits to `PauseEmptyState`. ✓
- **`ChildTasksScreen.tsx` (`PastelChildTasks`, lines 49-217) destructures only `{ settings }` from `useAppSettings()` (line 65) and never checks `isPauseActive`** — the Mint (default!) theme renders the full task list while the family is paused. ✗
- Same gap on the Mint rewards screen (`ChildRewardsScreen.tsx`) — Gamer rewards checks pause, Mint does not.
- Both dashboards (Mint `ChildDashboardScreen.tsx:194-198`, Gamer `GamerDashboardScreen.tsx:242-245`) check pause correctly — which makes the tasks-tab leak extra confusing for parents ("the dashboard says paused but the tasks are still there").
- Origin: pause gate was added with `GamerTasksScreen` (commit `4d28f14`, 2026-05-12) and never back-ported to the pre-existing Mint screen.

### Defect 2 — Child device never learns about the pause (confirmed)
Per-task pause = `scheduleDays: []`, saved correctly (`ParentTasksScreen.tsx:214` → `useChildProgress.ts:483` → `tasks.schedule_days = []`). Both visibility filters hide `[]` correctly (`src/utils/taskSchedule.ts:26-29`, `src/lib/taskScheduling.ts:43-44` — `[].includes(day)` is false). **But the child-side data hook's realtime channel subscribes only to `daily_progress`, `lesson_progress`, `credit_vault` (`useChildProgress.ts:176-183`) — NOT to `tasks`.** A child on her own device (Liya's case) keeps the stale task list until a full refetch. Parent pauses → nothing changes on the child's screen. This affects *every* task edit (title, time, days), not just pause.

### Edge 3 — Per-task pause is a no-op for one-time tasks (latent, verify & fix)
`isTaskVisibleOn` (`src/lib/taskScheduling.ts:38-39`): when `dueDate` is set, `scheduleDays` is **ignored**. The edit modal still shows the day chips + the "paused" hint for such a task — the hint lies. Decide: hide day chips for one-time tasks, or make `[]` also hide dated tasks.

### Bonus divergence found (fix here, it's one line)
`src/lib/taskScheduling.ts:43` defaults null `scheduleDays` to `[0,1,2,3,4,5]` (no Saturday) while `src/utils/taskSchedule.ts:28` defaults to all 7 days. Post-backfill (PR #233) null rows are rare, but the two "sources of truth" disagree → align lib to `[0..6]` and add a test.

---

## Goals
- A paused task (per-task `[]` **or** family Pause Mode) is **never visible on any child surface, on any theme, on any device, within ≤ a few seconds** of the parent's action.
- One visibility rule, one module, tested.

## Non-goals
- No redesign of Pause Mode UX, no new pause states, no schema change.
- No changes to parent-side screens beyond what Edge 3 requires (chip visibility in the edit modal).

## Behavior Contract
1. Family Pause ON → Mint tasks tab AND Mint rewards tab show `PauseEmptyState` (exact same behavior as Gamer theme today).
2. Parent sets a task's days to `[]` → the task disappears from the child's task list/dashboard/timeline **without app restart** (realtime or focus-refetch), on both shared-device (View-as-Child) and own-device children.
3. Editing any task field propagates to an open child session the same way.
4. One-time (dueDate) task: the edit modal never shows a misleading "paused" state (per Open Question 1 resolution).
5. Both platforms: verified on Android emulator AND Expo Web (`npm run web`).

## Schema Changes
None. (`tasks.schedule_days` already exists and is written correctly.)

## API / Route Changes
- `useChildProgress.ts` realtime channel: add `.on('postgres_changes', { table: 'tasks' }, () => fetchChildData())` (scoped by family filter like the existing subscriptions; debounce if needed).
- If realtime on `tasks` is not enabled for the Supabase project's publication → fallback: refetch on screen focus (`useFocusEffect`) + AppState foreground. **Check publication first; flag to Adi if a publication change is needed (schema-adjacent → approval gate).**

## UI Changes
- `ChildTasksScreen.tsx` (`PastelChildTasks`): destructure `isPauseActive`, short-circuit to `PauseEmptyState` after the loading gate (mirror `GamerTasksScreen.tsx:264-273`).
- `ChildRewardsScreen.tsx` (Mint): same gate.
- `ParentTasksScreen.tsx` edit modal: resolve Edge 3 (likely hide `DayScheduleToggles` + hint when `dueDate` is set).
- No copy changes; reuse existing `PauseEmptyState` + i18n keys (both locales already have them).

## Values Check (9/9 — Pass)
**Pillar 1 — Intrinsic Motivation**
1. Would the child want this without virtual reward? **Yes** — a paused day is a promise of quiet; showing stale demands breaks trust.
2. Moves toward child-chosen reward? **N/A** — bug fix; no reward mechanics touched.
3. "I want" not "I must"? **Yes** — removing tasks the parent explicitly paused reduces "must" pressure.

**Pillar 2 — Positive Coaching**
1. Demeaning/comparing/failure-showing? **No** — `PauseEmptyState` copy is already values-approved (pkg/pause-mode).
2. On failure — empathy or pressure? **Empathy** — the whole point of pause is a pressure valve; this makes it actually work.
3. BUDDY suffering/loss mechanic? **No.**

**Pillar 3 — Independence-Building**
1. More capable without the app? **Yes** — pause exists so the family can regulate load; honoring it keeps the tool a scaffold, not a nag.
2. Child has a voice? **Unchanged.**
3. Still needed in 6 months? **It's a correctness fix — permanent.**

## Plan of work (chunks)
1. **Chunk 1:** Mint pause gates (tasks + rewards) + Jest snapshot/unit for the gate. Show diff → approval.
2. **Chunk 2:** `tasks` realtime subscription (or focus-refetch fallback) in `useChildProgress`. Show diff → approval.
3. **Chunk 3:** Edge 3 resolution + lib default `[0..6]` alignment + tests (`taskScheduling.test.ts` parity table update).
4. **Chunk 4:** Hat 3 on emulator (scenario below) + web smoke; exit deliverables.

## Tests
- **Hat 1:** `tsc --noEmit`; Jest — new: pause-gate render test per theme; `isTaskVisibleOn` with `scheduleDays: []` on every weekday; null-default = 7 days.
- **Hat 3 (emulator):** parent pauses family → switch View-as-Child (Mint) → tasks tab shows PauseEmptyState; parent sets one task to `[]` days → child list drops it without restart; repeat with Gamer theme (regression); rewards tab both themes.
- **Hat 4 (Adi, real devices):** two-device test — parent phone pauses, child phone (Liya-style own device) updates within seconds. This is the exact user scenario; code-only verification is insufficient.

## Open Questions (resolve in Plan Mode)
1. Edge 3: hide day-chips for one-time tasks, or make `[]` hide dated tasks too? (Recommend: hide chips — a dated task has no recurrence to pause.)
2. Is `tasks` in the Supabase realtime publication? If not — publication change needs Adi's approval, or ship focus-refetch only.
3. Does `useChildrenDashboard.ts` (parent side) need the same `tasks` subscription for symmetric freshness? (Flag, don't expand scope silently.)

## Out of Scope
- Rewriting the two scheduling modules into one file (flagged as follow-up refactor; this package only aligns the default).
- Any Pause Mode UX/copy change.
- The known HQ vs Today's-Plan day-filter divergence beyond surfaces touched here (`project_task_day_filtering` handoff remains its own item).

## SPEC_SYNC
- `docs/BUFF_GAP_ANALYSIS.md`: propose closing "pause leaks to child" row (Adi's doc — propose only).
- `docs/INTEGRATION_LEARNINGS.md`: append — "theme-forked child screens must share behavior gates; Gamer/Mint drift caused a values-level bug."
- `STATUS.md` row per phase.
