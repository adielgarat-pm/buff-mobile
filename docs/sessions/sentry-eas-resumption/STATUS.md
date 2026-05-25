# Sentry + EAS Resumption — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Session folder + branch setup | _passed_ | 2026-05-25 | (this commit) | Working tree clean on `pkg/sentry-eas-resumption` (branched from main `2d701cb`). All 5 session files present. Stash `stash@{0}` preserves WIP from `pkg/timetable-review-day-select` (AnchorRecoveryToast + parser). SPEC Values Check 9/9. | — |
| 1 — expo-doctor 4 → 0 (doc drift fix N/A — F-2026-05-05-01 already accurate as `open`) | _passed_ | 2026-05-25 | (this commit) | 18/18 ✓ (was 14/18 — 4 failures). `tsc --noEmit` clean. Removed `android.supportsRTL` from app.json. `npx expo install` aligned 9 packages: expo-font (new peer dep, also auto-added as plugin), babel-preset-expo (^55.0.15 → ~54.0.10), expo, expo-auth-session, expo-crypto, expo-dev-client, expo-file-system, expo-image-picker, expo-updates, expo-web-browser (all to SDK 54 patches). Duplicate expo-font resolved automatically. F-2026-05-05-01 entry status stays `open` for this phase — gets updated to `resolved` at Closeout (single source of truth for the resolution commit). Working in worktree `.claude/worktrees/sentry-eas-resumption` (Phase 0 had a parallel-CC incident, see [[project-parallel-cc-pattern]] in memory). | — |
| 2 — Install Sentry + verify EAS secrets | _passed_ | 2026-05-25 | (this commit) | EAS state confirmed: auth=`iamadi79` (`adi.elgarat@gmail.com`), project=`@iamadi79/buff-mobile` (id `8796128b-5e2d-4c0e-9c41-016e87c62ab7`), `SENTRY_AUTH_TOKEN` present in production env. eas-cli v19.0.8 available (using older — non-blocking for build). `npx expo install @sentry/react-native` installed `~7.2.0` (matches 2026-05-16 known-good); plugin `@sentry/react-native` auto-added to app.json plugins. expo-doctor 18/18 ✓, tsc clean. | — |
| 3 — Wire DSN + Sentry.init + PII scrubbers | _passed_ | 2026-05-25 | (this commit) | `eas.json`: added `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_ORG=buffadhd`, `SENTRY_PROJECT=react-native` to `build.production.env` + `build.preview.env`. Development profile intentionally clean (no Sentry in dev). DSN restored from b5c723e (same project as 5/16, never rotated). `App.tsx`: added `import * as Sentry from '@sentry/react-native'`, `Sentry.init({ dsn, enabled: !!dsn, sendDefaultPii: false, beforeSend: strip user.email/username/ip_address, beforeBreadcrumb: regex-redact emails to [email] })`, wrapped default export with `Sentry.wrap(App)`. tsc clean. D-2026-05-25 entries drafted for Closeout commit. | — |
| 4 — First production AAB v10 build + source-map upload | _passed_ | 2026-05-25 | (this commit) | Build `c9aa1828-8495-45ac-8365-3153e6e864cb` FINISHED in 8m 35s (queue 4m 47s + duration 8m 35s; total ~13min wall). versionCode auto-incremented 9 → 10. Keystore `Build Credentials dG1dqozJHO (default)` reused from 5/16 (no fingerprint change). Env vars resolved into build: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT. AAB artifact: https://expo.dev/artifacts/eas/qUkBTuTYYccCZjUm1kSd1t.aab (expires 2026-06-24). Source-map upload: implicit pass — Sentry's `@sentry/react-native/expo` post-build hook would have failed the build had upload errored. Final verification deferred to Phase 5 smoke crash (symbolicated stack trace = source maps live). Build commit: 7cc235d (Phase 3). | — |
| 5 — Play Console Internal Testing upload + smoke test | _in_progress_ | 2026-05-25 | — | PR #85 merged to main 2026-05-25 (commit `20fa598`) BEFORE Adi-side Play Console steps confirmed. AAB v10 artifact at https://expo.dev/artifacts/eas/qUkBTuTYYccCZjUm1kSd1t.aab (expires 2026-06-24). Pre-flight Sentry-dashboard check + Play Console upload + device install + (optional) smoke crash all per `PLAY_CONSOLE_v10_UPLOAD.md`. Will be marked `_passed_` when Adi confirms `v10 installed, dashboard reachable`. | — |

## Legend

- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה, plan מאושר
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework לפני להמשיך
- `_blocked_` — מחכה לחיצוני (סקירה של Adi, EAS account verification, Play Console action)

## Closeout

- [~] כל הפאזות עברו (Phases 0-4 passed; Phase 5 in_progress — Adi-side install pending confirmation)
- [x] INTEGRATION_LEARNINGS.md עודכן עבור הפתעות + IN-2026-05-25-02 (lost-work pattern + 5-day rule) — this closeout commit
- [x] INTEGRATION_LEARNINGS.md F-2026-05-05-01 status `open` → `resolved` with commit ref — this closeout commit
- [x] BUFF_DECISIONS_LOG.md עודכן עם 2 D entries (D-2026-05-25-01 Sentry re-adoption + D-2026-05-25-02 Verify-Before-Delete reinforcement) — this closeout commit
- [x] CLAUDE.md §Tech Stack + §Open FLAGs מסונכרנים — this closeout commit
- [ ] PR ל-main מוכן (closeout PR open, awaiting Adi merge)
- [ ] Git tag `pkg/sentry-eas-resumption/v1` נוצר (deferred to after closeout PR merges; tags merge commit `20fa598`)
- [ ] **Verify-Before-Delete Protocol** הופעל לפני branch deletion (Rule 2 passed 2026-05-25 — content + merge confirmed; Rule 4 awaiting Adi `verified, clean up` for both `pkg/sentry-eas-resumption` worktree + branch)
- [ ] Sentry post-deploy regression check עבר (deferred — Sentry won't see events until v10 is installed on a tester device per Phase 5)
- [ ] הסשן מסומן closed (this checklist הושלם — pending Phase 5 + tag + branch cleanup)

## Recovery metadata (for the future)

- Branch: `pkg/sentry-eas-resumption` (merged 2026-05-25 in PR #85 → merge commit `20fa598`; branch awaiting Verify-Before-Delete cleanup)
- Closeout branch: `docs/sentry-eas-resumption-closeout` (this commit; opens follow-up PR for canonical docs sync)
- Branched from: `main` @ `2d701cb` (post PR #79 merge)
- Worktree paths:
  - `C:\Users\adiel\buff-mobile\.claude\worktrees\sentry-eas-resumption` — Phase 1-5 code work (parallel-CC incident moved work here from main worktree; see memory `project-parallel-cc-pattern`)
  - `C:\Users\adiel\buff-mobile\.claude\worktrees\sentry-closeout` — closeout docs work (this commit, branched from `origin/main` @ `20fa598`)
- Plan file: `~/.claude/plans/linked-gliding-bear.md`
- Historical lost-work reference: `git show b5c723e:docs/sessions/beta-2026-06-01/RESUMPTION_NOTES_2026-05-16.md` (only in git history, not on main)
- Stashed WIP from Phase 0 setup: `git stash list` shows multiple — stash@{0}/{1} are paste-mode + AnchorRecoveryToast WIP (separate concerns from this package; unaffected by this closeout)
