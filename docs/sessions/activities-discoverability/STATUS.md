# Activities Discoverability — Status

Surface the live **פעילויות וציוד** (Activities & gear) feature on the parent dashboard so parents discover it (previously reachable only from a Settings row). Origin: tester feedback (Noa, 2026-07-31).

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| 0 — Decisions + SPEC | ✅ done | 2026-07-31 | (branch) | — | D1 name "פעילויות וציוד" (no "organizer" collision with live #411 capture card) · D2 below the insight card, never above · D3 mirror ParentCaptureEntry · D5 card only, no nudge/badge · D6 keep Settings row · D7 independent of activities-multi-day. |
| 1 — Entry card + telemetry + copy + rename | ✅ code-complete | 2026-07-31 | (branch) | tsc 0 · jest 9/9 (dedup 4 + card 5) | `ParentActivitiesEntry.tsx` (🎒, no flag/pill/badge, unconditional render) · `lib/activities/entryTelemetry.ts` (own session Set — cannot cross-cancel with capture) · mounted below insight block on `ParentDashboardScreen` · `activities_entry_seen`/`activities_entry_tapped` added to `OnboardingEventType` (DB column is free text — no migration) · i18n `activities.entryTitle`/`entrySub` (he+en). **Consistency rename folded in (Adi, expert-recommended):** `activities.pageTitle` + `settings.rowActivities` → "פעילויות וציוד" / "Activities & gear" so card→screen→settings speak one name. **Hat-3/Hat-4 device check pending (parent dashboard is auth-gated).** |
| 2 — Exit | ✅ done | 2026-07-31 | (branch) | — | SPEC copied to branch · STATUS + SPEC_SYNC written · RELEASE_QUEUE row on merge · Values re-checked against built copy (inherits parent-package 9/9; no new child surface, no currency, no failure framing). |

## Final copy (Adi-approved 2026-07-31)
- **Entry title** — he: `פעילויות וציוד` · en: `Activities & gear`
- **Entry sub** — he: `חוגים, פעילויות ומה שלוקחים איתנו` · en: `Classes, activities, and what to bring along`
- Seasonality note: dropped "קייטנות/camps" from the sub — season-bound noun reads wrong ~10 months/year on an always-on card (Adi 2026-07-31). Evergreen umbrella instead.

## Verification summary
- **Hat-1:** `tsc --noEmit` 0 errors (whole repo) · jest 9/9 for this package (`entryTelemetry` dedup 4/4 — first-true/repeat-false/co-parent-separate/null-familyId-false; `ParentActivitiesEntry` 5/5 — renders unconditionally, logs `_seen` once, re-mount no second `_seen`, no `_seen` before familyId resolves, tap → `navigate('Activities')` + `_tapped`) · i18n JSON valid both locales.
- **Platform parity:** pure JS/RN, no native API, no schema — identical on Android native + Expo Web PWA. RTL (he) + LTR (en) both carried by the mirrored capture-card layout.
- **Hat-3 (emulator):** ⏳ pending — dashboard shows "פעילויות וציוד" below the insight card → tap → lands on Activities screen; pull-to-refresh ×3 → still one `activities_entry_seen`.
- **Hat-4 (real device):** ⏳ pending — RTL/LTR wording; confirms the card reads *quieter* than the insight card above it (placement/visual weight). Auth-gated (logged-in parent) → Adi's check.

## Scope guards honored
- `ParentCaptureEntry` / capture feature (#411) **untouched** — its own session Set stays separate; new telemetry lives in a parallel module.
- No migration, no feature flag, no schema, no new child-facing surface.
- Multi-day weekdays (`activities-multi-day`) **not coupled** — this package drives discovery of the single-day feature that works today.
