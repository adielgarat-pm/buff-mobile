# BUFF — Fix SPECs for the Critical + HIGH pre-launch bugs

> Companion to `docs/PRE_LAUNCH_BUG_AUDIT_2026-08-30.md`. One detailed, review-ready
> SPEC per **Critical/HIGH** finding, each with: root cause → solution design →
> platform-parity check → Values Check → rollout/risk → **test plan that proves we
> don't break existing functionality**. Ends with a per-SPEC completeness review.
>
> **Status legend:** ✅ Implemented this session · 📐 SPEC only (awaiting Adi's `approved, proceed`) · 🔐 Needs schema/Supabase approval.

| ID | Title | Change surface | Status |
|---|---|---|---|
| **C1 / H5** | Local day-boundary (daily loop + vibe check) | Client (TS) | ✅ Implemented |
| **H1** | Server-side reward-cost validation | Supabase RPC + column | 🔐 SPEC only |
| **H2** | Child session hardening (no guessable password) | Supabase RPC + client | 🔐 SPEC only |
| **H3** | Parent dashboard day-filtered task counts | Client (TS) | 📐 SPEC only |
| **H4** | iOS Phase-1 paywall guard | Client (TS) | 📐 SPEC only |

---

## C1 / H5 — Local day boundary (✅ Implemented this session)

### Problem (anchored)
`daily_progress` and `child_vibes` day keys were computed as `new Date().toISOString().split('T')[0]` — **UTC** — while task visibility and the weekday use **local** time (`toDateKey` / `getDay()` in `src/lib/taskScheduling.ts`). For negative-UTC-offset users (the US/UK launch market) UTC midnight lands in the local afternoon/evening, so the day key flipped mid-day: completed tasks re-appeared as incomplete, streak/goal reset (**C1**), and the Vibe Check re-prompted and wrote a duplicate `child_vibes` row (**H5**).

### Solution design (as implemented)
One shared helper, `localDayKey()` in **`src/lib/dayKey.ts`**, returns the **local** `YYYY-MM-DD` (mirrors the already-correct `toDateKey`). Every "the child's today" key now routes through it:
- `src/hooks/useChildProgress.ts` (daily_progress read + task-completion write)
- `src/hooks/useChildrenDashboard.ts` (parent-side read of the same day)
- `src/utils/vibeUtils.ts` `getTodayKey` (→ `useDailyVibe`, `useVibeDismiss`, `UStep6_FirstTask` seed)
- `src/hooks/usePetState.ts` (streak rolls with the same local day as tasks)
- `src/hooks/useAnchorRecoveryDismiss.ts` (per-day dismiss gate)

**Deliberately NOT changed** (separate concern — would risk server-aggregate mismatch): analytics *windows* (`useSmartInsights`, `useParentInsights`, `useWeeklyStats`, `useTaskTimeline`, `useAutoCoachInsight`), DOB (`BirthdayField*`, `UStep1`, `EditChild` — that's M1), and `yesterdayRecapUtils`. `useParentNotifications` left as-is (parent-side "today" label, not the child loop).

### Platform parity
`localDayKey` uses only `Date.getFullYear/Month/Date` — identical on Android native and Expo Web. No native API. ✅ Both platforms.

### Values Check (3 pillars)
- **Intrinsic Motivation:** the daily loop no longer silently erases a child's morning wins → effort stays visibly rewarded. ✅
- **Positive Coaching:** streak/goal no longer reset mid-afternoon → no false "you lost your streak". ✅
- **Independence:** child sees a stable, honest day. ✅ No new copy, no gating change.

### Rollout / risk
Ephemeral per-day rows — **no data migration**. Only visible artifact: a user who updates the app **mid-day** may see that morning's completion read as incomplete **once**, on the transition day (the morning row is under the old UTC key). Acceptable; noted in `dayKey.ts`. Rollback = revert the helper (pure code).

### Test plan — proves nothing breaks
**Implemented & green (this session):**
- `src/lib/__tests__/dayKey.test.ts` (new) — local-midnight roll, zero-pad, evening-doesn't-shift, and a TZ-divergence guard that runs only in a non-UTC runner (skipped in UTC CI, so it never passes vacuously).
- `src/utils/__tests__/vibeUtils.test.ts` — rewritten `getTodayKey` block to assert **local** semantics (was asserting UTC).
- `src/hooks/__tests__/usePetState.streak.test.ts` — seed helpers switched to local keys so the streak suite is TZ-robust.
- **Full suite re-run: 109 suites / 950 pass / 1 skipped; `tsc` clean.** No regression in the 946 pre-existing tests.

**Still owed by a real device (Hat-3/4) — can't run in cloud:**
1. Set the Android emulator to `America/Los_Angeles`, complete a task at 10:00 local, advance clock to 18:00 local, reopen → task stays completed, streak intact. (Pre-fix: resets.)
2. Same TZ: vibe-check in the morning, reopen at 18:00 → **no** second prompt; `child_vibes` has one row for the day.
3. Israel (`Asia/Jerusalem`) regression: behavior unchanged around local midnight.

---

## H1 — Server-side reward-cost validation (🔐 SPEC only — needs Supabase approval)

### Problem (anchored, verified)
`src/hooks/useRewardRedemptions.ts:103-109` inserts `credits_spent` **from the client**; the INSERT RLS policy (`migrations/019_reward_redemption_flow.sql:50-52`) checks only `family_id`. `approve_reward_redemption` (`:159-167`) deducts `v_red.credits_spent` **verbatim** with no re-validation, and the column has **no `CHECK (credits_spent >= 0)`** (`:24`). A crafted request with a low value buys a costly reward cheaply; a **negative** value passes the `balance < credits_spent` guard and *increases* the balance on approve.

### Solution design (defense in depth — do all three)
1. **Validate inside the RPC** (authoritative). In `approve_reward_redemption`, after locking the redemption, re-read the reward and clamp/verify:
   ```sql
   -- after selecting v_red, before the funds check:
   select credits_needed into v_reward_cost
     from public.store_rewards where id = v_red.reward_id;
   if v_reward_cost is null then
     return jsonb_build_object('ok', false, 'error', 'reward_gone');
   end if;
   if v_red.credits_spent is distinct from v_reward_cost then
     return jsonb_build_object('ok', false, 'error', 'price_mismatch',
                               'stored', v_red.credits_spent, 'actual', v_reward_cost);
   end if;
   ```
   (For cash-conversion rewards whose price is intentionally parent-set, gate the equality on `store_rewards.kind <> 'cash'` — confirm the column name during implementation.)
2. **Column guard:** `alter table public.reward_redemptions add constraint chk_credits_spent_nonneg check (credits_spent >= 0);` (new migration; back-check existing rows first).
3. **Insert-time trigger (belt & suspenders):** a `before insert` trigger that overwrites `credits_spent` with the reward's real `credits_needed`, so the client value is never trusted. Makes the client field advisory.

### Platform parity
Pure server-side (Supabase). Identical for Android + Web. The client (`useRewardRedemptions`) needs a new error branch for `price_mismatch`/`reward_gone` → surface a friendly "this reward changed, try again" via `crossAlert`. ✅ Both.

### Values Check
- **Intrinsic Motivation:** the BUFF economy stays real — rewards can't be minted/discounted. ✅
- **Positive Coaching / Independence:** unchanged UX for honest users; only abuse is blocked. ✅

### Rollout / risk
Migration is additive. **Risk:** the equality check could reject legitimate flows if any real path stores `credits_spent ≠ credits_needed` (e.g. a reward whose price was edited after the request, or the cash-conversion reward). **Mitigation:** audit `store_rewards.kind`/cash path and existing open redemptions before enabling the equality branch; ship the `CHECK (>= 0)` + insert-trigger first (zero false-positive risk), then the equality check.

### Test plan — proves nothing breaks
**New DB/integration tests (run against a staging Supabase, never prod):**
- Happy path: request at real cost → approve → balance drops by exactly `credits_needed`. (Regression: current behavior preserved.)
- Forged low value → approve returns `price_mismatch`, **balance unchanged**.
- Negative value → insert rejected by `CHECK` (and/or trigger normalizes it).
- Cash-conversion reward (parent-set amount) → still approves. **This is the key non-breakage test.**
- Insufficient funds at real cost → still returns `insufficient_funds`.
**Existing tests that must stay green:** `src/services/__tests__/purchaseService.test.ts` and any credit-vault/redemption unit tests; the atomic-adjust path (migration 021) is untouched.
**Device (Hat-3):** child redeems a normal reward, parent approves, balance correct; cash-conversion still works end-to-end.

---

## H2 — Child session hardening (🔐 SPEC only — needs Supabase approval; sizeable package)

### Problem (anchored, verified)
`src/utils/childAuth.ts:17-23` derives a child's password deterministically: `password = ` `${profileId}_buff_stable_2026`. `list_family_children` is granted to `anon` (`migrations/018_child_login_stable_identity.sql`) and returns every child's immutable `id`. So anyone with the 6-char `families.short_code` can list ids and compute each child's password → **sign in as any child**. Migration 018's header already flags this as a deferred MVP limitation.

### Solution design (recommended: server-minted sessions)
Replace the guessable-password login with a **service-role session mint** behind a Supabase Edge Function:
1. **Edge Function `child-signin`** (service role, never ships the key to the client): input `{ family_short_code, child_id }` (+ optionally a per-child PIN). It verifies the code, then creates/returns a session for the child's auth user via the Admin API (`auth.admin.generateLink` / `createSession`-style flow), rather than the client signing in with a derived password.
2. **Rotate** each child auth user to a random, non-derivable password owned only by the service role (one-time migration over existing child users).
3. **Optional per-child PIN** (4-digit, parent-set) as a second factor for the pick-from-list flow — raises the bar beyond "holds the family code".
4. **Client:** `childAuth.stableChildCreds` is retired; `ChildJoinScreen` calls the Edge Function and consumes the returned session. Keep `legacyChildCreds` only as a one-time migration reader.

### Platform parity
Edge Function is platform-agnostic; the client change is in shared TS (`ChildJoinScreen`, `AuthContext`). Works on Android + Web identically. ✅

### Values Check
- **Positive Coaching / trust (Pillar 2 — children's-app safety):** a child can no longer be impersonated by anyone holding a short code — real privacy/safety win. ✅
- **Independence:** pick-from-list UX preserved (optionally + a PIN the child owns). ✅ No motivation/economy impact.

### Rollout / risk
Largest of the five — touches auth. **Risk:** locking out existing children mid-migration. **Mitigation:** dual-read during rollout (accept legacy derived login *and* the new mint until all sessions migrate), stage on a burner family, and keep `legacyChildCreds` as the fallback until verified. **This is a standalone package**, not a same-day hotfix — size it consciously; if launch can't wait, ship H1 + C1 + H3 first and fast-follow H2.

### Test plan — proves nothing breaks
**New tests:**
- Edge Function unit/integration (staging): valid code + child_id → session; wrong code → 401; wrong PIN → 401; child of another family → 403.
- Migration dry-run on a burner family: every existing child still logs in via the dual-read path.
- Client: `ChildJoinScreen` pick-from-list still lands the child in Child mode with the right profile.
**Existing tests that must stay green:** `src/utils/__tests__/childAuth.test.ts`, `src/integrations/supabase/__tests__/authStorage.test.ts`, `src/screens/auth/__tests__/RoleSelectionScreen.test.tsx`.
**Device (Hat-3/4):** real child sign-in on Android; sign-out clears session; re-sign-in works.

---

## H3 — Parent dashboard day-filtered task counts (📐 SPEC only — small client change)

### Problem (anchored, verified)
`src/hooks/useChildrenDashboard.ts:106-116` counts tasks filtered **only** by the off-routine partition (`isTaskInActivePlan`); it ignores `scheduleDays`, `hideOnWeekend`, and one-time `dueDate`. The child surfaces filter the same list through `isTaskVisibleOn` (`src/lib/taskScheduling.ts`). Result: the parent card (`ParentDashboardScreen.tsx:984`) shows a total that never matches what the child sees, "all done" never registers, and past-dated one-time tasks inflate the total permanently.

### Solution design
Reuse the existing single-source-of-truth visibility rule in the parent aggregation. In `useChildrenDashboard.ts`, after the off-routine partition:
```ts
import { isTaskVisibleOn, toDateKey } from '../lib/taskScheduling';
import { isWeekendForFamily } from '../utils/schoolDay'; // confirm exact name/signature

const todayKey = localDayKey();
const isWeekend = isWeekendForFamily(new Date(), family.friday_enabled); // per-family rule
const visibleTasks = (tasks ?? [])
  .filter(t => isTaskInActivePlan(t.is_off_routine, child.off_routine_until))
  .filter(t => isTaskVisibleOn(t, todayKey, { isWeekend }));
```
`tasksTotal`/`tasksCompleted` then use `visibleTasks` — byte-for-byte the child's rule. (Confirm the weekend/`friday_enabled` source available in this hook; if not already fetched, add it to the family query.)

### Platform parity
Pure TS shared by both platforms. ✅ The child surfaces already use this rule on both, so the parent now matches on both.

### Values Check
- **Positive Coaching:** parent sees the child's *real* daily progress → accurate encouragement, no false "incomplete". ✅
- **Intrinsic Motivation / Independence:** unchanged. ✅

### Rollout / risk
Low. **Risk:** the hook may not currently fetch the weekend/`friday_enabled` flag → add it to the query. Rollback = revert.

### Test plan — proves nothing breaks
**New unit test** for `useChildrenDashboard` count logic (or extract the count into a pure helper and test it directly — preferred, mirrors `taskScheduling.test.ts`):
- 5 daily + 2 Monday-only + 1 future one-time → on a Tuesday, `tasksTotal === 5`.
- All of today's tasks completed → `tasksCompleted === tasksTotal` (the "all done" case that's currently impossible).
- Weekend + `hideOnWeekend` tasks excluded; Friday honors `friday_enabled`.
- Past-dated one-time task → excluded (no permanent inflation).
**Cross-check test:** feed the same task list to the child rule (`PhaseView`/`GamerTasks` use `isTaskVisibleOn`) and assert the parent count equals the child's visible count. This is the anti-divergence guard.
**Existing tests that must stay green:** `src/lib/__tests__/taskScheduling.test.ts`, `src/components/__tests__/PhaseView.test.tsx`, `src/screens/child/__tests__/GamerTasksScreen.rowtap.test.tsx`.
**Device (Hat-3):** parent dashboard card matches the child's task screen for a multi-schedule child.

---

## H4 — iOS Phase-1 paywall guard (📐 SPEC only — small client change)

### Problem (anchored)
On iOS Phase 1, `useSubscription` hides the child-limit paywall but leaves `insightsUnlocked=false`, so the parent Insights card renders a "Unlock with Premium" CTA that `navigate('Paywall')`. `PaywallScreen.tsx:58-61` guards only `isWeb` + `isChild` — **no iOS branch** — so it renders real purchase cards; tapping them calls RevenueCat, which was never initialized on iOS (`purchaseService.ts:35`) → "product not found".

### Solution design (choose 1; recommend both)
1. **Guard the screen** (defense in depth): in `PaywallScreen`, add an iOS Phase-1 branch mirroring `isWeb` — render an "coming soon on iOS" / dismiss state instead of purchase cards, OR route to the same non-purchasing path web uses. Single source: a `isIapAvailable` selector (`Platform.OS === 'android' && !isWeb`) from `useSubscription`, reused by both the screen and the CTA.
2. **Hide the CTA at the source:** on iOS, don't render the Insights "Unlock" lock card (or make its `onPress` a no-op) in `ParentDashboardScreen.tsx:658-704`, gated on the same `isIapAvailable` selector.

### Platform parity
Explicitly a per-platform behavior. Verify all three: **Android** = paywall works (unchanged); **iOS** = no reachable purchase dead-end; **Web** = existing Play-Store redirect path unchanged. ✅ Add the selector so the three stay consistent.

### Values Check
- **Positive Coaching:** parents don't hit a broken purchase dead-end → no confusion/erosion of trust. ✅
- **Pillar 2 (no dark patterns):** we're removing a broken CTA, not adding pressure. ✅

### Rollout / risk
Low; iOS-only surface. **Risk:** over-hiding on Android/Web — guard strictly on `Platform.OS === 'ios'` + the Phase-1 flag. Rollback = revert.

### Test plan — proves nothing breaks
**New unit tests** for the `isIapAvailable` selector in `useSubscription` (extend `src/hooks/__tests__/useSubscription.test.ts`): true only on Android non-web; false on iOS and web. Test the CTA render decision with a mocked `Platform.OS`.
**Existing tests that must stay green:** `src/hooks/__tests__/useSubscription.test.ts`, `src/services/__tests__/purchaseService.test.ts`, the child-cannot-reach-paywall guard (audit-verified — keep it).
**Device (Hat-4, iOS build):** on an iOS TestFlight build, the Insights card shows no purchase dead-end; Android build still shows a working paywall; Web still redirects to Play Store.

---

## SPEC review — completeness checklist

Each SPEC was checked against: root cause anchored · solution concrete · **platform parity (Android + Web + iOS where relevant)** · Values Check · rollout/rollback · **regression tests + new tests + device items** · open questions surfaced (not silently resolved).

| SPEC | Root cause anchored | Parity covered | Values Check | Rollback | Regression + new tests | Open questions for Adi |
|---|---|---|---|---|---|---|
| **C1/H5** | ✅ verified in code | ✅ both | ✅ | ✅ pure revert | ✅ done + device list | Confirm the mid-day-update transition artifact is acceptable (it is, ephemeral). |
| **H1** | ✅ verified (SQL) | ✅ server | ✅ | ✅ additive migration | ✅ planned (staging) | **Does any legit path store `credits_spent ≠ credits_needed`?** (cash-conversion `store_rewards.kind`) — audit before the equality check. |
| **H2** | ✅ verified | ✅ both | ✅ | ⚠️ dual-read during migration | ✅ planned | **Launch-blocking or fast-follow?** Recommend fast-follow (biggest surface). Add a per-child PIN? |
| **H3** | ✅ verified | ✅ both | ✅ | ✅ revert | ✅ planned (+ anti-divergence cross-check) | Is `friday_enabled`/weekend flag already fetched in `useChildrenDashboard`? If not, add to the query. |
| **H4** | ✅ agent-traced (spot-verified) | ✅ all 3 | ✅ | ✅ revert | ✅ planned | Is an iOS build actually in testers' hands right now? If not, this is lower urgency. |

### Recommended sequencing for launch
1. **C1/H5** — ✅ done, verify on device.
2. **H3** — small, self-contained, high user-visible value; implement next.
3. **H1** — ship `CHECK (>= 0)` + insert-trigger immediately (zero false-positive risk); add the equality check after the cash-path audit.
4. **H4** — before any iOS distribution.
5. **H2** — dedicated fast-follow package (dual-read migration); size consciously.

### What I need from Adi to proceed past SPEC
- `approved, proceed` on **H3** and **H4** → I implement + test now (client-only, no schema).
- Approval on **H1** and **H2** touches **Supabase schema/RPC** — per CLAUDE.md I will not modify schema without your explicit go, and H1's equality check needs the cash-path answer above.

---

*Companion to the 2026-08-30 pre-launch audit. C1/H5 implemented + regression-tested this session; H1–H4 are review-ready SPECs awaiting approval.*
