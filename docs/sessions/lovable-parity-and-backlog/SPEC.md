# Lovable Parity & Backlog — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**Type:** Docs-only (אפס שינוי קוד)
**Trigger:** שיחת תכנון 2026-05-14 — אדי שאלה "מתי ואיך לסאנסט את Lovable" → גילוי ש-Lovable מכיל פיצ'רים שלא במובייל ולא בבקלוג → דרושה החלטה אסטרטגית על web + תיעוד פערים.

---

## Capabilities & Bottlenecks

> מה כל אחד מהצדדים יכול ולא יכול לעשות בחבילה הזו.

### מה Claude.ai (אני) יכולה
- לסקור diffs של CC, להציף inconsistencies בין השורות החדשות לבין PRD/VALUES.
- לתאם בין החבילה הזו לסשנים פתוחים אחרים (DevEx, Buddy V0.5, Founding-100 Payment).

### מה Claude Code (CC) יעשה
- כל עדכוני ה-docs בחבילה (CC כותב, אדי סוקרת).
- נעשה כבר: מיפוי מלא של Lovable repo (`C:\Users\adiel\buff-lovable`) — pages, edge functions, סכמה, deps.
- נעשה כבר: אימות auth flow במובייל (`signInWithPassword`, `signInWithOAuth`, `resetPasswordForEmail` קיימים; ResetPassword screen חסר).

### מה Adi חייבת לעשות בעצמה
- לסקור את ה-diff של פאזה 1 ולאשר ("approved, proceed" לפני merge).
- להעתיק/לערוך את טיוטת ה-decision מ-STATUS.md אל `BUFF_DECISIONS_LOG.md` בעצמה (CLAUDE.md: DECISIONS_LOG הוא של אדי בלבד).
- ליצור קשר עם 2 המשתמשים הפעילים ב-Lovable כשמגיעים לסאנסט (לא בחבילה הזו — Phase 2).

### צוואר בקבוק / נקודות עצירה צפויות
- אם אדי לא מסכימה עם priority של פיצ'ר חדש (F-024..F-029, F-071) — עוצרים, מתאימים, לא ממשיכים.
- F-006 → Out הוא שינוי decision קיים — דורש אישור מפורש לפני הפעולה.
- F-027 (Email password recovery) — הצעה ל-Should Have / MVP. אדי יכולה לדחות ל-Out אם רוצים רק Google OAuth ב-MVP.

---

## Values Check

> 9 שאלות מ-`docs/BUFF_VALUES.md`. **חייבים לעבור על כולן לפני שCC כותב קוד.**
> נכשל באחת = עצירה ודיון, לא ממשיכים בשקט.

**הערה:** זו חבילת תיעוד בלבד — אין שינוי התנהגות מוצרית. ה-Values Check מחיל ב-meta: האם ההחלטות שאנו מתעדים תואמות את הערכים, ואיזה דגלים לזכור כשנגיע ליישום.

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?** N/A — חבילת תיעוד. הפיצ'רים שמוצעים לבקלוג (Parent Dashboard, Schedule Parser) לא מציעים תגמולים חדשים לילד.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?** N/A.
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?** N/A.

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?** ⚠️ **דגל לזכור ב-F-024 (Daily summary):** כשנעצב את הפיצ'ר, חייבים לוודא שהסיכום אינו "דוח כשלים" של הילד אלא תיעוד הצלחות + הזדמנויות. כרגע — חבילה זו רק רושמת אותו, לא מעצבת.
2. **אם הילד נכשל — האם התגובה היא empathy או pressure?** N/A בחבילה.
3. **האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?** N/A.

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?** F-028 (Web build) ו-F-029 (אתר שיווקי) תומכים בנגישות — ילד או הורה יכולים לגשת מכל מכשיר. ✅
2. **האם לילד יש קול בפיצ'ר?** N/A בחבילה.
3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?** F-071 (Sunset Lovable) הוא דוגמה לעבודה שעושה את עצמה ומתבטלת. ✅

**Values Check Pass:** ✅ עובר. שני flags לזכור ב-Phase 2:
- F-024 — ניסוח חיובי בסיכום היומי להורה.
- F-027 — שמירה על UX אחיד למשתמשי Email מול Google OAuth.

---

## Goals

1. לתעד באופן רשמי את הארכיטקטורה התלת-שכבתית (Static landing + Expo Web app + Supabase backend) בסעיף חדש 9.4 ב-`BUFF_PRD.md`.
2. להוסיף 7 שורות חדשות ל-`BUFF_FEATURE_PRIORITIZATION.md` (F-024, F-025 ל-PARENT DASHBOARD; F-071..F-075 ל-TECHNICAL INFRASTRUCTURE) כדי שלא נשכח את הפיצ'רים החסרים מ-Lovable כשמגיעים ל-Phase 2.
3. לשנות F-006 (Beta migration) מ-Must Have/MVP ל-Out — לפי החלטת אדי 2026-05-14 לוותר על הגירה אוטומטית.
4. להוסיף FLAG ל-`INTEGRATION_LEARNINGS.md` לגבי web compatibility של מודולים native.
5. לטיוטה decision ב-`STATUS.md` שאדי יכולה להעתיק/לערוך ל-`BUFF_DECISIONS_LOG.md`.

## Non-goals

- שום שינוי קוד.
- שום שינוי ב-`BUFF_VALUES.md` או ב-`BUFF_GAP_ANALYSIS.md` (שם של אדי בלבד).
- שום בנייה בפועל של Web build / Expo Web (זה Phase 2 פוסט-MVP).
- שום מגע ב-Lovable או ב-Supabase של Lovable.
- שום החלטה על תאריך מדויק לסאנסט (תלוי בקצב MVP — ייקבע בנפרד).
- POC להוכחת Expo Web (חבילה נפרדת אם נרצה).

## Behavior Contract

> מה המערכת עושה end-to-end אחרי שהחבילה הזו נסגרת.

- `BUFF_PRD.md` מכיל סעיף "Web Strategy" שמסביר את הארכיטקטורה התלת-שכבתית כתכנית עתידית, כולל הסבר מדוע Expo Web בחר על-פני Capacitor או web נפרד, וה-trade-offs הידועים.
- `BUFF_FEATURE_PRIORITIZATION.md` מכיל את 7 השורות החדשות (F-024..F-029, F-071) ואת F-006 מעודכן ל-Out.
- `INTEGRATION_LEARNINGS.md` מכיל את ה-FLAG החדש: לפני התקנת native dep — לבדוק web compat.
- אדי מקבלת טיוטת decision מוכנה ב-`STATUS.md` של החבילה — היא מעתיקה/עורכת ל-`BUFF_DECISIONS_LOG.md`.
- כל פיתוח עתידי של פיצ'ר מ-Lovable יודע איפה לחפש את הקונטקסט (PRD §Web Strategy + השורות החדשות ב-FEATURE_PRIORITIZATION).

## Schema Changes

אין. חבילת תיעוד.

## Prompts Changes (אם רלוונטי)

אין.

## API / Route Changes

אין.

## UI Changes

אין.

## Resolved Decisions (2026-05-14, post-approval)

1. **ID assignment fixed to respect section structure:**
   - F-024 (Daily summary), F-025 (Schedule parsing) → PARENT DASHBOARD section (IDs F-024..F-029 reserved there)
   - F-071 (Translate review), F-072 (Email password recovery), F-073 (Web build), F-074 (Static landing), F-075 (Sunset Lovable) → TECHNICAL INFRASTRUCTURE section (after F-070)
2. **F-072 (Email password recovery) — Out / Phase 2, Conditional.** הנימוק: אדי שאלה "אם Google תומך בזה, למה צריך?". הקוד היום תומך גם ב-email/password וגם ב-Google OAuth, ו-`ChildJoinScreen` יוצר משתמשים עם auto-password. אם בעתיד תוסר תמיכה ב-email/password ב-MVP — F-072 מבוטל לחלוטין. אם תישאר — F-072 חוזר ל-Should Have. **תלוי בסשן Auth Strategy עתידי, לא בחבילה הזו.**
3. **F-073 (Web build) timing** — דחוי לפוסט-MVP. POC = חבילה נפרדת אם נרצה.
4. **F-074 (Static landing) scope** — רק שורה ב-PRD בשלב זה. מסמך נפרד `BUFF_MARKETING_SITE.md` יוכן רק כשנתחיל בפועל בתכנון המעבר.
5. **תאריך סאנסט Lovable (F-075)** — לא מוחלט עכשיו. ייקבע אחרי MVP יציב לפרודקשן + 30 יום observation.
6. **F-071 refined (post-commit-1):** הוגדר מחדש כ-"In-app reviews mechanism (submit → moderate → display)". בקוד Lovable יש flow מלא + טבלת `reviews` + `translate-review` edge function. **החלטת אדי: Play Store ratings מספיקות ל-MVP — לא בונים מערכת כפולה.** הביקורות הקיימות ב-Lovable יחולצו ויתורגמו לאנגלית כ-testimonials (משימה חיצונית — INTEGRATION_LEARNINGS F-2026-05-14-02).
7. **F-075 הורחב למודל white-glove (Adi choice):** 2 המשתמשים הפעילים ב-Lovable יקבלו טיפול אישי — חשבונות מוכנים בסופאבייס החדש + מייל "set your password". ללא הגירת דאטה. F-075 effort עלה S→M.

## F-074 — Static Marketing Landing: Acceptance Criteria (Expo Web Phase 2)

> Captured 2026-05-25 in `pkg/launch-comms-2026-06-01`. Applies to the future
> Expo Web Phase 2 landing page rebuild — **NOT** to the current buffadhd.com
> (Lovable) site, which is managed in a parallel session.

Acceptance criteria for the Expo Web Phase 2 landing page:

- **AC-F074-01 — WhatsApp community links preservation:** Page must include
  prominent invite links to BUFF's WhatsApp communities, identical in
  placement and prominence to the current Lovable site's, to preserve the
  organic community growth channels:
  - **Hebrew community** (46 members, active): `https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5`
  - **English community** (5 members, low-activity): `https://chat.whatsapp.com/KM1b9UmQO0cBGgCVI54W7R`
  - **Rationale (Adi, 2026-05-25):** *"הקישור לוואטסאפ יושב בתוך האתר — צריך לשמר את זה גם אצלנו."*
  - **Source:** `pkg/launch-comms-2026-06-01`.

## Out of Scope

- כל שינוי קוד מובייל.
- כל POC ל-Expo Web (חבילה נפרדת אם נרצה).
- כל פעולת migration על משתמשי Lovable.
- שינוי ב-buffadhd.com (האתר השיווקי הקיים).
- עדכון `BUFF_DECISIONS_LOG.md` (CC נותן טיוטה; אדי כותבת).
- עדכון `BUFF_VALUES.md` ו-`BUFF_GAP_ANALYSIS.md` (לא נוגעים).
- עדכון `BUFF_FEATURE_AUDIT.md` (זה אינוונטר של פיצ'רים *קיימים*; הפיצ'רים החדשים עדיין לא קיימים).
