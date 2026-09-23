# BUFF — Why the reward loop doesn't close (2026-09)

> **Purpose:** explain why, across real families, children almost never redeem a reward — the finding that 37–38 of ~50 real families defined a reward but only **1** ever redeemed one (~3%). Trace the redeem flow in code, classify the cause against read-only DB evidence, and lay out a minimal options memo. Read-only investigation; no schema, monetization, or dependency changes; no app code shipped (see §6).
> **Author:** Claude Code · **Date:** 2026-09-23 · **Branch:** `claude/zen-wright-z824s2`

```
SNAPSHOT — 2026-09-23
Files read (code):
  - src/screens/child/ChildRewardsScreen.tsx        (413 lines, mint impl)
  - src/screens/child/GamerRewardsScreen.tsx         (668 lines, gamer impl)
  - src/screens/parent/ParentRewardsScreen.tsx       (837 lines)
  - src/hooks/useRewardRedemptions.ts                (253 lines)
  - src/hooks/useRewardLoopHealth.ts                 (102 lines)
  - src/utils/insightFraming.ts                      (174 lines)
  - src/screens/onboarding/unified/onboardingData.ts (§ reward calculators)
  - src/config/onboardingConfig.ts                   (14 lines)
  - src/navigation/ChildTabs.tsx                      (Rewards/"Shop" tab reg.)
DB read (Supabase gfrongfnyigxsexuofrg, read-only): families, profiles,
  credit_vault, store_rewards, reward_redemptions, daily_progress, tasks.
Files requested but not read: none.
Cohort: families.created_at >= 2026-06-01, family name & child display_name
  NOT matching /(test|e2e|demo|dummy|qa)/i, creator email NOT ilike %buffadhd.com.
```

---

## 1. The redeem flow, in plain terms

**Parent defines the reward** (`ParentRewardsScreen.tsx`) → row in `store_rewards`
(`child_id`, `title`, `credits_needed`, `size`, optional `cash_value`). Default
costs by size are `small: 100, medium: 300, large: 700` (ParentRewardsScreen
`DEFAULT_CREDITS`); onboarding-seeded rewards instead cost
`0.7 × dailyBuffs × REWARD_DAYS[size]` where `REWARD_DAYS = {small:3, medium:7,
large:14}` (`onboardingData.ts` `calcRewardCredits`, `onboardingConfig.ts`).

**Child earns BUFFs** by completing tasks. Default earn rate is
`DEFAULT_TASKS_COUNT × DEFAULT_BUFF_VALUE = 3 × 20 = 60 BUFFs/day`
(`onboardingConfig.ts`). Completions land in `daily_progress`; the wallet is
`credit_vault.total_balance`.

**Child opens the Rewards ("Shop") tab** (`ChildTabs.tsx` → `ChildRewards`, bag
icon; the tab is present and navigationally discoverable). The screen routes by
theme: `GamerRewardsScreen` (gamer) or `PastelChildRewards` (mint).

**Child redeems — but only once affordable:**
- **Gamer** (`GamerRewardsScreen.tsx` L361–377): an affordable card shows a lime
  **REDEEM** button; an unaffordable card shows a progress bar + "X to go" and
  **no redeem affordance at all**.
- **Mint** (`ChildRewardsScreen.tsx` L313–328, `handleClaim` L154–172): the claim
  button is always rendered, but tapping it while unaffordable is a **silent
  no-op** (`if (totalBalance < reward.credits_needed) return;`).

Tapping redeem inserts a `reward_redemptions` row with status `requested`
(`useRewardRedemptions.request`). **No BUFFs are deducted yet.**

**Parent approves** (`ParentRewardsScreen.tsx` L294–316): "Yes, let's do it" calls
the `approve_reward_redemption` SECURITY DEFINER RPC, which locks the vault row
and deducts atomically → status `approved`. "Let's talk about it" → `discussing`
(a reset, not a decline; child taps "Got it" → `discussed`, re-requestable). There
is **no decline** path by design (`useRewardRedemptions.ts` header; BUFF_VALUES
Pillar 2).

**Is the redeem step discoverable?** *Once the child can afford a reward,* yes —
the Rewards tab exists, and the REDEEM/claim button is clear. *Before affordability,
no* — the redeem affordance is hidden (gamer) or inert (mint), and nothing in-app
teaches a child that BUFFs convert to a real reward they picked. A child who never
crosses the price threshold never sees a working redeem button. This is the
mechanism behind Noa's account (below).

---

## 2. DB evidence (read-only; queries run 2026-09-23)

**Cohort:** 51 real families (post-filter). Of these, **38 defined ≥1 reward.**

### 2.1 Redemption is essentially absent — and not a parent-approval bottleneck

| Metric (real families) | Value |
|---|---|
| Real families total | 51 |
| Families with ≥1 reward defined | 38 |
| Families with **any** `reward_redemptions` row (any status) | **1** |
| Families with an **approved** redemption | **1** |

`reward_redemptions` rows across the whole real-family cohort: **8 approved, 1
requested, 1 withdrawn** — *all 10 rows belong to the single redeeming family*
(two sibling children). Every other reward-defining family has **zero** redemption
rows: children are not requesting and being turned down — they are **not tapping
redeem at all.**

*(For contrast, the whole table incl. test/buffadhd families is 21 approved / 29
withdrawn / 1 requested = 51 rows — i.e. most redemption activity is internal test
data, not real families.)*

### 2.2 The loop breaks upstream: children never earn enough to reach the button

Per child, across the 44 children in the 38 reward-defining families. "Lifetime
earned" = Σ `tasks.credits` over `daily_progress` where `completed=true AND
revoked_at IS NULL` (a true peak, independent of any deduction):

| Metric | Value |
|---|---|
| Children with a reward defined | 44 |
| **Never completed a single task** (zero earning) | **30 (68%)** |
| Completed ≥1 task ever | 14 (32%) |
| Active ≥3 distinct days ever | 4 (9%) |
| **Never earned enough for their cheapest reward** | **40 (91%)** |
| Earned enough at least once | 4 (9%) |
| Median lifetime earned | **0** |
| Avg lifetime earned | 232 |
| Median cheapest-reward cost | 126 |
| Avg cheapest-reward cost | 185 |

All 44 child profiles have `last_seen_at` set (the app was opened for every one),
yet 68% never completed a task — opening ≠ earning.

### 2.3 The 4 children who did earn enough

| Lifetime earned | Cheapest cost | Redemption rows | Approved |
|---|---|---|---|
| 5345 | 100 | 6 | 5 |
| 2950 | 100 | 4 | 3 |
| 1020 | 126 | **0** | **0** |
| 106 | 100 | **0** | **0** |

Two are the sibling pair in the one redeeming family. **Two earned enough but
never redeemed** — the pure discoverability/UX cases.

### 2.4 Rewards are priced days-away, not weeks-away

Cheapest-reward cost per child vs the ~60 BUFFs/day default earn rate:

| ≤1 day (≤60) | 1–3 days (61–180) | 3–7 days (181–420) | >1 week (>420) | min | max |
|---|---|---|---|---|---|
| 1 | 26 | 17 | 0 | 50 | 294 |

No child's cheapest reward is more than ~5 days of earning away. The reward is
**not** aspirational/long-term by construction — it is reachable in a few days of
task completion that almost never happens.

---

## 3. Cause classification

Honest read: **several causes, but the redeem step is not the primary one — the
loop breaks upstream of it.**

- **(a) Discoverability — SECONDARY / contributing.** Navigationally the Rewards
  tab exists and the redeem button is clear once affordable. But the redeem/cash-out
  concept is invisible before affordability (hidden in gamer, inert in mint), and
  2 of the 4 children who *could* afford a reward still never redeemed. Nothing
  teaches a child "complete tasks → earn BUFFs → get the real reward you chose."
- **(b) Affordability / pacing — TRUE, but not because rewards are overpriced.**
  91% never earned enough to reach the button (§2.2), yet pricing is days-away
  (§2.4). The gap is *earning*, not *pricing*.
- **(c) Bug — NO clear bug found.** The `approve_reward_redemption` RPC works (8
  successful approvals), the child insert is permitted by RLS (the one family's
  requests/withdrawals succeeded), and the redeem button renders and functions when
  affordable. The "silent no-op on unaffordable tap" (mint) is documented,
  deliberate anti-friction behaviour, not a defect.
- **(d) Short lifespan / churn — MAJOR contributor.** Only 4/44 children reached 3
  active days; median completions 0. Families churn before the loop can close.
  Consistent with `VALUE_VALIDATION_2026-09.md` (§ "zero strangers have reached 3
  active days").
- **(e) Aspirational / long-term by design — NO.** §2.4 rules this out; rewards are
  reachable in a few days.

**Dominant cause:** an upstream **task-completion / earning collapse**. Children
open the app but 68% never complete a task, so they never earn, never reach the
redeem threshold, and the ~3% redemption rate is a *symptom*. This is itself
downstream of the paywall-before-value abandonment already logged as **H8**
(`H8_PAYWALL_BEFORE_VALUE_2026-09.md`, `VALUE_VALIDATION_2026-09.md`): the parent
often never finishes setup or never gets the child earning.

**Interview cross-check (verbatim, `INTERVIEW_LOG_2026-09.md` row d111 / Noa):**
> "לא הבנתי מה שונה מניהול משימות, התמריצים לא היו ברורים"
> ("I didn't understand what's different from task management; the incentives
> weren't clear.")

Her family is also the archetype of the loop never starting: they defined rewards,
the son "tried two days and said 'enough, it doesn't work'," and 0 redemptions
resulted — the earning side never got going.

**Relation to the caller's framing** ("biggest activation gap, bigger than the
paywall"): the DB supports that redemption ~never closes, but the numbers locate the
break *upstream of redemption* (earning/first-task), and that upstream break is
largely the paywall/exploration abandonment (H8). Redemption UX and the earning/
paywall problem are not independent — they are the same funnel seen at different
depths. Presented as data for Adi; not resolved here.

---

## 4. What already exists (and why it barely fires)

`useRewardLoopHealth.ts` + `insightFraming.ts` already implement a parent-side
"reward-loop health" nudge (Layer C0): `C0a` no rewards, `C0b` earning-but-not-
redeeming, `C0c` hoarding. But `C0b`/`C0c` only fire when the child *is active
recently* **and** *can already afford* the cheapest reward (`insightFraming.ts`
L133–145). Given §2.2 (91% never afford; median 0 completions), this nudge's real
audience is ~4 children — it is effectively dormant. `C0a` (no rewards) is the only
branch with reach, and it is not the problem here (38/51 families *have* rewards).

---

## 5. Minimal options memo (propose — do not build under the freeze)

Ordered smallest-blast-radius first. None shipped; each needs Adi's approval and a
Values Check at design time.

1. **Teach the finish line before affordability (discoverability).** On locked
   reward cards, and/or a one-time first-open explainer, make explicit that
   completing tasks earns BUFFs that redeem for *this* real reward. Smallest lever
   for the (a) gap. *Scope:* child Rewards screens + copy → **feature, propose.**

2. **Seed one "first-win" reward (~1 day / ~50–60 BUFFs) at onboarding.** Guarantee
   a redeemable reward is reachable after ~one good day so the first loop closes
   fast. Directly targets (b)/(d). *Scope:* onboarding seeding + economy → **propose
   (touches onboarding data; monetization-adjacent → Adi).**

3. **Fix the upstream earning collapse (the real lever).** The redeem button is not
   the bottleneck; first-task completion is. Pursue via the H8 paywall-before-value
   work and a first-task nudge rather than any redeem-screen change. *Scope:* larger
   product work, cross-referenced to `H8_PAYWALL_BEFORE_VALUE_2026-09.md` → **propose.**

4. **Widen the dormant C0 nudge (parent side).** Consider a pre-affordability
   variant ("your child is earning toward X — Y to go") so the loop-health insight
   reaches the 40 who never afford. *Scope:* `insightFraming.ts` thresholds →
   **propose (behaviour change, needs design + Values Check).**

---

## 6. Fix decision

**No app code shipped.** There is no clear, small, safe *bug* in the redeem flow to
fix: the RPC and the redeem button work, RLS permits the child insert, and the
affordability gating is deliberate. The dominant cause (upstream earning/activation)
exceeds "small safe bug" and falls under the development freeze, so it is proposed
(§5), not built — per CLAUDE.md ("No architecture beyond scope"; propose, don't
build under freeze).

**Confirmed:** no schema changes, no monetization changes, no dependency changes,
no writes to the database (all queries read-only).

---

## 7. Reproducible queries

Cohort CTE reused by every query:

```sql
with real_families as (
  select f.id from families f
  left join auth.users u on u.id = f.created_by
  where f.created_at >= '2026-06-01'
    and coalesce(f.name,'')      !~* '(test|e2e|demo|dummy|qa)'
    and coalesce(u.email,'') not ilike '%buffadhd.com'
    and not exists (select 1 from profiles p2
                    where p2.family_id = f.id
                      and p2.display_name ~* '(test|e2e|demo|dummy|qa)')
)
```

Per-child earning vs cheapest reward:

```sql
-- child_rewards: min(credits_needed) where is_redeemed=false, grouped by child_id
-- earned: sum(tasks.credits) over daily_progress completed=true and revoked_at is null
-- classify: lifetime_earned >= cheapest_cost  ->  earned enough (didn't redeem)
--           lifetime_earned <  cheapest_cost  ->  never earned enough
```

(Full statements are in the session transcript; each is read-only `SELECT`.)
