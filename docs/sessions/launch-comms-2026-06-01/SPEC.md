# Launch Comms 2026-06-01 — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.

**Type:** Docs + Copy (אפס שינוי קוד אפליקציה / schema)
**Trigger:** Beta launch 2026-06-01 לקבוצת WhatsApp + 49 משתמשי Lovable. Adi דורשת
תוצרי תקשורת מוכנים + כלים פנימיים להפעלת Lifetime ידנית.

---

## Capabilities & Bottlenecks

### מה Claude.ai יודעת / יכולה
- לסקור diffs של CC, להציף inconsistencies בין הניסוחים החדשים לבין PRD/BRAND/VALUES.
- לתאם בין החבילה הזו לחבילות מקבילות (buffadhd.com brand alignment).

### מה Claude Code (CC) יעשה
- כתיבת כל קבצי ה-session + שלושת הדליברבלס + F-074 AC.
- אימות סכמת `profiles` ב-Supabase MCP לפני כתיבת ה-playbook (בוצע 2026-05-25).
- git ops: branch + commit + PR.

### מה Adi חייבת לעשות בעצמה
- למלא placeholders: APK / Play Store URL ומועד הגעת ה-build.
- לאשר את ה-PR ולעשות merge.
- להריץ את ה-playbook ידנית בכל פעם שמשתמש cohort נרשם.
- לשלוח את המייל ל-49 ולפרסם את WhatsApp בקבוצה ה-HE.

### צוואר בקבוק / נקודות עצירה צפויות
- ה-Lifetime mechanism היה אמור להיות אוטומטי (TRACK_5_findings Option B). Adi
  החליטה ידני 2026-05-25. ה-playbook המסופק כאן מוריד את החיכוך, אבל זה עדיין
  טיפול ידני שמצריך תפעול שוטף עד שהמערכת תאומת מספיק לבנות אוטומציה.
- 49 מיילים = רשימה ש-Adi מחזיקה חיצונית (MailerLite או דומה). הם לא קיימים
  כעמודה ב-DB; ה-playbook מסתמך על ש-Adi מדביקה אותם כ-VALUES מקומי בכל
  שאילתת cross-reference, או שומרת אותם בקובץ gitignored.

---

## Values Check

> זו חבילת תקשורת בלבד — אין שינוי התנהגות מוצרית. ה-Values Check מחיל על
> ה-copy עצמו.

### Pillar 1 — Intrinsic Motivation
1. **האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?** N/A — לא מסר לילד.
2. **האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?** N/A.
3. **האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?** ה-copy למשתמשי Lovable
   מבליט "ה-Lifetime שלך **מחכה**" כ-gift, לא כ-obligation. נטייה ל-"אני רוצה".
   ✅

### Pillar 2 — Positive Coaching
1. **האם הניסוח אי-פעם משפיל / משווה / מציג כשל?** לא. אין הזכרה של "אתם
   לא השתמשתם", "Lovable נכשל", או כל שיפוט על משתמשים שלא יחזרו. ✅
2. **אם הילד נכשל...** N/A.
3. **האם יש מנגנון "סבל / איבוד / כעס"?** ה-Lifetime conditional-on-feedback —
   בנייתו תהיה לא-עונשית: "בעוד כמה שבועות אשאל ממך משוב, זה מה ששומר על
   ה-Lifetime פעיל". ✅ (revoke הוא שיחה, לא הענשה אוטומטית בשקט.)

### Pillar 3 — Independence-Building
1. **האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?** Sunset של Lovable
   = פחות פלטפורמות לתחזק, מתחזק לכיוון "until they don't need us" ✅.
2. **האם לילד יש קול בפיצ'ר?** N/A — הסכמה מבוגרים.
3. **בעוד 6 חודשים, הפיצ'ר עדיין הכרחי?** המייל = one-shot communication.
   ה-playbook = ייסטור עד שתוכרע אוטומציה. ✅ (לא קבוע — by design.)

### Brand Check (additional, per BUFF_BRAND.md §1-§6)

- ✅ **Essence:** המייל פותח ב-"בוקרים שקטים בלי לחזור על אותו דבר חמש פעמים" —
  outcome framing, לא mechanics.
- ✅ **Mission tagline:** "עד שהם כבר לא יזדקקו לנו" משמש כ-sign-off.
- ✅ **Glossary (BRAND §6):** אין הזכרה של BUFFs / BUDDY / 70% / streaks / rewards.
- ✅ **Tone:** Coach, pragmatic, ללא סימני קריאה, ללא empathy גנרי
  ("אנחנו מבינים אותך").
- ✅ **Sign-off:** Founder credibility (BUFF_PERSONAS trust signal #1).

**Values + Brand Check Pass:** ✅ עובר.

---

## Goals

1. לספק נוסח Migration Email מוכן לשליחה ל-49 משתמשי `marketing_consent = true`.
2. לספק שתי גרסאות WhatsApp HE מוכנות לפרסום בקבוצה הפעילה (46 משתתפים).
3. לספק playbook SQL מקיף שמאפשר ל-Adi לבצע Lifetime grant ידני בפחות מ-60
   שניות לכל משתמש שנרשם.
4. לתעד את שני קישורי קהילת ה-WhatsApp ב-F-074 AC עבור landing דף ה-Expo Web
   Phase 2 העתידי.

## Non-goals

- שום שינוי קוד אפליקציה.
- שום שינוי schema (כל ה-lifetime עובד עם דגלים קיימים: `is_lifetime_access`,
  `is_lifetime_founding`, `founding_member_number`).
- שום בניית מנגנון אוטומטי ל-Lifetime grant (Option B מ-TRACK_5_findings).
- שום גרסה אנגלית ל-WhatsApp (הקהילה האנגלית = 5 משתתפים, לא מצדיק תרגום).
- שום שינוי בתוכן/קוד buffadhd.com (Lovable) — מתנהל בשיחה מקבילה.
- שום עדכון של `BUFF_DECISIONS_LOG.md` / `BUFF_VALUES.md` / `BUFF_GAP_ANALYSIS.md`.

## Behavior Contract

- 4 קבצי deliverable מוכנים ב-`docs/sessions/launch-comms-2026-06-01/deliverables/`
  ובתוך `docs/sessions/lovable-parity-and-backlog/SPEC.md`.
- כל ה-placeholders מסומנים `[PLACEHOLDER_NAME]` בסוגריים מרובעים.
- ה-playbook עובר read-through של Adi לפני שיצא לפעולה ראשונה.
- ה-PR נסגר כשכל ה-placeholders שאינם של Adi מולאו (יש 2 כאלה ב-merge: APK URL,
  Play Store URL — שניהם בידי Adi בלבד).

## Schema Changes

אין.

## API / Route Changes

אין.

## UI Changes

אין.

## Resolved Decisions (2026-05-25)

1. **Lifetime mechanism = manual + conditional on feedback** (Adi 2026-05-25):
   ה-Lifetime ניתן ידנית בהרשמה. ההמשכיות תלויה במשוב ממשתמש לאחר תקופת שימוש.
   Option B (pending_lifetime_grants + handle_new_user trigger) מ-TRACK_5_findings
   נדחה — לא נבנה עכשיו.

2. **Cohort scope = all 49** (Adi 2026-05-25): המייל יוצא לכל 49 מ-
   `marketing_consent = true`, ולא רק ל-24 הקבוצה המצמצמת מ-TRACK_5_findings
   (שכללה גם "completed family setup" + "recoverable email"). השמונה שלא היה
   ניתן לחלץ מייל ל-`email_logs` יישלחו מ-MailerLite (חיצוני ל-DB).

3. **Lifetime flag = C** (Adi 2026-05-25): שני הדגלים יסומנו +
   `founding_member_number` יוקצה סדרתית (1..N). הסיבה: שמירה על אופציה
   להכרת תודה עתידית (badge / Reel "Founding Members" / certificate).

4. **English WhatsApp = skipped** (Adi 2026-05-25): הקהילה האנגלית (5 משתתפים)
   קטנה מכדי להצדיק תרגום בחבילה הזו. תיפתח חבילה נפרדת `pkg/comms-en-translations`
   אם/כשהקהילה האנגלית גדלה לסף משמעותי.

5. **APK distribution = Play Store internal testing** (default, Adi לא ענתה
   במפורש): ה-URL במייל וב-WhatsApp הוא placeholder ל-Play Store internal/closed
   testing track. Adi ממלאת ב-pre-send.

6. **Cross-session edit** (Adi 2026-05-25): התוספת ל-`lovable-parity-and-backlog/SPEC.md`
   F-074 AC נכנסת באותו PR כמו שאר החבילה, למרות ש-`lovable-parity-and-backlog`
   נמצא במצב `_blocked_` (Phase 1 awaiting Adi review). השינוי additive ולא
   נוגע בקיים.

## Out of Scope

- כל שינוי קוד אפליקציה.
- אוטומציה של Lifetime grant.
- תרגום ל-EN של WhatsApp.
- שינוי באתר Lovable הקיים.
- בניית טבלת audit-log ל-Lifetime grants (נמצא נדרש בעתיד? פתח חבילה.)
- עדכון BUFF_DECISIONS_LOG.md (CC נותן draft → Adi כותבת).
- ניתוק/הסרת `marketing_consent` או טיפול ב-187 dangling profiles
  (open question #1 מ-TRACK_5_findings — דורש חבילה נפרדת).
