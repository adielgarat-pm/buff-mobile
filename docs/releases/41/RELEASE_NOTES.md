# Release v1.4.3 (versionCode 41)

## A. Technical
- versionCode **41**, versionName **1.4.3**
- Cut from `pkg/release-41` @ `1148f84` (origin/main `07ba6d0`)
- EAS build: `0bbd6332-048a-4840-96a8-619d38799dc1`
- Anchor: build 40 (`c30c9dc`, 1.4.2)
- **Delta over build 40:** `#215` denial-banner safe-area fix · `#211` kid vibe-share
- Tests: Gate 1 ✅ (tsc / jest 358 / expo-doctor 18 / i18n / Values#211) · Gate 2 → Hat-4 (delta items are real-device) · Hat-4 pending
- Schema: none new in AAB (#211 migration `025` already live on DB)
- ⚠️ Edge Function `push-notification-fanout` deploy gated on 41 promotion

## B. User-facing (Hebrew — DRAFT, Adi approval before any in-app "What's New")
<!-- WHY/WHAT not HOW. #211 copy itself is still a draft pending Adi/Itay. -->
- כשילד/ה במצב רוח טוב — אפשר לשתף את ההורה בלחיצה, והרגש מגיע בעדינות (פרטי כברירת מחדל).
- תיקון: באנר ההתראות לא נחתך יותר מאחורי כפתורי הניווט.

> No in-app "What's New" surface yet (FLAG F-2026-05-30-01) — staged for later.
