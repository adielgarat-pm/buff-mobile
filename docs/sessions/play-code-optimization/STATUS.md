# play-code-optimization — STATUS

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC | ✅ drafted | 2026-08-31 | 5a1… | n/a | R8 package for Google Play "Code optimization ≥25%" |
| SPEC review | ✅ finalized after architect review + API verification | 2026-08-31 | 3fe5eac | 977 jest + typecheck green | No open technical questions |
| Phase 1 — enable R8 | ✅ config complete | 2026-08-31 | 26c785c | 977 jest + typecheck + expo-config resolve + throwaway-prebuild wiring verified | R8 flags land in Gradle; Sentry AGP applied |
| Phase 1 — EAS production build | ✅ **build SUCCEEDED with R8 on** | 2026-08-31 | 26c785c | EAS build finished, AAB produced | Run #8; R8 minify+shrink did NOT break the build; no keep-rules needed. Remaining = Hat-4 device smoke + Play Console ≥25% |

## EAS production build result (run #8, wait=true)
- Triggered by Claude via the `eas-build-android.yml` workflow_dispatch on this branch (sha `26c785c`).
- **Build finished successfully** — R8 (`minifyEnabled` + `shrinkResources`) + Sentry AGP did **not** break the production AAB. RevenueCat/svg/Sentry consumer rules sufficed; **no `extraProguardRules` needed**.
- EAS build page: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/d8cee29c-1103-4c92-9d00-be559683df94
- AAB artifact: https://expo.dev/artifacts/eas/EZ1bIGDswcdPaq9Jw602Nulo_JPR4KeFAr2pWqNWlrg.aab
- Job step "EAS build (Android app-bundle)" ran ~12.5 min (17:52:51→18:05:30 UTC) — a real completed cloud build, not just a submission.

## What shipped (config only — no app source changed)
- **Dependency:** `expo-build-properties@1.0.10` (SDK 54-pinned) added.
- **`app.json` — R8:** new `expo-build-properties` plugin with
  `android.enableMinifyInReleaseBuilds: true` + `enableShrinkResourcesInReleaseBuilds: true`.
- **`app.json` — Sentry mapping upload:** extended the existing `@sentry/react-native/expo`
  plugin with `experimental_android.enableAndroidGradlePlugin: true` +
  `autoUploadProguardMapping: true`, so R8's `mapping.txt` auto-uploads and native crash
  frames stay symbolicated (Pillar 2 stability requirement).

## Local validation performed (does NOT replace the EAS build)
- `app.json` valid JSON after both edits.
- `expo config --type prebuild` resolves all plugins incl. `expo-build-properties`.
- **Throwaway `expo prebuild`** (android/, gitignored, deleted after) confirmed the flags
  actually wire into Gradle:
  - `gradle.properties`: `android.enableMinifyInReleaseBuilds=true`,
    `android.enableShrinkResourcesInReleaseBuilds=true`
  - `app/build.gradle` release block: `minifyEnabled` + `shrinkResources` + `proguardFiles` active
  - Sentry AGP applied (`io.sentry.android.gradle`, `sentry-android-gradle-plugin:5.11.0`),
    `autoUploadProguardMapping` + `includeProguardMapping = true`
- `tsc --noEmit` clean; Jest **977 passed / 113 suites** (1 skipped).
  > Note: typecheck/Jest are JS-sanity only — they do NOT exercise R8. The AAB is the real test.

## Left for Adi (Hat-4 / build-time — cannot be done from this session)
1. Trigger the production AAB: `eas build --profile production --platform android`.
2. Confirm the build **succeeds** with R8 on (watch for R8/AGP resolution errors — RevenueCat-ui
   is the first suspect; fix via `extraProguardRules`, never by disabling minify).
3. Smoke test the AAB on device: parent OAuth + ChildJoin, RevenueCat Paywall, notifications+icon,
   splash/adaptive-icon, fonts, deep link `buffadhd.com/join`.
4. Sentry: force a JS test crash **and** a native test crash on the new release/dist; confirm both
   symbolicate and a mapping artifact is attached.
5. Play Console → Code optimization shows **≥25% / green**; record the AAB size delta vs previous.

## Not in this package
- Memory / bitmap optimization (separate — needs the Play Console memory report first).
- Device migration / Restore Credentials (separate — functionally already works via ChildJoin;
  store-compliance API deferred, deadline Apr 2027).
