# Release 1.6.1 (versionCode 48)

## A. Technical (for STATUS + Play Console internal notes)
- **versionName** 1.6.1 · **versionCode** 48 (EAS remote auto-increment from 47)
- **Branch:** `pkg/release-48` · **built from** `2b47941` (+ prep `837d11b`)
- **EAS build:** `92e07549-2d0d-4e1a-93eb-ba4ca21a9ba0` (production app-bundle) — queued 2026-06-16
- **Anchor:** last build 1.6.0 (versionCode 47), 2026-06-15
- **Content:** 11 merges since the 47 cut (see MANIFEST.md). App-facing: completion confetti + sound (#253), "Recommended now" parent card (#252) + realtime crash fix (`89ab9cc`), BUDDY gift loop + L4/L5 (#244), reward size-null label fix (#248), off-routine leak fix (#243). Web-only/docs: #245/#246/#249/#247/#250.
- **Tests:** Gate 1 ✅ — tsc 0 / jest 423/423. Gate 2 pending (Hat-3 emulator + Hat-4 device).
- **Schema:** no new migration. `use_buddy_gift` RPC already live. New dep `expo-audio ~1.1.1`.

## B. User-facing (Hebrew — Adi approves before any in-app "What's New")
<!-- WHY/WHAT not HOW. Outcomes & feelings, not mechanics. -->
- מה חדש:
  - רגעים קטנים של שמחה כשמסיימים משימה — חגיגה קצרה שמרגישה טוב.
  - ה-BUDDY ממשיך לגדול איתכם, עם הפתעות קטנות בדרך.
  - להורה: הצעה אחת ברורה ל"מה הכי כדאי עכשיו", בלחיצה אחת — פחות רעש, יותר חיבור.
  - שיפורי יציבות ותיקונים קטנים מאחורי הקלעים.
