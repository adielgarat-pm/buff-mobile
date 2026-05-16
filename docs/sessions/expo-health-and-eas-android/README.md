# Expo Health + EAS Android Internal Testing

> First signed Android AAB to Play Console Internal Testing.
> Resolves F-2026-05-05-01 (4 expo-doctor failures) and closes CLAUDE.md "EAS Build / Submit decision pending" line.

## סטטוס

ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו |
| `ROADMAP.md` | רצף 4 פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

> No `PRINCIPLES.md` — infrastructure work, no novel principles beyond BUFF_VALUES.

## רצף ביצוע

1. Phase 0 — Session folder + SPEC (this commit)
2. Phase 1 — expo-doctor 4 → 0 failures
3. Phase 2 — EAS-managed Android credentials
4. Phase 3 — First production AAB build (cloud)
5. Phase 4 — Manual upload to Play Console Internal Testing (Adi-driven)

## Plan draft

See [docs/sessions/beta-2026-06-01/PLAN_expo-health-and-eas-android.md](../beta-2026-06-01/PLAN_expo-health-and-eas-android.md) for the full chunked plan that Adi approved 2026-05-16.
