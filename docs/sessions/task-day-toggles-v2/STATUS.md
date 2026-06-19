# STATUS — pkg/task-day-toggles-v2

Forward-port of the per-task weekday selector (PR #233, stranded on `release-43`) onto `main`,
plus a native time picker and "zero days = paused/hidden" semantics.

| State | Date | Tests | Notes |
|---|---|---|---|
| code-complete-pending-device-test | 2026-06-19 | tsc 0 · jest 425/425 | DB migration applied; Hat-3 + Adi View-as-Child pending |

## What shipped in this package

1. **Day selector on main** — cherry-picked `e024d3b` (DayScheduleToggles + ParentTasks wiring + i18n).
   It never reached main (see IN-2026-06-19-01).
2. **Native time picker** — replaced the free-text HH:MM field with `DateTimePicker` (same pattern as
   `MedReminderSheet`). RTL/LTR follows interface language via `useRTLStyles()`; the clock value is
   forced LTR (`writingDirection: 'ltr'`) so "16:00" never bidi-flips in Hebrew.
3. **Zero days = paused** — deselecting every day is now allowed (min-1 rule removed). An explicit `[]`
   hides the task from the child everywhere and excludes it from counts/recap; a "paused" hint shows
   under the selector so it's never a silent disappearance.
4. **Single-source semantics** — `null/undefined → every day` (legacy safe), `[] → no day`. Aligned
   across `taskSchedule.ts`, `yesterdayRecapUtils.ts`, and `useChildProgress.ts` (load + create).
5. **DB hardening** — `tasks.schedule_days` is now `DEFAULT '{0,1,2,3,4,5,6}' NOT NULL` (verified 0
   null / 0 empty across 1121 rows before applying). Future inserts that omit the column get all 7
   days, so `[]` can only come from a deliberate parent action.

## Verification

- Hat 1: `tsc --noEmit` → 0 errors; `jest` → 425/425 (3 earlier failures were environmental render
  timeouts, green on re-run).
- Hat 3 (emulator, adb): **pending**.
- Hat 4 (Adi, real device / View-as-Child): **pending** — confirm a task with selected days shows only
  on those days, and a task with all days deselected disappears for the child + shows the paused hint
  to the parent.

## Values Check (BUFF_VALUES)

- **Pillar 1 — Intrinsic Motivation:** lets the parent fit the plan to the child's real week (e.g. no
  homework on weekends); pausing avoids nagging on irrelevant days. PASS.
- **Pillar 2 — Positive Coaching:** hiding off-day tasks prevents false "incomplete" marks; the paused
  hint prevents a silent-broken feel. No PII added. PASS.
- **Pillar 3 — Independence-Building:** parent tailors structure; child autonomy untouched. PASS.

## Out of scope (flagged, not pulled)

- "Seasonal / vacation until date X + custom task set" (Adi's Itay-summer use-case) — net-new feature,
  exists on neither platform. Candidate for its own SPEC. See `docs/sessions/lovable-parity-audit/MATRIX.md`.
- Category / icon pickers in the parent task modal — separate parity gaps.
- A "paused" badge on the parent task row — nice-to-have, not required (parent list already shows the task).
