# Release 1.7.6 (versionCode 56)

**Date:** 2026-06-23
**Base commit:** `1bb0a0b`
**Type:** Patch — web fixes

## What's in this build

| PR / commit | Type | Description |
|---|---|---|
| `1bb0a0b` | fix | **Onboarding web RTL/LTR** — WelcomeScreen, _OnboardingShell, UStep5_Preview replaced `I18nManager.isRTL` (always false on web) with `useRTLStyles()`. Back chevron, card emoji side, text alignment now correct on Expo Web for Hebrew users. |
| `1bb0a0b` | fix | **ParentInsightsScreen web scroll** — ScrollView missing `flex:1`; page couldn't scroll on web. |
| `1bb0a0b` | fix | **Motivator copy** — `"הרוויח הרשאות ופרסים"` → `"הרשאות ופרסים"` (consistent noun-phrase pattern). |

## Platforms affected
- Web (Expo Web PWA): all three fixes apply
- Android: copy fix only (RTL + scroll were web-only bugs)

## Gates
- [ ] Gate 1: EAS build succeeds
- [ ] Gate 2: Web deploy (Vercel) — verify Hebrew onboarding RTL
- [ ] Gate 3: Android smoke test (copy change visible in UStep4)
