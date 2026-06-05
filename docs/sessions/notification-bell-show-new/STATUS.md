# Notification Bell — Show New Only — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Foundation + class lock | _passed_ | 2026-06-05 | (this) | code verify: useParentNotifications reads read+unread ✓; SOS dot via child_vibes ✓ | — |
| 1 — Class map + show-new feed | _in_progress_ | 2026-06-05 | (this) | tsc ✓; jest 307/307 ✓ (incl. new notificationClass 7/7); **emulator test by Adi pending** | — |
| 2 — Badge/feed sync + copy | _in_progress_ | 2026-06-05 | (this) | badge uses isVisibleInFeed (OQ-N6) ✓; copy rename (OQ-N7) deferred — needs Adi OK | — |
| 3 — Spec sync + tests + PR | _pending_ | — | — | — | — |

> הערה: פאזות 1+2 מומשו יחד ב-commit אחד (השינוי הליבתי + סנכרון ה-badge צמודים). מסומנות `in_progress` עד ש-Adi מריצה את בדיקות האמולטור ב-TESTS.md. copy של OQ-N7 ("נקה הכל") **לא** בוצע — נשמר "Mark all as read" עד אישור copy של Adi (gate על user-facing copy).

## Legend

- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה, plan מאושר
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework
- `_blocked_` — מחכה לחיצוני (סקירה של Adi וכו')

## Closeout

- [ ] כל הפאזות עברו
- [ ] INTEGRATION_LEARNINGS.md עודכן
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר
- [ ] PR ל-main, merge, branch נמחק לפי Verify-Before-Delete
- [ ] RELEASE_QUEUE.md row נוסף
- [ ] הסשן מסומן closed
