# SPEC — Monetization Model Fix (gate on value, not child count)

> **Status:** PROPOSED — awaiting Adi's `approved, proceed`.
> **Created:** 2026-06-19. **Author:** CC (architect) + Adi (PM).
> **Origin:** Billing-launch session. Pricing model was never ratified (DECISIONS_LOG empty); deep research (2026-06-19, 25 sources) + founder concern converged on this fix.

---

## 1. Problem

BUFF's paywall gates premium on **number of children** (`useSubscription.ts:114` — `needsUpgrade = !isSubscribed && childCount >= 1`). Most families have **one child**, so the majority never hit a gate and use the app free forever → near-zero revenue. This is precisely the freemium **failure mode** RevenueCat names: "no clear upgrade path."

Two supporting code facts found this session:
- **The 5-task free limit is DEAD CONFIG.** `FREE_TASK_LIMIT = 5` is exported (`useSubscription.ts:31`) but **never enforced** — `addTask` (`useChildProgress.ts:433`) has no limit check. A free one-child family creates unlimited tasks today.
- **A "14-day free trial" CTA exists but no trial is wired** (`en.json:235`). The copy promises something the app doesn't deliver.

## 2. Decision (model)

Launch with **generous freemium + premium gated on value every family hits, not child count**, annual-forward. Backed by research: Finch ($30M ARR, closest comp) keeps the core habit loop free and gates peripheral value; hard paywalls would discard BUFF's weeks-to-value, habit-fragile users before the habit forms; annual retains ~2.6× monthly.

## 3. Free / Premium split — FINAL (locked 2026-06-19)

**FREE — core habit loop + emotional safety (let the habit form; never gate a struggling child):**
Tasks up to **6**/child · BUFFs + Shop + redemption · **Buddy (full) + skins** · BUFF Catch mini-game · Vibe Check · SOS/Low Power · Anchor Recovery · Pause Mode · notifications · child suggestions · Yesterday Recap.

**PAID (BUFF Premium) — scale + extras + anything with marginal cost:**
Tasks **7+** · children **2+** · **Parent Insights + Recommendations** · **Backpack/Bag-prep** · **Off-routine mode** · **Timetable + AI schedule import (parse-schedule)** · **Activities/camp-lists** · **Text/image task-capture** (future).

⛔ **Ethical line (non-negotiable):** SOS/Low Power, Anchor Recovery, Vibe Check, Pause stay FREE — gating a struggling child's safety net violates Pillar 2.

**Key lever:** the **task limit (6)** — every family hits it regardless of child count. Onboarding generates ~3–5 tasks, so there's headroom before the wall.

### Build status (branch `pkg/monetization-model`, typecheck-clean, NOT yet on-device verified)
- ✅ **Chunk 1:** task limit 6 enforced (`ParentTasksScreen`) + false "14-day free trial" copy → "Upgrade"/"שדרגו".
- ✅ **Chunk 2:** Buddy + skins **ungated → free** (`ChildDashboardScreen`, `ChildSettingsScreen`).
- ✅ **Chunk 3a:** Insights + Recommendations **gated** for non-subscribers (`ParentDashboardScreen`) + premium copy keys (`dashboard.insightsPremium*`).
- ⏳ **Chunk 3b — DO BEFORE LAUNCH, with Hat-3 verification (not blind):** gate **Timetable AI import** (`parse-schedule` invokes in `TimetableScreen` ~221/257 — protects margin; gate the *import action* only, NOT phase-labeling from existing data), **Backpack/Bag-prep**, **Off-routine enable**, **Activities**. Each = `!isSubscribed → navigate('Paywall')` at the entry point.

## 4. Pricing (set in Play Console / RevenueCat, not code)

- Monthly **$9.99**, Annual **$59.99** (≈50% off, foreground annual). Finch anchor: $9.99 / $69.99.
- **No free trial** — the free tier *is* "try before you buy." Fix the "14-day free trial" copy → "free" framing.
- **Founding 100** one-time lifetime ($99 first 50 / $149 next 50) — keep as a capped launch-only hero. Already built + inherits family-wide.

## 5. Scope (code changes)

1. **Enforce the task limit** — block creating a 6th active task per child when `!isSubscribed`; surface the paywall at that moment. (`useChildProgress.addTask` + Parent Tasks UI.)
2. **Demote child-count as the *primary* gate** — keep the 2nd-child gate, but it's no longer the only lever; the task gate carries single-child families.
3. **Keep premium feature gates** (insights, buddy depth, skins) — already wired.
4. **Fix trial copy** — `en.json`/`he.json` `dashboard.paywallCta` "Start 14-day free trial" → free-framing (e.g. "Unlock BUFF Premium" / "Upgrade"). Remove the trial promise everywhere it appears.
5. **Platform parity** — task-limit enforcement must hold on Android AND Web (logic in shared hook, not platform-split).

## 6. Values Check (per BUFF_VALUES.md) — FLAG for Adi

⚠️ Open question before build: **Does capping free at 5 tasks/child harm habit formation** (Pillar concerns)? Onboarding generates 3–5, so the core loop fits free — but a family needing 8 daily anchors (meds, homework, chores…) hits the wall. Confirm the 5-task line passes the 9 questions, or adjust the threshold, before coding.

## 7. Open questions (not answered by research — need Adi)

- **WTP:** will a one-child ADHD family actually pay $9.99/mo for unlimited tasks + insights + buddy depth? The structural fix is data-backed; the *conversion* is the remaining bet. Consider a soft launch + measure.
- **Premium definition:** is "unlimited tasks + insights + buddy" the most compelling bundle, or should insights/buddy be re-weighted?
- Exact threshold for the task gate (5? 6? 8?).

## 8. Out of scope

- Problem B (monthly/annual family-wide inheritance for own-device kids / co-parents) — separate fast-follow (see `project_subscription_family_scoping_gap`).
- iOS IAP (Phase 2).
- A/B testing infrastructure for price/threshold.
