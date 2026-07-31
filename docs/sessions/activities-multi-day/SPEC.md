# SPEC — Activities: multiple recurring weekdays

**Slug:** `activities-multi-day` · **Branch:** `pkg/activities-multi-day`
**Status:** ✅ IMPLEMENTED (approved 2026-07-31, lean plan) — see § Exit / as-built at the end
**Author:** CC · **Date:** 2026-07-31
**Origin:** Tester feedback (Noa, 2026-07-31): *"אפשר להוסיף יכולת לבחור ימים מרובים? או לפחות לשכפל כדי שאם זה בכמה ימים לא אצטרך להזין מחדש?"*

---

## Goal

Let a parent set **one recurring activity on several weekdays** (e.g. a חוג that meets Sun + Tue + Thu) in a single entry, instead of one activity per day. Fixes the real friction Noa hit: today the recurring picker is **single-select** (`setWeekday(d)` overwrites), so a 3-day חוג forces three separate identical activities.

---

## SPEC amendment (must be explicit — not a silent override)

The parent package (`docs/sessions/activities-and-camp-lists/SPEC.md`) **deliberately deferred** this:

> *"Multi-week date ranges for a camp (v1 = recurring weekday or single date … Date-range is a v2 refinement)"* — and `ActivitySchedule` comment: *"camp Sun–Thu = one per day or future multi-weekday"*.

This package **reopens that decision** and promotes multi-weekday from "future" to "now." That is a conscious amendment to a locked SPEC, surfaced here per the conflict rule — **not** for CC to self-approve. Requires Adi's `approved, proceed`.

**Why multi-weekday and not the "duplicate" stop-gap:** duplicate creates N rows for one real-world חוג → editing gear or archiving means touching N rows, and the rows silently drift apart. For a *weekly* חוג that lives a year (Noa's case, not a finite seasonal camp), that drift is exactly what our data-integrity discipline guards against. The array model is the correct end-state; duplicate is logged below as a rejected alternative.

---

## Scope

**In:**
- `ActivitySchedule.recurring` changes from a single `weekday` to a non-empty `weekdays: ActivityWeekday[]`.
- One Supabase migration: add a `weekdays` column, backfill from the existing single `weekday`, keep backward-compat.
- Parent add/edit UI: recurring day pills become **multi-select** (toggle, min-1 guard).
- Schedule label + child-side day-matching read the array.
- i18n for the multi-day label (he + en).

**Out (non-goals):**
- One-off `date` schedule is untouched (still a single date).
- Date *ranges* / start-end camp windows — still deferred.
- Per-day different times or per-day different gear (one activity = one time + one gear list, applied to every selected day). If a parent needs different gear per day, that is genuinely two activities.
- The discoverability / dashboard-surfacing of the organizer — **separate package** (see `activities-discoverability`, proposed 2026-07-31 from the same tester session). Do not fold in.

---

## Data model change

### Type (`src/types/activities.ts`)

```ts
// before
export type ActivitySchedule =
  | { kind: 'recurring'; weekday: ActivityWeekday }
  | { kind: 'oneoff'; date: string };

// after
export type ActivitySchedule =
  | { kind: 'recurring'; weekdays: ActivityWeekday[] }   // non-empty, deduped, Sun→Sat order
  | { kind: 'oneoff'; date: string };
```

An invariant helper keeps `weekdays` sorted in `ACTIVITY_WEEKDAYS` order and deduped, so labels and equality are stable.

### DB (`activities` table)

Current recurring columns: `schedule_kind`, `weekday text`, `on_date`, `at_time`.

**Migration (Phase 1, needs schema approval):**
1. `ADD COLUMN weekdays jsonb` (nullable initially).
2. Backfill: `UPDATE activities SET weekdays = to_jsonb(array[weekday]) WHERE schedule_kind = 'recurring' AND weekday IS NOT NULL;`
3. Leave the old `weekday` column **in place** for one release (backward-compat, see below). A later cleanup package drops it.

> ⚠️ **Existing-user impact (schema-change-gate):** mobile Supabase now has production families with live activities. The backfill above is required so their current single-day חוגים keep rendering. Verified: this is additive + backfilled, no row is lost.

### Hook (`src/hooks/useActivities.ts`)

- `ActivityRow` gains `weekdays: unknown`.
- `rowToActivity`: `weekdays: coerceWeekdays(r.weekdays) ?? (r.weekday ? [r.weekday] : [])` — reads the new column, falls back to the legacy single for any un-backfilled/older row.
- `scheduleColumns`: for recurring, write **both** `weekdays: schedule.weekdays` **and** `weekday: schedule.weekdays[0]` for one release, so a family member still on an older app build (which only reads `weekday`) sees at least the first day rather than a blank. Drop the dual-write in the cleanup package.

### Day-matching (`src/lib/activities/packing.ts`)

```ts
// activeOnDate, recurring branch
return schedule.weekdays.includes(weekdayOf(dateStr));   // was: === schedule.weekday
```

`buildPackingGroups` and `PackingCard` need no other change — they already consume the derived groups.

---

## Parent UI (`src/screens/parent/ActivitiesScreen.tsx`)

- Local state `weekday: ActivityWeekday` → `weekdays: ActivityWeekday[]` (default `['sunday']`).
- The day-pill row toggles membership instead of replacing:
  ```ts
  onPress={() => setWeekdays(cur =>
    cur.includes(d) ? cur.filter(x => x !== d) : sortWeekdays([...cur, d]))}
  ```
- **Min-1 guard:** tapping the last selected day off is a no-op (can't save a recurring activity with zero days). `canSave` already gates on this once `weekdays.length > 0` is added.
- `buildSchedule()` returns `{ kind:'recurring', weekdays }`.
- `openEdit()` seeds `weekdays` from `a.schedule.weekdays`.
- No visual redesign — same pills, now multi-select (a pill stays filled when selected). Matches the existing task-day-toggle interaction users already know.

### Schedule label (parent list + child, i18n)

- 1 day → unchanged: `כל יום ראשון` / `Every Sunday`.
- 2–3 days → join: `כל ראשון, שלישי, חמישי` / `Sun, Tue, Thu`.
- All 7 → collapse to `כל יום` / `Every day` (nice-to-have; safe to skip in v1 and just list all).
- New key `activities.recurringDays` alongside the existing `activities.recurringEvery`.

---

## Platform parity (Android + Web)

Pure JS/data change — no native API. Valid identically on both surfaces; verify the multi-select pills + label on **both** Android emulator and Expo web. The only cross-platform seam is **mixed app versions inside one family** (an older build reading `weekday`), handled by the dual-write above.

---

## Values Check (parent executive-function utility — light, P3-home)

Same posture as the parent SPEC: this is a Pillar-3 EF aid, not a child motivation mechanic. No child-facing failure framing is added; the child card still just lists today's gear. **No new P-violations.** Full 9-question pass is inherited from the parent package (the schedule is parent-side; child surface is unchanged). Re-verify at exit against built behavior.

---

## Chunked plan (each chunk: diff → approval → continue)

- **Phase 1 — Data + migration:** migration (add `weekdays`, backfill); `types/activities.ts`; `useActivities` read/write incl. legacy fallback + dual-write; `packing.ts` `activeOnDate`. Hat-1: jest for `activeOnDate` (multi-day match/no-match), `coerceWeekdays`, backfill fallback.
- **Phase 2 — Parent UI:** multi-select pills + min-1 guard + `buildSchedule`/`openEdit`; schedule-label i18n (he + en). Verify Expo web + emulator (Hat-3): create a Sun+Tue+Thu חוג, edit it, confirm the child card shows it on each of those days and not others.
- **Phase 3 — Exit:** STATUS row, SPEC_SYNC, RELEASE_QUEUE row, INTEGRATION_LEARNINGS if surprised, Values re-check. Note the follow-up cleanup package (drop legacy `weekday` column + dual-write).

## Verification

- **Hat-1:** `tsc` + jest — `activeOnDate` for a multi-day activity across all 7 weekdays; legacy single-`weekday` row still matches; empty-`weekdays` recurring never matches; label formatting for 1 / several / all-7.
- **Hat-3 (emulator):** add a multi-day חוג → appears on each selected day in the child packing card → edit removes a day → that day stops showing → archive hides all.
- **Hat-4:** RTL + EN label wording; real-device feel.

## Open decisions for Adi — RESOLVED 2026-07-31

1. ✅ **SPEC amendment + schema change — APPROVED** ("approved, proceed — lean"), after a three-lens review (architect / PM / UX), all GO-WITH-CHANGES. Migration 054 applied + backfill verified on the 6 live recurring rows.
2. ✅ **All-7 label — collapse** to `כל יום / Every day` (`activities.recurringEveryDay`).
3. ✅ **Duplicate button — dropped** (multi-day supersedes it; none existed in code).
4. ✅ **Child add-activity screen — minimal wrap** (stays single-select; emits `weekdays: [weekday]`).

---

## Rejected alternative — "duplicate" stop-gap

A "שכפל" button cloning an activity onto another day. Cheaper (no migration), but institutionalizes N-rows-per-חוג drift for weekly activities. Acceptable only as a same-week band-aid if multi-day is deferred; since we're building multi-day, it is not needed. Logged so the decision is visible, not silently dropped.

---

## Exit / as-built (2026-07-31)

Built in two chunks off `main`. Three-lens review (architect / PM / UX) ran before build; all GO-WITH-CHANGES. Adopted amendments:

**From the architect** — the SPEC's compat plan only reasoned about old-build *reads*:
- **`weekdays` is nullable with a WEAK CHECK only** (`weekdays IS NULL OR jsonb_array_length > 0`) — a strict "recurring ⇒ present" CHECK would reject old-build inserts during the compat window. Strict CHECK deferred to the cleanup package.
- **One-off writes null BOTH `weekdays` and `weekday`** (converting recurring→one-off must not leave a stale array).
- **`coerceWeekdays` contract**: `Array.isArray` guard, drop unknown/non-string tokens, dedupe, sort Sun→Sat, return `null` (not `[]`) when empty so the legacy fallback fires. `activeOnDate` on `[]` fails safe (matches no day).
- **`jsonb` is the consistency choice** (matches `equipment`), not strictly-correct — fine because weekdays is never queried server-side (fetch-all + filter in JS). No index; RLS/grants inherited (additive column ≠ new table).
- ⚠️ **Accepted, bounded risk (old-build *write* skew):** a pre-OTA client that EDITS a backfilled multi-day row writes only `weekday`, leaving `weekdays` stale; new builds trust `weekdays` and ignore that edit. Near-zero population (forced-update/OTA, pre-scale). **Not reconciled by design.** See IN-2026-07-31.

**From PM** — lean, not enterprise ceremony for 9 rows:
- Kept the one-line dual-write (`weekday = weekdays[0]`, protects the OTA-propagation window). **Dropped the dedicated "cleanup package"** — the eventual `weekday`-drop + strict CHECK fold into any future activities migration, no two-package saga.

**From UX** — the gesture already ships twice (`DayScheduleToggles`, `MedReminderSheet`):
- Added a **persistent hint line** (`activities.daysHint`) — solves discoverability *and* frames the silent min-1 guard.
- Pills gained `accessibilityRole="button"` + `accessibilityState={{ selected }}`; padding bumped `7→10` (tap target).
- Labels: `recurringDays` = "Every {{days}}" (keeps the recurring marker, not bare "Sun, Tue, Thu"); all-7 → `recurringEveryDay`.

**Values re-check (against built behavior):** unchanged posture — Pillar-3 parent EF aid; child surface still just lists today's gear; no child-facing failure framing added. No new P-violations. ✅

**Follow-up (not this package):** cleanup package to drop legacy `weekday` + the dual-write + add the strict `recurring ⇒ non-empty weekdays` CHECK, after old builds age out.

**Verification:** Hat-1 `tsc` clean + jest green (multi-day match across 7 days, empty-array fail-safe, `coerceWeekdays`, multi-select payload deduped/ordered, min-1 no-op). **Hat-3 (emulator/web) + Hat-4 (RTL/EN label, real-device feel) pending** — Activities is parent-auth-gated.
