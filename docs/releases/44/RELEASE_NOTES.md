# Release v1.6.0 (versionCode 44)

## A. Technical (for STATUS + Play Console internal notes)
- **versionName** 1.6.0 · **versionCode** 44 (EAS remote auto-increment from 43)
- **Branch:** pkg/release-44 · **built from** `origin/main @ dc5b76a` (+ 2 release commits: `75abb46` prep, `dcadf69` Gate-2)
- **Anchor:** last promoted build 1.4.0 (versionCode 34), Alpha 2026-06-08
- **Content:** 17 items merged to main since the 34 cut (see MANIFEST.md) — Pause calendar-midnight, Off-Routine Day, Notifications UI (Phase 4) + safe-area fixes, reward-redemption discovery, kid mood-share, per-child streak, onboarding 24h reminder, medication-reminder anchor (#239), platform backfill, iOS readiness bundle.
- **Tests:**
  - Gate 1 (static) ✅ — tsc 0 / jest 392/392 / expo-doctor 18/18 / i18n parity 0
  - Gate 2 (functional Hat-3) ✅ — smoke green; 3 of 5 pending items verified on-device (#211 + both streak fixes), 2 deferred to Hat-4 (#209, #216) with jest-guard / shipped-engine coverage. No ❌, no beta-blocker.
- **Schema:** no new migration in this cut. Migrations 021/025/026/029 already applied to `gfrongfnyigxsexuofrg`.
- ⚠️ **Edge Function `push-notification-fanout`**: deploy ONLY when this build is promoted (kid reminders default off).

## B. User-facing (Hebrew, for the future in-app "What's New" — Adi approves before ship)
<!-- WHY/WHAT not HOW. Outcomes & feelings, not mechanics. No BUFFs/70%/BUDDY/counts.
     Staged for later — no in-app "What's New" surface yet (FLAG F-2026-05-30-01). -->
- מה חדש:
  - יום שכולו לא לפי הסדר? עכשיו אפשר לעבור ל"יום אחר" ולתת לילד/ה יום רך יותר, בלי לאבד את הקצב.
  - רגע טוב שמתחשק לחלוק? הילד/ה יכול/ה לבחור לשתף אתכם תחושה טובה — לגמרי בבחירה שלו/ה.
  - תזכורות עדינות שבאמת מגיעות אליכם, וכל אחד שולט במה שמתאים לו.
  - ועוד שיפורים קטנים שמרגישים גדול ביומיום.
