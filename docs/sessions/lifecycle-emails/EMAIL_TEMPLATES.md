# Lifecycle Email Templates — v2 FINAL (Gemini-refined hybrid, 2026-07-17)

> v2 = hybrid of Gemini's two refinement options, adjudicated against our own
> campaign data (real-number subjects performed; clarity>cleverness for cold
> recipients) + email research. Restored: T2 bullet list (Gemini flattened it),
> merge-field integrity. T3 subject is CONDITIONAL on completions count.

> Voice: Adi's approved win-back voice (2026-07-14 batch) — founder-personal,
> honest, zero pressure, kid's REAL data up front.
> Merge fields pulled at send time from live DB. Hebrew shown; EN variant per
> `preferred_language` before arming (T2 EN exists from win-back? verify).
> Every email ends with the mandatory footer (below).
> Sender: hello@buffadhd.com · Reply-To: adi@buffadhd.com

## Merge fields available

| Field | Source |
|---|---|
| `{parent}` | profiles.display_name (parent) |
| `{child}` | child profiles.display_name |
| `{task_1}`, `{task_2}`, `{task_3}` | first 3 real task titles from the child's generated plan |
| `{task_count}` | count of the child's tasks |
| `{completions}` | completed daily_progress count |
| `{days_left}` | trial days remaining (T4) |

---

## T1 — נרשמו, לא הגדירו ילד (24 שעות)

**נושא:** נרשמת אתמול ל-BUFF — הצעד הבא לוקח 2 דקות

היי {parent},

אני עדי, אמא לילדים עם ADHD והמייסדת של BUFF.

ראיתי שנרשמת אתמול ועצרת רגע לפני הגדרת הילד/ה. זה קורה להמון הורים —
בדרך כלל כי החיים פשוט קרו באמצע, וזה לגמרי מובן.

רציתי רק להגיד שהשלב הבא לוקח בדיוק שתי דקות. עונים על כמה שאלות קצרות,
ו-BUFF בונה תוכנית משימות אישית שמתאימה בדיוק לילד/ה שלך.

אם עצרת כי משהו לא היה ברור או לא עבד — אשמח מאוד לשמוע. אני עונה אישית
לכל מייל.

עדי

---

## T2 — ילד הוגדר + תוכנית נוצרה, אף משימה לא הושלמה (24 שעות)

**נושא:** התוכנית של {child} מוכנה — הנה מה שמחכה לו/לה

היי {parent},

אני עדי, המייסדת של BUFF (ואמא לילדים עם ADHD).

התוכנית האישית של {child} כבר בנויה ומחכה. הנה טעימה ממה שיש בה:

- {task_1}
- {task_2}
- {task_3}

כל מה שצריך עכשיו זה לפתוח את האפליקציה יחד עם {child} ולתת לו/לה להשלים
משימה אחת. מהניסיון שלנו — המשימה הראשונה היא הרגע שבו זה "נדלק" אצלם:
הם רואים שמישהו בנה משהו במיוחד בשבילם, ולא עוד רשימת מטלות של מבוגרים.

אם משהו עצר אותך — טכני או אחר — פשוט תשיבו למייל הזה. אני קוראת הכל.

עדי

---

## T3 — התחילו יפה ונעצרו (משימה ראשונה הושלמה, שקט 3 ימים, משפחה בת פחות מ-14 יום)

**נושא (מותנה בקוד):**
- אם `{completions} >= 5`: {child} כבר עם {completions} משימות מאחוריו/ה — ממשיכים?
- אחרת: {child} כבר התחיל/ה (ומחכה לו/לה משימה להיום)

היי {parent},

עדי מ-BUFF כאן. {child} כבר השלים/ה {completions} משימות — התחלה מעולה,
וממש לא מובנת מאליה. ראיתי שבימים האחרונים נהיה קצת שקט.

זה שלב טבעי לגמרי. לפעמים מספיקה משימה אחת קטנה היום כדי להחזיר את
התנופה — והכל שמור בדיוק איפה ש{child} השאיר/ה.

ואם משהו הפריע או שהאפליקציה לא התאימה — תגידו לי בכנות. כל תשובה,
גם ביקורתית, עוזרת לי לבנות את BUFF טוב יותר.

עדי

---

## T4 — הטרייל נגמר בעוד יומיים (יש שימוש אמיתי, אין מנוי)

**נושא:** עוד יומיים מסתיימת התקופה החינמית שלכם ב-BUFF

היי {parent},

עדי מ-BUFF. רציתי לעדכן מראש ובלי הפתעות: בעוד יומיים תסתיים התקופה
החינמית שלכם.

בתקופה הזו {child} השלים/ה {completions} משימות. זה הישג יפה שמראה
שמשהו כאן עובד לו/לה — העצמאות הקטנה הזאת של "עשיתי את זה בעצמי".

אם תרצו להמשיך, המנוי הוא 29.90 ₪ לחודש, וכל ההתקדמות של {child} כמובן
נשמרת. ואם לא — זה לגמרי בסדר, ואשמח מאוד לשמוע מה היה חסר לכם.

עדי

---

## Mandatory footer (every email)

> BUFF — buffadhd.com
> קיבלת את המייל הזה כי אישרת קבלת עדכונים ב-BUFF.
> [להסרה מרשימת התפוצה בלחיצה אחת]({unsubscribe_url})

Plus `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers.

## Guardrails

- Parents only. Child data limited to first name + task titles + counts.
- No "מנוי" wording anywhere except T4 (WHY/WHAT framing, not mechanics).
- One email per trigger per family, ever; ≥72h between any two lifecycle emails.
- Consent re-checked at send time (`marketing_consent = true`).
