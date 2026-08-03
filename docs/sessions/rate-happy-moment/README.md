# Session: Rate Prompt → Happy-Moment Trigger

> **Part of:** [growth-play-store master plan](../growth-play-store/PLAN.md) — initiative #3.
> **State:** ⚪ Queued (start after ASO #1 ships). **Created:** 2026-08-03. **Owner:** CC → Adi approves SPEC.

## Goal
Raise average star rating (→ better store conversion + indexed review keywords) by firing
the native in-app review card at a **genuine positive moment**, not on plain dashboard mount.

## Why (grounded — code + research)
Current behavior ([RateNudge.tsx](../../../src/components/rate/RateNudge.tsx),
[rateEligibility.ts](../../../src/lib/rateBuff/rateEligibility.ts)):
the native card fires on **any** parent-dashboard mount that passes a **retention** gate
(≥7 days, ≥3 sessions, 90-day cooldown). That's a time/session gate — **not** a real
activation/positive-moment gate.

Google's own guidance: fire the card when the user just experienced the app's core value.
Behavior-triggered timing converts ~**1–5%**; a generic prompt converts **<0.3%**. One dev
went 2.2→4.7 stars in ~2 weeks by fixing timing alone.

BUFF's happy moment = **child completed a task / hit a streak / parent saw a positive weekly
summary** — not "opened the dashboard 3×".

## Scope (proposed — SPEC to follow)
- Keep the existing retention gate; **move the `requestNativeReview()` invoke** so it fires
  right after a positive in-app event, within that gate.
- Fully compliant: we choose *when* to invoke, we do **not** sentiment-gate the card.
- Preserve `enabled: !isChildPreview` — a kid viewing as child must never see it.

## Disciplines
- **Engineering (CC):** small package; needs a positive-event hook point in the dashboard.
- **Values:** kids never see a rate prompt (Pillar) — verify view-as-child path stays clean.
- **Platform Parity:** Android native card + Web in-house banner/sheet both covered.
- **PM:** Adi approves the SPEC before code.

## Cost
~half-day CC + SPEC. Dependency: a defined positive-moment event in dashboard code.

## Measure
Play Console → Ratings & reviews: average stars + new-review rate after ship.

## Status log
| Date | State | Note |
|---|---|---|
| 2026-08-03 | Queued | Start after ASO #1; write SPEC first |

## Next action
After #1 ships: CC writes SPEC (positive-event hook + trigger move) → Adi approves → implement.
