# timetable-time-picker — SPEC

> Branch: `pkg/timetable-time-picker`
> Priority: **P1 — UX consistency, directly requested by a real user (Noa, 2026-07-06, WhatsApp 19:06)**
> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.

---

## Problem (user evidence)

> "אולי כדאי בלחיצה על השעון להקפיץ מסך של שעון (כמו השעון המעורר) כדי להזין שעה" — Noa, 2026-07-06 19:06

She's right, and it's an **inconsistency we already ship**: the task-edit modal has exactly what she asked for; the timetable editor doesn't.

### Code-verified current state
- **Task edit modal** (`src/screens/parent/ParentTasksScreen.tsx:446-469`): tap time row (🕐 icon, `:455`) → `@react-native-community/datetimepicker` `mode="time"`, `is24Hour`, Android Material clock / iOS spinner. The exact "שעון מעורר" experience she described.
- **Timetable editor** (`src/screens/parent/TimetableScreen.tsx:936-944` manual / `:765-776` review): free-text `TextInput keyboardType="numbers-and-punctuation" maxLength={5}` placeholder `HH:MM`. Error-prone (no validation feedback, "730" vs "07:30"), slow for 6-8 lessons/day, and the keyboard it opens is a direct contributor to the overflow bug (`pkg/timetable-editor-overflow`).
- **Web precedent for the split**: `@react-native-community/datetimepicker` has **no web implementation** (`src/components/BirthdayField.web.tsx:2` — solved exactly this for dates with a platform-split component).

## Goals
- Lesson time entry on TimetableScreen (both manual + review modes) uses a **native time picker on Android/iOS** and a proper **web-native control on Expo Web** — same interaction as the task-edit modal.
- One reusable `TimeField` component so the next screen that needs a time doesn't fork a third pattern.

## Non-goals
- Not changing the stored format — `PeriodInfo.startTime` stays `"HH:MM"` string inside `timetables.data` (`src/types/timetable.ts:9-13`). No schema/migration.
- Not touching task-edit modal (already correct), MedReminderSheet, or ChildAddActivityScreen — though `TimeField` should be adoptable by them later (flag as follow-up).
- No redesign of the lesson row beyond swapping the time control.

## Behavior Contract
1. Tap the time on a lesson row → native time picker opens pre-set to the current value (default sensible, e.g. previous lesson +1h, else 08:00); confirm → row shows `HH:MM`, persisted via existing `manualUpdateLesson` / `updatePeriod` unchanged.
2. Cancel → no change.
3. Web: the control renders `<input type="time">` (or equivalent) — **never a dead button** (`project_web_birthday_field` lesson: native-only pickers are invisible no-ops on web).
4. RTL: time always renders LTR (`writingDirection: 'ltr'` like `ParentTasksScreen.tsx:564`).
5. Existing timetables with any legacy string values still render without crashing (defensive parse → fallback 08:00 in the picker, raw string still displayed).

## Schema Changes
None.

## API / Route Changes
None. Same `PeriodInfo.startTime` writes through the existing update paths.

## UI Changes
- New `src/components/TimeField.tsx` (native: TouchableOpacity row + 🕐 + `DateTimePicker mode="time"`, lifted from `ParentTasksScreen.tsx:446-469`) + `src/components/TimeField.web.tsx` (`<input type="time">` styled to match) — following the established platform-split convention (`feedback_android_web_platform_parity`, BirthdayField pattern).
- `TimetableScreen.tsx`: replace both free-text time inputs (`:936-944`, `:765-776`) with `TimeField`.
- Helpers `hhmmToDate` / `dateToHhmm`: extract from ParentTasksScreen into the component (don't duplicate a third copy).
- i18n: picker itself is OS-native (no strings); any accessibility label via `t()` in both locales.

## Values Check (9/9 — Pass)
Parent-tool ergonomics; no child-facing change.
**Pillar 1:** 1-3. N/A — no motivation mechanics.
**Pillar 2:** 1. **No** copy changes. 2. N/A. 3. **No** BUDDY mechanics.
**Pillar 3:** 1. **Yes (indirect)** — lower schedule-entry friction → more families complete the timetable → bag-prep independence loop reaches the child. 2. Unchanged. 3. Permanent ergonomic fix.
**Pass:** ✔

## Plan of work (chunks)
1. **Chunk 1:** `TimeField` + `TimeField.web` + unit test (parse/format round-trip). Diff → approval.
2. **Chunk 2:** Wire into TimetableScreen manual + review modes. Diff → approval.
3. **Chunk 3:** Android + web verification, exit deliverables.

## Tests
- **Hat 1:** `tsc --noEmit`; Jest for hhmm↔Date helpers incl. invalid input ("", "730", "25:99").
- **Hat 3 (emulator):** set times across several lessons in both modes; verify Material clock opens, value persists after save + reload; RTL locale check.
- **Web:** `npm run web` + preview tools — `<input type="time">` opens browser control, value persists; no `datetimepicker` import in the web bundle (launch-crash guard, `feedback_native_import_sentry_blindspot`).

## Open Questions (resolve in Plan Mode)
1. Default time for a NEW lesson row: previous lesson +1h vs fixed 08:00? (Recommend previous+1h — matches how schedules are entered.)
2. Keep `maxLength={5}` free-text as a long-press fallback, or picker-only? (Recommend picker-only — one path, fewer bugs.)
3. Adopt `TimeField` in MedReminderSheet/ChildAddActivityScreen now or flag as follow-up? (Recommend: flag only — scope discipline.)

## Out of Scope
- Layout/overflow fixes (`pkg/timetable-editor-overflow` — merge order note: land overflow first; this package's diff assumes its structure).
- Copy-day feature, task-edit modal, any timetable parser changes.

## SPEC_SYNC
- `STATUS.md` row per phase.
- `docs/INTEGRATION_LEARNINGS.md`: append the web-split learning only if something new surfaces beyond the BirthdayField precedent.
