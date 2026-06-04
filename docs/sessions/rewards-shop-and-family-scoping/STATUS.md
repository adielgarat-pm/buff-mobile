# rewards-shop-and-family-scoping — STATUS

> Session 2026-06-03. Started from Adi's question: "why does Itay see this view
> (LOCKED ZONE) instead of his rewards?" Ended with V26 release prep.

| Step | What | State | Date | Commit / PR | Tests |
|---|---|---|---|---|---|
| 1 | Diagnose Itay's LOCKED ZONE | ✅ | 2026-06-03 | — | root cause found (subscription gate + per-profile check + PRD §5.1 drift) |
| 2 | Data fix — grant lifetime to children of premium parents | ✅ live | 2026-06-03 | SQL (mobile DB) | 11 kids across 7 families unlocked; 0 left locked |
| 3 | Remove subscription gate from rewards shop | ✅ merged | 2026-06-03 | PR #147 `835a9fe` | tsc clean; jest 24/24 |
| 4 | Child inherits parent's premium entitlement (family-scoped) | ✅ merged | 2026-06-03 | PR #148 `29ac095` | tsc clean; jest 39/39 |
| 5 | V26 release prep (build from main) | ✅ built | 2026-06-03 | PR #156 / branch `pkg/release-v26` | Gate 1 green; Gate 3 build done |

## V26 release summary
- **versionName 1.2.0**, **versionCode 27** (EAS auto-incremented 26→27 — 26 already consumed, likely a parallel session's build same day).
- **AAB:** https://expo.dev/artifacts/eas/b9LPSvHK2LtZGtHtUdyV5f.aab
- Contents: #146 FCM · #147 shop ungate · #148 family-scoped subscription · #149 parent→child stickers (feat) · #151 view-as-child + credit-exploit guard.
- Gate 2 (emulator functional) NOT completed — see SESSION_LOG + HAT4_CHECKLIST.

## Legend
- `✅ merged` — in main · `✅ built` — AAB produced, not yet uploaded · `⚠️` — partial

## What remains (Hat-4 / Adi)
1. Merge PR #156 (versionName bump 1.2.0 + release docs).
2. Download AAB → upload to Play Console internal track.
3. Run the functional verification in `docs/releases/v26/HAT4_CHECKLIST.md` (carries Gate 2: shop has no LOCKED ZONE, stickers, credit-exploit, FCM).
4. After live on internal track → tell CC "verified, tag it" → CC proposes `git tag v27`.
