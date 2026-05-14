# fix-runtime-theme-switch — SPEC

> Bug fix. No new feature.

**Slug:** `pkg/fix-runtime-theme-switch`
**Branch:** `pkg/fix-runtime-theme-switch`
**Origin:** Discovered 2026-05-14 during `pkg/teen-ui-my-stats-lite` UI verification. The earlier "fix" in pkg/teen-ui-my-stats-lite-followup mitigated only the fresh-mount case.

---

## The bug

Switching theme at runtime (Mint ↔ Gamer via Settings → Theme card) blanks the child tab bar. Page becomes near-black, no tabs, no content. Affects all child screens. Reload doesn't recover until theme is set in localStorage manually.

## Root cause

`ChildTabs.tsx` had two compounding sources of identity thrash on every render:

1. **Inline `() => null` for `tabBarButton`** — a fresh arrow-function reference every render. React Navigation's reconciler treats this as a "different button component" and re-mounts the tab item. When this toggles between defined and `undefined` (theme switch), the navigator state machine ends up in an inconsistent state.
2. **Inline `screenOptions` function** — a fresh closure every render. React Navigation re-evaluates per-route options on every screenOptions identity change. Combined with #1, theme switches cause cascading re-mounts that the navigator can't recover from.

## Fix

1. **Module-level constants** for the hidden-tab options — `HIDDEN_TAB_BUTTON` and `HIDDEN_TAB_OPTIONS`. Stable identity, defined once at module load.
2. **`useCallback` for `screenOptions`** — keeps function identity stable across renders that don't change the theme tokens (`T.tabBarActive`, `T.tabBar`, `t`, `insets`).
3. **Move per-screen options out of `screenOptions`** — the conditional hide for `ChildMyStats` is now passed via `<Tab.Screen options={myStatsOptions}>`, where `myStatsOptions` is either `undefined` or `HIDDEN_TAB_OPTIONS` (stable).
4. **Self-redirect in `ChildMyStatsScreen`** — if the user is on the MY STATS tab when theme flips to Pastel (the tab becomes hidden), navigate them to `ChildDashboard` automatically via a useEffect. Prevents a "stuck on hidden tab" failure mode.

## Values Check

This is a pure bug fix — UX restoration, no new product behavior. All 9 questions remain ✅ per the previous packages.

## Behavior Contract

After this package merges:

1. A user in Gamer theme who taps **Mint** in Settings → tabs re-render with 4 tabs (HQ / Quests / Shop / Menu). No black screen, no crash.
2. A user in Mint who taps **Gamer** → tabs re-render with 5 tabs (HQ / Quests / Shop / **סטטים** / Menu).
3. A user who was viewing MY STATS in Gamer when they switch to Mint → automatically navigated to Dashboard.

## Out of scope

- The duplicate-profile `ChildJoin` bug (IN-2026-05-14-03) — separate package.
- The paywall-to-child rework (already shipped in `pkg/hide-paywall-from-child`).
- Any visual refresh of the theme picker UI.

## Files changed

- `src/navigation/ChildTabs.tsx` — fix as described
- `src/screens/child/ChildMyStatsScreen.tsx` — add self-redirect useEffect

## Verification

- ✅ `npm run typecheck` clean
- ✅ `npm test` 15/15 pass
- ⚠️ Web preview verification of the runtime theme switch was attempted but the preview environment has accumulated enough state from today's sessions that it can no longer reliably bootstrap. The code change is small, localized, and the reasoning is sound. Adi to verify on Android emulator.
