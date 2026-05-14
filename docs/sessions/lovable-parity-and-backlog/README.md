# Lovable Parity & Backlog

**Slug:** `lovable-parity-and-backlog`
**Type:** Docs-only (אפס שינוי קוד)
**Branch מוצע:** `pkg/lovable-parity-and-backlog`
**נוצר:** 2026-05-14

## למה החבילה קיימת

אדי שאלה ב-2026-05-14: "מתי ואיך נכון לסאנסט את Lovable web app".

מהבדיקה התגלה ש-Lovable מכיל פיצ'רים שלא קיימים במובייל ושלא נמצאים בבקלוג:
- Parent Dashboard (סיכומים יומיים, דוח להורה — `daily-summary`, `generate-parent-summary` edge functions)
- Schedule parsing (טקסט חופשי → לוח זמנים, AI — `parse-schedule`)
- Email password recovery (חלקית קיים במובייל — חסר ResetPassword screen)
- אתר שיווקי (Landing.tsx)
- i18n אנגלית
- Translate review

בלי תיעוד מסודר — הפיצ'רים האלה ייעלמו מהזיכרון כשנגיע ל-Phase 2 ונחשוב שהמובייל "מוכן להחליף את Lovable".

במקביל, נדרשת החלטה אסטרטגית על ארכיטקטורת ה-Web העתידית של BUFF, לאור הרצון של אדי להישאר עם **קוד-בייס אחד**.

## מה החבילה משיגה

1. **תיעוד אסטרטגיית Web** ב-`BUFF_PRD.md` — ארכיטקטורה תלת-שכבתית (אתר שיווקי סטטי + Expo Web app + Backend Supabase).
2. **הוספת 7 שורות חדשות** ל-`BUFF_FEATURE_PRIORITIZATION.md`:
   - F-024 Daily summary להורה
   - F-025 Schedule parsing AI
   - F-026 Translate review
   - F-027 Email password recovery (להשלים)
   - F-028 Web build (Expo Web + PWA)
   - F-029 Static marketing landing
   - F-071 Sunset Lovable
3. **שינוי F-006** (Beta migration) מ-Must Have/MVP ל-Out — לפי החלטת אדי לוותר על הגירה אוטומטית.
4. **FLAG חדש** ב-`INTEGRATION_LEARNINGS.md`: לבדוק web compatibility לכל native dep חדש לפני התקנה.
5. **טיוטת decision** ב-`STATUS.md` — אדי תעתיק/תערוך ל-`BUFF_DECISIONS_LOG.md`.

## מה החבילה **לא** עושה

- שום שינוי קוד.
- שום מגע ב-Lovable או ב-Supabase שלו.
- שום בנייה בפועל של Web build / Expo Web (זה Phase 2).
- שום תקשורת ל-2 המשתמשים הפעילים של Lovable (ייעשה כשמתקרבים ל-sunset בפועל).
- עדכון ישיר של `BUFF_DECISIONS_LOG.md`, `BUFF_VALUES.md`, `BUFF_GAP_ANALYSIS.md` (של אדי).

## קבצים בסשן

- [`SPEC.md`](SPEC.md) — מטרות, Values Check, scope, open questions
- [`ROADMAP.md`](ROADMAP.md) — פאזה אחת
- [`SPEC_SYNC.md`](SPEC_SYNC.md) — איזה canonical docs מתעדכנים
- [`TESTS.md`](TESTS.md) — code review checklist
- [`STATUS.md`](STATUS.md) — מצב פאזות + טיוטת decision לאדי
- `README.md` — זה
