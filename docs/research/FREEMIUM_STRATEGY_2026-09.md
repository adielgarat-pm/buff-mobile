# BUFF — Freemium v2 strategy (September 2026)

> **Ask (Adi, 2026-09-23):** make BUFF free now, with a paywall that meets the parent late; more children without a paywall; BUDDY not paywalled; AI areas behind a paywall after the family has tried them. Can we market it as free? Is this right for this stage? Research successful apps and recommend clearly.
> **Status:** RECOMMENDATION + DRAFT decision (`DRAFT_DECISION_freemium_v2.md`). Nothing changed in code or in `BUFF_DECISIONS_LOG.md`. Supersedes parts of D-2026-06-19-01 only if Adi approves.

---

## 1. Short answer

**Yes, freemium with a late paywall is the right model for this stage — with one addition that makes or breaks it: a "reverse trial" on the AI features.**

- It is right because BUFF's bottleneck is **activation, not conversion**. 68% of children never complete a first task (see `VALUE_VALIDATION_2026-09.md` §8); zero families pay today. A paywall anywhere before the first win removes users without producing revenue.
- It costs short-term revenue. Hard paywalls earn ~8x more per install than freemium (RevenueCat 2026). That is the price of reach and learning, and it is the right price while there are ~50 new families a quarter.
- **Paywalling only the AI is not enough on its own.** AI is used by 1 family in 51 today. Locking a feature nobody sees produces no revenue. Every new family must *experience* the AI first — which is exactly what a reverse trial does, and what the app can already do cheaply (`premium_until` exists and the AI server gates already honour it).

## 2. What the data says (BUFF, real families since 2026-06-01)

| Metric | Value |
|---|---|
| Families | 51 |
| Paying parents | 0 |
| Families that used the AI coach | 1 |
| Families that used AI capture (photo/text → tasks) | 0 |
| Families that used AI timetable import | 0 |
| Families with a BUDDY | 37 |
| Families with ≥2 children | 6 |
| Children with >6 tasks (hit the current free cap) | 6 |

Reading: the AI is effectively invisible, not rejected. The 2nd-child gate and the 6-task cap touch only the few families who are already engaged — the ones you most want to keep.

## 3. What successful comparables do

| App | Category | Model | Free | Paid | Notes |
|---|---|---|---|---|---|
| [Finch](https://finchcare.com/about-finch) | self-care pet | freemium | all core self-care, pet, goals, journaling | cosmetics, extra content ($9.99/mo, $69.99/yr) | ~$1M/month revenue on ~600k downloads/month ([Oct 2024 estimate](https://finch.fandom.com/wiki/Finch_Plus)); closest comp to BUDDY |
| [Tiimo](https://lifestack.ai/blog/tiimo-pricing) | ADHD planner | freemium + 7-day trial | basic planner, limited AI, 1 profile | unlimited AI, web, sync, family (5 profiles) — $7.99/mo, $79.99/yr | Apple iPhone App of the Year 2025; [went freemium deliberately](https://www.tiimoapp.com/resource-hub/why-tiimo-went-freemium) so ADHD users can try before paying. **AI is the paid line — same as Adi's instinct.** |
| [Joon](https://www.choosingtherapy.com/joon-app-review/) | ADHD kids chores | free tier + 7-day trial, paywall after onboarding | capped (7 quests/day) | $12.99/mo, $89.99/yr | Aggressive; paywall straight after the onboarding quiz |
| [Duolingo](https://www.businessofapps.com/data/duolingo-statistics/) | learning | freemium | everything core | ad-free, extras, AI (Max) | ~9% of MAU pay; typical freemium is 2–4% |

**Benchmarks** ([RevenueCat 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)):
- Freemium median conversion to paid by Day 35: **2.1%**. Hard paywall: **10.7%**.
- Revenue per install at Day 60: **$0.38** freemium vs **$3.09** hard paywall.
- One-year retention of annual subscribers: **28% vs 27%** — the same. Freemium does not produce worse subscribers, just fewer.
- ~50% of conversions happen on Day 0 in hard-paywall apps — not applicable when the value arrives in week 1–2, as in BUFF.

**Reverse trial** ([Elena Verna / Amplitude](https://amplitude.com/blog/reverse-trial)): new users get full Premium for a period, then drop to the free tier if they don't pay. Reported lift of **10–40%** over plain freemium; works best when the period is long enough to adopt the premium feature (14–21 days) and the downgrade is announced in advance.

## 4. The recommended model

### FREE, forever (the whole habit loop + everything a child touches)
- Tasks (no cap — see §6 for the trigger to revisit)
- **Unlimited children** (removes the 2nd-child gate)
- **BUDDY + skins** (already free)
- BUFFs, rewards shop, redemption
- Vibe Check, SOS / Low Power, Anchor Recovery, Pause Mode (never gated — Pillar 2)
- Notifications, Yesterday Recap, child suggestions
- Manual timetable, activities, bag prep, off-routine (currently free in code anyway — this ratifies the code and closes the D-2026-06-19 spec drift)

### PREMIUM — "BUFF Coach" (the AI + the parent's power tools)
- AI coach: smart insights, weekly parent report, recommendations (`generate-child-insights`)
- AI capture: photo/text → tasks (`parse-capture`)
- AI timetable import (`parse-schedule`)
- Price unchanged: **$9.99/month, $59.99/year** (annual foregrounded). Founding-100 lifetime can stay as an optional one-off.

### The reverse trial (the piece that makes AI revenue possible)
> Design review (2026-09-23) found the trial already exists: `migrations/037_trial_clock_and_activation.sql` starts a 14-day `premium_until` on the family's 2nd completion day. v2 is a one-line threshold change (first real completion, skipping the onboarding seed row `source='onboarding_first_task'`) — still a function change, so it needs Adi's approval as schema.
- **Every new family gets 14 days of BUFF Coach free, starting when their child completes the first task** — not at signup. Our data says most families don't reach the first task on day 1; a trial that starts at signup would expire unused, and the AI coach needs a few days of completions before it has anything to say.
- Day 10: a gentle in-app note to the parent: "Your coach trial ends in 4 days — here's what it found so far."
- Day 14: the family drops to free. They keep everything they had, lose only the AI. One free AI insight per week stays as a taste (the existing taste gate).
- Implementation is cheap: set `profiles.premium_until = first_completion + 14 days`. `useSubscription` already derives `isTrialActive` / `trialDaysLeft` from it, and the AI server gates already honour `premium_until`. **No schema change.**

### Where the paywall is allowed to appear
- **Never** during onboarding. **Never** to a child (already enforced, `PaywallChildGate`).
- Only when a parent taps an AI action after the trial, and once, softly, when the trial ends.

## 5. Marketing: can we say "free"?

**Yes — "free" is a legitimate, strong claim, because the free tier is complete and permanent.**
- Stores label the app "Free · In-app purchases" automatically; that is the standard for Finch, Tiimo, Duolingo.
- [Google Ads](https://support.google.com/adspolicy/answer/6258274?hl=en) prohibits "free" only when payment is required to install or use the app — not our case. It requires fees and auto-renewals to be disclosed when you advertise them, and a free trial can't be advertised without its length and the auto-charge.
- [Meta](https://transparency.meta.com/policies/ad-standards/content-specific-restrictions/subscription-services) requires price and recurring-billing disclosure when an ad promotes the subscription itself.
- Safe copy: **"Free for your whole family. Optional AI coach."** / **"חינם לכל המשפחה. מאמן AI לבחירה."**
- Avoid: "100% free", "free forever" for everything, and any "free trial" wording in ads without terms.
- Kids-app rules: purchases stay behind the parent, never offered to a child ([Google Play Families policy](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)). BUFF already does this.

**Why it helps acquisition now:** skeptical "tried everything" parents (persona P3) and post-diagnosis parents (P2) are price-sensitive and wary of another subscription. "Free, no card" removes the first objection and makes word-of-mouth easier ("it's free, just try it").

## 6. Honest risks and how to watch them

1. **Revenue will stay small until activation is fixed.** At ~15 new families a month and ~20% activation, 2–5% conversion is 0–1 paying family a month. Freemium is a bet on volume; the lever is the first-win work, not the paywall.
2. **The whole revenue line depends on the AI.** If, 60 days after launch, fewer than 1% of families that finish the trial pay, the paid tier is too thin. Pre-agreed response: reintroduce one scale lever that only engaged families meet (e.g. a family plan with co-parent + history, or a high task cap) rather than adding friction early.
3. **AI cost on the free tier.** A 14-day trial for every activated family costs tokens. The existing rate limits (3 insights/child/week, daily schedule-parse cap, free capture runs) bound it. At current volume the cost is negligible; recheck monthly.
4. **Web and iOS can't sell today** (`noIapPaywallHidden`). Correction (2026-09-23, from the design review): since 2026-07-29 the AI gate is the same on every platform in code (`useSubscription.ts` `hasRealEntitlement`, server `generate-child-insights`), superseding D-2026-07-04. So the trial and the weekly taste apply on web too; a web parent who wants BUFF Coach after the trial is routed to the Play Store. Code is ground truth; D-2026-07-04 vs code is flagged for Adi's DECISIONS_LOG.

## 7. What changes in the app (for a later build package, not now)

| Change | Where | Effort |
|---|---|---|
| Remove the 2nd-child paywall | `ParentDashboardScreen.tsx` `handleAddChild` (~l.431) | Small |
| Remove the free task cap (or raise it) | `useSubscription.ts` `FREE_TASK_LIMIT`, `ParentTasksScreen.tsx` (~l.127) | Small |
| Reverse trial: set `premium_until` at first completed task | server trigger or RPC on first `daily_progress` completion | Small–medium, no schema |
| Trial-ending note + soft downgrade message (no shame) | parent dashboard | Small |
| Paywall copy: "BUFF Coach" framing, annual first | `PaywallScreen.tsx`, `en.json`/`he.json` | Small |
| Telemetry: `trial_started`, `trial_ended`, `paywall_viewed` | mirror `track-install-cta` | Medium (needs a table → schema approval) |
| Store listing + ad copy | Play Console, marketing docs | Adi |

## 8. Values Check

- **Pillar 1 (Intrinsic Motivation):** the child's loop (tasks, BUFFs, rewards, BUDDY) is entirely free; money never touches what the child sees. Pass.
- **Pillar 2 (Positive Coaching):** the safety net stays free; the downgrade message must not frame loss ("you lost your coach") — copy guard required. Pass with the guard.
- **Pillar 3 (Independence):** the AI coach helps the parent scaffold and fade; nothing about the child's independence is paywalled. Pass.

## 9. Sources
- RevenueCat, [State of Subscription Apps 2026 — trends & benchmarks](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026); [Hard paywall vs freemium](https://www.revenuecat.com/blog/growth/hard-paywall-vs-freemium)
- Elena Verna, [Reverse trials](https://amplitude.com/blog/reverse-trial); [Reverse trial examples](https://www.elenaverna.com/p/reverse-trials-examples)
- Finch: [About Finch](https://finchcare.com/about-finch), [Finch Plus](https://finch.fandom.com/wiki/Finch_Plus)
- Tiimo: [Pricing](https://lifestack.ai/blog/tiimo-pricing), [Why Tiimo went freemium](https://www.tiimoapp.com/resource-hub/why-tiimo-went-freemium), [App of the Year breakdown](https://www.retention.blog/p/app-of-the-year-tiimo)
- Joon: [Review & pricing](https://www.choosingtherapy.com/joon-app-review/)
- Duolingo: [Business of Apps statistics](https://www.businessofapps.com/data/duolingo-statistics/)
- Paywall timing: [Airbridge](https://www.airbridge.io/en/blog/paywall-conversion-structural-decisions), [Setgreet](https://www.setgreet.com/blog/onboarding-paywall-placement)
- Ad policy: [Google Ads app requirements](https://support.google.com/adspolicy/answer/6258274?hl=en), [Meta subscription services](https://transparency.meta.com/policies/ad-standards/content-specific-restrictions/subscription-services), [Google Play Families](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
