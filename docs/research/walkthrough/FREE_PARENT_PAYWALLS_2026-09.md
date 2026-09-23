# FREE-Tier Parent — Paywall / Locked-Surface Walkthrough (Android)

**Study:** H8 "paywall-before-value" value-validation
**Method:** CODE-ONLY static walkthrough (see "Method & limitations")
**Date:** 2026-09-17
**Branch:** `claude/zen-wright-z824s2`

---

## Header inventory (Read-only Snapshot Protocol)

```
SNAPSHOT — 2026-09-17
Files read (full):
  - src/hooks/useSubscription.ts               (221 lines)
  - src/screens/parent/ParentDashboardScreen.tsx (1473 lines)
  - src/screens/parent/ParentTasksScreen.tsx    (631 lines)
  - src/screens/PaywallScreen.tsx               (~430 lines)
Files read (partial / targeted):
  - src/screens/parent/ParentInsightsScreen.tsx (gate block §230-250)
  - src/screens/parent/ParentSettingsScreen.tsx (subscription row §160-180)
  - src/components/parent/ParentActivitiesEntry.tsx (full)
  - src/navigation/ParentTabs.tsx, RootNavigator.tsx, types.ts (screen registration)
  - docs/BUFF_DECISIONS_LOG.md §D-2026-06-19-01
Files requested but NOT read: none material to gate inventory
Live app driven: NO — no Android tooling in this environment (see below)
```

## Method & limitations

- **This is a CODE-ONLY walkthrough.** The environment has **no `adb`, no `emulator` binary, and no
  attached device** (`metro_status` → `Emulator: NOT connected`; `adb`/`emulator` → command not found).
  The buff-emulator lease was **FREE, not BUSY** — the blocker is that there is nothing to drive, not
  another session. No lease was acquired, so none was released. **No screenshots were captured.**
- Every gate below is anchored to code. "What the parent sees" is read from the JSX branch that renders
  on the trigger, not observed on device. **Recommend Adi (or a device session) re-run steps live to
  attach screenshots** — the taps-from-dashboard counts should be verified against the live tab bar.

## Who is a "FREE-tier parent" on Android (the gate math)

From `useSubscription.ts`:
- `isSubscribed` (§123-130) is the OR of: lifetime, family entitlement, referral-premium, **grace period**,
  RC subscribed/founding, and **`noIapPaywallHidden`**.
- `noIapPaywallHidden = Platform.OS === 'ios' || Platform.OS === 'web'` (§114). **On Android this is `false`.**
- `GRACE_PERIOD_END = 2026-05-01` (§31). Today (2026-09-17) is **past** it, so `isGracePeriod = false`.
- ⇒ For a fresh Android free parent: `isSubscribed = false`, `hasRealEntitlement = false` (§137-138),
  `insightsUnlocked = false` (§149). **This is the parent who hits every wall below.**
- **Android-vs-web contrast:** on **web/iOS the exact same parent has `isSubscribed = true`** via
  `noIapPaywallHidden`, so the child-limit paywalls (add-child, 7th task) **never fire**. The
  insights/AI card gate keys off `hasRealEntitlement`, which is `false` on web too, so **the insights
  wall shows on all platforms** — but tapping it on web routes to a "get the Android app" panel
  (`PaywallScreen` `isWeb` branch), not a purchase.

---

## Locked surfaces reachable in a FREE parent's first session

| # | Surface | Taps from dashboard | Trigger (code) | What the parent sees | H8 relevance |
|---|---------|:---:|----------------|----------------------|--------------|
| 1 | **Insights card (locked)** | **0** (on dashboard) | `!insightsUnlocked && !smartInsight` → locked `📊` card, or free-teaser card if one real insight exists — `ParentDashboardScreen` §679-726 | A greyed `📊` "Premium" card ("Unlock with Premium ✨"), OR a purple teaser showing ONE real insight with a locked "coach" CTA. Tap → **Paywall** | **HIGH — blocks understanding.** The core "why is my kid struggling" value is walled on the home screen before any depth is seen. |
| 2 | **Parent Insights (full screen)** | **1** (tap insight card) | Dashboard card `onPress` → `navigate('Paywall')` §686/716/744/775; screen self-guards `if (!isSubscribed)` `ParentInsightsScreen` §230 | Full-screen Paywall ("Unlock BUFF Premium"), or the screen's own `📊` lock panel if reached directly | **HIGH — blocks understanding.** |
| 3 | **7th task** (per child) | **2** (Tasks tab → + Add Task) | `!isSubscribed && tasks.length >= FREE_TASK_LIMIT(6)` → `navigate('Paywall')` `ParentTasksScreen` §127-129 | Full-screen Paywall. First 6 adds open the task modal normally; the 7th `+` opens Paywall instead | **LOW — blocks scale, not understanding.** Parent has already used the feature 6×. |
| 4 | **2nd child** (add child) | **1** (+ Add Child button) | `!isSubscribed && children.length >= 1` → `navigate('Paywall')` `ParentDashboardScreen` §431 | Full-screen Paywall (with first child's name in subtitle) | **LOW — blocks scale.** Single-child families (the majority) never hit it (this is the D-2026-06-19 rationale). |

### Paywall screen itself (`PaywallScreen.tsx`)
Reached by all four surfaces above. On **Android** (`canPurchase = true`): hero, 5-feature list,
Founding-100 banner, Yearly (highlighted) + Monthly price cards (live RC pricing), restore/legal links.
Child role is hard-guarded out (renders null + `goBack`, §Role guard).

---

## Spec drift — surfaces D-2026-06-19 lists as premium but code does NOT gate

`D-2026-06-19-01` (DECISIONS_LOG §49-66) lists the paid set as: **7th+ task, 2nd+ child, parent insights,
bag-prep, off-routine, timetable (+AI), activities, task-capture (future).** Only the **first three**
are enforced in code. The rest are reachable **for free** in the current build:

| Surface listed as premium | Gate in code? | Reachable free | Anchor |
|---|:---:|:---:|---|
| Timetable (+AI) | **NONE** | Yes — `ParentTimetable` tab, **1 tap**, no `useSubscription` import | `ParentTabs.tsx` §34/86; `TimetableScreen.tsx` (no sub hook) |
| Activities | **NONE** | Yes — dashboard "Activities & gear" card → `navigate('Activities')` unconditional, **1 tap** | `ParentActivitiesEntry.tsx` `onPress`; `RootNavigator.tsx` §255 |
| Bag-prep | **NONE** | Yes — `ChildBagPrep` (child tab); no gate | `ChildTabs.tsx` §33/119 |
| Off-routine | **NONE** | Yes — banner/card components; no gate | `OffRoutineCard.tsx` / `OffRoutineBanner.tsx` |

> Per CLAUDE.md Spec-drift policy this is **flagged, not resolved**: the monetization SPEC/decision says
> these are paid; the code ships them free. Which is correct is **Adi's call** (possible Spec Sync).
> It is material to H8: the *understanding/exploration* features that a free parent CAN currently reach
> (timetable, activities) are exactly the ones that would deepen value — walling them later would move
> more friction in front of value.

---

## H8 read: "paywall-before-value"

- **Walls that block exploration/understanding (H8-relevant):** #1 and #2 — the **insights / AI-coach
  surface**. This is the home-screen card and its detail screen. A free Android parent meets it at
  **0-1 taps**, i.e. *before* accumulating the days of data that would make the insight land. A partial
  mitigation exists in code: the **taste gate** — a free family that already has one real insight sees it
  (`topInsight && !showLockedInsights` teaser, and the `smartInsight` branch §733-781), with the upsell
  moved to the *next* insight. So the wall's harshness depends on whether data exists yet: **brand-new
  parent (no data) → hard `📊` lock; parent with some history → value-first teaser then upsell.**
- **Walls that block scale, not understanding (not H8-relevant):** #3 (7th task) and #4 (2nd child).
  These fire only after real use and mostly to multi-child / heavy families.

**Bottom line for H8:** the only *before-value* wall in the first session is the **insights card**, and
only in the **no-data-yet** state. Everything else is either after-use (tasks) or after-first-value
(taste-gated insights) or currently ungated (timetable/activities/bag-prep/off-routine).

---

## UNVERIFIED CLAIMS
- Taps-from-dashboard counts assume the standard parent tab bar and no intervening modals; **not
  confirmed on device** (no emulator). Verify live.
- Whether a fresh free parent lands in the no-data (hard lock) vs. taste (teaser) insight state on
  first open depends on seeded/onboarding data — **not observed**, inferred from `insightsHaveData`
  gating (`ParentDashboardScreen` §366-367).
