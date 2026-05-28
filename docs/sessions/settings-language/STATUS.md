# settings-language — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.
>
> Note: this package was handed to CC directly (plan-in-chat), so there is no
> SPEC.md / SPEC_SYNC.md / ROADMAP.md for the slug. The package goal, the one
> discovered surprise, and the Values Check are captured here + in
> INTEGRATION_LEARNINGS IN-2026-05-28-01.

## Goal

Surface an in-app language switcher (he/en) in Settings so users don't depend on
the hard-to-find login-screen globe. Added to **both** Parent and Child settings.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 1 — Settings language switcher (parent + child) + RTL restart fix | `_passed_` | 2026-05-28 | (this commit) | 250/250 jest, tsc clean, i18n:check ✅ | IN-2026-05-28-01 |
| 2 — Hat-4 emulator verification | `_blocked_` | — | — | — | — |

## What shipped

- New **"Language" (he/en) row** in a dedicated **"General"** section of both
  `ParentSettingsScreen` and `ChildSettingsScreen`. Each opens the shared
  `LanguagePickerModal`.
- **`LanguagePickerModal.tsx`** (new) — the language-choice sheet, extracted from
  `LanguagePicker.tsx` (which previously held the modal inline). The auth-screen
  globe trigger now renders the shared modal; its public API is unchanged.
- **Fixed `LanguageContext.reloadApp()` no-op** (IN-2026-05-28-01): a he↔en switch
  now prompts a restart (confirm Alert) and reloads via `expo-updates`, with a
  `.catch()` fallback for dev clients / Expo Go.
- **New i18n keys** (en + he): `settings.sectionGeneral`, `settings.rowLanguage`,
  `childSettings.generalSection`, `language.pickerTitle`,
  `language.restart{Title,Message,Confirm,Cancel}`.
- **Test:** extended `ChildSettingsScreen.test.tsx` — added `useLanguage` to the
  LanguageContext mock and an `initReactI18next` stub to the react-i18next mock
  (the new modal pulls in `src/i18n`, which calls `i18n.use(initReactI18next)`).

## Values Check (verified against implemented behavior)

All 9 pass:
- **Intrinsic Motivation:** choosing your own language is pure autonomy; no
  extrinsic mechanic, reward, or currency added.
- **Positive Coaching:** neutral, non-judgmental preference UI; no failure state;
  restart copy is gentle ("everything is saved 💚"), no "must"/"חייב".
- **Independence-Building:** gives the child direct control over their own reading
  comfort and an explicit voice (a row in *child* settings); creates no dependency.
- **Hard product rule honored:** switching language only writes AsyncStorage +
  i18n; no auth is touched, so it works for a kid already in a persistent session
  (even the reload does not log them out — the Supabase session is persisted).

## Legend

- `_pending_` — לא התחיל · `_in_progress_` — באמצע · `_passed_` — עבר · `_failed_` — נכשל · `_blocked_` — מחכה לחיצוני

## Closeout

- [x] Code phase passed (tsc clean + 250/250 jest + i18n:check ✅)
- [x] INTEGRATION_LEARNINGS.md updated (IN-2026-05-28-01)
- [ ] Hat-4: Adi verifies on Android emulator — row visible in both Settings, modal
      opens, en↔he switches strings + restart prompt flips RTL, kid session not
      logged out
- [ ] PR to main, merge, branch deleted
