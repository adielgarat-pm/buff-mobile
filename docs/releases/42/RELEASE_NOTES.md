# Release v1.4.4 (versionCode 42)

## A. Technical (for STATUS + Play Console internal notes)
- versionCode **42**, versionName **1.4.4** — EAS build `0e62b1b4` (cut 2026-06-11 from `pkg/release-42 @ 892c564`, origin/main `0034200`)
- Supersedes build 41 (1.4.3, not yet promoted): carries all of 41's content + today's three merges
- Delta commits: `aaf1dda` (#219 platform backfill) · `fad5ed2` (#220 rewards focus-refetch) · `64f890b` (#221 safe-area top, 17 screens)
- Tests: Gate 1 ✅ (tsc 0 · jest 358/358 · expo-doctor 18/18 · i18n parity) · Gate 2 ✅ Hat-3 emulator (all three delta items verified live, see MANIFEST) · Hat-4 pending (real device)
- Schema: none ship in the AAB — migration 026 (`backfill_family_platform`) already live on `gfrongfnyigxsexuofrg`
- ⚠️ Inherited gates from 41: `push-notification-fanout` Edge Function deploys only when this build is promoted; #211 kid/push copy still DRAFT (Adi/Itay gate)

## B. User-facing (Hebrew, draft — Adi approves before any user-visible use)
<!-- אין משטח What's New באפליקציה עדיין (FLAG F-2026-05-30-01) — הבלוק מוכן לעתיד. -->
- כל הכפתורים חזרו להיות בהישג יד — תיקנו מסכים שבהם הכותרת הסתתרה מאחורי שעון המערכת
- מסך הפרסים של הילד מתעדכן מיד — ברגע שאישרתם בקשה, הילד רואה את זה
- שיפורים פנימיים ביציבות ובאיכות המעקב אחרי חוויית המשפחות
