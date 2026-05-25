# Launch Comms — 2026-06-01

**Slug:** `launch-comms-2026-06-01`
**Type:** Docs + Copy (אפס שינוי קוד אפליקציה)
**Branch:** `pkg/launch-comms-2026-06-01`
**נוצר:** 2026-05-25
**Target send date:** 2026-06-01 (אולי 5/30)

## למה החבילה קיימת

ה-Lovable web app מסתיים, ו-49 משתמשים מרשימת התפוצה (`marketing_consent = true`)
מקבלים את אפליקציית האנדרואיד החדשה ב-1.6.2026. דרושים שלושה תוצרי תקשורת
לעבור-החוצה + כלים פנימיים ל-Adi להפעיל Lifetime ידנית.

קונספט ה-Lifetime: ניתן ידנית בהרשמה. ההמשכיות תלויה במשוב מהמשתמש לאחר תקופת
שימוש (החלטת Adi 2026-05-25).

## מה החבילה משיגה

1. **Migration Email (HE)** — מייל ל-49 ברשימת התפוצה. מסביר את המעבר, איך
   להפעיל Lifetime ידנית, מה עובר אוטומטית ומה לא.
2. **WhatsApp Messages (HE)** — שתי גרסאות (3 שורות + 5 שורות) להעלאה לקבוצת
   WhatsApp העברית (46 משתתפים).
3. **Admin Playbook (Lifetime Grant)** — מערך SQL queries ש-Adi מריצה ב-Supabase
   SQL Editor כדי לזהות חברי-cohort שנרשמו, להפעיל Lifetime ידנית עם מספר
   founding, לאמת, ולבטל (במידת הצורך לאחר תקופת המשוב).
4. **F-074 AC ב-lovable-parity SPEC** — תוספת acceptance criterion לתעד את
   שני קישורי קבוצות WhatsApp (HE+EN) לתוכנית Expo Web Phase 2 העתידית.

## מה החבילה **לא** עושה

- שום שינוי קוד אפליקציה.
- שום שינוי schema (חלוקת ה-Lifetime היא UPDATE-ים בלבד על דגלים קיימים).
- שום בניית מנגנון אוטומציה ל-Lifetime grant (היה Option B ב-TRACK_5_findings —
  הוחלט לטפל ידנית, נדחה למידה ותהיה הצדקה).
- שום שינוי באתר Lovable הקיים (מתנהל בשיחה מקבילה — buffadhd.com brand alignment).
- שום גרסה אנגלית של ה-WhatsApp (הקבוצה האנגלית = 5 משתתפים, לא מצדיק תרגום עכשיו).
- שום עדכון של `BUFF_DECISIONS_LOG.md`, `BUFF_VALUES.md`, `BUFF_GAP_ANALYSIS.md`
  (של Adi).

## קבצים בסשן

- [`SPEC.md`](SPEC.md) — מטרות, Capability Check, Values Check, Behavior Contract
- [`ROADMAP.md`](ROADMAP.md) — פאזה אחת
- [`SPEC_SYNC.md`](SPEC_SYNC.md) — איזה canonical docs / sessions מתעדכנים
- [`TESTS.md`](TESTS.md) — acceptance per deliverable + Brand Check
- [`STATUS.md`](STATUS.md) — מצב פאזות + placeholder fill list ל-Adi
- [`deliverables/migration-email-he.md`](deliverables/migration-email-he.md) — דליברבל 1
- [`deliverables/whatsapp-messages-he.md`](deliverables/whatsapp-messages-he.md) — דליברבל 2
- [`deliverables/admin-playbook-lifetime.md`](deliverables/admin-playbook-lifetime.md) — דליברבל 3

הדליברבל הרביעי (F-074 AC) הוא תוספת ל-
[`docs/sessions/lovable-parity-and-backlog/SPEC.md`](../lovable-parity-and-backlog/SPEC.md)
ולא לקובץ בתוך הסשן הזה.
