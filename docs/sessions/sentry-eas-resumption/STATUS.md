# Sentry + EAS Resumption — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Session folder + branch setup | _passed_ | 2026-05-25 | (this commit) | Working tree clean on `pkg/sentry-eas-resumption` (branched from main `2d701cb`). All 5 session files present. Stash `stash@{0}` preserves WIP from `pkg/timetable-review-day-select` (AnchorRecoveryToast + parser). SPEC Values Check 9/9. | — |
| 1 — expo-doctor 4 → 0 + doc drift fix | _pending_ | — | — | — | — |
| 2 — Install Sentry + verify EAS secrets | _pending_ | — | — | — | — |
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
- Plan file: `~/.claude/plans/linked-gliding-bear.md`
- Historical lost-work reference: `git show b5c723e:docs/sessions/beta-2026-06-01/RESUMPTION_NOTES_2026-05-16.md` (only in git history, not on main)
- Stashed WIP: `git stash list` → `stash@{0}` ("WIP: AnchorRecoveryToast + parser changes on pkg/timetable-split-groups (2026-05-25)")
