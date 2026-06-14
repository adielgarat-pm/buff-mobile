# Anchor Recovery — Phase 3 Plan: "Add Medication Reminder"

> Detailed spec for Phase 3 (auto-create anchor task → **smart-default setup sheet**).
> Drafted 2026-06-14 by CC. Awaiting Adi's `approved, proceed` before any code.
> Parent SPEC: [SPEC.md](./SPEC.md). Status tracker: [STATUS.md](./STATUS.md).

---

## Decision delta vs. locked contract

Phase 0 locked **OQ4 = "auto-add + toast, NO form"**. Adi (2026-06-14) deliberately
overrode this in favor of a **smart-default setup sheet**. Rationale: medication
timing is personal — a fixed 07:30 default makes the reminder useless for a kid who
takes meds at 14:00. The sheet keeps the "one click" goal (defaults pre-filled) while
allowing adjustment. This supersedes OQ4. The other locked OQ6 defaults are honored.

### Adi decisions (2026-06-14)

| # | Question | Decision |
|---|---|---|
| P3-1 | Sheet vs auto-add | **Smart-default sheet** (defaults pre-filled, one-tap add still possible) |
| P3-2 | Second dose in v1 | **Yes** — meds are typically morning + night-before-bed. Default = one morning dose; "+ add evening dose (before bed)" creates a second task. Parent always sets/confirms the time. |
| P3-3 | Medication name/label field | **No** — generic child-facing label only, no medical PII stored |

---

## Current state (the gap)

`handleAnchorAddMeds` in [`src/screens/parent/ParentDashboardScreen.tsx`](../../../src/screens/parent/ParentDashboardScreen.tsx)
(~line 163) is **log-only**: it console-logs, calls `resolveAnchorPrompts()` +
`markAnchorShown()`, and closes the modal. **No task is created.** Worse — it marks the
notification resolved, so the prompt never returns. The button is a working-looking shell.

The Phase-2 modal also renders the meds CTA **unconditionally**; SPEC Scenario A step 4
says it should appear only when the kid has no standalone meds task (OQ7 heuristic).
Phase 3 closes both gaps.

---

## Flow

1. Parent taps "Add medication reminder" → opens `MedReminderSheet` (new component).
2. Sheet opens with **defaults pre-filled**: one morning dose `07:30`, all 7 days selected.
3. Parent may: change the time · tap "+ add evening dose (before bed)" · toggle
   days off · or just tap "Add reminder". The morning time is always parent-confirmed.
4. On save → one `tasks` row **per dose** is inserted → toast
   "✓ Reminder added for {name} · edit anytime in Tasks" → sheet closes →
   `resolveAnchorPrompts()` + `markAnchorShown()` (unchanged).
5. Kid sees the new task next time they open the app.

---

## Data model (no migration — schema verified 2026-05-23)

One INSERT into `tasks` per dose, reusing the existing insert path from
[`ParentTasksScreen.tsx` `handleConfirmTask`](../../../src/screens/parent/ParentTasksScreen.tsx) (~line 159):

| field | value |
|---|---|
| `assigned_to` | `childId` |
| `family_id` | `familyId` |
| `title` | single dose → `נטילת תרופה` · two doses → `נטילת תרופת בוקר` + `נטילת תרופת ערב` |
| `time` | parent's choice (morning default `07:30`; evening/before-bed default `20:00`) |
| `category` | `self-care` (per OQ6 — **not** `responsibility`) |
| `credits` | `5` (per OQ6) |
| `schedule_days` | parent's choice (default `[0,1,2,3,4,5,6]`) |
| `is_system_generated` | `true` |

**No medication name is collected or stored** (P3-3). Child-facing title is the generic
`נטילת תרופה`.

---

## Product decisions baked in

- **All 7 days by default** — diverges from the generic task default `[0–5]` (skips Sat).
  For meds, a silent weekend skip is a health risk. Aligns with the in-app
  `medication-low` insight ("Consistency is key", `useParentInsights.ts`).
- **No med-name field** — children's app with aggressive PII scrubbing (Pillar 2). A
  reassurance line ("we don't store medication name or dosage — just a gentle reminder")
  is built into the sheet.
- **Morning default + optional evening (before-bed) dose** — meds are typically taken
  morning and at night before sleep. Default is one morning dose; the evening dose is
  opt-in. Grounded in real UGC (Etay: morning + evening were the only anchors that
  survived the war, per Appendix). The "+ evening dose" row is collapsed by default to
  stay light. Parent always confirms the time (per Adi, 2026-06-14).

---

## OQ7 conditional display (gap fix)

The meds CTA in `AnchorRecoveryPromptModal` must render only when the kid has **no
standalone meds task**: title contains `תרופה` (case-insensitive) AND does NOT contain
`ארוחת`/`בוקר`/`ערב`. Compute per-child and pass a `showMeds` flag into the modal.

---

## Values Check (against implemented behavior)

| Pillar | Verdict |
|---|---|
| 1 — Intrinsic Motivation | ✅ 5 BUFFs kept modest, not headlined; meds = health, not a grind. |
| 2 — Positive Coaching | ✅ Gentle copy, zero failure language, no medication name shown to kid. |
| 3 — Independence-Building | ✅ Scaffold that fades; goal is meds without a reminder. |

---

## Files touched (proposed)

- **New:** `src/screens/parent/MedReminderSheet.tsx` — the setup sheet (modal).
- **Modified:** `src/screens/parent/ParentDashboardScreen.tsx` — replace the log-only
  `handleAnchorAddMeds` with sheet open; insert tasks on save; pass `showMeds` to modal.
- **Modified:** `src/screens/parent/AnchorRecoveryPromptModal.tsx` — conditional meds CTA.
- **New i18n keys (EN + HE):** `medReminder.*` (title, subtitle, time, addDose, days,
  daysHint, privacy, childPreviewLabel, save, cancel, toast).
- **Reuse:** existing `tasks` insert pattern; existing time-input + toast patterns.

## Out of scope (later phases)

- Phase 4 — Vibe Check credit (separate).
- Phase 5 — ParentTasksScreen meds template prioritization.
- Phase 6 — full i18n sweep, banned-string grep gate, Values Check sign-off, ship.

---

## Test plan (Phase 6 detail; smoke here)

- Tap meds CTA → sheet opens with defaults.
- Save single dose → exactly one `self-care`, `is_system_generated` task at chosen time/days.
- Add second dose → two tasks (`...בוקר`, `...ערב`).
- Toggle days → `schedule_days` matches selection.
- After save → notification resolved, toast shown, kid sees task next open.
- Meds CTA hidden when a standalone meds task already exists (OQ7).
- Banned-string grep clean (`פספסת`/`missed`/`failed`/`inactive`/...).

---

**End of Phase 3 plan.** Awaiting `approved, proceed`.
