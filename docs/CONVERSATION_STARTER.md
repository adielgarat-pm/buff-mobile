# BUFF — Conversation Starter

מטרה: פרומפט סטנדרטי לתחילת כל שיחה חדשה ב-claude.ai עבור פרויקט BUFF.

איך להשתמש: העתק את כל הטקסט שבין השורות הכפולות למטה והדבק
בתחילת השיחה החדשה.

==========================================================

היי קלוד, אני עדי. אני עובדת על BUFF — אפליקציית מובייל לילדים ומתבגרים עם ADHD.

הפרויקט: C:\Users\adiel\buff-mobile
GitHub: github.com/adielgarat-pm/buff-mobile
פלטפורמה: Windows, React Native + Expo + Supabase
Editor: Visual Studio Code + Claude Code Extension (Anthropic, verified)

הצוות:
- אני (PM/founder)
- Itay, בני (קו-יוצר Teen UI, בן 15, מתבגר עם ADHD)
- Emi, בתי (פרסונה עתידית של Children Mode, בת 9)

## Environment / סביבת עבודה

- **OS:** Windows 11
- **Editor:** Visual Studio Code עם Claude Code Extension של Anthropic (verified)
- **קוד נכתב על-ידי:** Claude Code (CC) ב-Plan Mode, ב-VS Code
- **Spec / design / החלטות נכתבות על-ידי:** Claude.ai (web/app), בצ'אט
- **טרמינל:** רק לפעולות bash מהירות. אין שימוש בפרומפטים ארוכים בטרמינל (בעיית RTL בעברית).
- **שפה:** עברית בצ'אט עם Claude.ai; אנגלית בקוד, פרומפטים לקלוד קוד, ושמות קבצים. תיעוד: עברית/אנגלית מעורב כפי שהמסמכים מבטאים היום.

לפני שתענה על כל דבר, תקרא את המסמכים הבאים בסדר הזה:

1. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_DECISIONS_LOG.md
   (24+ החלטות מתועדות — חיוני להבין למה דברים כפי שהם)

2. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_GAP_ANALYSIS.md
   (איפה הקוד עומד מול PRD + תוכנית עבודה ל-17 ימי קוד)

3. https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_BUDDY_SYSTEM.md
   (מערכת BUDDY מלאה — Friendship Levels, Boosters, Pause Mode, Welcome Back, Onboarding Choice)

4. https://github.com/adielgarat-pm/buff-mobile/blob/main/SESSION_LOG.md
   (יומן הסשנים)

5. אם השיחה דורשת PRD מלא:
   https://github.com/adielgarat-pm/buff-mobile/blob/main/docs/BUFF_PRD.md

6. אם השיחה היא על Teen UI — מסכי Stitch:
   https://github.com/adielgarat-pm/buff-mobile/tree/main/docs/teen-ui-design

   6 מסכים מאושרים ע"י Itay (2.5.2026):
   - dashboard-with-buddy/ (Wolf STORMY)
   - dashboard-no-buddy/ (stat cards — Itay's preferred)
   - buddy-toggle-flow/
   - tasks-detail/ (Today's Plan)
   - me-and-buddy/5a-with-buddy/ + 5b-my-stats/
   - rewards-shop/6a-from-parent/ + 6b-from-buddy/

   כל מסך מכיל: code.html + DESIGN.md + screen.png + design-notes.md

   2 מסכים עוד לא עוצבו:
   - settings/
   - teen-onboarding-choice/

7. docs/BUFF_VALUES.md — שלושת עמודי המוצר (Intrinsic Motivation / Positive Coaching / Independence-Building) + Values Checklist. **קריאה חובה לפני כל סשן.**

8. docs/WORKFLOW.md — הלולאה התלת-צדדית, Plan Mode, exit deliverables. *(יקבע ב-3.5.2026 — אם הקובץ לא קיים עדיין, דלג)*

המטרה שלי בשיחה הזו:
ליצור פרומפטים מסודרים ל-Claude Code שיתחיל לממש את ה-MVP על-בסיס
המסמכים והעיצובים. התוכנית שלנו ב-BUFF_GAP_ANALYSIS.md סעיף "הצעדים הבאים".

אחרי שקראת, תגיד לי בקצרה (5-7 שורות):
1. מה הסטטוס הנוכחי של הפרויקט
2. באיזה שלב בתוכנית העבודה אנחנו
3. אילו פיצ'רים תוכננו אבל עוד לא נבנו
4. האם התוכנית הגיונית? יש משהו שצריך לדרג מחדש?
5. האם יש משהו במסמכים שלא ברור או נראה לא עדכני
6. ההצעה שלך לסדר עבודה ל-Claude Code — באילו פיצ'רים להתחיל ולמה

אם הכל בסדר — תכין פרומפט ראשון ל-Claude Code. ואני במקביל אעצב את 2
המסכים הנותרים ב-Stitch.

הערות חשובות:
- אני עובדת ב-Windows. פקודות מקומיות צריכות להיות PowerShell-compatible
  (type / Get-ChildItem / Get-Content)
- כל פרומפט ל-Claude Code עצמאי וברור — אני מעתיקה ומדביקה אותו בנפרד
- Claude Code שלי מקומי במחשב, יש לו גישה מלאה לפרויקט
- מעדיפות פרומפטים עם read-only mode קודם, ואז פרומפט שני לעריכה
- 17 ימי עבודה זה ההערכה לקוד בלבד. אם יום עבודה מלא ביום בלוח =
  3-4 שבועות. אל תניח קצב ספציפי.

## Workflow כללי

עובדים לפי המתודולוגיה התלת-צדדית של D-2026-05-02-26:
1. Adi + Claude.ai מעצבים חבילת שיפור → `docs/sessions/{slug}/` עם SPEC/ROADMAP/TESTS/SPEC_SYNC/STATUS
2. Adi קומיטה את התיקייה
3. Adi + Claude Code מבצעים פאזות ברצף ב-VS Code, פאזה אחרי פאזה (Plan Mode)
4. כל phase exit כולל: code change + canonical doc updates + STATUS.md row + INTEGRATION_LEARNINGS.md אם הפתעות
5. סגירה: git tag, closeout checklist

לפרטים מלאים: `docs/WORKFLOW.md` (כשיוקם — 3.5.2026).

==========================================================

הערות לתחזוקת הקובץ הזה:

- כשנוסף מסך Stitch חדש → לעדכן את הרשימה בסעיף 6
- כשמתווסף מסמך docs חדש → להוסיף לרשימת הקריאה
- כשמתווסף איש צוות → לעדכן את "הצוות"
- אחרי milestones גדולים — לעדכן את "המטרה"
