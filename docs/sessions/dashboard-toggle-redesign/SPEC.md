# `pkg/dashboard-toggle-redesign` — SPEC

**Status:** `executing — Adi requested 2026-05-24 after pkg/dashboard-today-yesterday-toggle shipped`
**Slug:** `pkg/dashboard-toggle-redesign`
**Branch:** `pkg/dashboard-toggle-redesign` (off `main`)
**Builds on:** `pkg/dashboard-today-yesterday-toggle` (PR #70, merged)
**Source:** Adi: "ה UI עדיין לא נראה כמו שרציתי, עם toggle למעבר בין הנתונים של אתמול לאלו של היום"
**Drafted:** 2026-05-24

---

## Why this exists

The toggle shipped in PR #70 used a tiny iOS-style segmented control (minWidth 56, fontSize 12, padding 12h/6v). Active vs inactive differ mainly by a subtle shadow + text color shift. Outcome: the control reads as decoration, not as a primary navigation surface. Asymmetric pill widths ("היום" vs "אתמול · 23.5") further weaken the segmented-control feel.

This package redesigns the toggle as **Big Segmented Pills** (Direction A from the design review):
- Full-width toggle on its own row (Add Child moves to a separate row)
- Equal-width pills (date moves to a subtext below the day label)
- Strong active state: accent-color fill + white text
- Clear inactive state: card-color fill + accent-color text + visible border

---

## Locked decisions (CC defaults)

| # | Decision | Rationale |
|---|---|---|
| **OQ-DTR-1** | **Pills are full-width** — toggle takes the entire row, "+ Add Child" moves to its own row below (Today view only). | The toggle is the primary navigation control of this section; it deserves the row. Add Child is a secondary action. |
| **OQ-DTR-2** | **Equal-width pills** — each pill is `flex: 1`. Date is rendered as a small subtext UNDER the day label, not inline. | Solves the asymmetric-width problem with the current "אתמול · 23.5" inline date. Symmetry is what makes segmented controls feel intentional. |
| **OQ-DTR-3** | **Show date for BOTH pills** — "היום" gets today's date as subtext, "אתמול" gets yesterday's date. | Information parity. Parent sees both dates at a glance. Also balances the pill heights perfectly. |
| **OQ-DTR-4** | **Active = accent fill (purple) + white text**. Inactive = card fill (white) + accent text + cardBorder border. | High contrast, follows BUFF's existing accent palette. Inactive is still clickable-looking (bordered button), not dimmed-out. |
| **OQ-DTR-5** | **Container has subtle shadow / border** to group both pills as one control. | Reinforces "this is one toggle, not two unrelated buttons". |
| **OQ-DTR-6** | **i18n key change**: `dashboard.toggle.yesterday` drops `· {{date}}` and becomes just "אתמול" / "Yesterday". The date is rendered separately as a `<Text>` subtext. | Cleaner separation of label vs metadata. |
| **OQ-DTR-7** | **No state / behavior change** — `useState<'today' \| 'yesterday'>('today')` unchanged, scenario A-D from PR #70 SPEC still apply. This is a visual-only redesign. | Surgical. Don't re-litigate behavior. |

---

## Values Check

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1-3 | ✅ no change to motivation surface |
| Positive Coaching | 1 — shame framing? | ✅ neutral toggle, no value-laden copy |
| Positive Coaching | 2 — empathy? | ✅ unchanged from PR #70 baseline |
| Positive Coaching | 3 — suffering? | ✅ none |
| Independence-Building | 1-3 | ✅ no kid-facing change |

**All 9 pass.** This is a visual-only iteration; values posture is identical to PR #70.

---

## Visual mock (ASCII)

**Today view (active = "היום"):**
```
┌───────────────────────────────────────────────────────────┐
│ ┌────────────────────────┬──────────────────────────────┐ │
│ │         היום           │           אתמול              │ │
│ │         24.5           │           23.5               │ │
│ │   (purple #6D28D9      │   (white bg, purple text,    │ │
│ │    bg, white text)     │    cardBorder border)        │ │
│ └────────────────────────┴──────────────────────────────┘ │
│                                              + Add Child  │
│                                                           │
│ [children cards...]                                       │
└───────────────────────────────────────────────────────────┘
```

**Yesterday view (active = "אתמול"):**
```
┌───────────────────────────────────────────────────────────┐
│ ┌────────────────────────┬──────────────────────────────┐ │
│ │         היום           │           אתמול              │ │
│ │         24.5           │           23.5               │ │
│ │  (white bg, purple     │   (purple bg, white text)    │ │
│ │   text, cardBorder)    │                              │ │
│ └────────────────────────┴──────────────────────────────┘ │
│                                                           │
│ [yesterday recap cards...]                                │
└───────────────────────────────────────────────────────────┘
```

---

## Files Touched

- `src/screens/parent/ParentDashboardScreen.tsx`:
  - Add `formattedToday` computed alongside `formattedYesterday`
  - Restructure the section header: toggle on its own row, Add Child below
  - Refactor pill JSX: render day label + date subtext
  - Update styles: bigger pills, accent-fill active state, bordered inactive, subtext styles
- `src/i18n/he.json` + `src/i18n/en.json`:
  - Change `dashboard.toggle.yesterday` from "אתמול · {{date}}" → "אתמול"
  - Same for English

## Files NOT Touched
- `src/components/YesterdayRecapCard.tsx` — unchanged
- `src/hooks/useYesterdayRecap.ts` — unchanged
- Phase 3 orphans (`AnchorRecoveryToast.tsx`, `useAnchorRecoveryActions.ts`) — explicitly out of scope

---

## Tests (manual, emulator)

1. Default mount: toggle full-width row, "היום" active (purple), today's date as subtext, "אתמול" inactive (white+border, purple text), yesterday's date as subtext ✅
2. Tap "אתמול" → fills flip; "+ Add Child" disappears ✅
3. Tap "היום" → flip back; "+ Add Child" reappears ✅
4. Pause Mode / no yesterday → toggle hidden, falls back to static "TODAY" header (unchanged from PR #70) ✅
5. Cold reopen → defaults to Today (unchanged from PR #70) ✅
6. Anchor recovery modal still renders on top regardless of view (unchanged from PR #70) ✅
7. Banned-string grep on i18n: 0 hits ✅
8. Jest: all 155 tests pass ✅

## Out of Scope
- Tab pattern (Direction C) — explicit reject; toggle is the mental model
- Hero date pattern (Direction B) — explicit reject; user wants "toggle" not "drill"
- Animation between states — defer to future iteration if Adi wants
- Phase 3 of anchor-recovery — separate package needed

---

## Phase plan

Single chunk. ~25 min CC time.

---

**End of SPEC.**
