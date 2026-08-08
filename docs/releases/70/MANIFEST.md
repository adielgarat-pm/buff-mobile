# Release MANIFEST — 1.8.3 (versionCode 70)

> Prepared 2026-08-08 (documented after the fact — the build already existed on EAS). Content = everything merged to `main` after vc69's base (`764548b`, 1.8.2) up to the versionName bump (`02f2824`, 1.8.3).
> Build: EAS production app-bundle `3270b41b-fe53-44e0-8e53-e13d8284d80d`, from `origin/main @ 02f2824`, autoIncrement → vc70. Built 2026-08-07 by iamadi79. Fingerprint `f2ca396f82dd77fec09900a6897504b45eb69327` (distinct from vc69's `09ebe91d` — the native smart-join delta landed). Prior production build: 1.8.2 (vc69, base `764548b`).
> Theme: **the smart join link goes native** — this is the store build that #443 required (App Link intentFilter + `react-native-play-install-referrer` change the fingerprint, so it could NOT ride an OTA). Bundling everything else since vc69 drains the queue into one binary — notably #439 (unlimited motivators), whose auto-OTA only reached the vc69 runtime and never vc68 production users.
> AAB artifact: https://expo.dev/artifacts/eas/r-y6QLY-L65XKQHnyMsoHLMaq7MAxmYyMNoMwGXt_Cc.aab
> Build page: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/3270b41b-fe53-44e0-8e53-e13d8284d80d

## ⚠️ Build-time notes

1. **Native dep + App Link (#443):** `react-native-play-install-referrer@^1.1.9` (Adi-approved) + an `android.intentFilters` App Link (`autoVerify`) for `https://buffadhd.com/join/*`. Both change the fingerprint — this is why #443 needs a fresh binary, not an OTA. Referrer read is lazy / platform-split / time-boxed (2.5s) / consume-once (web + iOS no-op) to avoid the launch-crash blind spot (IN-2026-06-17 class).
2. **Fingerprint runtime:** `runtimeVersion: fingerprint` active — the build resolved clean (finished on EAS). From vc70 onward, JS-only fixes ship via `npm run ota:prod` against the vc70 runtime.

## Content (delta over vc69)

| PR / Commit | Type | Change | User-facing? | Gate 2 evidence |
|---|---|---|---|---|
| #443 `f14f084` | feat | **Smart join link goes native** — `https://buffadhd.com/join/CODE` is the child invite; Android App Link (`autoVerify`) opens ChildJoin directly, no-app installs route via Play with `referrer=join_CODE` auto-fill on first launch. Web/iOS/desktop → www PWA ChildJoin. **The reason this store build exists** (intentFilter + native dep ≠ OTA-able). | yes | Hat-1: tsc 0 · jest 108/108 · landing vite build ✓ · live web E2E code pre-filled; Hat-4: App Link autoVerify + referrer auto-fill on a real Play install |
| #441 `536e6d3` | feat | **Onboarding handoff reframed — 3 child-access paths** + shared-device View-as-Child launch. | yes | Hat-3 Android verification (#447 docs) |
| #439 `237b80d` | feat | **Unlimited motivator picks + a reward menu that scales with them** — UStep4 drops the max-2 cap (min 1); UStep5 seeds rewards from every selected motivator, deduped by `title.en`. Insert-only, no balance/ledger mutation. | yes | Hat-1 jest 934/934 · `buildRewards` scaling+dedup empirically proven; Values 9/9. **Was OTA'd only to the vc69 runtime — vc70 is its first store binary for vc68 prod users.** |
| #435 `6027466` | feat | **Review ask fires only on a winning yesterday** — native in-app-review card + web rate banner gate on `hasWinningYesterday` (≥1 child meeting `completed >= min(3, scheduled)`, D-2026-06-14). | yes (parent) | Hat-1: happyMoment 9/9 (rateBuff 18/18) |
| #432 `0c4262b` | fix | **Co-parent Join-Family card hidden once the family has children** — gated on `!childrenLoading && children.length === 0`; prevents an established parent orphaning their children by switching families. | yes | Hat-1 jest 931/931; Hat-4 auth/family-state |
| #436 `4b8405c` | feat | **Admin tester board shows every parent + per-person device** (migration 055, already live). | no (admin) | tsc clean (admin-web); Adi visual check post-deploy |
| #438 `9d69002` | fix | **Admin platform column shows every family device; creator falls back to signup platform.** | no (admin) | tsc clean (admin-web) |

**Docs / store-listing only (no build impact):** #445 versionName bump, #444/#442/#440/#437/#433 queue rows, #434 store-listing assets + revised description, #447 child-access-paths Hat-3 verification, #446 unlimited-motivators E2E web spec.

## Gates
- **Gate 1 (on `02f2824`):** the build finished on EAS (fingerprint resolved clean). Per-row Hat-1 evidence above (tsc 0 · jest green per PR at merge).
- **Gate 2:** per-row evidence above. Full device sweep of the merged tree not run — Hat-4 items below.
- Schema changes: migration 055 (#436, additive, already live). New dependencies: `react-native-play-install-referrer` (#443, Adi-approved). Edge functions: none gated to this build.

## Delivery / submission status
- **Build:** ✅ finished on EAS (vc70, 1.8.3).
- **Play Console:** ⚠️ **NOT uploaded.** Only vc69 (1.8.2) is in the console. `eas submit` is configured in `eas.json` but points at `./google-play-key.json`, which does not exist locally (EAS Submit service-account deferred) — so submission is **manual**: download the AAB (link above) → Play Console → Internal testing → new release → upload → roll out. vc70 > vc69, distinct versionName, so no Play collision.
- **Web (www + landing):** ✅ already live from `main` Vercel deploys — `/join/CODE` routing works.

## Hat-4 (Adi, real device, after install from the promoted vc70)
1. **Smart join link (#443, the point of this build):** share a `buffadhd.com/join/CODE` link → on an Android device **with** the app, it opens ChildJoin directly (App Link autoVerify); **without** the app, Play install → first launch pre-fills the code (Install Referrer).
2. **Unlimited motivators (#439):** add a child → pick 3–5 motivators → reward preview scales, no duplicates.
3. **Rate-on-winning (#435):** after a winning yesterday the rate surface may appear; after a non-winning one, never.
