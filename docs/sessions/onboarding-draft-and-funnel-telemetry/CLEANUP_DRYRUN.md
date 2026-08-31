# Cleanup Dry-Run Report — 2026-08-31

> כל מספר מעוגן לשאילתה. מחיקה בפועל תיעשה רק אחרי אישור מפורש + דוח DELETE מסודר (Verify-Before-Delete).

## ✅ EXECUTED — Category A נמחקה (2026-08-31, באישור מפורש של Adi)
מחיקה טרנזקציונית אחת, ממודרת ל-5 ה-user-ids המדויקים. FK map נבדק מראש; כל טבלאות ה-`NO ACTION`
(`stickers`/`child_suggestions`/`parent_items`/`capture_runs`/`email_logs`/`push_subscriptions`) היו ריקות ל-5 המשפחות.
- **נמחק:** 5 auth users · 8 profiles (5 הורים + 3 ילדים) · 5 families · 14 tasks · 7 store_rewards · 6 daily_progress · 3 credit_vault · 3 buddy_relationships (הכול בקסקייד ממחיקת ה-families). referrals: referrer→CASCADE, referred→SET NULL (לפי כללי ה-FK).
- **אימות אחרי:** `test_auth_users_remaining=0`, `test_email_remaining=0`, `orphan_tasks=0`, `orphan_profiles=0`.
- 4 המשפחות-הריקות (Category E) קדמו למחיקה ולא הושפעו.

Categories B/C/D/E **לא נגענו** — נשארות להחלטה נפרדת / אסורות למחיקה כמפורט למטה.

---

> **להלן הדוח המקורי (dry-run) ששימש לאישור.**

---

## הבחנה קריטית — שני דברים שונים

### Scope 1 — הניקוי של בדיקות ה-E2E שלי (מה שה-Test Plan מדבר עליו)
זה **היחיד** שרץ אוטומטית כחלק מהבדיקות, והוא **self-scoped לחלוטין**: מוחק **רק חשבונות שאני יוצר** תוך כדי בדיקה, מתויגים `e2e+<slug>@bufftest.dev`.
- **כמה שורות כאלה קיימות עכשיו? אפס.** אין מה לנקות עד שאריץ בדיקה.
- קדימה: כל ריצה יוצרת hderך slug ייחודי ומוחקת בדיוק אותו — דטרמיניסטי, לא נוגע בשום דאטה קיימת.
- זו התשובה לחשש "שלא נדפוק כלום": הניקוי האוטומטי **לא יכול** לגעת במשתמשים אמיתיים.

### Scope 2 — junk קיים בפרודקשן (נפרד, אופציונלי, דורש אישור מפורש)
דאטת-טסט/שאריות שכבר בפרודקשן מלפני החבילה הזו. **לא אגע בזה בלי אישור פרטני**, וחלקו **אסור למחיקה**. מפורט למטה.

---

## Scope 2 — אינוונטר מועמדים (עם המלצה לכל קטגוריה)

### 🟢 A — חשבונות-טסט מפורשים · 5 · **מומלץ למחיקה**
זוהו לפי דומיין/דפוס טסט:

| id | email | created | has_profile |
|---|---|---|---|
| df2b540c… | `test@example.com` | 2026-05-16 | כן |
| ba331a51… | `newuser@example.com` | 2026-05-26 | כן |
| 91d4cc7a… | `newtest@example.com` | 2026-06-04 | כן |
| fce3341c… | `ccrem1781455528@bufftest.dev` | 2026-06-14 | כן |
| aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee | `ref.test.new@bufftest.dev` | 2026-06-23 | כן |

**Footprint שיימחק בקסקייד** (שאילתה מאומתת): 5 auth users · 5 parent profiles · 5 families · **3 child profiles** · 14 tasks · 0 onboarding_events · 6 daily_progress.
→ מחיקה בטוחה. זו דאטת-טסט ידועה (כולל ה-UUID הסינתטי `aaaa…` וה-`ref.test.new` מסשן ה-referral).

### 🟡 B — פרופילי-הורה עם `user_id` מת · 189 · **החזק, החלטה נפרדת**
189 פרופילי-הורה שה-`user_id` שלהם לא קיים ב-`auth.users` (חשבונות שנמחקו/טסט ישן). זה מה שמנפח את כל טבלאות ה-all-time. **לא מומלץ למחיקה עיוורת** — צריך לוודא שאין ביניהם משפחות עם ילד/דאטה אמיתיים ששווה לשמר, ולבדוק cascade. חבילת-ניקוי ייעודית נפרדת אם תרצי.

### ⛔ C — ילדים יתומים (`family_id IS NULL`) · 3 · **אסור למחיקה**
אלה **שחזירים** (באג ChildJoin, `childjoin-claim-orphans`). מחיקה תמחק ילד אמיתי. משאירים.

### ⛔ D — חשבונות ילד `@buff.app` · 22 · **אסור למחיקה — אלה אמיתיים**
לא טסט. 21 מתוכם עם פרופיל ילד פעיל. לא נוגעים.

### 🟡 E — משפחות עם 0 פרופילים · 4 · **החזק**
משפחות ריקות לגמרי (אין הורה ואין ילד). כנראה שאריות, אבל לא ב-Scope 1. לבדוק עם B.

---

## מה שלעולם לא יימחק (רשימה מפורשת)
- כל חשבונות ה-`@buff.app` (ילדים אמיתיים).
- 3 הילדים היתומים (`family_id NULL`) — שחזירים.
- כל הורה/משפחה עם `auth.users` חי.

## לפני מחיקה בפועל (Scope 2)
1. אפיק **דוח DELETE מדויק** — statements מסודרים לפי FK + ספירת שורות לכל טבלה.
2. אימות cascade (buddy_relationships, credit_vault, store_rewards, notifications וכו').
3. אישור מפורש של Adi על אותו דוח.
4. רק אז מריץ, ומדווח ל-STATUS.

**כרגע לא נמחק דבר.**
