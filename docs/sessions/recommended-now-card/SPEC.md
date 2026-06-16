# SPEC — Parent "Recommended Now" Card (Insights → Action Engine)

**Slug:** `recommended-now-card` · **Branch:** `pkg/recommended-now-card`
**Origin plan:** `~/.claude/plans/spec-typed-toucan.md` (approved by Adi 2026-06-16)

## Problem

The parent dashboard's Insights card is passive — it shows a completion stat and, when
a family lapses (no recent completions), falls back to a locked "unlock after 3 days"
state. Adi's directive: the insight should be **an action that brings the child back**,
chosen from the **toolbox of levers we already have**.

## Goal

Turn the passive insight into a single, one-tap **"Recommended now" card** backed by a
transparent recommendation engine that reads each child's state and surfaces the
highest-priority lever. Generalizes the existing Anchor Recovery prompt and moves it from
an interruptive full-screen modal to a calm dashboard card.

## Decisions (locked with Adi)

- Surface = a **card in the parent dashboard** (prime insight slot), non-blocking.
- v1 lever set = **existing-working levers only**: Send sticker, Add medication reminder,
  Bonus BUFFs. Live parent-triggered Vibe Check + freeform child nudge deferred to v2.
- v1 engine scope = **multi-state**: low-vibe, comeback (lapse), positive-streak celebration.
- Notification tap routing for `anchor_recovery` → parent dashboard (router fix).

## Behavior Contract — priority ladder (first match wins, ONE recommendation)

1. **Pause active** → no card (respect the break).
2. **Low vibe today** (`vibe_level ≤ 2` / `low_power_mode`) → "Send a warm sticker".
3. **Lapse** (unread `anchor_recovery` for the child) → comeback: no standalone med →
   "Set a medication reminder" (establish the anchor); has med → "Send a sticker" (reconnect).
4. **Positive streak** (`streak ≥ 3`, and no low insight) → "Send a sticker" (celebrate).
5. else → no card (legacy insight / locked card renders unchanged).

When no recommendation fires, the existing insight card is untouched — this layer is purely additive.

## Architecture

- `src/utils/recommendationEngine.ts` — pure `selectRecommendation(state)` (testable, mirrors
  pauseUtils/vibeUtils). 12 unit tests.
- `src/hooks/useParentRecommendations.ts` — gathers live signals (pause / vibe / streak) +
  dashboard-provided signals (lapse, standalone-med, topInsight).
- `src/components/parent/RecommendationCard.tsx` — calm card, single CTA, dismiss.
- `src/screens/parent/ParentDashboardScreen.tsx` — renders the card in the insight slot when
  a recommendation exists; maps `ctaType` → existing handlers (openSticker / setMedSheetTarget /
  openBonus); resolves the anchor prompt on comeback engagement; **retires the Anchor Recovery
  modal auto-show**.
- `src/lib/notificationRouter.ts` — `anchor_recovery` → parent dashboard.
- i18n: `recommendations.*` keys in en + he.

## Deviations from the plan (flagged per spec-drift policy)

1. **No 30-day lookback added to `useParentInsights`** — the `anchor_recovery` notification
   already encodes the lapse signal (5+ days), reused instead. Insight hook untouched.
2. **No true auto-shrink-to-anchor** — used the plan's documented fallback: comeback CTA =
   "Set a medication reminder" (establish the anchor) or sticker reconnect. True bulk-pause
   auto-shrink deferred to v2 (risky new mechanism).
3. **No Phase-4 vibe-check-task CTA** — deferred: semantics underspecified in anchor-recovery
   SPEC, and forcing a vibe prompt tensions with Pillar 3; low-vibe is covered by the sticker.

## Values Check

- Pillar 1 (Intrinsic): comeback centers a meaningful anchor; sticker is a body-double
  gesture, not a reward bribe. ✅
- Pillar 2 (Positive Coaching): neutral, forward-looking copy; no failure framing; calm card,
  accent only on the CTA. ✅
- Pillar 3 (Independence): one tap, dismissible; nothing forced on the kid. ✅

## Out of scope (v2)

Live parent-triggered Vibe Check prompt; freeform parent→child nudge; any push delivery
(FCM Hat-4, 0 device tokens); true auto-shrink-to-anchor.
