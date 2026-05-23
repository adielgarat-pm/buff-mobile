# `pkg/dashboard-clarity-cleanup` — SPEC

**Status:** `executing — Adi approved 2 fixes, OQ9-C is informational only`
**Slug:** `pkg/dashboard-clarity-cleanup`
**Branch:** `pkg/dashboard-clarity-cleanup` (off `main`)
**Source:** 2026-05-23 emulator test of pkg/anchor-recovery-ui flagged 3 pre-existing dashboard UX issues
**Drafted:** 2026-05-23

---

## Why this exists

While testing `pkg/anchor-recovery` Phase 2 on the emulator, Adi spotted 3 pre-existing dashboard UX issues that make the parent surface confusing — and would have made the anchor-recovery modal harder to evaluate because it would sit on top of confusing chrome. We're pausing anchor-recovery Phase 2 testing to clean these up first.

None of the 3 issues were introduced by anchor-recovery. They live on `main` and need a separate, surgical cleanup.

---

## Issues

### Issue A — Duplicate child names (unlinked banners + child cards)

**Root cause:** `src/screens/parent/ParentDashboardScreen.tsx:265-276` renders an "👋 {name} הצטרף למשפחה — לחץ לחיבור" banner for every kid in `useUnlinkedChildren().unlinked`. The hook flags any kid with `role='child'` + `user_id NOT NULL` + `pro_settings->>source = 'child_signup'` as "unlinked". The auto-link `useEffect` at line 65-97 only fires when both `unlinked.length > 0` AND `linkable.length > 0` — but it doesn't clean up or hide banners when there's no `linkable` target.

Result: kids whose `source='child_signup'` flag was never cleared keep showing as banners forever, while ALSO appearing as proper cards in the TODAY section. The two surfaces show the same kid twice.

**Fix:** Wrap the banner `.map()` in `linkable.length > 0 &&`. If there's nothing to link against, the banner is meaningless and hidden. Auto-link logic untouched.

### Issue B — "Goal 70%" mystery copy

**Root cause:** `ParentDashboardScreen.tsx:343-344` renders `{t('weeklyGoal.goal70')}` = "יעד 70%" / "Goal 70%" as a constant footer under each child's progress bar. The text references the `atGoal = pct >= 70` success threshold but doesn't make that connection visible. Parents see "0%" + "יעד 70%" and read it as a failed goal of 0.

**Fix (Adi-approved option B3):** Replace the i18n value:
- HE: `"יעד 70%"` → `"70% = יום מוצלח 🎯"`
- EN: `"Goal 70%"` → `"70% = a successful day 🎯"`

Key name `weeklyGoal.goal70` stays (rename = separate refactor, out of scope).

### Issue C — "C ZERO / yesterday" — informational only (no code change)

The Yesterday Recap card's "C. Zero marked" variant (the softened "אתמול לא היה" copy when a kid completed 0 tasks yesterday) is shipped behavior from `pkg/yesterday-recap` and is intentional, Pillar-2-compliant. Adi clarified she was just understanding what the variant is. **No fix needed.**

---

## Values Check

Both fixes are pure UX clarity. Neither touches the kid surface or BUDDY logic.

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | 1-3 | ✅ no change to reward / motivation mechanics |
| Positive Coaching | 1 — no shame? | ✅ Removing "Goal 70%" mystery copy REDUCES the "0% < 70% = failure" misreading. Net Pillar-2 positive. |
| Positive Coaching | 2 — empathy on fail? | ✅ The new copy frames 70% as "a successful day" — encouraging, not threshold-judging |
| Positive Coaching | 3 — suffering mechanic? | ✅ none |
| Independence-Building | 1-3 | ✅ no kid-facing change |

**All 9 pass.**

---

## Goals

1. Hide "join family" banners when `linkable.length === 0` — banners only show when there's something to actually link against
2. Change the "Goal 70%" footer copy to "70% = יום מוצלח 🎯" / "70% = a successful day 🎯" (B3 per Adi)
3. **No changes to:** auto-link logic, kid card structure, YesterdayRecap, anchor-recovery Phase 2 work on its own branch

## Non-goals

- ❌ Renaming `weeklyGoal.goal70` i18n key (refactor, separate)
- ❌ Fixing `daily_goal` display vs. percentage display mismatch (deeper redesign)
- ❌ Anything in the YesterdayRecap component (works as designed per pkg/yesterday-recap)
- ❌ The 86 anchor_recovery notifications currently in DB (testing data; out of scope here)
- ❌ App.tsx and `__YesterdayRecapPreviewHarness.tsx` WIP files left uncommitted on the working tree — those are someone else's work-in-progress, left untouched

---

## Files Touched

- `src/screens/parent/ParentDashboardScreen.tsx` — wrap line 265 banner map in `linkable.length > 0 &&`
- `src/i18n/he.json` — `"weeklyGoal.goal70"` value → `"70% = יום מוצלח 🎯"`
- `src/i18n/en.json` — `"weeklyGoal.goal70"` value → `"70% = a successful day 🎯"`
- `docs/sessions/dashboard-clarity-cleanup/*` — new session folder

## Files NOT Touched

- `src/hooks/useUnlinkedChildren.ts` — leave the heuristic; we're just gating the render
- `src/components/YesterdayRecapCard.tsx` — works as designed
- `App.tsx` (local modifications) — Adi's WIP, untouched
- `src/screens/_dev/__YesterdayRecapPreviewHarness.tsx` — Adi's WIP, untouched

---

## Tests

Manual visual check on emulator after the changes:
1. Dashboard for Adi's family (parent profile `b45bf1b2-…`) → no purple banners (no linkable kids) ✅
2. Each kid card's progress footer reads "70% = יום מוצלח 🎯" (HE) ✅
3. YesterdayRecap section unchanged ✅
4. anchor-recovery modal (separate branch, Phase 2) unaffected ✅

No Jest/typecheck required — i18n values and one conditional, both trivial.

---

## Phase plan

Single chunk. ~10 minutes of code + commits + PR.

---

**End of SPEC.**
