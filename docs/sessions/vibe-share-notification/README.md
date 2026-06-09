# Vibe Share Notification

> Kid-initiated, non-SOS "share my mood with my parent" path — the positive counterpart of the SOS button. The child chooses, per-share, to let a parent know "I feel ___". Delivered as a **gentle push + a bell row** to the parent (decided 2026-06-09).

## סטטוס
`Phase 1a applied` — migration 025 live + probe-verified. Design D1–D8 locked. ראי [STATUS.md](./STATUS.md).

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד + Values Check + D1–D8 + פאזות |
| `migration.sql` | עותק ייחוס; הקנוני: `migrations/025_vibe_shared_notification.sql` (הוחל 2026-06-09) |
| `STATUS.md` | מעקב פאזות |

## הקשר

מודל ההסכמה: **ביוזמת הילד** (כמו SOS) — Adi החליטה 2026-06-05. מסירה: **Push עדין** על מתג "Alerts to me" הקיים — Adi 2026-06-09. שיכפול מבני של דפוס ה-SOS (`parent_sos_sent` → trigger 011), עם `vibe_shared_with_parent` → trigger 025 (`handle_vibe_shared`).

מערכת ה-Push כבר ב-main (PR #207) — Phase 1b (חיווט ה-fanout) פתוח.

## מה צריך אישור Adi לפני שחרור

1. **copy בצד הילד** (OQ-A) ו-**copy ה-Push/פעמון להורה** (OQ-B) — body-double + declarative; gate של Adi (ואולי Itay/Emi).
2. **deploy של ה-Edge Function** (Phase 1b) — שינוי פונקציה.
