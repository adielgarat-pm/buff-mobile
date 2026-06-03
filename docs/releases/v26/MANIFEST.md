# Release v1.2.0 (versionCode 28) — Manifest

**Cut date:** 2026-06-03
**Anchor:** tag `v25` (versionName 1.1.1, versionCode 25)
**Branch:** release/v26-aab (cut from `main` @ 57ff43c)
**Track:** internal
**EAS build:** caf7aab7-4508-409b-b4e0-b47464f1654d
**Naming note:** team "V26" = versionName **1.2.0**. EAS versionCode is remote/auto and landed on **28** (codes 26/27 consumed by earlier canceled attempts on 2026-06-03). Play Console ordinal only — must be monotonic; not a content difference.

## What's in this release

| # | Commit / PR | Type | Feature / Bug | Flow Suite | Targeted test (happy + edge) |
|---|---|---|---|---|---|
| 1 | #154 / 207821e | feat | Parent edit/delete tasks from the list + Settings version row | F (parent tasks) | tap task row → edit → save; tap → delete → confirm; version row shows installed build |
| 2 | #149 / 20cb651,a5f0683 | feat | Parent→child sticker sending (dedicated modal copy) | F (stickers) | send sticker from parent; child sees reveal on dashboard focus |
| 3 | #151 / 3981289 | fix | View-as-child used parent id → empty child screens | F (view-as-child P-08) | Settings → View as Child shows real child data (1 child + multi-child) |
| 4 | #151 / 0d30a25 | fix | Child credit/debit only on a real completion transition (infinite-credit guard) | F (child task complete) | complete task once credits once; toggle does not farm BUFFs |
| 5 | #148 / debf827 | fix | Child inherits parent's premium entitlement (family-scoping) | F (subscription gates) | premium parent → child sees ungated features |
| 6 | #147 / 86985bc | fix | Remove subscription gate from child rewards shop | F (child rewards) | child opens rewards shop without paywall |
| 7 | #146 | fix | FCM push fix | CC2 (Hat-4 only) | device-token registration — deferred to Hat 4 |

## Schema changes in this release?
- [x] none — `git diff --stat v25..HEAD` shows no new `supabase/` or `migration.sql` files. (The subscription family-scoping data fix / lifetime grants were applied in their own packages, not part of this build.)

## Notable risk / watch-items
- Child-credit guard (#4) touches the BUFF balance mutation path — the fragile, ledger-less credit model. Watch for under-crediting on legitimate completions.
- versionCode 28 (not 26) — confirm Play Console accepts the jump (it will; monotonic).
- FCM (#7) is still Hat-4-pending: 0 device tokens ever registered — verify on real device post-install.
