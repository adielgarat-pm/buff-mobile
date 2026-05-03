# BUFF — Integration Learnings

> זיכרון ארוך טווח של הפרויקט. הפתעות, FLAGs פתוחים, החלטות שלא הפכו לDECISIONS רשמיות אבל לא רוצות להיעלם.

**מבנה כל ערך:**
- **תאריך** של גילוי / יצירה
- **מקור** — מי גילה (Adi / Claude.ai / CC) ובאיזה הקשר
- **תיאור** — מה זה
- **השפעה** — על מה זה משפיע
- **סטטוס** — `open` / `resolved` / `deferred`
- **קשור ל** — DECISION ID, package slug, וכו'

---

## FLAGs פתוחים

### F-2026-05-03-01: Onboarding fixes שעדיין לא ב-GAP_ANALYSIS

- **תאריך:** 3.5.2026 (התגלה ב-2.5.2026 בסקירה של הזיכרון של Claude.ai)
- **מקור:** Claude.ai (web) — בזיכרון של מסכמי שיחות עבר
- **תיאור:** רשימת תיקונים שסוכמו בשיחות עבר אבל לא הוכנסו ל-GAP_ANALYSIS:
  - החלפת text input ליום הולדת ב-`@react-native-community/datetimepicker` (פורמט "19 Oct 1998")
  - שינוי שם "Homework & grades" → "Homework & focus"
  - הוספת Section B ב-Step 3 (Challenges screen) עם multi-select checkboxes שמסתירות אופציות Section A
  - עטיפת Step 3 ב-ScrollView
  - פתרון אופציות זהות שמופיעות גם ב-Step 2 וגם ב-Step 3
- **השפעה:** ה-onboarding flow עלול להיות במצב לא רצוי בקוד. צריך אודיט מול הקוד הקיים.
- **סטטוס:** `open`
- **קשור ל:** Adi הורתה לא להוסיף ל-GAP_ANALYSIS חד-צדדית. ידון בסשן עתידי + יוסכם יחד מה להכניס.

---

### F-2026-05-03-02: Invite Link Option B (deep linking)

- **תאריך:** 3.5.2026 (התגלה ב-2.5.2026)
- **מקור:** Claude.ai — בזיכרון של תוכניות עתידיות
- **תיאור:** אחרי דדליין RevenueCat (1.5.2026), יישום Option B של invite link:
  - רישום `buff://join/:code` ב-`handleDeepLink`
  - Pre-fill של `SignupScreen` עם invite code
  - הוספת Universal Links לתמיכה ב-HTTPS domain
- **השפעה:** Invite flow המלא עוד לא ממומש. כרגע Option A (קוד-בלבד, ללא deep link) פעיל.
- **סטטוס:** `open`
- **קשור ל:** Adi הורתה לא להוסיף ל-GAP_ANALYSIS חד-צדדית. ידון בסשן עתידי.

---

### F-2026-05-03-03: קוד עוד ב-13-15 לאחר D-25 (הרחבה ל-13-18)

- **תאריך:** 3.5.2026
- **מקור:** D-2026-05-02-25 (תיעוד) + סשן ה-docs update
- **תיאור:** ה-docs עודכנו לטווח 13-18, אבל הקוד עוד מכיל auto-detection של mode לפי "13-15 = teen". מקומות ספציפיים לבדוק:
  - UI mode auto-detection logic
  - Hard-coded גיל ב-validation
  - Strings ב-onboarding screens אם יש מפורש "13-15"
- **השפעה:** מתבגר בן 16-18 שירשם עכשיו לא יקבל את Teen UI אוטומטית.
- **סטטוס:** `open` — לפעולה ב-session "Age Range Update" עתידי
- **קשור ל:** D-2026-05-02-25

---

### F-2026-05-03-04: buffadhd.com — תוכן פומבי לא מסונכרן

- **תאריך:** 3.5.2026
- **מקור:** סשן בדיקה של terminology (Cog-Fun research)
- **תיאור:** ה-title של buffadhd.com עדיין: "BUFF — ADHD Routine App for Kids | Executive Function Training". לא בדקנו את שאר התוכן באתר. צריך:
  - לוודא שטווח גילאים (אם מצוין) מעודכן ל-6-18
  - לוודא שאין שימוש במונח "Cog Fun" / "קוגפאן" (D-29)
  - לבדוק תאימות לשפת BUFF_VALUES (Intrinsic Motivation, Positive Coaching, Independence-Building)
- **השפעה:** Marketing alignment. עלולה להציג את BUFF לא נכון.
- **סטטוס:** `open` — לפעולה בסשן Marketing/UI עתידי
- **קשור ל:** D-2026-05-02-25, D-2026-05-02-29

---

### F-2026-05-03-05: BUFF_BUDDY_SYSTEM.md הוא spec-only

- **תאריך:** 2.5.2026
- **מקור:** סשן ה-Spec Status header
- **תיאור:** ה-doc מתאר את BUDDY V0.5 (post-2.5.2026 redesign) עם 5 friendship levels, 6 boosters, EOD trigger. הקוד הקיים ממש *spec ישן יותר* — 4 evolution stages + skins, ללא friendship levels, ללא boosters, ללא EOD trigger.
- **השפעה:** כל מי שקורא את ה-doc חושב שהקוד ממש את ה-V0.5. **לא נכון.**
- **סטטוס:** `deferred` — Reconciliation תיעשה ב-BUDDY implementation session, אז ייעשה code audit מפורש.
- **קשור ל:** Spec Status header נוסף ב-2.5.2026 ל-BUDDY_SYSTEM.md

## רשומות שנפתרו (Resolved)

### F-2026-05-03-06 (RESOLVED 2026-05-03): `.claude/settings.local.json` — file noise

- **תאריך פתיחה:** 3.5.2026
- **תאריך סגירה:** 3.5.2026 (אותו יום)
- **מקור הגילוי:** sessions של 2.5.2026 ו-3.5.2026 (מופיע כ-modified בכל git status)
- **תיאור מקורי:** קובץ הגדרות מקומי של Claude Code Extension משתנה בכל סשן. יוצר רעש ב-`git status`.
- **ההשפעה שהייתה:** קוסמטי. עלול היה להיות מקומיט בטעות.
- **איך נפתר:** ב-PR `workflow-foundation` (commit 5d374b3 ב-main):
  1. הוספה של `.claude/settings.local.json` ל-`.gitignore`
  2. `git rm --cached .claude/settings.local.json` — ניתוק הקובץ מ-tracking (CC זיהה ש-`.gitignore` לבד לא מספיק לקבצים שכבר tracked)
- **קשור ל:** D-2026-05-02-28 (VS Code Extension), D-2026-05-03-30 (Workflow Foundation)
- **לקח להמשך:** קבצי הגדרות מקומיים של כלים שלא צריכים להיות בריפו — לוודא בכל הוספת dependency חדשה / כלי חדש שהם ב-`.gitignore` *לפני* commit ראשון.

---

## Lessons

### Lesson 2026-05-03 — Snapshot fabrication + recommendation cascade

**Symptom:** CC produced a 6-bullet snapshot containing *"RevenueCat: grace period expired May 1 — payment system needed urgently."* Claude.ai accepted the claim and built a pushback recommending RevenueCat go-live instead of the planned DevEx package.

**Root cause:** Three layers failed simultaneously.
1. **Loose prompt (Claude.ai):** "10-15 key points" invited synthesis instead of extraction.
2. **No anchor protocol (CC):** "grace period expired" + "needed urgently" had no source. Actual source `BUFF_DECISIONS_LOG.md` D-2026-05-01-05 says only "RevenueCat מוגדר ועובד" — no grace period, no urgency.
3. **No verification gate (Claude.ai):** Used unverified claim as basis for sequencing change. BUFF skill Rule 8 (verification, not memory) was bypassed.

**Mitigation (snapshot-protocol package, this commit series):**
- Read-only Snapshot Protocol → `CLAUDE.md`
- Snapshot Prompt Template + Verification Gate → `docs/WORKFLOW.md`
- This entry as canonical incident reference

**Pattern to watch:** When a CC-produced claim "sounds right" or fits a narrative, both CC and Claude.ai are tempted to skip anchoring. The verification gate makes the skip impossible.

**FLAGs opened:** None — process fix, not code FLAG.

---

## איך למלא ערך חדש

CC, Claude.ai, או Adi — מי שמגלה את ההפתעה רושם. הפורמט:

```markdown
### F-{YYYY-MM-DD}-{##}: {כותרת קצרה}

- **תאריך:** YYYY-MM-DD
- **מקור:** [Adi / Claude.ai / CC] — בהקשר של {sessions/{slug}/ או description}
- **תיאור:** מה גילית / מה ההפתעה
- **השפעה:** על מה זה משפיע (קוד / docs / UX / וכו')
- **סטטוס:** `open` / `resolved` / `deferred`
- **קשור ל:** DECISION ID / package slug / FLAG אחר
```

**מתי להעביר ל-resolved:** כשFLAG נפתר (פיצ'ר ממומש, מסמך מסונכרן, baseline נסגר). מעבירים את הערך לסעיף "רשומות שנפתרו" עם תאריך resolution והפניה לcommit/session שסגר אותו.

**מתי NOT לרשום פה:**
- החלטות אסטרטגיות → DECISIONS_LOG
- עקרונות קבועים → BUFF_VALUES.md
- אפיון פיצ'ר → SPEC.md של חבילה
- bugs לתיקון מהיר → ישר ל-CC ב-Direct Fix
