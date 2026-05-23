# Anchor Recovery

> Post-onboarding inactivity detection + parent prompt to add a bulletproof anchor (Vibe Check or Medication) when a kid hasn't been active for X days. Direct response to the 2026-05-23 research finding: 79% of pre-war active kids never returned, all 3 survivors had standalone bulletproof anchors.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## רקע

ב-2026-05-23 ניתחנו את הפעילות סביב מלחמת שאגת הארי (28.2-9.4) ואחריה. המקור: דיאלוג מחקרי בין Adi לClaude.ai, מבוסס Supabase MCP על buff-mobile snapshot + 5 JSON exports מ-Lovable. ה-data מעוגן ב-[~/buff-mobile-data/lovable-exports/](file:///C:/Users/adiel/buff-mobile-data/lovable-exports/) + memory files.

הממצא המכריע:

- **79% non-return** — 11 מ-14 ילדים שהיו פעילים בשבוע שלפני המלחמה, לא חזרו עד 6 שבועות אחרי שהיא נגמרה
- **3 iron-men שרדו**: Etay (15, משפחת אלגרת), Leia Sagy (7, משפחת Noa Morag), מתן (9, משפחת שני)
- **כולם** היו עם **standalone bulletproof anchor** — תרופה, מקלחת, או להתעורר לבד, כשעל פני שורה משלה ולא חבילה עם ארוחת בוקר
- **11 churners** ללא **אף anchor** מסוג זה

ה-Theory ([[buff-anchor-theory]]): כל ילד ב-BUFF צריך לפחות anchor אחד שהוא context-independent. אם נשבר ההרגל — אין מנגנון re-acquisition; הוא נשבר לתמיד.

## ההגבלה הקריטית שאדי שמה

**שום שינוי באונבורדינג.** הכל post-onboarding, דרך פרומפט עדין שמופעל רק כשמזוהה חוסר פעילות. ה-onboarding נשאר light כפי שהוא היום.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה. כולל Values Check, 9 Open Questions, Behavior Contract |
| `ROADMAP.md` | רצף פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

> **הערה:** אין `PRINCIPLES.md` — הפיצ'ר נשען על BUFF_VALUES.md.
> אין `PROMPTS.md` — הפרומפטים נמסרים בצ'אט עם universal preamble inlined.

## רצף ביצוע

1. סקרי [SPEC.md](./SPEC.md) במלואו. עני על 9 ה-Open Questions (או אישור גורף "מקבלת את כל ההמלצות").
2. **OQ9 (copy של ההצעה להורה) הוא קריטי לPillar 2** — חייב אישור מפורש לפני קוד.
3. וודאי שאת ב-branch `pkg/anchor-recovery` (off main).
4. פתחי שיחה חדשה ב-Claude Code (VS Code Extension).
5. הדביקי את ה-Brief מסוף [SPEC.md](./SPEC.md).
6. סקרי תוכנית של CC. דחי כל self-approved decision.
7. אישור: `approved, proceed`. CC מבצע chunk-by-chunk.
8. בסוף כל פאזה: בדיקות [TESTS.md](./TESTS.md), exit deliverables, ועדכון STATUS.md באותו commit.
9. אחרי כל הפאזות: git tag `pkg/anchor-recovery/v1`, closeout checklist.

## תלויות

| תלות | סטטוס | הערה |
|---|---|---|
| `pkg/daily-vibe-check` (Vibe Check + Low Power) | ✅ shipped | Anchor Recovery מוסיף credit + inactivity-trigger |
| `notifications` table | ✅ קיים | נשתמש בסוג חדש `'anchor_recovery'` |
| pg_cron extension | ✅ קיים (buddy-v05-backend) | אפשרי לproject inactivity detector באותה תבנית |
| `pkg/fcm-push-notifications` | 🟡 separate | v1 משתמש in-app בלבד; push אופציונלי לv1.1 |
| Lovable users migration | 🟡 ongoing | Anchor Recovery יחול על buff-mobile, לא על Lovable POC |

## כללי המתודולוגיה (קבועים — מ-WORKFLOW.md)

- CC עובד תמיד ב-Plan Mode
- אין self-approved decisions — Especially OQ9 (copy)
- Inspect actual code לפני הצעות
- Plan שולח chunk-by-chunk; סקירת diff אחרי כל אחד
- INTEGRATION_LEARNINGS.md לכל הפתעה
- STATUS.md ועדכוני canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שmoved-on לכל פאזה — **קריטי לחבילה הזו (Pillar 2 risk on copy)**

## מקורות

- Memory: `~/.claude/projects/C--Users-adiel-buff-mobile/memory/project_buff_anchor_theory.md`
- Memory: `~/.claude/projects/C--Users-adiel-buff-mobile/memory/project_buff_war_non_return.md`
- Memory: `~/.claude/projects/C--Users-adiel-buff-mobile/memory/project_buff_elgarat_test_case.md`
- Memory: `~/.claude/projects/C--Users-adiel-buff-mobile/memory/reference_lovable_user_data_location.md`
- Data: `C:\Users\adiel\buff-mobile-data\lovable-exports\` (5 family JSONs, gitignored)
