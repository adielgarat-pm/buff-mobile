# Release v1.4.1 (versionCode 38)

## A. Technical (for STATUS + Play Console internal notes)
- versionCode **38**, versionName **1.4.1**
- Built from: `main @ 6468037` + versionName bump (release branch `release/2026-06-08-v35`, build commit `722c9d4`)
- EAS build: `a1798c89-6f8a-481a-a2b9-93d5ca614ae6` — https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/a1798c89-6f8a-481a-a2b9-93d5ca614ae6
- Anchor: previous promoted build `1.4.0 (34)` (Alpha, 2026-06-08)
- Change set: 4 PRs not in build 34 — #198 (Pause calendar-day), #199 + #201 (Off-Routine Day), #194 (remove dev toggle)
- Tests: Gate 1 ✅ (tsc 0 · jest 351/351 · expo-doctor 18/18 · i18n parity · Values Check ✅). Gate 2 emulator smoke deferred (changes are date-logic + each Hat-3 verified pre-merge); **Hat-4 device pass is the real gate** (Pause/Off-Routine are calendar-sensitive). 
- Schema: no new migration in this build. `off_routine_until` (#199) + notifications-hardening P2/P3a migrations already applied to `gfrongfnyigxsexuofrg` in their own packages.
- Note: planned as versionCode 35; EAS remote counter was at 37 → landed on **38**.

## B. User-facing (Hebrew, for the future in-app "What's New") — DRAFT, needs Adi approval
<!-- WHY/WHAT not HOW. Outcomes & feelings, not mechanics. No BUFFs/tasks/count. -->
- **ימים לא תמיד הולכים לפי התוכנית.** עכשיו אפשר לבחור "יום רך" — להוריד הילוך ביום עמוס, בלי לאבד את הקצב. ממשיכים, בעדינות.
- **כשבוחרים הפסקה — ברור בדיוק מתי חוזרים.** ההפסקה מסתיימת בצורה נקייה וצפויה.

> No in-app "What's New" surface exists yet (FLAG F-2026-05-30-01) — this block is staged for later.
