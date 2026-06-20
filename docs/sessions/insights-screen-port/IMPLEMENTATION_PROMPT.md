# Implementation prompt — Parent Insights screen (paste into a fresh CC session)

Build the new **Parent Insights screen** for BUFF (React Native / Expo, `C:\Users\adiel\buff-mobile`). This is part of the monetization package — Insights is a **paid (BUFF Premium)** feature, and today it's just a single thin dashboard card. We're replacing it with a rich, data-real screen so the paid gate is earned.

## Read these FIRST (they are the spec — follow them)
1. `docs/sessions/insights-screen-port/DESIGN.md` — the authoritative design: principles, the case→response **matrix** (Layers A / B / C0 / C / D), our vocabulary, and the recommended build.
2. `docs/sessions/insights-screen-port/SPEC.md` — scope, data plan, gating, the critical fixes vs the Lovable source.
3. `CLAUDE.md` + `docs/WORKFLOW.md` + `docs/BUFF_VALUES.md` — start in **Plan Mode**, ship chunk-by-chunk (diff → approval), run the Values Check.
4. **Reference to ADAPT, not copy:** `C:\Users\adiel\buff-lovable-ref\src\components\ParentIgnitionInsights.tsx` (Lovable web). It's the visual inspiration only — re-implement for our model.

## What to build (chunks — diff + approval between each)
1. **`useWeeklyStats(childId)`** — over `daily_progress` (the table `useParentInsights` already queries). Return: per-day state for **last 7 + prior 7 days** (date, dayName, tasksCompleted, tasksTotal), `activeDays` count, `dailyMap[]`, and a **real** `weekOverWeek` (or `null`).
2. **`selectInsightFraming(state)`** — a PURE function (test it like `src/utils/recommendationEngine.ts`). Returns the Layer-B case (B1–B5) + the single tip, **checking Layer C0 (reward loop) FIRST, then C1–C5**. Inputs: active-days, phase data, reward-loop signals, today's vibe/lapse.
3. **`ParentInsightsScreen`** (RN) — renders the layers per DESIGN §4 (A gesture if low-vibe/lapse → B weekly card → D highlights → C0/C one tip → D weekly map → reinforcement + CTA). Premium-gated. Add to the parent navigator + `RootStackParamList`.
4. **Wire the entry:** the dashboard insight card is ALREADY premium-gated (free → Paywall). For a **subscriber**, tapping it should now `navigate('ParentInsights')`. (See `src/screens/parent/ParentDashboardScreen.tsx` ~line 419, the `!isSubscribed ? … : …` block from the monetization package.)
5. **i18n:** add new `insights.weekly.*` keys to `src/i18n/en.json` + `he.json`; reuse existing `insights.<tip>.*`.

## Non-negotiable constraints
- ⛔ **NO fabricated data.** Lovable fakes week-over-week with `Math.random()` (its line ~52). Use **real** prior-week data; if unavailable (new family) **hide the WoW badge** — never invent it. This is the whole point (paid feature trust).
- **Our vocabulary** — drop Lovable's "ignition / ignited / charging". A good day = **"יום פעיל" (active day)**; an off-day = **"יום מנוחה" (rest day)**.
- **Active day = success-by-COUNT**, aligned with the buddy EOD: `completed ≥ LEAST(3, assigned)` (see DECISIONS_LOG D-2026-06-14-01). Import/share one definition; do not re-hardcode a % .
- **Reward loop is top coaching priority (Layer C0).** Detect earning-without-redeeming (rewards table + `useRewardRedemptions` + balance vs cheapest reward) and nudge a small periodic redemption — it's the #1 churn driver ("always close to a win"). C0 wins the single tip slot over C1–C5.
- **Trigger targeted tips by `tasks.category` / `strategy_id`, NOT title keyword** (the current keyword matching is fragile + misses non-English/odd titles).
- **Every Layer-B message carries a CTA** wired to an existing lever: B1→send bonus, B2/B3→send sticker, B4→set tomorrow's anchor; C0→open rewards/redeem.
- **Pillars / tone:** warm, forward, effort-over-outcome; NEVER "failed/behind/dropped"; anti-overload (one screen, ≤1 tip); reuse `recommendationEngine` for the wellbeing gate (Layer A) — don't duplicate it.
- **Platform parity:** must work on Android (native) AND Web (Expo Web) — keep logic in shared hooks/selectors, not platform-split.
- **No schema change** (reads existing `daily_progress`, rewards, redemptions).

## Verify before "done"
- Typecheck clean (`npx tsc --noEmit`).
- Unit-test `selectInsightFraming` across B1–B5 + C0a–C0d + C1–C5.
- **Hat-3 (emulator, parent view, a demo family with ~a week of data):** confirm each weekly case (strong/building/growing/quiet/new) renders the right message + CTA, highlights show, the weekly map is correct, the reward-loop nudge fires when earning-without-redeeming, and a non-subscriber hits the Paywall (subscriber lands on the screen). Web preview can't reach this auth-gated parent screen — use the emulator.

## Branch
Continue on `pkg/monetization-model` (where the gating work lives) or branch `pkg/insights-screen` off it — your call. Don't push to main; don't commit unrelated pre-existing working-tree changes.

## Open product items to confirm with Adi during the build
- Final en/he strings for the new terms + the 5 weekly messages.
- Exact thresholds (active-day bar, reward-loop windows) — tune on real data.
