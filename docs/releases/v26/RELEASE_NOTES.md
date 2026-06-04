# Release v1.2.0 (versionCode 27)

> NOTE: requested as "V26", but EAS remote auto-increment produced **versionCode 27**
> (26 was already consumed on the EAS remote counter — likely a parallel session's
> build earlier the same day). Content is the intended V26 set; only the build number differs.

## A. Technical (for STATUS + Play Console internal notes)
- versionCode 27 (EAS remote auto-increment), versionName 1.2.0
- EAS build: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/5234f61c-5427-4fe0-9118-aace4dbdbdea
- Anchor: v25 (1.1.1). Cut from main `7f8a8d8` → release branch `pkg/release-v26` @ `a6c5313`.
- Contents:
  - #146 — FCM push delivery fix
  - #147 — remove subscription gate from child rewards shop (PRD §5.1 alignment)
  - #148 — child inherits parent's premium entitlement (family-scoped subscription)
  - #149 — parent→child affirmation stickers (feat)
  - #151 — view-as-child-from-Settings empty screens + infinite BUFF task-credit exploit guard
- Gates: Gate 0 ✅ · Gate 1 ✅ (tsc / jest 300/300 / expo-doctor 18/18 / i18n / Values) · Gate 2 ⚠️ not completed on emulator (19-session contention — Metro timeouts + state races); V26 code confirmed to boot+render; functional verification deferred to Hat-4 on the real AAB · Gate 3 ✅ **build finished**
- **AAB artifact:** https://expo.dev/artifacts/eas/b9LPSvHK2LtZGtHtUdyV5f.aab
- Build page: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/5234f61c-5427-4fe0-9118-aace4dbdbdea
- Confirmed: versionCode **27** (EAS incremented 26→27), Sentry env wired (SENTRY_ORG/PROJECT/DSN) → source maps uploaded.
- Schema: none new in this release.

## B. User-facing (Hebrew, for the future in-app "What's New") — DRAFT, needs Adi approval
<!-- WHY/WHAT not HOW. Outcomes & feelings, not mechanics. No "BUFFs/tasks count/%". -->
- הורים יכולים עכשיו לשלוח רגע של עידוד לילד/ה — דרך קטנה לחזק את הקשר ביניכם.
- חוויה חלקה ויציבה יותר בכל המסכים.

> ⚠️ No in-app "What's New" surface exists yet (FLAG F-2026-05-30-01). This block is staged for later and is NOT shipped anywhere user-visible until Adi approves.
