# SPEC — School-Day vs Free-Day Task Parity

- **Slug:** `school-free-day-parity`
- **Branch (proposed):** `pkg/school-free-day-parity`
- **Status:** Decisions locked (Adi: "ניצמד כמו ללוובל", 2026-05-29) — ready to build, pending explicit "proceed"
- **Date:** 2026-05-29
- **Author:** Claude Code (from Adi's V19 testing feedback)

---

## 1. Problem

During V19 testing Adi observed that the child's "Today's Plan" does not treat
**school days** and **free days (weekend)** differently, and that the day/school
logic in the mobile app is wrong for Israel. The Lovable web app already
implements a school-day/free-day model; mobile is behind.

Adi's product intent (verbatim, 2026-05-29):
- "את יום שישי נעשה לפי המערכת כשיש" — Friday is a school day only when the
  family's schedule says so (not a hardcoded calendar rule).
- "נתייחס למשימות שונה ביום לימודים וביום חופש" — tasks behave differently on a
  school day vs a free day.

---

## 2. Reference model — how Lovable already does it (source of truth)

Anchored to the local Lovable checkout (`C:\Users\adiel\buff-lovable`, remote
`github.com/adielgarat-pm/buff`):

- **Per-task flag `hideOnWeekend?: boolean`** — `src/types/task.ts:61`.
  `true` = school-day-only task (hidden on weekends). Absent/false = shows every
  day. (Plus `scheduleDays?: number[]` for fine per-weekday control — `task.ts:66`.)
- **Weekend determination** — `src/hooks/useSyncedTaskStore.ts:26-30`:
  ```js
  const isWeekend = (fridayEnabled = false) => {
    const day = new Date().getDay();
    if (day === 5) return !fridayEnabled; // Friday: weekend unless fridayEnabled
    return day === 6;                      // Saturday: always weekend
  };
  ```
  → Sat always free; Fri configurable; **Sun–Thu always school**.
- **`friday_enabled`** — family-level setting in the **`app_settings`** table
  (`useSyncedTaskStore.ts:361` read, `:1112` write).
- **Visible-task filter** — `useSyncedTaskStore.ts:1086-1089`:
  ```js
  const isCurrentlyWeekend = isWeekend(fridayEnabled);
  const visibleTasks = isCurrentlyWeekend
    ? tasks.filter(t => !t.hideOnWeekend) // weekend: drop school-only tasks
    : tasks;                               // school day: show all
  ```
  Lessons earn 0 credits on weekends (`:1092`).

---

## 3. Current mobile state (gaps)

Anchored to `C:\Users\adiel\buff-mobile`:

| Piece | Lovable | Mobile today | Action |
|---|---|---|---|
| `tasks.hide_on_weekend` | ✅ field + filter | ❌ **column missing** | **migration: add column** |
| `app_settings.friday_enabled` | ✅ used | ✅ **column exists**, code ignores it | wire in code (no migration) |
| Weekend logic | `isWeekend(fridayEnabled)` (Israel) | `isWeekday()` = Mon–Fri (Western) — `src/screens/child/GamerTasksScreen.tsx:71-74` | **replace** with Israel logic |
| Filter tasks to today | PhaseView + visibleTasks | Mint `PhaseView` filters by `scheduleDays`; **Gamer `GamerTasksScreen` does NOT filter to today at all** | fix Gamer to filter |
| Per-task day editor | `hideOnWeekend` flag | only `schedule_days` | add toggle in task editor |

Confirmed via Supabase MCP (project `gfrongfnyigxsexuofrg`, 2026-05-29):
- `tasks` columns: id, family_id, title, time, category, credits, description,
  icon, created_at, assigned_to, strategy_id, **schedule_days (ARRAY)**,
  is_system_generated, proposed_by_child. → **no `hide_on_weekend`.**
- `app_settings` columns include **`friday_enabled` boolean** (already present).
- `profiles` has `school_quest_enabled` (boolean), `school_end_time`.

---

## 4. Proposed changes

### 4.1 Data
- **Migration:** `ALTER TABLE tasks ADD COLUMN hide_on_weekend boolean NOT NULL DEFAULT false;`
- No migration for `friday_enabled` (exists in `app_settings`).

### 4.2 Logic (shared helper)
- Add an Israel-correct `isWeekend(fridayEnabled)` / `isSchoolDay(fridayEnabled)`
  helper (Sat always free; Fri per `friday_enabled`; Sun–Thu school). Replace the
  hardcoded `isWeekday()` in `GamerTasksScreen.tsx` and reuse in the Mint path.
- Read `friday_enabled` from `app_settings` (family-level) — likely via
  `useAppSettings`.
- In `useChildData` (or screens): compute `visibleTasks` = on weekend, drop
  `hide_on_weekend` tasks; on school day, show all. Apply alongside the existing
  `schedule_days` (today) filter.
- **Fix Gamer:** `GamerTasksScreen` must filter to today's `schedule_days`
  (currently shows all days) and apply the weekend/`hide_on_weekend` filter.

### 4.3 UI
- **Task editor (parent):** add a toggle "Hide on weekends / school-days only"
  (Hebrew wording TBD — see Open Questions) that sets `hide_on_weekend`.
- **Parent settings:** surface the `friday_enabled` toggle (the setting exists in
  DB but has no mobile UI). Mirror Lovable's ParentDashboard switch.

---

## 5. Behavior contract

- Sun–Thu: school day → all of today's scheduled tasks show (incl. `hide_on_weekend`).
- Sat: free day → tasks with `hide_on_weekend=true` are hidden.
- Fri: school day **iff** `app_settings.friday_enabled=true` for the family;
  else free day (hide `hide_on_weekend` tasks).
- `schedule_days` still applies (a task only appears on its listed weekdays).
- Both Gamer and Mint task screens behave identically on this contract.

---

## 6. Decisions locked — "match Lovable" (Adi, 2026-05-29)

1. **Vacations/holidays:** weekly pattern only (Sat always free + Fri toggle). No
   one-off holiday calendar in V1 — matches Lovable. Future package.
2. **`friday_enabled` scope:** family-level (one toggle for all children), stored
   in `app_settings.friday_enabled` — matches Lovable. Per-child is a future
   refinement (noted: a family with a Friday-studying young kid + non-Friday older
   kid can't be split until then).
3. **Day-applicability mechanism:** matches Lovable — the parent controls which
   days a task applies to via the **day-of-week picker (`schedule_days`)**, NOT a
   per-task "school/free" toggle. In Lovable `hideOnWeekend` is set only on
   system/seed tasks (`useTaskStore.ts:8`), with no parent-facing toggle.
   → For mobile parity we still add `hide_on_weekend` + the weekend filter (for
   system tasks), but the **parent-facing control is the day picker**.
4. **Existing data:** leave `schedule_days` as-is; weekend behavior is driven by
   the weekend filter + `schedule_days` (a task simply won't show on days not in
   its `schedule_days`). No backfill.

### Key finding — the real mobile gap is bigger than logic
The **parent task editor (`ParentTasksScreen.tsx`) has no day-of-week picker** —
it groups by time only and never lets the parent set `schedule_days`. So today a
mobile parent cannot make a task "school-days only." Matching Lovable therefore
requires **adding a day picker to the parent task add/edit flow**, in addition to
the logic fixes. (Lovable sets `scheduleDays` in its parent task UI.)

---

## 7. Values Check (to verify at exit)

- **Intrinsic Motivation:** free days show a lighter, age-appropriate plan rather
  than nagging school tasks on a day off — supports autonomy/rest.
- **Positive Coaching:** weekend ≠ failure; school-only tasks simply don't appear,
  no "missed" guilt.
- **Independence-Building:** the child sees the right plan for the right day
  without a parent re-curating tasks daily.
- (Full 9-question check to be completed before exit.)

---

## 8. Out of scope
- Holiday/vacation calendar (one-off dates) — future package.
- Per-child `friday_enabled` — future.
- The HQ-tappable fix (separate, shipped via PR #119).
