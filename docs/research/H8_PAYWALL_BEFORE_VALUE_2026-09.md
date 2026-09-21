# H8 — "Paywall-Before-Value" Investigation

**Study:** BUFF value-validation study — leading hypothesis after Interview 1 (Noa, family d111)
**Question (H8):** Does BUFF put a paywall in front of a FREE parent *before* they can experience
what makes BUFF different from a plain task manager — killing activation?
**Method:** Static code walkthrough (verified independently against the prior walkthrough) + live DB
cross-check via Supabase MCP (read-only). **No emulator/web** in this environment — no screenshots.
**Date:** 2026-09-21
**Branch:** `claude/zen-wright-z824s2`
**Author:** Claude Code (CC), for Adi's review. **This is a research document + a telemetry proposal.
NO app behaviour was changed. `BUFF_DECISIONS_LOG.md` was NOT edited.**

---

## Header inventory (Read-only Snapshot Protocol)

```
SNAPSHOT — 2026-09-21
Files read (code):
  - src/hooks/useSubscription.ts                     (221 lines, full)
  - src/screens/parent/ParentDashboardScreen.tsx     (insights block §660-790, gates §110/301-400/430-431)
  - src/screens/parent/ParentTasksScreen.tsx         (task gate §61/124-129)
  - src/screens/parent/ParentInsightsScreen.tsx      (self-guard §61/230-249)
  - src/screens/parent/ParentRewardsScreen.tsx       (grep: no gate)
  - src/screens/child/ChildRewardsScreen.tsx         (redeem flow §45/120-149)
  - src/hooks/useRewardRedemptions.ts                (reward_redemptions ledger)
  - src/hooks/useAutoCoachInsight.ts                 (taste gate §21-75)
  - supabase/functions/track-install-cta/index.ts    (telemetry pattern, full)
  - docs/BUFF_DECISIONS_LOG.md §D-2026-06-19-01, §D-2026-07-04-01
  - docs/research/walkthrough/FREE_PARENT_PAYWALLS_2026-09.md (prior CODE-only walkthrough)
DB cross-check: Supabase project gfrongfnyigxsexuofrg (read-only, SELECT only; no writes)
Files requested but NOT read: none material
Live app driven: NO — no adb/emulator/web in this environment
```

---

## 1. Gate inventory — verified from code (understanding vs scale)

The prior walkthrough (`walkthrough/FREE_PARENT_PAYWALLS_2026-09.md`) is **confirmed correct**. Only
**three** gates are enforced for a FREE Android parent; a fourth surface (the full Insights screen) is
the same wall reached one level deeper. Independent verification:

### Who is actually walled (the gate math — `useSubscription.ts`)
- `isSubscribed` (§123-130) ORs in `noIapPaywallHidden = Platform.OS==='ios' || 'web'` (§114). **On web/iOS
  every parent is treated subscribed → the child-limit/task walls never fire there.**
- `GRACE_PERIOD_END = 2026-05-01` (§31) is past → `isGracePeriod=false`.
- ⇒ **Only a fresh ANDROID parent with no real entitlement hits the hard walls.**
- `insightsUnlocked = hasRealEntitlement` (§149) — REAL entitlement only, so the **insights wall shows
  on web/iOS too**, but tapping it there routes to a "get the app" panel, not a purchase.

### The gates

| # | Surface | File:line | Trigger (verified) | What the parent sees | Class |
|---|---------|-----------|--------------------|----------------------|-------|
| 1 | **Insights card — no-data lock** | `ParentDashboardScreen.tsx:714-725` | `!insightsUnlocked && !smartInsight` AND (`!topInsight \|\| showLockedInsights`) — §679-680; `showLockedInsights = !insightsHaveData` §366 | Greyed `📊` card, "Unlock with Premium ✨". Tap → **Paywall** | **UNDERSTANDING (H8) — 0 taps** |
| 2 | **Insights card — taste teaser** | `ParentDashboardScreen.tsx:684-712` | same gate but `topInsight && !showLockedInsights` | Purple card showing ONE real insight (value-first), locked "coach"/Trends CTA → **Paywall** | **UNDERSTANDING (H8), softened — 0 taps** |
| 3 | **Full Insights screen** | `ParentInsightsScreen.tsx:230` (`if (!isSubscribed) return <lock>`); dashboard onPress → `navigate('Paywall')` §686/716/744 | reached by tapping card #1/#2 | Full Paywall, or the screen's own lock panel if reached directly | **UNDERSTANDING (H8) — 1 tap** |
| 4 | **7th task (per child)** | `ParentTasksScreen.tsx:127` | `!isSubscribed && tasks.length >= FREE_TASK_LIMIT(6)` | First 6 `+` open the task modal; the 7th opens **Paywall** | **SCALE — after 6× use** |
| 5 | **2nd child** | `ParentDashboardScreen.tsx:431` | `!isSubscribed && children.length >= 1` | Full Paywall (first child's name in subtitle) | **SCALE — multi-child only** |

**Taste gate (mitigation, verified):** `FREE_INSIGHTS_PER_CHILD = 1` (`useAutoCoachInsight.ts:24`);
`hasFreeTaste = totalCount < 1` (§75). The **first** AI insight per child is generated free for everyone;
the **next** is walled. So gate #1 (hard `📊`) is the brand-new / no-data state; once the family has one
real insight it becomes the softer teaser (#2) or a real coach card with the upsell moved to the *next*
insight.

### Correction / addition to the prior walkthrough
- **The reward value loop is NOT gated** — independently confirmed: `ParentRewardsScreen.tsx` and
  `ChildRewardsScreen.tsx` import no `useSubscription` and contain no Paywall navigation. Redeeming is a
  parent-approval request over the `reward_redemptions` ledger (`useRewardRedemptions.ts`), free on all
  tiers. This matches D-2026-06-19 ("BUFFs + חנות + מימוש" listed as free). **Good for H8: the core
  habit loop is reachable without paying.**
- **Spec drift re-confirmed:** D-2026-06-19-01 lists timetable(+AI), activities, bag-prep, off-routine as
  **paid**, but **none are gated in code** — reachable free today. Flagged, not resolved (Adi's call /
  possible Spec Sync). Material to H8: these are the *depth/understanding* surfaces; walling them later
  would push more friction in front of value, not less.

---

## 2. The value loop — where a FREE parent first hits a wall, and is "aha" reachable free?

**Intended loop:** create child → define/generate tasks → child completes → earns BUFFs → parent/child
define a real reward → child redeems (parent approves).

| Step | Free? | Wall? |
|------|:-----:|-------|
| Create 1st child | ✅ free | — (2nd child walled, gate #5) |
| Define up to 6 tasks/child | ✅ free | 7th task walled (gate #4) |
| Child completes → earns BUFFs | ✅ free | — |
| BUDDY reacts / skins / mini-game | ✅ free | — (the actual differentiator; free) |
| Define a real reward | ✅ free | — |
| Redeem (parent approves) | ✅ free | — |
| **Insights / AI coach ("why is my kid struggling")** | 1 free taste, then walled | **gate #1/#2/#3 — sits ON the dashboard at 0 taps** |

**Where the wall first appears:** not inside the habit loop at all — it appears on the **home screen**,
as the Insights card, which the parent sees **before** the loop has produced any data. For a brand-new
(no-data) android free parent that card is the **hard `📊` lock** (gate #1), literally the first premium
signal they meet.

**Is "aha" reachable free?** Two different "aha"s, and the answer differs:
- **Reward-loop "aha" (BUFF as a working habit engine):** *Structurally reachable free* — every step is
  ungated. **But the DB shows it almost never actually closes** (see §3: 1 of 37 reward-defining families
  ever redeemed). So the loop is free but rarely completed — the value is available but not *landing*.
- **Differentiation "aha" (BUDDY + emotional safety net = not a task manager):** BUDDY, skins, Vibe Check,
  Pause are all free, so this is *reachable* — yet Interview 1's parent did not perceive it ("didn't
  understand how BUFF differs from a plain task manager"). Free ≠ surfaced.
- **Insights/coaching "aha" ("why is my kid struggling, what do I do"):** **This is the one genuinely
  walled before value.** One free taste, then a paywall — and for a no-data new parent, a hard lock at
  0 taps with no taste at all.

**H8 verdict (evidence-grounded):** The literal "paywall-before-value" wall is **narrow** — it is the
**Insights card in the no-data state**, on the dashboard, at 0 taps. Interview 1's stronger complaint
("hit the paywall fast… no way to explore") is only *partly* a paywall problem: most of what would let a
parent explore/understand (loop + BUDDY) is already free but **not legible**, and the one before-value
wall is the first premium cue they meet. H8 is **supported but should be reframed**: the risk is less
"too many walls" and more "the first premium cue lands before any value is felt, and the free value that
exists is not made legible."

---

## 3. DB cross-check (read-only)

**Cohort:** real families created since 2026-06-01, excluding family names / display-names matching
`test|e2e|demo|dummy|qa` and any family with a parent `@buffadhd.com` email. **No writes were made.**

```
Real families (since 2026-06-01):                         50
  Platform:            web 26   |   android 21   |   null 3
  "Entitled" (lifetime/founding/premium_until grant):     23
  Android + NOT entitled (can hit a HARD paywall):        10   ← the true at-risk cohort
```

**Reward loop (the Interview-1 finding, quantified):**
```
Families that defined >= 1 reward (store_rewards):        37 of 50   (74%)
Families with any reward_redemptions row:                  1 of 50
Families with an APPROVED redemption:                      1  (8 approved rows, all one family)
⇒ Reward loop closed for ~1 of 37 reward-defining families (~3%).
   Redemption-status totals (all-time, whole table): approved 21 | withdrawn 29 | requested 1.
```
This **strongly corroborates Interview 1**: parents set up rewards, the task→BUFFs→reward→redeem loop
almost never closes. (This is a value-loop-completion problem, distinct from the paywall — but it is why
the free "aha" is not felt.)

**Scale walls (are they even being hit?):**
```
Families where a child reached 6 tasks:                    8
Families where a child exceeded 6 (>=7 → would wall):      5
  ...of those, android + not entitled (actually walled):   1
Families with 2+ children:                                 6
  ...android + not entitled (actually hit add-child wall): 1
Max tasks on one child: 19   |   Avg tasks per child: 5.9  (an entitled/web family)
```
⇒ The **scale walls are near-non-events** so far: ~1 family each actually hit them. This confirms they
are not the H8 problem.

> Caveat: "entitled" counts DB lifetime/founding/`premium_until` grants only (not web/iOS paywall-hiding,
> not expired grace). Platform is inferred from `families.platform` / `profiles.last_platform`; a family
> can appear on multiple platforms. Numbers are directional, not audited.

---

## 4. Options memo — letting a FREE parent feel value before the wall

Framed as **proposed amendments to D-2026-06-19-01** for Adi's decision. **CC does not decide this.**
All options are docs/decision-level; none is implemented here. Values pillars: **P1** Intrinsic
Motivation, **P2** Positive Coaching, **P3** Independence-Building.

### Option A — Soften the no-data Insights lock (smallest)
**Change:** In the no-data state (gate #1), replace the hard `📊` "Unlock with Premium" card with a
**value-explainer / "insight coming soon" card** (what BUFF's coaching will tell you once there's data),
and move the first Paywall exposure to *after* the free taste insight exists. Keep everything else.
**Effort:** Low (one JSX branch + copy). **Risk:** Low — no entitlement/loop change; pure framing. Slight
risk of a "coming soon" feeling empty. **Pillars:** P2 (coaching framed as help, not a locked product).
**H8 fit:** Removes the single before-value hard wall. Directly targets the identified problem.

### Option B — Value-first exploration window (medium)
**Change:** For the first N days (e.g. 7) OR until the first reward is redeemed, treat the family as
entitled for the *understanding* surfaces (insights taste is already 1; extend to a short window), while
keeping the **scale** walls (7th task, 2nd child) exactly as-is. A time/'milestone'-boxed unlock, not a
feature giveaway.
**Effort:** Medium (a new derived flag in `useSubscription`, mirroring `isGracePeriod`; server insight
gate must honour it too, or it diverges — see D-2026-07-04). **Risk:** Medium — AI cost exposure on the
free tier (insights cost money, per D-2026-06-19 rationale); needs a cap. **Pillars:** P2, P3.
**H8 fit:** Strong — guarantees the parent reaches an "aha" before any wall. Costs money and is the most
behaviour-change, so it is a real product decision, not a framing tweak.

### Option C — Reorder free-vs-paid so "understanding" is never gated; keep scale paid (recommended)
**Change:** Adopt the principle **"understanding is free; scale is paid."** Concretely: keep the loop +
BUDDY free (already), keep 7th-task / 2nd-child paid (already), and **move the *first, rule-based*
insight (the non-AI `topInsight`) fully free on every platform** — only the **AI coach depth** (LLM,
trends, weekly map, action levers) stays paid. This aligns code with the *spirit* of D-2026-06-19 ("free
= core + emotion") and resolves the drift: the cheap-to-serve rule insight becomes the free "aha", the
expensive AI stays the paid upgrade.
**Effort:** Low-Medium (change gate #1/#2 to show `topInsight` unlocked; AI stays on `insightsUnlocked`).
No new server cost — `topInsight` is rule-based, not LLM. **Risk:** Low-Medium — must confirm `topInsight`
never leaks a shaming %/failure count (Pillar 2); the card already routes AI depth to Paywall.
**Pillars:** P1, P2, P3. **H8 fit:** Strong and cost-safe — a real, self-owned insight about *their* child
is free, the wall moves to AI depth (genuine incremental value), and no free-tier AI bill.

### Option D — Do nothing to gates; fix loop legibility + add telemetry first (null option)
**Change:** Leave the paywall as-is; instead (a) ship the telemetry in §5 to *measure* H8 before acting,
and (b) treat the real finding (reward loop closes ~3%) as the priority. **Effort:** Low (telemetry only).
**Risk:** Low, but leaves the before-value wall in place for another cycle. **Pillars:** neutral.
**H8 fit:** Weakest on H8 itself, strongest on evidence discipline.

### Recommendation
**Option C**, sequenced behind **§5 telemetry (Option D's measurement half)**. Rationale:
- It is the **only option that both removes the before-value wall AND costs no free-tier AI spend** — it
  respects the exact D-2026-06-19 rationale ("תשלום = … מה שעולה לנו כסף (AI)") instead of contradicting
  it. A free *rule-based* insight is core+emotion; the AI coach is the paid upgrade.
- It converts the first premium cue from "you are locked out" into "here is a real insight about *your*
  child — the AI goes deeper for Premium," which is a qualified ask *after* value, the pattern the taste
  gate already endorses.
- It is small and reversible, and it fixes the spec drift on the insight surface in the values-aligned
  direction.
- **But the DB says the bigger activation lever is the reward loop closing (~3%), not the paywall.** So
  C should ship *with* ship §5 telemetry and a follow-up on loop completion — the paywall is the leading
  *hypothesis*, the loop is the leading *measured* gap. Both should be on the table; **Adi decides.**

---

## 5. Telemetry proposal — `paywall_viewed` event (spec only, NOT implemented)

To make H8 quantifiable, mirror the existing `track-install-cta` → `install_cta_events` pattern
(`supabase/functions/track-install-cta/index.ts`): a public, anonymous, fire-and-forget beacon writing
non-PII rows via the service role.

**New table `public.paywall_events`** (proposed — needs Adi's schema approval; not created):
| column | type | note |
|--------|------|------|
| `id` | uuid pk default gen_random_uuid() | |
| `event_type` | text | one of `view`, `dismiss`, `cta_tap`, `purchase_start` |
| `source` | text (<=32) | which gate: `insights_nodata`, `insights_taste`, `insights_screen`, `task_limit`, `add_child` |
| `platform` | text (<=16) | android / web / ios |
| `family_id` | uuid null | validated as uuid, else null |
| `user_id` | uuid null | validated as uuid, else null |
| `days_since_family_created` | int null | **the H8 signal** — how early in the lifecycle the wall is hit |
| `had_first_insight` | bool null | taste-gate state at view time |
| `rewards_defined` | int null | loop-progress context |
| `redemptions_count` | int null | loop-progress context |
| `created_at` | timestamptz default now() | |

**New edge function `track-paywall`** — a near-copy of `track-install-cta/index.ts`:
- `verify_jwt` disabled; CORS identical (`authorization, apikey, x-client-info, content-type`).
- Same bot-UA skip; strict allow-list validation of `event_type`/`source`; `asUuid` guards on ids;
  service-role insert; always responds `204` (never surfaces an error to the UX).
- **No PII:** never store email/IP; `user_agent` truncated to 300 chars as in the original.

**Client:** one fire-and-forget call at each `navigate('Paywall', …)` site (the 5 gates above) and on
Paywall mount/dismiss, computing `days_since_family_created` client-side. **No behaviour change** — pure
instrumentation, so H8 (and the reward-loop gap) become measurable across the funnel.

**What it answers:** distribution of `days_since_family_created` at first paywall view (H8's core claim:
is the wall hit *early*?), which `source` dominates, and paywall exposure vs. reward-loop progress.

> This is a **spec**. No table, function, or client code was created. Schema/edge changes require Adi's
> explicit approval per CLAUDE.md.

---

## Report summary (for the study)

- **Gate inventory:** 3 enforced gates + the deeper Insights screen. **Understanding (H8):** Insights
  card #1/#2 and the Insights screen #3. **Scale (not H8):** 7th task #4, 2nd child #5. Reward loop is
  ungated (free). Spec drift on timetable/activities/bag-prep/off-routine stands (listed paid, shipped
  free).
- **First wall in the loop:** the Insights card, on the dashboard at **0 taps**, *before* the loop
  produces data; hard `📊` lock for a no-data new parent, softened by a 1-insight taste otherwise.
- **"Aha" free?** Reward-loop and BUDDY "aha" are structurally free but not landing (loop closes ~3%);
  the insights/coaching "aha" is the one genuinely walled before value.
- **DB:** 50 real families; only **10** android-free can hit a hard wall. **37/50 defined a reward, 1
  ever redeemed (~3% of definers).** Scale walls actually hit by ~1 family each.
- **Recommendation:** **Option C** (understanding free / scale paid — free rule-based insight, AI depth
  paid), sequenced behind the **§5 telemetry**, and paired with a loop-completion follow-up. Proposed as
  an amendment to D-2026-06-19-01 — **Adi's decision, not CC's.**
- **No code shipped. `BUFF_DECISIONS_LOG.md` not edited.**

## UNVERIFIED CLAIMS
- Tap counts and on-screen text are read from JSX, not observed on device (no emulator/web).
- Whether a fresh free parent lands in no-data vs taste state on first open depends on onboarding-seeded
  data — inferred from `insightsHaveData`, not observed.
- DB platform/entitlement splits are directional (multi-platform families, grant-type nuance).
