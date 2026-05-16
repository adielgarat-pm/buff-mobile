# Sentry Crash + Error Monitoring

> Real-time crash visibility for BUFF mobile. Replaces deferred Phase 5 of `pkg/expo-health-and-eas-android` (Play Console mapping path).

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה זו |
| `ROADMAP.md` | רצף 6 פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות |

## Plan draft

[docs/sessions/beta-2026-06-01/PLAN_sentry-crash-monitoring.md](../beta-2026-06-01/PLAN_sentry-crash-monitoring.md)
Resolved Q&A inline in the plan (Adi 2026-05-16): account via `adi@buffadhd.com`, alerts to same, aggressive PII scrubbing, start now.

## רצף פאזות

1. Phase 0 — Session folder + SPEC
2. Phase 1 — Install `@sentry/react-native` + plugin + init (no DSN yet, no-op)
3. Phase 2 — Adi creates Sentry project → CC wires DSN to eas.json
4. Phase 3 — Source-map auto-upload (Adi provides auth token → EAS secret)
5. Phase 4 — Trigger v9 build + dev-only crash test verification
6. Phase 5 — Adi uploads v9 to Play Console Internal Testing
