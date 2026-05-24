# buddy-relationship-cross-screen-sync — Status

> Single-phase surgical fix. Closeout below.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 1 — refetch on focus (4 screens) | _passed_ | 2026-05-24 | `7d0c20d` → merged via `ba25c0b` (PR #72) | 154/154 jest | [IN-2026-05-24-01](../../INTEGRATION_LEARNINGS.md#IN-2026-05-24-01) |
| Follow-up — regression test for focus-refetch wiring | _passed_ | 2026-05-24 | TBD (this PR) | 155/155 jest (added 1 test) | — |

## Closeout

- [x] כל הפאזות עברו
- [x] INTEGRATION_LEARNINGS.md עודכן עבור הפתעות (VS Code revert + branch switch — IN-2026-05-24-01)
- [x] Canonical docs מסונכרנים — אין צורך לעדכן (הbugfix לא משנה PRD/BUDDY_SYSTEM/GAP_ANALYSIS)
- [ ] Git tag — לא רלוונטי לbugfix
- [x] PR ל-main, branch נמחק
- [x] Adi אימות מולטור — _pending_ (CC לא יכול)
- [ ] הסשן מסומן closed

## Notes

- ה-PR המקורי לא כלל בדיקה שמאמתת את ההתנהגות החדשה — ה-mock של `useFocusEffect` היה `jest.fn()` no-op. ה-follow-up PR מתקן זאת: mock עכשיו קורא ל-callback (`(cb) => cb()`) ובדיקה חדשה אחת ב-`ChildSettingsScreen.test.tsx` מאמתת `expect(refetch).toHaveBeenCalled()`.
- אימות end-to-end על אמולטור עדיין נדרש מ-Adi (focus-on-navigation לא מתבצע ב-jsdom).
