# Release v1.5.0 (versionCode 43)

## A. Technical (STATUS + Play Console internal notes)
- versionCode **43**, versionName **1.5.0**
- Cut from `main` HEAD `4984572`; release commit `aa68a8d` (branch `pkg/release-43`, worktree off main)
- **Carries everything since the live Alpha 1.4.0(34)** — the un-promoted 39/41/42 stack + 5 PRs merged after the 42 cut (#225 i18n sweep, #226 iOS readiness/account-deletion, #227 sticker-preview fix, #228 equipment backpack, #229 activities/camp-lists). Supersedes the un-promoted 39/41/42.
- Tests: Gate 1 ✅ (tsc 0 · jest 388/388 · expo-doctor 18/18 · i18n parity 0) · Gate 2 boot+core-render ✅ (zero ❌); deep new-feature UI → Hat-4
- Schema: all migrations live on `gfrongfnyigxsexuofrg` (delete_account_rpc, soft_delete_child, 026/027/028_activities + the inherited 39/41/42 set)
- Sentry env wired in the production profile (source-map upload — confirm in build log, Hat-4)

## B. User-facing (Hebrew — DRAFT, Adi approves before any "What's New" surface)
<!-- WHY/WHAT not HOW. Outcomes & autonomy, not mechanics. No BUFFs/%/BUDDY/counts. -->
- חדש: רשימות ציוד לחוגים, ימי בריכה וקייטנות — שהילד/ה יכול/ה להכין לבד, בלי שתצטרכי להזכיר
- חדש: יום שונה מהשגרה? אפשר להתאים את היום בלי ללחוץ — האפליקציה זורמת עם החיים, לא נגדם
- שליטה מלאה שלך: אפשר עכשיו למחוק חשבון או להסיר ילד/ה ישירות מתוך האפליקציה
- שיפורי שפה ועקביות לאורך האפליקציה

> Note: no in-app "What's New" surface exists yet (FLAG F-2026-05-30-01) — block B is staged for later.
