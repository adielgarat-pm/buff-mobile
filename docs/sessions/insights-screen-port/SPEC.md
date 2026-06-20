# SPEC — Port the rich Insights screen from Lovable to mobile

> **Status:** PROPOSED — awaiting Adi's `approved, proceed`.
> **Created:** 2026-06-19. **Author:** CC.
> **Origin:** Monetization audit (insights becoming a paid feature). The mobile insights = a single dashboard card (thin); Lovable already has a rich, proven Insights screen. Porting it makes the paid gate clearly earned.
> **Source to port:** `C:\Users\adiel\buff-lovable-ref\src\components\ParentIgnitionInsights.tsx` (+ its `useParentInsights.ts`, `useWeeklyBuffStats`).

---

## 1. Why

Audit finding: mobile "Parent Insights" is one rotating card (1 of 8 static templates) on the dashboard; `phaseInsights`/`lowPerformingTasks` are computed but never shown; only a 7-day window, no trend, a dead zone for 50–70% families. Too thin to headline a $9.99/mo gate. **Lovable has the depth already** — port it.

## 2. What to port (the 5 sections from `ParentIgnitionInsights`)

1. **Ignition-rate card** — weekly completion rate %, progress bar with a **70% goal marker**, week-over-week change badge (↑/↓%), above-goal / on-the-way message.
2. **Ignited vs Charging day counters** (2 tiles).
3. **Highlights** — Strongest phase (best `avgCompletionRate`) + Most-active window. *(Both derive from `phaseInsights`, which mobile ALREADY computes.)*
4. **Personalized reinforcement message** — tiered by performance (≥5 days / ≥3 / ≥50% / below), interpolates child name + real numbers. Covers EVERY performance level (kills the dead-zone).
5. **Weekly map** — 7-day 🔥/💤 dots.

## 3. Data plan (mobile)

- **Reuse:** `useParentInsights` already returns `phaseInsights` (avgCompletionRate, taskCount per phase) → powers Highlights #3. No new work.
- **Build:** a `useWeeklyStats(childId)` hook from `daily_progress` (the table useParentInsights already queries). Returns `DailyStats[]` (date, dayName, tasksCompleted, tasksTotal) for the **last 7 days AND the prior 7 days** → powers #1/#2/#5 **and the REAL week-over-week**.

## 4. CRITICAL fixes vs the Lovable source (do NOT copy verbatim)

1. ⛔ **Kill the fake trend.** Lovable line 52 fakes week-over-week with `Math.random()`. **Replace with real prior-week data** from the new hook. Shipping a fake trend in a paid feature is the exact trust-eroder this whole audit guards against (and violates the no-dark-pattern Pillar). If real prior-week data is unavailable (new family), **hide the WoW badge** — don't invent it.
2. **Align the "ignited day" threshold** with the success-count decision ([[D-2026-06-14-01]] — success = ~3 completed abs count, not a %). Lovable hardcodes 30%. Use the SAME definition as the buddy/EOD success so the two surfaces never contradict.
3. **RN conversion:** framer-motion → `Animated`/none; lucide icons → emoji/`@expo/vector-icons`; tailwind classes → `StyleSheet` + `PARENT_THEME`. Match existing parent-screen styling.

## 5. Gating + entry point

- The screen is **BUFF Premium** (per monetization-model SPEC). 
- Dashboard insight card (already premium-gated in chunk 3a): **free → Paywall** (unchanged); **subscriber → navigate to this new Insights screen** (new — gives subscribers somewhere richer to land).
- Add the screen to the parent navigator + a route in `RootStackParamList`.

## 6. Values check

- Reinforcement copy stays positive/forward, effort-over-outcome (Pillar 2) — the Lovable tiers already do this; keep.
- No fabricated data (fix #1) — Pillar/no-dark-pattern.
- Anti-overload: one screen, scannable; no nagging.

## 7. Open questions (Adi)

- **Framing:** adopt Lovable's "ignition / ignited days / charging" metaphor, or mobile's existing vocabulary? (Copy decision.)
- i18n: port the `ignition.*` keys into mobile `en.json`/`he.json` (new keys).
- Threshold value for "ignited day" once aligned with D-2026-06-14-01.

## 8. Out of scope

- Reworking the 8 insight templates / keyword→category detection (separate audit item; can follow).
- Multi-child comparison.

## 9. Effort

Medium. New hook (~1 file) + new screen (~1 file, RN port) + nav wiring + i18n keys. No schema change (reads existing `daily_progress`). Verify on Hat-3 (parent view, real family with a week of data).
