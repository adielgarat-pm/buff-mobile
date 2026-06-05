# Vibe Share Notification

> Kid-initiated, non-SOS "share my mood with my parent" path — the positive/neutral counterpart of the SOS button. The child chooses, per-share, to let a parent know "I feel ___". Surfaces as an INFO row in the parent bell.

## סטטוס
`draft — design only; schema + kid UI NOT applied`. ראי [STATUS.md](./STATUS.md).

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד + Values Check + OQ-V1..V8 |
| `migration.sql` | **מוצע, לא הוחל** — עמודה חדשה + trigger 019 (העתק של 011) |
| `STATUS.md` | מעקב פאזות |

## הקשר

חבילה אחות ל-`pkg/notification-bell-show-new`. **חייבים למזג קודם את חבילת הפעמון** (היא מספקת את הסיווג `child_vibe_shared → INFO` ואת מחזור-החיים בפיד).

מודל ההסכמה: **ביוזמת הילד** (כמו SOS) — Adi החליטה 2026-06-05. שיכפול מבני של דפוס ה-SOS הקיים (`parent_sos_sent` → trigger 011), עם `vibe_shared_with_parent` → trigger 019.

## מה צריך אישור Adi לפני ביצוע

1. **OQ-V1** — איפה כפתור השיתוף (בתוך ה-Vibe Check / כפתור דאשבורד).
2. **copy בצד הילד** (OQ-V6) — body-double voice; gate של Adi (ואולי Itay/Emi).
3. **gate על ה-migration** — schema change; להחיל רק אחרי אישור מפורש + אחרי מיזוג חבילת הפעמון.
