# BUFF — Pre-Launch Bug Audit (2026-08-30)

> **Purpose:** a full, severity-ranked bug sweep of BUFF **before the massive public launch**, so Adi can make an informed go / no-go call and know exactly what state the product is in.
> **Run by:** Claude Code (autonomous QA session, branch `claude/pre-launch-bug-testing-rc8a6b`). No product code was changed — this is a read-only audit plus new test harness files.

---

## 1. How this was tested (methodology)

BUFF is validated on **two axes** — the code (static + logic) and the two shipping platforms (Android native + Expo Web PWA). This audit combined five complementary methods:

| Method | What it catches | Ran here? |
|---|---|---|
| **Static analysis** (`tsc`, Jest, i18n + guard scripts) | type errors, unit regressions, missing translations, banned patterns | ✅ Fully |
| **Web build gate** (`build:web`, the CI quality gate) | RN-Web bundle breaks | ✅ Fully |
| **Web functional smoke** (Playwright + Chromium, real entry routes) | launch crashes / blank screens / boot errors on the Web PWA | ✅ Fully |
| **Code review vs SPEC + open FLAGs** (5 parallel deep-dive passes) | logic bugs, economy/data-integrity, platform-parity, timezone, security | ✅ Fully |
| **Android device runtime** (Hat‑3 adb, Hat‑4 real device) | on-device UI, sensors, push, OAuth | ⚠️ **Not runnable in this cloud environment** — the emulator + `adb` live on Adi's Windows machine. Android was covered by static + code-level review + parity checks; items marked *needs device verification* below require the emulator/real device. |

**Environment note:** this session ran in a cloud container with no Android emulator and no staging Supabase. The web onboarding E2E specs need an authenticated fresh-parent session + reachable backend, so they were **not** run (they'd fail on the auth gate, not on product bugs, and would risk writing junk into the production Supabase whose keys are in the committed `.env`). Instead the web was verified with a **non-mutating boot smoke test** on the real app screens.

### Results of the automated gates

| Gate | Result |
|---|---|
| `tsc --noEmit` (typecheck) | ✅ clean |
| `jest` unit suite | ✅ **946 / 946** pass (108 suites) |
| `npm run build:web` | ✅ exports `dist` cleanly |
| `check-no-raw-alert` | ✅ clean |
| `check-no-fs-root-import` | ✅ clean |
| `i18n-key-check` | ✅ all static keys resolve in en + he |
| **Web boot smoke** (`/RoleSelection`, `/Login`) | ✅ both render, **zero uncaught page errors** |
| `check-bilingual-access` | ❌ **fails (8 violations)** — see L2. Known/accepted debt, intentionally *not* wired into CI. |

---

## 2. Severity summary (the one-screen view)

Severity = user/business impact if this ships to a large audience.

| # | Severity | Title | Platform | Confidence |
|---|---|---|---|---|
| **C1** | 🔴 Critical | Daily task/streak state resets **mid-day** for Western (US/UK) timezones (UTC day boundary) | Both | Confirmed |
| **H1** | 🟠 High | Reward economy: client controls `credits_spent`, no server validation → cheap/negative-cost redemptions can **inflate BUFF balance** | Both (DB) | Confirmed |
| **H2** | 🟠 High | Child password is **deterministic** from profile id; ids are anon-listable → 6-char family code = sign in as **any child** | Both | Confirmed (documented MVP limit) |
| **H3** | 🟠 High | Parent dashboard task counts are **not day-filtered** → parent sees wrong "X/Y", "all done" never shows | Both | Confirmed |
| **H4** | 🟠 High | iOS Phase‑1 paywall is reachable via the Insights card and **dead-ends on a purchase error** | iOS | Confirmed |
| **H5** | 🟠 High | Daily Vibe Check **re-prompts twice a day** (+ duplicate DB rows) for Western timezones (same UTC bug) | Both | Confirmed |
| **M1** | 🟡 Medium | Birthday stored **one day early** on native (web is already fixed) — parity bug | Android/iOS | Confirmed |
| **M2** | 🟡 Medium | Reward pricing assumes a fixed 3 tasks while the engine ships up to 5 → economy 25‑40% mis-priced | Both | Confirmed |
| **M3** | 🟡 Medium | Insights unlock gate keys off **profile age**, not streak/history → seeded/re-linked child never unlocks | Both | Confirmed |
| **M4** | 🟡 Medium | Child "Add Activity" date/time picker is a **dead control on web** (no `.web` split) | Web | Confirmed |
| **M5** | 🟡 Medium | Notification "Open settings" CTA **throws a TypeError on web** | Web | Confirmed |
| **M6** | 🟡 Medium | Instant Buff (+5) is **farmable** by reopening the app (no server idempotency) | Both | Confirmed |
| **M7** | 🟡 Medium | Parent insight completion-rate math uses a hardcoded /5 over 7 days → **>100%** rates, wrong cards | Both | Confirmed |
| **M8** | 🟡 Medium | Dashboard doesn't refetch child progress/insights on focus (stale until pull-to-refresh) | Both | Suspected |
| **L1** | 🟢 Low | Kid local-notification scheduler unguarded on web → unhandled promise rejection | Web | Confirmed |
| **L2** | 🟢 Low | `check-bilingual-access` guard red (8 violations; 3 in real screens) — known debt | Both | Confirmed |
| **L3** | 🟢 Low | Task completion is read-check-act (TOCTOU) — double-credit only under true concurrency | Both | Suspected |
| **L4** | 🟢 Low | Onboarding progress bar never reaches "7 / 7" (cosmetic) | Both | Confirmed |
| **L5** | 🟢 Low | 6‑8 band: a second same-domain challenge silently adds no task | Both | Confirmed |
| **L6** | 🟢 Low | EN→HE task retitle can pick the wrong Hebrew variant (stale-library collision) | Both | Confirmed |
| **L7** | 🟢 Low | Back from Preview lands on a spent loading screen (minor dead-end) | Both | Confirmed |
| **L8** | 🟢 Low | Buddy L3 gift reveal keys off `theme_color` — no fallback if RPC returns null | Both | Suspected |
| **L9** | 🟢 Low | A child can insert a redemption row targeting a **sibling** `child_id` | Both | Confirmed |
| **L10** | 🟢 Low | Paywall Privacy/Terms links bypass the `openExternalUrl` wrapper (fragile) | Web | Suspected |
| **L11** | 🟢 Low | `onboarding.step5.buffs` has no singular form ("1 BUFFs") — latent | Both | Confirmed |

**Headline:** there is **no launch crash** on either platform and the automated suite is green. The single most important theme is **timezone (UTC vs local)** — it independently breaks the daily task loop (C1), the vibe check (H5), and the stored birthday (M1). For an English-speaking-first (US/UK) launch, **C1 is a daily, prime-time, core-loop failure** and should be treated as a blocker.

---

## 3. Detailed findings

### 🔴 C1 — Daily task & streak state resets mid-day for Western timezones
- **Platform:** Both · **Confidence:** Confirmed (traced + reproduced in code)
- **Files:** `src/hooks/useChildProgress.ts:30` and `src/hooks/useChildrenDashboard.ts:28` — `getTodayKey = new Date().toISOString().split('T')[0]` (**UTC**). Task visibility & weekday use **local** time: `src/lib/taskScheduling.ts:13` (`toDateKey` via `getFullYear/getMonth/getDate`) and `getDay()` in `src/utils/schoolDay.ts`.
- **What happens:** `daily_progress` rows are keyed by the **UTC** calendar day, but which tasks are shown for "today" is computed from the **local** weekday. For any negative-UTC-offset user (all of the Americas), UTC rolls to the next day in the local afternoon/evening — e.g. **~5pm US-Pacific, ~8pm US-Eastern**. At that moment `todayKey` flips, the morning's completions (saved under the previous UTC key) no longer match, and the app reads an empty progress set → **completed tasks re-appear as incomplete, the daily goal and streak read 0** — during exactly the after-school/evening usage window.
- **Not** data loss (yesterday's rows still exist), but the visible daily boundary is wrong (UTC midnight, not local midnight). The code comment at `vibeUtils.ts:33‑35` explicitly calls UTC "acceptable for the MVP cohort [Israel, UTC+2/+3]" — that assumption breaks for the launch market.
- **Fix direction:** derive the day key from **local** date (reuse `toDateKey()`), consistently for `daily_progress`, `child_vibes`, and the instant-buff/streak logic. One shared local-day helper.

### 🟠 H1 — Reward economy: client-controlled `credits_spent`, no server validation
- **Platform:** Both (Supabase RPC + RLS) · **Confidence:** Confirmed (traced SQL)
- **Files:** `src/hooks/useRewardRedemptions.ts:103‑109` (insert sends `credits_spent`), `migrations/019_reward_redemption_flow.sql:24` (`credits_spent integer not null`, **no `CHECK (>= 0)`**), `:159‑167` (`approve_reward_redemption` deducts `v_red.credits_spent` **verbatim**).
- **What happens:** the redemption's `credits_spent` is supplied by the client; the INSERT policy checks only `family_id`, never that it equals `store_rewards.credits_needed`. `approve_reward_redemption` re-reads nothing — it subtracts the stored value as-is. A crafted request with `credits_spent = 1` buys a 500‑BUFF reward for 1; with a **negative** value the funds check `balance < -1000` is trivially true-passing and `balance - (-1000)` **increases** the balance. The parent's approve tap is the only gate, and the parent UI shows only the forged amount.
- **Realism:** requires a deliberate direct-API call (the app UI always sends the real cost) **plus** a parent approving. Kids won't craft SQL — but the anon key ships in the client bundle, and there is **zero** server-side cost validation, so any future client bug can also corrupt balances. **Fix:** validate `credits_spent` against `store_rewards.credits_needed` inside the RPC (or via trigger) and add `CHECK (credits_spent >= 0)`.

### 🟠 H2 — Deterministic child credentials + anon-listable ids
- **Platform:** Both · **Confidence:** Confirmed (documented as an accepted MVP limitation)
- **Files:** `src/utils/childAuth.ts:17‑23` (`password = ` `${profileId}_buff_stable_2026`), `migrations/018_child_login_stable_identity.sql` (`list_family_children` granted to `anon`, returns every child's immutable `id`), family code is `[A-Z0-9]{6}` (`AuthContext.tsx:548`).
- **What happens:** anyone with a family's 6‑char code can call the anon RPC to list child ids, then compute each child's password deterministically and sign in **as that child**. Password entropy beyond the code is zero. Migration 018's header already acknowledges this and defers the hardening (service-role session mint).
- **Why it matters for a *massive* launch:** this is a children's app; "hold the short code → become any child in the family" is a real impersonation/privacy exposure once the user base is large and codes circulate. **Fix (deferred package):** mint child sessions server-side (service role) instead of deriving a guessable password.

### 🟠 H3 — Parent dashboard task counts are not day-filtered
- **Platform:** Both · **Confidence:** Confirmed
- **Files:** `src/hooks/useChildrenDashboard.ts:106‑116` counts *all* assigned tasks filtered **only** by the off-routine partition — it never applies `scheduleDays`, `hideOnWeekend`, or one-time `dueDate`. Every child surface (`PhaseView.tsx:43‑49`, `GamerTasksScreen.tsx:219‑222`) filters the same list through `isTaskVisibleOn`.
- **What happens:** a child with 5 daily + 2 "Mondays-only" + 1 future one-time task sees **5** today; the parent card (`ParentDashboardScreen.tsx:984`) shows **"X / 8"**. Finishing everything scheduled today can **never** read as done on the parent card, and a past-dated one-time task inflates the total **permanently** until deleted. Same HQ↔Quests divergence class the team already fixed on the child side; the parent aggregation was never migrated. **Fix:** run the parent count through the shared `isTaskVisibleOn` rule.

### 🟠 H4 — iOS Phase‑1 paywall reachable & dead-ends
- **Platform:** iOS (TestFlight Phase 1) · **Confidence:** Confirmed
- **Files:** `src/hooks/useSubscription.ts:130‑142` (iOS: paywall "hidden" but `insightsUnlocked=false`), `src/screens/parent/ParentDashboardScreen.tsx:658‑704` (locked Insights card → `navigate('Paywall')`), `src/screens/PaywallScreen.tsx:58‑61` (guards `isWeb` + `isChild` only — **no iOS branch**), `purchaseService.ts:35` (RevenueCat init early-returns on iOS).
- **What happens:** on iOS the child-limit paywall is hidden (good), but the Insights lock card still navigates to `PaywallScreen`, which renders the real Monthly/Yearly/Founding cards. Tapping them calls into RevenueCat, which was never initialized on iOS → "product not found" error. Requirement was "iOS Phase 1: paywall hidden **and** RC init skipped"; init is skipped but the paywall is still reachable and broken. **Fix:** add an iOS guard to `PaywallScreen` (mirror `isWeb`), or hide the Insights lock CTA on iOS. Only bites if an iOS build is in testers' hands.

### 🟠 H5 — Daily Vibe Check re-prompts twice a day (Western timezones)
- **Platform:** Both · **Confidence:** Confirmed
- **Files:** `src/utils/vibeUtils.ts:41‑43` (`getTodayKey` = UTC), consumed by `src/hooks/useDailyVibe.ts:42,78` and `src/hooks/useVibeDismiss.ts:26` (AsyncStorage key embeds the UTC date).
- **What happens:** same UTC-boundary root cause as C1. A child who vibes in the morning and reopens after the UTC rollover (afternoon/evening local for the Americas) gets `hasVibedToday=false` → the modal fires **again the same local day**, and `recordVibe` inserts a **second** `child_vibes` row, so the parent sees two vibes/day and Low-Power state can flip mid-day. **Fix:** local day key (shared with C1).

---

### 🟡 Medium

- **M1 — Birthday off by one on native.** `src/components/BirthdayField.tsx:39` passes the picker's **local-midnight** Date; `UStep1_ChildProfile.tsx:27‑29` does `toISOString().split('T')[0]` → UTC → a UTC+ parent (Israel) stores the day **before** the one picked. The **web** sibling `BirthdayField.web.tsx:41‑42` was already patched (`new Date(\`${v}T00:00:00Z\`)`); native never got the same fix → data-integrity + parity bug. Mitigated because `age_group` (not `birth_date`) drives logic. *Needs device verification of the exact stored value.*
- **M2 — Reward pricing ignores real task count.** `UStep5_Preview.tsx:342,493` use `calcRewardCreditsDefault(size)` (hard-codes 3 tasks × 20 = 60 daily BUFFs). The intent-matching `calcRewardCredits(tasks, size)` (`onboardingData.ts:363`) that sums the *actual* task values is exported but **never used**. The engine commonly makes 4‑5 tasks (`generatorConfig.ts:11‑22`), so a "7‑day" reward is reachable in ~3 days (under-priced 25‑40%); the 1‑task fallback over-prices ~3×. *Design call for Adi — the correct helper already exists.*
- **M3 — Insights unlock keyed on profile age (open FLAG B1, still live).** `ParentDashboardScreen.tsx:342‑346`: `showLockedInsights = daysSinceChildCreated < 3`, purely the profile's `created_at`. Any seeded/back-dated/re-linked child with a real streak but a fresh row shows "Insights unlock after 3 days" forever. `useParentInsights.ts:167` gates on `daily_progress` presence — an uncoordinated second signal. **Fix:** gate on streak/history, not row age.
- **M4 — Child "Add Activity" picker dead on web.** `src/screens/child/ChildAddActivityScreen.tsx:9,147,163` imports `@react-native-community/datetimepicker` with **no `.web` split** (unlike `DateField`/`TimeField`/`BirthdayField`). On web Metro resolves the null-rendering base module → the child can't set a one-off activity's date/time. **Fix:** add `ChildAddActivityScreen.web.tsx` or reuse `DateField`/`TimeField`.
- **M5 — Notification "Open settings" throws on web.** `src/components/NotificationGate.tsx:127` calls `Linking.openSettings()`; react-native-web's `Linking` has **no** `openSettings` → `TypeError` in the handler (Sentry noise, dead CTA) for a parent with denied browser notifications. The banner is arguably native-only. **Fix:** guard the CTA/banner behind `Platform.OS !== 'web'`.
- **M6 — Instant Buff (+5) farmable.** `src/components/InstantBuffCard.tsx:46,54` — the "once" limit is only in-memory `awarded` state; on any reload the card returns and `awardInstantBuff` (`useDailyVibe.ts:240‑265`) credits again with no server-side daily idempotency (SOS-style flag). Self-inflicted, low-power days only, but contradicts the Pillar‑1 "no grinding" design. **Fix:** server-side per-day idempotency on the `instant_buff` credit.
- **M7 — Insight completion-rate math wrong.** `useParentInsights.ts:141‑145,176‑182`: 7‑day window but `totalDays = min(dates.length, 5)` = always 5; a task done daily yields `7/5 = 140%`, and the rate ignores how many days the task was actually scheduled. Drives the "attention"/"positive streak" cards → wrong card shown, ">100%" possible. **Fix:** denominator = scheduled-days in window.
- **M8 — Stale dashboard on focus (Suspected, open FLAG B2 residual).** `ParentDashboardScreen.tsx:317‑319` refetches only the AI coach on focus, not `useChildrenDashboard.refetch`/`refetchInsights`. Realtime subscriptions exist (`useChildrenDashboard.ts:152‑153`) but a code comment (`useChildProgress.ts:329‑332`) claims `daily_progress`/`credit_vault` aren't in the realtime publication — unverifiable from the repo (no `ALTER PUBLICATION` migration present). If accurate, a child's completion won't reflect on the parent side until pull-to-refresh. *Needs a DB/publication check.*

---

### 🟢 Low (cleanup / edge cases)

- **L1 — Kid local notifications unguarded on web.** `src/hooks/useKidLocalNotifications.ts:160,210` schedules `DATE`-trigger notifications for every child session with no `Platform.OS==='web'` guard and no `.catch` → unhandled rejection on web; reminders silently never schedule. **Fix:** early-return on web.
- **L2 — `check-bilingual-access` red (known debt).** 8 violations (`UStep5_Preview.tsx:103‑104`, `ParentRewardsScreen.tsx:267,326,379`, plus test files). All are `.title.en/.he` on I18nString **literals/constants**, not DB rows — low risk. Intentionally **not** CI-wired (see `ci.yml` comment): a cleanup PR must clear the debt first. Tracked, not shipping-blocking.
- **L3 — Task completion TOCTOU (Suspected).** `useChildProgress.ts:400‑448` reads `daily_progress.completed`, then credits in a separate `adjust_credit_vault` call gated on the stale read. True concurrency (child device + parent "view-as-child", or a double-tap before the upsert lands) could double-credit; a failed adjust after a successful upsert loses the credit. Sequential single-device taps are safe (awaited).
- **L4 — Progress bar never hits "7 / 7".** Every step renders `{STEP+1} / {TOTAL+1}` with `TOTAL=6` → tops out at "6 / 7" (~86%); steps 6 & 8 show no counter. Cosmetic.
- **L5 — 6‑8 second same-domain challenge adds nothing.** `onboardingData.ts:44‑50` maps both `calm_mornings` and `getting_ready` to Domain 1; the generator dedupes, so the second pick contributes 0 tasks. Graceful (no crash) but silently absorbed.
- **L6 — EN→HE retitle wrong-variant.** `src/lib/starterTaskRetitle.ts:19‑38` concatenates the new + old task libraries keyed by English; collisions (e.g. "Lay out tomorrow's clothes") resolve to the **old** Hebrew (`...לבוקר`) instead of the engine's (`...למחר`). Semantically near-identical.
- **L7 — Back from Preview → spent loading screen.** `ULoadingScreen.tsx:26‑40` fires its forward `setTimeout` once on mount; backing out of Preview reveals the completed-but-frozen loader — press back again to reach Step 4. Minor.
- **L8 — Buddy L3 gift reveal (Suspected).** `useBuddyGiftReveal.ts:64` / `BuddyGiftModal.tsx:42` decide "opened" by `theme_color !== null`; the L3 gift is stored as `double_buffs` (`docs/sessions/buddy-v05-backend/phase-1-migration.sql:260`). If the live `use_buddy_gift` RPC ever returns `theme_color: null` for it, the modal never advances. The RPC's own comment says every gift was remapped to a color (so likely fine today), but the app has no fallback. *Worth a manual test: reach 10 successful days, open the gift.*
- **L9 — Sibling-targeted redemption.** `useRewardRedemptions.ts:103‑109` + migration 019 insert policy check only `family_id`, so `child_id` is client-supplied → one child can create a redemption for a sibling. Minor alone; compounds H1 if combined.
- **L10 — Paywall Privacy/Terms bypass wrapper (Suspected).** `PaywallScreen.tsx:274,281` call `Linking.openURL` directly instead of `openExternalUrl`. Works on today's react-native-web (synchronous `window.open`) but becomes a popup-blocked dead link if any `await` precedes it.
- **L11 — "1 BUFFs" latent.** `UStep5_Preview.tsx:481,516` pass `count` to a key with no `_one` variant. Never surfaces today (count is always ≥20/≥126).

---

## 4. What passed / verified sound (the green column)

- **No launch crash / blank screen on either platform.** Web boots clean on the real app routes; Android static + parity review found no launch-crash path.
- **`expo-audio` launch-crash regression (IN‑2026‑06‑17) stays fixed** — no `expo-audio`/`expo-av` import in `src/`; `sfx.ts` is the no-op stub.
- **Platform-split discipline is strong.** Every wrapper (`crossAlert`, `openExternalUrl`, `useVersionGate`, `useOtaRestartToast`, `installReferrer`, `referralCapture`, `requestNativeReview`, `highIntentDestination`) has a complete, signature-matched set of variants. Native-only Expo modules (`expo-updates`, `expo-notifications`, `expo-haptics`, `expo-apple-authentication`, `expo-store-review`, `expo-in-app-updates`, image picker/manipulator, play-install-referrer, RevenueCat) are all import-safe on web and runtime-guarded. (Exceptions are the specific web gaps M4/M5/L1.)
- **Children cannot reach the paywall.** All `navigate('Paywall'/'FoundingHundred')` sites are parent-only; both screens are registered only in the parent navigator branch and carry a `role==='child' → null` defense-in-depth guard. (The one iOS gap is H4, parent-side.)
- **Subscription edge cases correct** — expiry, grace-period exclusion, lifetime/founding cohort bypass, and the iOS/web short-circuits all read correctly.
- **Pause Mode is sound** — active/indefinite/stale handling, auto-resume, clean resume, child sees a no-self-resume empty state.
- **Buglog 2026‑05‑31 items:** A1 (timetable blank) **fixed**, A2 (bell overlap) **re-architected/fixed**, A3 (auto-mark-read) **intentionally reverted by design**, B1 → **M3 (still present)**, B2 → **M8 (partially, Suspected)**.
- **Fixed atomic economy paths** — `adjust_credit_vault` (migration 021) genuinely killed the read-modify-write balance races; the open-redemption unique index (`uq_reward_redemptions_open_per_reward`) prevents duplicate open requests per reward.
- **Stale FLAG:** the CLAUDE.md "age 13‑15 vs 13‑17" flag is stale — the code now uses age **bands** (`6-8`/`9-11`/`12-14`/`15-18`), not a raw-year threshold.

---

## 5. Recommended pre-launch order

**Treat as blockers for a US/English-first launch:**
1. **C1** — local day boundary (fixes the daily loop; one shared helper also fixes **H5** and de-risks **M6**).
2. **H3** — parent task counts (core-loop visibility; small, self-contained).
3. **H1** — server-side `credits_spent` validation + `CHECK (>= 0)` (economy integrity).

**Strongly recommended before scale:**
4. **H4** (iOS paywall guard — if any iOS build is with testers), **H2** (child session hardening — a deferred package, but size the risk consciously), **M1/M2/M3** (birthday parity, reward pricing, insights gate), **M4/M5** (web dead controls).

**Batch as a cleanup PR:** the Low tier + L2's bilingual debt (then wire the i18n guards into CI).

**Still owed by a real device (Hat‑3/Hat‑4), which this environment can't run:** on-device confirmation of M1 (stored DOB), M8 (realtime publication), L8 (buddy L3 gift reveal), Google OAuth, push delivery, and a full happy-path pass on the Android emulator.

---

*Generated by an autonomous Claude Code QA session. Findings are Confirmed (traced in code) or Suspected (need runtime/DB confirmation) as labeled. No product code was modified.*
