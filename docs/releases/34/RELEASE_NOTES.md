# Release v1.4.0 (versionCode 34)

## A. Technical (STATUS + Play Console internal notes)
- versionCode **34**, versionName **1.4.0**
- Build commit: `c9eb5fa` (branch `release/2026-06-08`, off main `4139d2e`)
- Change set: `c34a68a..main` — 11 items (3 feat + 6 fix + 1 chore + funnel feat)
- AAB: https://expo.dev/artifacts/eas/m48Y8qGvb1xCHnaNssqu47.aab
- Tests: Gate 1 ✅ (tsc/expo-doctor/i18n; jest 347/348 — 1 pre-existing non-regression) · Gate 2 → Hat-4 · Hat-4 pending
- Schema: migrations 021 (family platform) + 022 (owndevice parent edit) — applied & verified
- Headline: funnel platform capture · iOS Phase-1 (paywall hidden, RevenueCat skipped, iOS builds enabled) · admin Tester Board · credit-vault atomic race fix · own-device child edit · task day-filtering · duplicate-child guard

## B. User-facing (Hebrew — DRAFT, needs Adi's approval; no in-app "What's New" surface yet, FLAG F-2026-05-30-01)
<!-- WHY/WHAT not HOW. Outcomes & feelings, not mechanics. -->
- שיפורים מאחורי הקלעים ליציבות ולחוויה חלקה יותר.
- הורים יכולים לערוך את הפרטים של ילד שמשתמש במכשיר שלו.
- תיקוני עקביות במסכי הילד והתאמות שפה.

> Most of this train is infra / admin / iOS-foundation / bug-fixes — little is directly user-visible, so the Hebrew block is intentionally minimal. Adi to approve/adjust before any user-facing use.
