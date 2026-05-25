# Sentry + EAS Resumption — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Session folder + branch setup | _passed_ | 2026-05-25 | (this commit) | Working tree clean on `pkg/sentry-eas-resumption` (branched from main `2d701cb`). All 5 session files present. Stash `stash@{0}` preserves WIP from `pkg/timetable-review-day-select` (AnchorRecoveryToast + parser). SPEC Values Check 9/9. | — |
| 1 — expo-doctor 4 → 0 (doc drift fix N/A — F-2026-05-05-01 already accurate as `open`) | _passed_ | 2026-05-25 | (this commit) | 18/18 ✓ (was 14/18 — 4 failures). `tsc --noEmit` clean. Removed `android.supportsRTL` from app.json. `npx expo install` aligned 9 packages: expo-font (new peer dep, also auto-added as plugin), babel-preset-expo (^55.0.15 → ~54.0.10), expo, expo-auth-session, expo-crypto, expo-dev-client, expo-file-system, expo-image-picker, expo-updates, expo-web-browser (all to SDK 54 patches). Duplicate expo-font resolved automatically. F-2026-05-05-01 entry status stays `open` for this phase — gets updated to `resolved` at Closeout (single source of truth for the resolution commit). Working in worktree `.claude/worktrees/sentry-eas-resumption` (Phase 0 had a parallel-CC incident, see [[project-parallel-cc-pattern]] in memory). | — |
| 2 — Install Sentry + verify EAS secrets | _passed_ | 2026-05-25 | (this commit) | EAS state confirmed: auth=`iamadi79` (`adi.elgarat@gmail.com`), project=`@iamadi79/buff-mobile` (id `8796128b-5e2d-4c0e-9c41-016e87c62ab7`), `SENTRY_AUTH_TOKEN` present in production env. eas-cli v19.0.8 available (using older — non-blocking for build). `npx expo install @sentry/react-native` installed `~7.2.0` (matches 2026-05-16 known-good); plugin `@sentry/react-native` auto-added to app.json plugins. expo-doctor 18/18 ✓, tsc clean. | — |
| 3 — Wire DSN + Sentry.init + PII scrubbers | _pending_ | — | — | — | — |
| 4 — First production AAB v10 build + source-map upload | _pending_ | — | — | — | — |
| 5 — Play Console Internal Testing upload + smoke test | _pending_ | — | — | — | — |

## Legend

- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה, plan מאושר
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework לפני להמשיך
- `_blocked_` — מחכה לחיצוני (סקירה של Adi, EAS account verification, Play Console action)

## Closeout

- [ ] כל הפאזות עברו
- [ ] INTEGRATION_LEARNINGS.md עודכן עבור הפתעות + IN-2026-05-25-XX (lost-work pattern)
- [ ] INTEGRATION_LEARNINGS.md F-2026-05-05-01 doc drift תוקן
- [ ] BUFF_DECISIONS_LOG.md עודכן עם 2 D entries (Sentry re-adoption + work-loss root cause)
- [ ] CLAUDE.md §Tech Stack + §Open FLAGs מסונכרנים
- [ ] Git tag `pkg/sentry-eas-resumption/v1` נוצר
- [ ] PR ל-main מוכן
- [ ] **Verify-Before-Delete Protocol** הופעל לפני branch deletion
- [ ] Sentry post-deploy regression check עבר (15+ דק' אחרי merge) — לפי TESTS.md
- [ ] הסשן מסומן closed (this checklist הושלם)

## Recovery metadata (for the future)

- Branch: `pkg/sentry-eas-resumption`
- Branched from: `main` @ `2d701cb` (post PR #79 merge)
- Worktree path: `C:\Users\adiel\buff-mobile\.claude\worktrees\sentry-eas-resumption` (Phase 1 onwards — parallel-CC incident moved work here from main worktree)
- Plan file: `~/.claude/plans/linked-gliding-bear.md`
- Historical lost-work reference: `git show b5c723e:docs/sessions/beta-2026-06-01/RESUMPTION_NOTES_2026-05-16.md` (only in git history, not on main)
- Stashed WIP from Phase 0 setup: `git stash list` shows multiple — stash@{0}/{1} are paste-mode + AnchorRecoveryToast WIP (separate concerns from this package)
