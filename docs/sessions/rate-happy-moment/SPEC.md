# SPEC — Rate Prompt → Happy-Moment Trigger (`pkg/rate-happy-moment`)

> **Part of:** [growth-play-store master plan](../growth-play-store/PLAN.md) — initiative #3.
> **State:** DRAFT — awaiting Adi approval. **Written:** 2026-08-03 by CC.
> **Size:** small (one phase, one PR). Branch: `pkg/rate-happy-moment`.

---

## 1. Problem

The native in-app review card currently fires on **any** parent-dashboard mount that
passes a retention gate (≥7 days, ≥3 sessions, 90-day cooldown) — see
[RateNudge.tsx](../../../src/components/rate/RateNudge.tsx) `useRateNudgeRegistration`,
native effect. That means we ask on neutral and even **bad** days: a parent opening the
dashboard after a rough week gets the same ask as one who just saw their kid win.

Industry data: behavior-triggered timing converts ~1–5%; untimed prompts <0.3%.
BUFF has ~0 ratings — every prompt we waste on a bad-day parent is a conversion lost
and a 90-day cooldown burned.

## 2. Target behavior

Fire the review flow only when the parent is looking at **evidence of their kid's
success** — and never otherwise.

**Unified signal (both platforms):** `hasWinningYesterday` — at least one child whose
Yesterday Recap meets the canonical winning-day rule
(`totalCompleted >= min(3, totalScheduled)`, D-2026-06-14 — the same rule every other
surface uses).

**Split action (Parity rule):**
- **Android/iOS (native):** the existing auto-fire of `requestNativeReview()`, now
  gated on `retention gate AND hasWinningYesterday`.
- **Web:** the existing banner+sheet, its `eligible()` now also requires
  `hasWinningYesterday` (banner appears only on a winning morning-after).

Everything else (retention thresholds, 90-day local cooldown, 7-day global nudge
cooldown, install-beats-rate priority, `markRated` forever-stop) stays as is.

## 3. Design

### 3.1 Data flow
`ParentDashboardScreen` already builds `yesterdayRecaps` (per-child
`{totalScheduled, totalCompleted}`). Add a pure helper:

```
// src/lib/rateBuff/happyMoment.ts
hasWinningYesterday(recaps: Record<string, ChildYesterdayRecap>): boolean
// true if ANY child: totalScheduled > 0 && totalCompleted >= Math.min(3, totalScheduled)
```

### 3.2 Hook change
`useRateNudgeRegistration(onDismiss, { enabled, positiveMoment })`:
- **Native effect:** currently `[]`-dep, fires once on mount. Becomes dependent on
  `positiveMoment` — runs when it turns `true` (recaps load async), still guarded to
  invoke at most once per mount, and only when `enabled` (view-as-child stays excluded).
- **Web registration:** `eligible()` becomes `evaluateRateEligible() && positiveMomentRef.current`.
- `recordRateNudgeSeen` (first-seen + session count) keeps firing on every mount —
  the retention clock must not slow down just because yesterday wasn't a win.

### 3.3 Call-site change
`ParentDashboardScreen`: pass `positiveMoment: hasWinningYesterday(yesterdayRecaps)`.

### 3.4 Policy compliance (unchanged posture)
We choose **when** to invoke — allowed and encouraged by Google ("a positive moment in
the user journey"). We still never ask a sentiment question, never gate on "do you like
it", never CTA-button the native card. The OS still owns whether the card shows.

## 4. What does NOT change
- No schema, no new deps, no new strings (native card is OS-owned; web banner copy unchanged).
- Retention gate values, cooldowns, nudge priorities.
- `enabled: !isChildPreview` — a child (or view-as-child) never sees any rate surface.

## 5. Open decisions (Adi)
1. **Threshold** — Recommended: the canonical winning-day rule (option A). Fallback if
   prompts become too rare at our volume: any `totalCompleted >= 1` (option B). CC
   recommends **A**: "the parent is looking at a genuine win" is the whole point, and
   A needs no new definition of success.
2. **iOS** — remains deferred (base `getHighIntentCta` returns null; expo-store-review
   path exists). No change in this package.

## 6. Values Check (9 questions)

**Pillar 1 — Intrinsic Motivation**
1. *Would the child want this without virtual reward?* — Child never sees it; no reward
   mechanics touched. PASS.
2. *Does it move the child toward a self-chosen reward?* — Orthogonal; touches nothing
   in the reward loop. PASS.
3. *"I want" or "I must"?* — Parent-side, fires on pride ("my kid did it"), not
   obligation. PASS.

**Pillar 2 — Positive Coaching**
1. *Ever shaming/comparing/failure-framing?* — Strict improvement: today we may ask on a
   bad day; after this change we **only** ask beside evidence of success. PASS.
2. *Failure → empathy or pressure?* — On a non-winning day nothing appears at all. PASS.
3. *Any buddy/app suffering mechanic?* — None. PASS.

**Pillar 3 — Independence-Building**
1. *More capable without the app, or more dependent on it?* — No child-facing behavior
   change. PASS.
2. *Does the child have a voice?* — N/A (parent-only surface); child data is only the
   same recap already shown. PASS.
3. *Still necessary in 6 months?* — The gate + cooldowns mean it asks at most a few
   times ever per family. Self-limiting by design. PASS.

**Result: 9/9 PASS.**

## 7. Tests
- Unit: `hasWinningYesterday` — empty recaps / zero-scheduled child / 1-of-5 (A: false,
  would-be-B: true) / 3-of-5 true / 2-of-2 true (min rule).
- Unit: hook gating — native fire waits for `positiveMoment`, fires once, respects
  `enabled:false`; web `eligible()` false on non-winning day.
- Existing `rateEligibility.test.ts` untouched and green.
- Platform parity: `npm run web` + preview (banner logic), typecheck; Android via
  Hat-3 when emulator free.
- Values check row in TESTS.md.

## 8. Exit deliverables
- STATUS.md row (state, date, commit, tests, learnings link).
- INTEGRATION_LEARNINGS entry only if something surprises.
- No canonical-doc updates needed (behavioral tweak inside an existing shipped feature);
  flag to Adi if reviewer disagrees.
