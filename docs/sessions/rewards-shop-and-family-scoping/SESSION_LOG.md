# Session Log — 2026-06-03 — Itay's LOCKED ZONE → V26

## The trigger
Adi sent a screenshot: Itay (15), in Gamer mode, on the Shop tab, sees a gift-box
**"🎁 LOCKED ZONE / Your parent has the key 🔑"** instead of his rewards. Question:
why?

## Investigation → root cause (two layers)
1. **Shop gated behind subscription.** `GamerRewardsScreen.tsx` and `ChildRewardsScreen.tsx`
   rendered the locked state when `!isSubscribed`. Today the grace period (`GRACE_PERIOD_END
   = 2026-05-01`) is over, so non-lifetime users are "not subscribed".
2. **Subscription was checked per-profile, not per-family.** `useSubscription` read the
   *logged-in* profile's `is_lifetime_access`. Itay on his own ChildJoin device = his own
   child profile (`is_lifetime_access=false`), even though his parent (Adi) had
   `is_lifetime_access=true`. So View-as-Child (parent device) worked, but Itay's own device
   was locked.
3. **PRD drift.** `BUFF_PRD.md §5.1` lists the gated free-tier features (children count,
   tasks, Buddy & Skins, notifications) — the **rewards shop is NOT among them**. The shop
   gate was never a documented decision; it pre-existed and `pkg/hide-paywall-from-child`
   only softened its CTA (explicitly out-of-scope to change the model). Adi confirmed the
   shop should not be gated.

## What we did (in order)
1. **Data fix (immediate unblock).** Granted `is_lifetime_access=true` to all child profiles
   in families whose parent is premium (lifetime/founding/pro) — 11 kids across 7 families
   (incl. Itay/Emmy/Leia). Verified 0 premium-family children left locked. Reversible; does
   not touch real Lovable users (separate project).
2. **PR #147 — remove the shop gate** (`pkg/rewards-shop-ungate`, merged `835a9fe`). Deleted
   the `!isSubscribed` branch + dead imports/styles in both rewards screens. Aligns with PRD
   §5.1 + Pillar 1. tsc clean, jest 24/24. Verified in origin/main; worktree+branches cleaned.
3. **PR #148 — family-scoped subscription** (`pkg/subscription-family-scoping`, merged
   `29ac095`). `useFamilyMembers` now exposes `isLifetimeAccess`/`isLifetimeFounding`;
   `useSubscription` adds `childInheritedAccess` (child + any family parent has
   lifetime/founding) to `isSubscribed`. Parent path unchanged. Fixes the *other* still-gated
   features (Buddy/Skins) for children of premium parents — no manual data edits going
   forward. tsc clean, jest 39/39. Verified + cleaned up.
4. **V26 release** (`pkg/release-v26`, PR #156). Cut from main `7f8a8d8` (after #146/#147/
   #148/#149/#151 all merged — "merge first, build from main"). versionName 1.2.0.
   - Gate 0 manifest ✅ · Gate 1 (tsc/jest 300/300/expo-doctor 18/18/i18n/Values) ✅
   - Gate 2 emulator ⚠️ NOT completed (see below)
   - Gate 3 build ✅ — versionCode **27**, AAB `b9LPSvHK2LtZGtHtUdyV5f.aab`

## Why Gate 2 didn't complete
The machine had ~19 parallel CC sessions sharing ONE emulator. Symptoms while driving it:
- A previously-running Metro (port 8081) owned by another session served the wrong worktree's
  code. Took over 8081 to serve V26 (one parallel session had to restart its bundler).
- Under load, Metro intermittently socket-timed-out → dev-client error overlay; recovered on
  Reload but unreliably.
- Taps landed on stale/changed screens (state races / possible concurrent input from other
  sessions). The "View-as-Child" tap opened an Edit-Task modal instead.
- **Gotcha that cost time:** Git-Bash converts `/sdcard/...` device paths to
  `/Files/Git/sdcard/...` (MSYS path mangling), so `uiautomator dump /sdcard/x.xml` wrote to
  the wrong device path and every `cat /sdcard/x.xml` returned empty — looked like contention
  but was a path bug. Fix: `export MSYS_NO_PATHCONV=1; export MSYS2_ARG_CONV_EXCL="*"`.

What WAS confirmed (evidence): V26 code boots and renders (parent dashboard, child tasks with
Buffs, edit-task modal, #149 "שליחת מדבקה" button present), RevenueCat + Dashboard logs
healthy. Adi chose to build now and carry functional verification to Hat-4 on the real AAB.

## What remains (Hat-4 / Adi)
See `docs/releases/v26/HAT4_CHECKLIST.md`:
- Merge PR #156, download AAB, upload to Play internal track.
- Functional verify on the real build: shop has no LOCKED ZONE, child inherits premium
  (Buddy/Skins unlocked), stickers send→receive, view-as-child shows child data,
  credit-exploit (toggle done↔undone) no balance inflation, FCM push in tray.
- After live → "verified, tag it" → CC proposes `git tag v27`.

## Open follow-ups (carried to memory + INTEGRATION_LEARNINGS)
- **RC monthly/yearly subs not inheritable** — only lifetime/founding have a DB flag a child
  can inherit. A child of a parent on a recurring (non-lifetime) sub would still be gated on
  premium features. Needs a DB-backed signal for active RC subs.
- **#149 parent-stickers has no Flow Suite** in MASTER_TEST_PLAYBOOK — add one.
- **versionCode drift** — 26 was consumed by a parallel session's build; with many concurrent
  sessions, coordinate release builds to avoid number confusion.
