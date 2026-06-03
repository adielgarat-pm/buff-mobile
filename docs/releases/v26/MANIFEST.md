# Release v1.2.0 (versionCode 26) — Manifest

**Cut date:** 2026-06-03
**Anchor:** tag `v25` (versionCode 25)
**Branch:** release/v26 (off `main`)
**Track:** internal
**EAS build:** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/b86ccd1b-20b2-420a-b2c5-6c1d47c69dbd

## What's in this release (v25..main)

| # | PR | Type | Feature / Bug | Gate 2 coverage |
|---|----|------|---------------|-----------------|
| 1 | [#149](https://github.com/adielgarat-pm/buff-mobile/pull/149) | feat | **Parent→child stickers** — wires up the previously-placeholder "Send Sticker" button (fixes Shani's "can't send a sticker to Mattan" report) | Hat 3 E2E ✅ (send → DB row via RLS → Gamer-theme reveal → is_seen flip → no re-pop) + V26 combined-bundle boot smoke ✅ |
| 2 | [#148](https://github.com/adielgarat-pm/buff-mobile/pull/148) | fix | subscription-family-scoping — child inherits parent's premium entitlement | tested at merge; Hat 4 (real entitlement) |
| 3 | [#147](https://github.com/adielgarat-pm/buff-mobile/pull/147) | fix | rewards-shop-ungate — remove subscription gate from child rewards shop | tested at merge; boot smoke ✅ |
| 4 | [#146](https://github.com/adielgarat-pm/buff-mobile/pull/146) | feat | fcm-push-fix — switch dispatch to Expo Push API + Android FCM config | Hat 4 (push on real device — `project_fcm_hat4_pending`) |

## Schema changes in this release?
- [x] **None.** The `stickers` table + RLS already existed (provisioned from Lovable web); mobile only wired up the UI.

## Notable risk / watch-items
- **Pastel-theme sticker reveal** not device-verified (test child was Gamer theme). Shared component, mounted identically, typecheck-clean — low risk. → Hat 4.
- **Custom-note sticker text** path sent with empty note in E2E (default message rendered). Trivial passthrough. → Hat 4.
- Jest shows 3 flaky suites under parallel workers (EditChildScreen, ManageChildrenScreen, UStep8_Complete) — **all pass serially (300/300 `--runInBand`)**. Test-infra flakiness, not a code regression.

## Gate results
| Check | Result |
|-------|--------|
| tsc | ✅ 0 errors |
| jest | ✅ 300/300 (serial) |
| expo-doctor | ✅ 18/18 |
| i18n parity | ✅ 0 missing |
| Values Check (stickers) | ✅ 9/9 |
| Gate 2 functional | ✅ headline E2E + boot smoke |
| Build (Gate 3) | versionCode 26 — running |
