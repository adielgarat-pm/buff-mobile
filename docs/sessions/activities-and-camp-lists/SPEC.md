# SPEC — Activities & Seasonal Packing (unified)

**Slug:** `activities-and-camp-lists` · **Branch:** `pkg/activities-and-camp-lists` · **Status:** SPEC (awaiting `approved, proceed`)
**Worktree:** `.claude/worktrees/activities-camp`
**Author:** CC · **Date:** 2026-06-13

---

## Goal

Give parents **one place to manage things that live OUTSIDE the school timetable**, each carrying the gear the child needs:

- **Recurring or one-off activities** — private lessons, חוגים, clubs. A day (recurring weekday **or** a single date), an optional time, and an equipment list. Mirrors the Lovable model.
- **Seasonal / camp packing** — for end-of-year / summer: the same flow, but the equipment is **pre-filled from a ready-made template** (pool day → swimsuit + towel + sunscreen; day camp → water + hat + change of clothes; overnight camp → sleeping bag, reusable utensils, wipes…) so the parent doesn't type it from scratch. Adi supplies the source templates.

Both feed **one child-facing "what to pack" surface**, where the **child checks items off**.

### Key design decision — UNIFIED (D6, locked 2026-06-13)

A "pool day" **is just an activity** whose equipment came from a template instead of being typed by hand. So there is **no separate "camp lists" screen**: the seasonal lists become **equipment templates** that pre-fill an activity at creation. The parent always sets the "when" in the same activity flow (one-off date or recurring weekday). One screen, one table, one child card.

Add-activity flow: **(1) pick a template** (pool / day camp / overnight / … or "blank" for a חוג) → **(2) set when** (one-off date or recurring weekday + optional time) → **(3) equipment pre-fills** from the template; parent removes what's irrelevant or adds their own.

---

## Scope

**In:** net-new Activities model + parent CRUD UI with a template-picker step; a typed packing-template catalog (mirrors `taskLibrary.ts`); a single child-facing packing card where the child checks items; i18n under new `activities.*` / `camp.*` namespaces (he + en); one Supabase table.

**Out (non-goals, deferred):**
- AI/photo capture of activities (that's `parent-capture`, gated OFF).
- Reminders/notifications for activities (FCM is its own package; equipment shows in-app only for v1).
- A global "turn off the school timetable" toggle (D2 — fully additive for v1; the packing card just appears).
- Multi-week date *ranges* for a camp (v1 = recurring weekday or single date; a 3-week camp is "recurring · Sun–Thu"). Date-range is a v2 refinement.
- Editing the school timetable, the child backpack screen, or `ChildTabs` (sibling session owns these).

---

## Relation to existing work (overlaps I must NOT resolve silently)

1. **`docs/sessions/off-routine-day/SPEC.md`** defines a per-child "Routine / Off-routine / Pause" day-state (swaps the weekday *plan*). This package is the *equipment* layer for the same "school is off" reality. Complementary, not duplicate. Per D2 we add **no** competing "school off" switch in v1; unifying the two into one "school off" concept is a later coordinated package.
2. **`parent-capture`** (`FEATURE_PARENT_CAPTURE=false`, AsyncStorage, has `bring`/`recurrence`, parser-fed) is a different concept — one-off AI-extracted items behind an OFF flag. We use **a new Activities model**, not an extension of `ParentItem`.
3. **Sibling timetable session** owns `TimetableScreen.tsx`, `types/timetable.ts`, `useTimetable.ts`, `ChildTabs.tsx`, and the child backpack screen. The packing card is additive; child-backpack integration is a future seam.

---

## Data model

### Activity (new file `src/types/activities.ts`)

```ts
/** Day-of-week token, local to this feature (NOT imported from types/timetable.ts,
 *  which a sibling session owns — avoid cross-session coupling). */
export type ActivityWeekday =
  | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type ActivitySchedule =
  | { kind: 'recurring'; weekday: ActivityWeekday }   // חוג every Tuesday; camp Sun–Thu = one per day or future multi-weekday
  | { kind: 'oneoff'; date: string };                 // YYYY-MM-DD, a single date (e.g. pool day)

export interface Activity {
  id: string;
  familyId: string;
  childId: string | null;          // null = whole family; usually a specific child
  title: string;                   // "Guitar lesson", "יום בריכה", "חוג כדורגל"
  templateId: string | null;       // → PACKING_TEMPLATE_LIBRARY key, or null for a blank/manual activity
  schedule: ActivitySchedule;
  time: string | null;             // "HH:MM", optional
  equipment: string[];             // pre-filled from the template, then parent-edited
  status: 'active' | 'archived';
  createdAt: string;               // ISO
}
```

`templateId` is kept only so the child card can show the right icon and so a template can be re-applied; the equipment itself is copied into `equipment[]` at creation (editing a template later never mutates existing activities).

### Packing-template catalog (pure data, mirrors `starterTasks/taskLibrary.ts`)

New dir `src/lib/packingTemplates/`:

```ts
// src/lib/packingTemplates/types.ts
import type { I18nString } from '...';            // reuse the existing bilingual string type
export interface PackingItemDef { id: string; label: I18nString; defaultApplies: boolean; }
export interface PackingTemplateDef {
  id: string;                       // stable key, e.g. 'pool_day'
  title: I18nString;
  icon: string;                     // Ionicons name (pool / tent / moon / …)
  items: PackingItemDef[];
  /** Smart default for step 2 so the parent makes one fewer decision:
   *  a pool day defaults to one-off, a חוג/blank to recurring. */
  defaultSchedule: 'oneoff' | 'recurring';
}
// src/lib/packingTemplates/catalog.ts → PACKING_TEMPLATE_LIBRARY: PackingTemplateDef[]
//   seeded: pool_day / day_camp / overnight_camp (+ a "blank" path that bypasses templates);
//   Adi supplies the final templates + items. Editing wording/items is a DATA edit.
```

At creation the picked template's items (those with `defaultApplies`, plus any the parent ticks) are flattened into `Activity.equipment`. No separate selection table.

### Unified child read shape

```ts
export interface PackingGroup {
  source: 'activity';
  templateId: string | null;        // drives the icon
  title: string;
  when?: string;                     // "Today" / weekday / date
  items: string[];
}
```

A selector derives `PackingGroup[]` for a child + day from Activities whose schedule matches today.

---

## Persistence — one Supabase table (recommended)

Matches the timetable pattern (Supabase + per-child/family rows + RLS + realtime); enables cross-device + co-parent visibility. Mobile DB has **no production users** (project memory), so the migration is low-risk.

- `activities` — `id, family_id, child_id (null=family), title, template_id, schedule_kind, weekday, on_date, at_time, equipment jsonb, status, created_at`. RLS: family-scoped read; parent write (mirror `timetables`/`tasks`, incl. parent→own-device-child from migration 022).
- Hook: `useActivities(childId)` in `src/hooks/`, mirroring `useTimetable` (fetch + realtime + save).
- The **child's check-off state** (which items the child has packed) is per-child, per-day, ephemeral UI state — stored lightweight (AsyncStorage keyed by `activityId+date`, resets daily). It is *not* parent data and does not need a table for v1.

Migration applied in **Phase 1**, after `approved, proceed`.

---

## Parent-side surface

- **`ActivitiesScreen`** (`src/screens/parent/ActivitiesScreen.tsx`) — list activities per child; the add/edit flow is the 3-step template → when → equipment flow above. Mirrors `ManageChildrenScreen` skeleton (SafeAreaView header, `PARENT_THEME as T`, `useTranslation`, `useRTLStyles`).
- **Entry point (D3 default):** one row in **Parent Settings** ("חוגים ופעילויות") routing to `ActivitiesScreen` as a root-stack modal screen (mirror `ManageChildren`). Keeps the 5-tab bar stable.

---

## Child-facing packing surface

A self-contained **`<PackingCard>`** (`src/components/PackingCard.tsx`) rendering `PackingGroup[]` for the child + today; the **child checks items off** (D1). Reached **from within an existing child screen** — I do **not** touch `ChildTabs.tsx`. Host (D4 default): the child **dashboard** (`ChildDashboardScreen` + `GamerDashboardScreen`) as a compact "מה לוקחים היום" card.

**Copy = body-double voice** (BUFF_VALUES P2 + memory): calm, alongside, in the child's pace. Never "you forgot…", never a missed-count. An unchecked item is just an item, not a verdict.

---

## Design constraints (from `design-critique`, 2026-06-13) — binding for build

These are build requirements, not nice-to-haves. Each maps to a critique finding.

**Child card (Phase 4) — the highest-impact fixes:**
- **Theme-aware:** `<PackingCard>` consumes `useChildTheme()`. Header/accent come from the child's theme (Mint vs Gamer) — **never** a hardcoded info-blue. Verify in both themes.
- **Gender-correct copy:** child copy must not default to masculine. Pull the child's gender from the profile, or use neutral phrasing (e.g. *"נארוז יחד?"* / *"מה לוקחים היום"*) — no "בוא…" masculine default. (Known BUFF trap.)
- **Empty state:** if nothing matches today, the card hides or shows a calm line (*"היום אין מה לארוז — תהנו!"*). Never an empty/half-rendered box.
- **No failure framing:** **no** "2/3 packed" counter, no progress bar — a half-done list must never read as a miss. Optional, P1-safe: a single calm *"מוכן/ה!"* when all are ticked (no points, no streak).
- **Keep the time anchor** ("17:00") visible to the child — a genuine ADHD win.

**Add-activity flow (Phase 3):**
- **Reorder step 1 around the daily case:** "חוג שלי" (blank/manual) is **first / auto-selected**; seasonal templates sit below under a "קיץ" subheader. Optimize for the everyday lesson, not the seasonal exception.
- **Smart default schedule:** step 2 pre-selects from the template's `defaultSchedule` (pool → one-off, חוג/blank → recurring).
- **Flow chrome:** `1/3` step indicator + RTL-mirrored back chevron + a sticky `שמור` CTA on step 3. No ambiguous "am I done?".
- **Cap long lists:** show ~6 items, then "עוד…" — a wall of checkboxes is an ADHD overwhelm trigger (worst on overnight camp).

**Accessibility (both surfaces):**
- **Touch targets ≥44px** for check-off rows (pad the row, not the 16–18px glyph) — kids miss-tap small targets.
- **Contrast:** unchecked labels use `text-secondary`, not `text-tertiary` (tertiary on a tinted row likely fails 4.5:1). Tertiary reserved for hints.
- **RTL:** all chevrons/back affordances mirrored.

**Minor (parent list):** inactive child chip gets a faint pill border (affordance); whole activity card taps to edit (chevron).

---

## Feature C — Child-authored activities (D7, locked 2026-06-13)

A child can add an activity **for themselves**, the same way they already propose a task/reward — for the real case of a teen's one-off event (e.g. Itay's job interview Tuesday 16:00, "bring CV, leave early"). Rationale: a teen who won't open a calendar **will** open BUFF, so centralising prep-bearing events there meets ADHD attention where it already is. Strengthens Pillar 3 (self-initiation).

**Guardrail — BUFF is not a calendar.** Child-add is for **prep-bearing** things (carry gear / leave-time / what-to-wear), surfaced on their day. No month view, no sync, no invites, no recurring-rule complexity. The existing `oneoff` schedule already covers the one-off case.

**Mode-aware approval (D7):**
- **Teen Mode (13+ / Gamer):** child adds **directly** → `status = 'active'`, no approval. Parent still sees it (transparency, not control).
- **Children Mode (6-12):** child **proposes** → `status = 'proposed'`; parent approves (→ `active`) or withdraws. Same feel as a proposed task/reward.

### Data + RLS delta (migration 027, Phase 4.5 — separate from 026)

- `activities.created_by_child BOOLEAN NOT NULL DEFAULT false` — lets the parent surface "added by Itay" and scopes child edit rights.
- Extend `status` CHECK to add `'proposed'` (alongside `active` / `archived`).
- New RLS: child may **INSERT** an activity where `child_id = (my profile)`; child may **UPDATE/archive** only their own rows where `created_by_child = true`. Parent's existing manage-all policy is the approval path (flip `proposed → active`). Mode (Teen-direct vs Children-propose) is enforced at the **app layer** (which UI shows + which status it writes), consistent with how BUFF gates modes elsewhere — *not* in RLS.
- Deliberately does **not** overload the `child_suggestions` table (too lightweight for schedule + equipment); the "pending" state lives as `status = 'proposed'` on `activities`.

**Values (Feature C):** P1 ✅ the teen owns his own event (intrinsic). P2 ✅ calm prep, no failure framing. P3 ✅✅ self-initiation — the strongest autonomy expression in the package. Passes 9/9.

---

## Values Check

### Activities (incl. seasonal packing) → **PASSES**

**P1 Intrinsic Motivation**
1. Want it without virtual reward? ✅ The child chose the activity (guitar, football, the pool day); the gear serves a thing they already want.
2. Toward a self-chosen reward? ✅ Neutral-positive — removes friction from a self-chosen pursuit; no app-generated reward loop introduced.
3. "I want" vs "I must"? ✅ "I want my swimsuit so I can swim."

> Honest note: the seasonal/packing facet is a *utility / executive-function* aid, not a motivation mechanic — it is **P1-neutral, not P1-violating** (no coins, no app currency). Its home pillar is P3.

**P2 Positive Coaching**
1. Demean/blame/compare/show failure? ✅ List framing, body-double copy, no missed-count (hard constraint).
2. On failure → empathy or pressure? ✅ A forgotten item is shown calmly, never nagged.
3. Suffering mechanic? ✅ None.

**P3 Independence-Building**
1. More capable without the app? ✅ **Strong** — remembering your own gear / packing your own bag is a canonical ADHD executive-function skill (the starter-task library already prioritises "pack your own bag").
2. Child has a voice? ✅ The **child checks items off** (D1) — they own the packing, not just the parent.
3. In 6 months / fades? ✅ A scaffold the child internalises; activities and seasons come and go.

**Verdict:** unified feature passes all 9. The seasonal facet earns its place as a **Pillar-3 executive-function aid** (not as motivation), with the child-checkoff (P3 voice) and body-double-copy (P2) constraints making it pass cleanly.

---

## Decisions (locked unless noted)

- **D1 — Child checks off the packing items.** ✅ Locked 2026-06-13.
- **D2 — Fully additive for v1** (no global "turn off timetable" toggle). ✅ Locked 2026-06-13.
- **D6 — Unified model:** one "Activities" flow; seasonal lists are equipment *templates*, not a separate screen; "when" always set in the activity. ✅ Locked 2026-06-13.
- **D3 — Parent entry (default, Adi may override):** one row in Parent Settings → modal `ActivitiesScreen`.
- **D4 — Child host (default, Adi may override):** `<PackingCard>` on the Mint + Gamer dashboards.
- **D5 — Source templates:** Adi supplies the canonical packing templates + items (he + en). I seed pool_day / day_camp / overnight_camp as placeholders to unblock build; final content is a data edit.
- **D7 — Child-authored activities:** ✅ **Locked 2026-06-13: mode-aware.** Teen adds directly (`active`); Children Mode proposes (`proposed`) → parent approves. Prep-bearing one-offs only; BUFF stays not-a-calendar. See Feature C above.

---

## Chunked plan (each chunk: show diff → wait for approval → continue)

- **Phase 0 — Lock decisions (done) + add `SPEC_SYNC.md`.**
- **Phase 1 — Data + persistence:** `activities` table (migration), `src/types/activities.ts`, `useActivities`, the today-matching `PackingGroup` selector. Hat-1 (tsc + jest for schedule matching: recurring weekday vs one-off date vs today).
- **Phase 2 — Template catalog:** `src/lib/packingTemplates/{types,catalog}.ts` with seed templates; `camp.*` i18n. Pure data + tests.
- **Phase 3 — Parent UI:** `ActivitiesScreen` (list + 3-step add/edit flow) + Settings entry row; `activities.*` i18n. Verify via Expo web + Claude_Preview.
- **Phase 4 — Child surface:** `<PackingCard>` + child check-off state; mount on the dashboards. Body-double copy. Verify via Expo web + Claude_Preview (Mint + Gamer, he + en).
- **Phase 4.5 — Child-authored activities (Feature C):** migration 027 (`created_by_child`, `proposed` status, child INSERT/UPDATE RLS); child add UI — Teen direct vs Children propose (mode-aware), reusing the propose-task/reward UX; parent review strip for `proposed` activities. Hat-1 + emulator.
- **Phase 5 — Exit:** STATUS row, SPEC_SYNC, INTEGRATION_LEARNINGS if surprised, RELEASE_QUEUE row, re-run Values Check against built behaviour.

## Verification

- **Hat-1:** `tsc` + jest — schedule day-matching, template→equipment flatten, unified `PackingGroup` derivation, child check-off state reset-by-day.
- **Hat-3 (emulator):** parent adds a חוג (blank, recurring) + a pool day (template, one-off) → child packing card shows today's gear → child checks items → archive hides them.
- **Hat-4:** real-device feel + EN/Hebrew RTL.

## Exit deliverables

Per `SPEC_SYNC.md` (added Phase 0): GAP_ANALYSIS row if scope warrants; STATUS row with commit/tests/learnings; INTEGRATION_LEARNINGS if surprised; RELEASE_QUEUE row at merge; Values Check re-verified against behaviour.
