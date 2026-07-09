# timetable-copy-day — SPEC

> Branch: `pkg/timetable-copy-day`
> Priority: **P1 — feature requested by a real user mid-task (Noa, 2026-07-06, WhatsApp 19:11)**
> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.

---

## Problem (user evidence)

> "הצעת ייעול (אולי פשוט לא מצאתי) — לאפשר לשכפל שיעורים מיום אחד ליום אחר" — Noa, 2026-07-06 19:11

She didn't miss it — **it doesn't exist** (code-verified 2026-07-06). Real schedules repeat: קייטנה 07:30 with the same gear list every day; school days share most lessons. Today she must retype every lesson + its full equipment list per day — on a screen that (until `pkg/timetable-editor-overflow` lands) she can't even reliably save. This is the #1 effort-reducer for schedule entry.

### Code-verified current state
- **No copy/duplicate across days exists.** The only duplication feature in the app is `DuplicateToChildModal.tsx` (tasks → other children), used at `ParentTasksScreen.tsx:516-524` — different concept, but a proven UX pattern to mirror.
- **Data model makes this trivial:** `timetables.data` is a JSON blob `Record<WeekDay, PeriodInfo[]>` (`src/types/timetable.ts:9-16`; `useTimetable.ts:58-200`). Copying a day = copying an array of `{ subject, startTime, equipment? }`. No schema change, no new table, no RLS.
- Day keys: `'sunday'…'friday'` (6 school days; Saturday not in the model).
- Equipment flows to the child from the same blob (`ChildBagPrepScreen.tsx:52-66, 84`) — a copied day carries its gear list with zero extra work.

## Goals
- From any day tab in the timetable editor, copy that day's lessons (including equipment) to one or more other days in ≤3 taps.

## Non-goals
- No "copy to another child" (different feature; timetables are per-child/family via `assigned_to` — out of scope).
- No week templates / import-export, no drag-and-drop reordering, no changes to the child screen.
- No autosave redesign — copy respects the screen's existing save semantics.

## Behavior Contract
1. Day tab with ≥1 lesson shows a **"שכפל יום ל… / Copy day to…"** affordance (placement: near "+ הוספת שיעור"; final placement in Plan Mode).
2. Tap → day-multi-select sheet (the 5 other days, current day disabled). Days that already have lessons are marked ("יש כבר X שיעורים").
3. Confirm → source day's `PeriodInfo[]` is **deep-copied** into each selected day.
   - Target empty → straight copy.
   - Target has lessons → **explicit choice, never silent overwrite**: "החלף את היום" / "הוסף לשיעורים הקיימים" (replace | append; append re-sorts by `startTime`).
4. Works in both **manual** and **review** modes (same underlying state; verify both entry points).
5. Copy mutates local editor state only; persisted by the screen's existing save flow — cancel/back discards like any other unsaved edit.
6. Equipment strings copy verbatim; child's bag-prep for the target day reflects them after save (existing flow, no new code).
7. Platform parity: identical behavior on Android and Expo Web (pure JS state operation + a modal — no platform-split needed; verify the sheet renders on web).

## Schema Changes
None. (JSON blob already holds everything; deep-copy in JS.)

## API / Route Changes
- `useTimetable.ts`: add `copyDay(sourceDay: WeekDay, targetDays: WeekDay[], mode: 'replace' | 'append')` mutating the in-memory `Timetable`, mirroring `manualUpdateLesson`'s state conventions. Deep copy (`structuredClone` or map+spread) — **never share `PeriodInfo` object references between days** (a shared ref would make editing Monday silently edit Tuesday).

## UI Changes
- `TimetableScreen.tsx`: copy affordance per day tab (manual + review) + day-select sheet component (reuse visual language of `DuplicateToChildModal` / `DayScheduleToggles` chips).
- i18n: new keys under `timetable.copyDay.*` in **both** `he.json` + `en.json` (title, dayHasLessons, replace, append, success toast). English-first values, Hebrew secondary per current locale policy.

## Values Check (9/9 — Pass)
Parent-tool; child sees only richer schedule data.
**Pillar 1:** 1-3. N/A — no child-facing motivation mechanics.
**Pillar 2:** 1. **No** demeaning copy — utilitarian strings only. 2. N/A. 3. **No** BUDDY mechanics.
**Pillar 3:** 1. **Yes (indirect)** — complete schedules across all days = the child's bag-prep checklist works every day, not just the day the parent had energy to type. 2. Child voice unchanged. 3. Permanent utility.
**Pass:** ✔

## Plan of work (chunks)
1. **Chunk 1:** `copyDay` in `useTimetable` + Jest (empty target, replace, append+sort, deep-copy no-shared-refs, invalid source). Diff → approval.
2. **Chunk 2:** UI — affordance + sheet + i18n, wired in manual mode. Diff → approval.
3. **Chunk 3:** Review-mode entry point + web verification + exit deliverables.

## Tests
- **Hat 1:** `tsc --noEmit`; the Jest suite above; `npm run i18n:check`.
- **Hat 3 (emulator):** build Sunday with 3 lessons + gear → copy to Mon-Thu (empty) → verify tabs; copy onto a non-empty day → both replace and append; save → reload → persisted; child Gear tab shows tomorrow's copied equipment.
- **Web:** same core flow via preview tools.

## Open Questions (resolve in Plan Mode)
1. Affordance placement: button next to "+ הוספת שיעור" vs. overflow menu on the tab? (Recommend visible button — this package exists because features hide; see the discoverability pattern in Noa's messages: "אולי פשוט לא מצאתי".)
2. Should REVIEW mode (post-OCR) offer it too, or manual only for v1? (Recommend both — same state layer, low cost.)
3. Success feedback: toast vs. auto-switching to the target tab? (Recommend switch to the first target tab — shows the result instantly, teaches the model.)

## Out of Scope
- Copy across children/families; week templates; Saturday support (model has no `saturday` key — separate decision if ever needed); any layout/picker changes (owned by the two sibling packages).

## SPEC_SYNC
- `STATUS.md` row per phase.
- `docs/BUFF_FLOWS.md`: add the copy-day step to the schedule-entry journey once shipped.
- `docs/INTEGRATION_LEARNINGS.md`: append only if the JSON-blob concurrency (parent editing on two devices) surprises.
