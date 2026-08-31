# play-code-optimization — STATUS

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| SPEC | ✅ drafted | 2026-08-31 | 5a1… | n/a | R8 package for Google Play "Code optimization ≥25%" |
| SPEC review | ✅ finalized after architect review + API verification | 2026-08-31 | 3fe5eac | 977 jest + typecheck green | No open technical questions |
| Phase 1 — enable R8 | ✅ config complete (pending EAS build + Hat-4 device verify) | 2026-08-31 | _(this commit)_ | 977 jest + typecheck + expo-config resolve + throwaway-prebuild wiring verified | Awaiting production AAB to confirm build succeeds + Play Console ≥25% |

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
