# STATUS — recommended-now-card

| Date | State | Branch / Commit | Tests | Learnings |
|---|---|---|---|---|
| 2026-06-16 | Built; static-verified; live (Hat-3) blocked by env | `pkg/recommended-now-card` (this commit) | tsc 0 errors · engine 12/12 · i18n guard 5/5 · `i18n:check` pass · bundle builds clean (17MB, HTTP 200) incl. card | IN-2026-06-16-01 |

## Verification detail

- **Hat 1 (static):** ✅ `tsc --noEmit` 0 errors · `jest src/utils/__tests__/recommendationEngine.test.ts` 12/12 · `jest i18nCatalogIntegrity i18nNoHardcodedCopy` 5/5 · `npm run i18n:check` all keys resolve in en+he.
- **Data sanity (MCP):** ✅ Family `a1b2c3d4…` has unread `anchor_recovery` notifications (Etay west, אמי), `pause_mode_active=false`, Etay has 2 med tasks → comeback path will fire on the dashboard.
- **Hat 3 (emulator):** ⚠️ **BLOCKED — environmental.** Dev-client APK on the emulator is stale: `ClassNotFoundException: expo.modules.splashscreen.SplashScreenManager` at `MainApplication.onCreate` → app crashes before loading the JS bundle. Not related to this feature (JS-only). The Metro bundle itself builds fully and includes `RecommendationCard.tsx` (module 2129). Needs `npx expo run:android` (native rebuild) to unblock.
- **Hat 4 (real device):** ⬜ Pending Adi — confirm the comeback card renders for the lapsed family and the sticker CTA opens the sticker modal.

## Open follow-ups

- Re-run Hat-3 after a dev-client rebuild, or verify on real device.
- v2: live parent-triggered Vibe Check prompt; freeform nudge; push (FCM Hat-4); true auto-shrink-to-anchor.
- Remove `AnchorRecoveryPromptModal` entirely once card parity is confirmed on device.
