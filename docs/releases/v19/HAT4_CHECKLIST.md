# Hat-4 Checklist — Release v1.1.0

> **Only-Adi** items per the buff-release skill — real device, Play Console, OAuth, push, Sentry dashboard, real-touch feel. CC cannot reliably do these from the emulator.
> Source MANIFEST: [`MANIFEST.md`](MANIFEST.md). Source notes: [`RELEASE_NOTES.md`](RELEASE_NOTES.md).

## Pre-upload

- [ ] **Confirm two migrations applied to `gfrongfnyigxsexuofrg`** (Supabase mobile DB) via MCP `list_migrations`:
  - `docs/sessions/child-suggest/migration.sql` (C — pending-suggestions)
  - `docs/sessions/money-conversion-reward/migration.sql` (D — money infra)
  - If either missing → apply, re-verify, then proceed.
- [ ] **Confirm EAS build versionCode** = previous + 1 (was 19; expect 20). Source maps uploaded to Sentry (`@sentry/react-native` mention in build log).

## Play Console upload + promotion

- [ ] Download AAB from EAS Build page.
- [ ] Upload to Play Console **internal track**.
- [ ] Add Play Console internal release notes (use `RELEASE_NOTES.md §A` technical block; trim to 500 chars if needed).
- [ ] Promote to internal testers; verify install link works (per memory `reference_play_internal_test`).

## On-device (after install)

- [ ] **CC1 — Google OAuth** on the installed AAB (emulator is unreliable per memory + skill notes).
- [ ] **CC2 — push notification** lands in system tray (FCM — `project_fcm_hat4_pending`).
- [ ] **CC4 — Sentry** capture path: provoke a non-fatal warn or wait for one to fire; confirm it lands in Sentry dashboard with NO PII (no email/username/IP).
- [ ] **F3.H2 — native date picker** on real device (UStep1 birthday).

## V19-followup feature spot-checks (one minute each)

- [ ] **A (onboarding-starter-tasks)**: create a new child with a **Hebrew** name (e.g. "טסט") + any challenge. Confirm tasks are in **Hebrew** and times match the challenge's natural pattern (e.g. screens-off → evening). *(Latin-name path was Hat-3 verified 2026-05-30 — see `docs/sessions/onboarding-starter-tasks/AC_MATRIX.md`.)*
- [ ] **B (idempotency)**: parent → Tasks tab → existing child with 0 tasks → "Set up tasks" → finish → confirm only one set inserted + lands on Tasks tab (not Dashboard). Try opening the empty-state flow a second time → should NOT duplicate.
- [ ] **C (child-suggest)**: in view-as-child → tap "Suggest a task" → submit. Switch back to parent → confirm suggestion appears + "Yes" approves + "Let's talk" wording (no shame).
- [ ] **D (money-conversion-reward)**: onboard a child picking the **money** motivator → confirm a money-conversion reward appears in the reward set with the parent-set ratio path visible.
- [ ] **E (gamer-parent-polish)**: parent Tasks tab — no empty checkbox circle next to incomplete tasks (status-only glyph); view-as-child — greeting says the real child name, not "תצוגה".
- [ ] **F (per-child-language) — RTL restart** *(only-real-device case)*: log in as a child user (ChildJoin) with `pro_settings.language = 'he'` on an English-default device → app should one-time restart with RTL layout. Repeat for `'en'` child on Hebrew-default device.

## Data cleanup (separate from release verification)

- [ ] **Itay's legacy duplicate task/reward rows** (pre-B fix in DB). CC can run the cleanup via Supabase MCP on go-ahead. Not a release-blocker.

## After everything passes

- [ ] Tell CC **"verified, tag it"** → CC proposes `git tag v1.1.0 <commit>` (the commit the AAB was built from).
- [ ] CC also runs the post-merge cleanup of `release/v19-1.1.0` remote branch per Verify-Before-Delete.
