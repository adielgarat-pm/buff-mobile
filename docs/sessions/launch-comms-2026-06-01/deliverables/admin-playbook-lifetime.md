# Admin Playbook — Manual Lifetime Grant (Launch 2026-06-01)

> איך Adi מסמנת ידנית `Lifetime` למשתמש cohort שנרשם באפליקציה.
> כל ה-SQL מורץ ב-**Supabase SQL Editor**, פרויקט `gfrongfnyigxsexuofrg`.
> URL ישיר: https://supabase.com/dashboard/project/gfrongfnyigxsexuofrg/sql

**Last verified against schema:** 2026-05-25 (CC via MCP).

---

## Context — מה הדגלים אומרים

`public.profiles` יש שלושה שדות שמשמשים את ה-Lifetime flow:

| Field | Type | תפקיד |
|---|---|---|
| `is_lifetime_access` | boolean | האם Lifetime פעיל **כרגע** (operational toggle) |
| `is_lifetime_founding` | boolean | האם המשתמש שייך ל-Founding 49 cohort (historical record) |
| `founding_member_number` | integer | סדרי 1..N מתוך ה-Founding (סדר הקצאה) |

**ה-distinction החשוב:**
- כשנותנים grant: שלושתם מתעדכנים.
- כשמבטלים (revoke עקב חוסר משוב): רק `is_lifetime_access` מתאפס. ה-`is_lifetime_founding` ו-`founding_member_number` נשמרים — historical record שהאדם היה חלק מהקבוצה.

---

## §1 — Daily check: מי מ-49 נרשם ועדיין לא דוגל?

הדרך הפשוטה — `marketing_consent = true` כבר מסומן ל-49 שלך. השאלה היא מי מהם
**נרשם באפליקציה** (`auth.users` row חדש שמתאים ל-email).

**אבל** הפרופילים הקיימים של 49 (מ-Lovable) לא מקושרים ל-`auth.users` — כי
Lovable השתמש ב-auth path אחר. כשמשתמש cohort נרשם באפליקציה, נוצר פרופיל
**חדש** עם `auth.users` row אמיתי. הזיהוי הוא דרך ה-email בלבד.

**ה-query מצלב בין רשימת ה-49 emails שלך לבין `auth.users` החדש:**

```sql
-- ⚠ הדבק את 49 המיילים שלך מ-MailerLite כאן (אחד לכל שורה ב-VALUES)
WITH cohort(email) AS (
  VALUES
    ('email1@example.com'),
    ('email2@example.com'),
    ('email3@example.com')
    -- ... ועוד 46 שורות
)
SELECT
  c.email,
  au.id            AS auth_user_id,
  au.created_at    AS signed_up_at,
  p.display_name,
  p.role,
  p.is_lifetime_access,
  p.is_lifetime_founding,
  p.founding_member_number
FROM cohort c
LEFT JOIN auth.users au       ON au.email = c.email
LEFT JOIN public.profiles p   ON p.user_id = au.id
ORDER BY au.created_at DESC NULLS LAST;
```

**מה לראות:**
- `auth_user_id` is NULL → לא נרשם עדיין באפליקציה.
- `auth_user_id` exists, `is_lifetime_founding` = false → **חדש, צריך grant.**
- `is_lifetime_founding` = true → כבר טופל. אין עוד מה לעשות.

**הרצה מומלצת:** פעמיים-שלוש ביום ב-3 ימים הראשונים אחרי השליחה.

---

## §2 — Grant Lifetime למשתמש בודד (idempotent)

```sql
UPDATE public.profiles
SET
  is_lifetime_access     = true,
  is_lifetime_founding   = true,
  founding_member_number = CASE
    WHEN is_lifetime_founding = false THEN (
      SELECT COALESCE(MAX(founding_member_number), 0) + 1
      FROM public.profiles
      WHERE is_lifetime_founding = true
    )
    ELSE founding_member_number   -- אם כבר founding, שומר מספר קיים
  END,
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paste_user_email@here.com'
)
  AND is_lifetime_founding = false   -- guard: לא לרוץ פעמיים על אותו אחד
RETURNING display_name, founding_member_number, is_lifetime_access;
```

**מה צריך לראות:** שורה אחת מוחזרת עם `display_name`, `founding_member_number`
(N+1 לעומת קודם), `is_lifetime_access = true`.

**מה אומר אם 0 שורות חזרו:**
- ה-email לא נמצא ב-`auth.users` — המשתמש עוד לא נרשם, או נרשם עם email אחר.
- המשתמש כבר founding — תוגן ע"י ה-guard. שלח לו תשובה ב-"כבר פעיל אצלך".

---

## §3 — Verify אחרי grant

```sql
SELECT
  au.email,
  p.display_name,
  p.is_lifetime_access,
  p.is_lifetime_founding,
  p.founding_member_number,
  p.updated_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'paste_user_email@here.com';
```

**Acceptance:** שלושת השדות (`is_lifetime_access` / `is_lifetime_founding` / `founding_member_number`) פעילים. `updated_at` של פחות מדקה אחורה.

---

## §4 — Revoke (אם לא הגיע משוב אחרי תקופת grace)

> ראי החלטת Adi 2026-05-25: ה-Lifetime המשכיותו תלויה במשוב. אם משתמש לא
> סיפק משוב לאחר תקופה (מומלץ: 6-8 שבועות), זה נושא לשיחה אישית, לא לטריגר אוטומטי.

**רק לאחר שיחה / החלטה בה את מבטלת:**

```sql
UPDATE public.profiles
SET
  is_lifetime_access = false,           -- ⚠ רק זה — לא נוגעים ב-founding
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'paste_user_email@here.com'
)
RETURNING display_name, is_lifetime_access, is_lifetime_founding, founding_member_number;
```

**שים לב:** `is_lifetime_founding` ו-`founding_member_number` **נשמרים** —
historical record. אם בעתיד תרצי לשחזר את ה-Lifetime (משתמש חזר עם משוב),
פשוט תפעילי שוב את `is_lifetime_access`:

```sql
UPDATE public.profiles
SET is_lifetime_access = true, updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'paste_user_email@here.com')
RETURNING display_name, founding_member_number, is_lifetime_access;
```

---

## §5 — Audit: מצב גלובלי

```sql
SELECT
  COUNT(*) FILTER (WHERE is_lifetime_access)                                    AS lifetime_active_now,
  COUNT(*) FILTER (WHERE is_lifetime_founding)                                  AS total_founding_ever,
  COUNT(*) FILTER (WHERE is_lifetime_founding AND NOT is_lifetime_access)       AS founding_but_revoked,
  MAX(founding_member_number)                                                   AS highest_number_assigned,
  COUNT(*) FILTER (WHERE marketing_consent)                                     AS marketing_consent_count
FROM public.profiles;
```

**מה לראות (בסיום ה-launch):**
- `total_founding_ever` הולך וגדל מ-0 ל-49 בקצב 3-10 לשבוע (אופטימי).
- `lifetime_active_now` = `total_founding_ever` כל עוד לא בוצעו revokes.
- `marketing_consent_count` נשאר 49 (לא משתנה).

---

## §6 — Edge cases ופתרונות

### Edge case A — משתמש נרשם עם email שונה מהרשימה
**זיהוי:** §1 query לא מוצא אותם, אבל המייל "פרטית" של המשתמש שלך אומר שזה אותו אדם.

**פתרון:** פנה אליהם, אמת זהות בשיחה, ואז ה-grant הוא רגיל לפי email החדש.

### Edge case B — משתמש נרשם דרך Apple (לא Google)
**זיהוי:** `auth.users.email` קיים, אבל `provider` (אם תבדקי) הוא apple.

**פתרון:** ה-flow זהה. ה-Lifetime לא קשור ל-OAuth provider. רק ה-email חשוב.

### Edge case C — UPDATE החזיר 0 שורות אבל אני בטוחה שזה האדם
**זיהוי:** ה-email נכון, אבל ה-WHERE החזיר nothing.

**פתרון:**
1. בדקי ב-§1 — האם `auth_user_id` is null? אז המשתמש עוד לא נרשם.
2. הסירי את ה-guard `AND is_lifetime_founding = false` כדי לבדוק אם המשתמש כבר founding (במקרה כזה — אין עוד מה לעשות).

### Edge case D — Race condition בהקצאת `founding_member_number`
**זיהוי:** את מריצה שני UPDATEs במקביל ב-2 חלונות → שניהם מקבלים את אותו מספר.

**פתרון:** סבירות נמוכה (3-10 grants/week ידני). אבל אם קרה, התנגשות מתבטאת ב-unique constraint violation (אם תוסיף constraint עתידי), או בכפילות מספרים (בלי constraint).

**מומלץ עתידי:** להוסיף `UNIQUE` constraint על `founding_member_number` כשמערכת אוטומטית תיבנה. לא נדרש עכשיו.

### Edge case E — את צריכה לראות מי קיבל grant לאחרונה (audit log light)
```sql
SELECT
  au.email,
  p.display_name,
  p.founding_member_number,
  p.updated_at AS granted_at_or_changed
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE p.is_lifetime_founding = true
ORDER BY p.founding_member_number DESC NULLS LAST
LIMIT 20;
```

לא audit log אמיתי (לא יודע אם זה grant ראשון או revoke + re-grant), אבל מספיק
לרובן/רוב המקרים.

---

## §7 — איפה לשמור את רשימת 49 המיילים

**אל תעדכן את הקובץ הזה עם המיילים** — PII, ולא נכנס ל-git.

**אפשרויות:**

1. **Inline בכל הרצה** — להעתיק מ-MailerLite, להדביק ב-§1 query בכל פעם. נוח אם
   הרצה היא נדירה (1-2/יום).
2. **קובץ מקומי gitignored** — לשמור ב-
   `C:\Users\adiel\buff-mobile-data\launch-2026-06-01\cohort-emails.txt`
   (התואם ל-memory `reference_lovable_user_data_location.md`). להדביק ל-VALUES
   בכל הרצה.
3. **Supabase temp table** — `CREATE TEMP TABLE cohort_emails (email text);`
   ואז `\COPY` מקומי. עובד אבל overkill ל-49 שורות.

**מומלץ:** אפשרות 2.

---

## §8 — Pre-send dry run (חובה לפני 1.6)

לפני שליחת המייל, בצעי dry run על חשבון dev שלך (אדי):

```sql
-- 1. נקה דגלים נוכחיים על החשבון שלך (rollback ה-grant הקיים)
UPDATE public.profiles
SET is_lifetime_access = false, is_lifetime_founding = false, founding_member_number = null
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'adi.elgarat@gmail.com');

-- 2. עכשיו הרץ את ה-grant query מ-§2 על האימייל שלך
-- ... [paste §2 query with email = 'adi.elgarat@gmail.com']

-- 3. ודאי דרך §3 verify שה-grant הצליח ושאתה Founding #1
```

ואז: לחזור על §2 פעם נוספת על אותו מייל — צריך לחזור 0 שורות (guard עובד).

---

## §9 — Operational SLA מוצע

- Reply ל-email של משתמש cohort: **<24 שעות**, רוב המקרים <6 שעות.
- Grant ל-DB מהרגע של reply: **<5 דקות** (העתק email, הדבק query, הרץ).
- Follow-up לקבלת משוב: **6-8 שבועות מ-grant**.
- Revoke decision: **תמיד דרך שיחה אישית**, לעולם לא bulk.
