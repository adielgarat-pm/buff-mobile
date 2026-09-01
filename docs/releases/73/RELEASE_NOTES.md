# Release v1.8.4 (versionCode 73)

## A. Technical (for STATUS + Play Console internal notes)
- versionCode 73 (EAS remote auto-increment 72→73), versionName 1.8.4
- EAS build: https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/68bf9a5b-8ca2-4ca7-82ac-27bd44577b18
- AAB artifact: https://expo.dev/artifacts/eas/n46zY_-tYPNJkn563bTb7sk5r90kb8UVC3TkQtHE2GQ.aab
- Cut from branch `claude/google-play-quality-requirements-ksjrpc` @ `cb24926` (merge of `origin/main` into the R8 branch).
- Contents:
  - #459 — timetable: PDF import + same-slot lesson options joined with "/"
  - #460 — timetable: rename import card to "Load file", daily-cap message, bump 1.8.4
  - `pkg/play-code-optimization` — Google Play "Code optimization" requirement: R8 enabled
    (`enableMinifyInReleaseBuilds` + `enableShrinkResourcesInReleaseBuilds` via
    `expo-build-properties`), Sentry Android Gradle plugin wired for `mapping.txt` upload
    (`experimental_android.enableAndroidGradlePlugin` + `autoUploadProguardMapping`).
- Gates: Gate 1 ✅ (tsc clean · jest 989/990, 1 skipped · i18n · Values) · Gate 3 build ✅
  (EAS production AAB finished with R8 on — build did NOT break; no `extraProguardRules` needed).
- Schema: none new in this release.
- Target: Play internal testing track.

## B. User-facing (Hebrew, for the future in-app "What's New" / Play release notes) — DRAFT, needs Adi approval
<!-- WHY/WHAT not HOW. Outcomes & feelings, not mechanics. No "BUFFs / tasks count / % / R8 / versionCode". -->

**עברית:**
- עכשיו אפשר לטעון את מערכת השעות של הילד/ה ישירות מתמונה או מקובץ PDF — הקמה מהירה, בלי להקליד הכול ידנית.
- שיעורים באותה משבצת מוצגים יחד, בצורה ברורה יותר.
- שיפורי ביצועים: האפליקציה קלה ומהירה יותר.

**English:**
- Load your child's school timetable straight from a photo or a PDF — quick setup, no manual typing.
- Lessons in the same slot now show together, more clearly.
- Performance improvements: the app is lighter and faster.

> ⚠️ No in-app "What's New" surface exists yet (FLAG F-2026-05-30-01). Block B is staged for the
> Play internal-testing release notes and future in-app use; not shipped user-visible elsewhere until Adi approves.
