# BUFF — Decisions Log

**מטרה:** תיעוד החלטות מוצריות והנדסיות עם תאריך ונימוק.

**מבנה:** כל החלטה כוללת תאריך, ההחלטה, הסיבה, ומסמכים שצריך לעדכן בעקבותיה.

---

## 2 ביוני 2026 — Play Store branding

### D-2026-06-02-01: שם המפתח (Developer name) ב-Google Play שונה ל-"BUFF ADHD Studio"

**ההחלטה:** שורת ה-Developer name שמופיעה מתחת לכותרת האפליקציה ב-Google Play משתנה מ-`BUFF -By Adi` ל-**`BUFF ADHD Studio`**. (השינוי מתבצע ידנית ע"י Adi ב-Play Console → Settings → Developer account → Account details → Developer name. account-level, משותף לכל האפליקציות.)

**הסיבה:**
- `BUFF -By Adi` נשמע כפרויקט אישי; `BUFF ADHD Studio` משדר ישות/צוות מאחורי המוצר — מעלה אמון אצל הורים ששוקלים אפליקציה לילד.
- שילוב המותג (BUFF) + הקטגוריה (ADHD) + תחושת צוות (Studio) בשדה אחד, בלי כפילות של "BUFF" ובלי "By" מיותר (גוגל כבר מציגה את השורה כ"מי המפתח" מעצם המיקום).
- תואם English-first GTM ונותן לאיתי את ה-"Studio" שהוא הציע (Teen UI co-creator).
- נדחו: `BUFF -By Adi` (אישי מדי), `BUFF ADHD - By BUFF Studio` (כפילות + "By" מיותר).

**מסמכים מושפעים:**
- שם האפליקציה (`BUFF: Habit Quest Kids & Teens`) — לא משתנה.
- אין שינוי קוד. הגדרה account-bound ב-Play Console בלבד.

---

## 25 במאי 2026 — Sentry monitoring + first production AAB

### D-2026-05-25-01: Sentry crash monitoring re-adopted + first production AAB v10 shipped

**ההחלטה:** אחרי שעבודת ה-Sentry + EAS של 2026-05-16 אבדה (שני ה-branches `pkg/expo-health-and-eas-android` + `pkg/sentry-crash-monitoring` נמחקו לפני merge ל-main), שוחזרה כל החבילה ב-`pkg/sentry-eas-resumption` (PR #85, merge commit `20fa598`). Sentry React Native @~7.2.0 חי ב-production+preview עם source-map symbolication ו-PII scrubbing אגרסיבי. AAB v10 (build `c9aa1828`, https://expo.dev/artifacts/eas/qUkBTuTYYccCZjUm1kSd1t.aab) מוכן ל-Play Console Internal Testing לקראת launch של 2026-06-01.

**הסיבה:**
- 5/16 ה-decision שכבר נלקח (D-2026-05-16-02 — Sentry as crash monitor) אבד עם ה-branch. ההחלטה מאומצת מחדש בלי שינוי.
- אותו vendor, אותו DSN, אותו project (`buffadhd/react-native`), אותו secret (`SENTRY_AUTH_TOKEN`) — כולם שרדו ב-EAS/Sentry cloud. אין הצדקה לשנות vendor או להחליף config.
- ה-launch 2026-06-01 דורש crash visibility — בלעדיו beta WhatsApp = blind shipping.
- Pillar 2 (Positive Coaching) מחייב PII scrubbing אגרסיבי כי BUFF היא אפליקציית ילדים. `beforeSend` מנקה email/username/ip_address, `beforeBreadcrumb` regex-redact emails ל-`[email]` literal. Dev profile DSN-less (init no-op) כדי לא לבזבז 5K/month free-tier quota.

**מסמכים מושפעים:**
- `CLAUDE.md` §Tech Stack — distribution + observability lines (this commit)
- `CLAUDE.md` §Open FLAGs — added Resolved entries (this commit)
- `docs/INTEGRATION_LEARNINGS.md` — F-2026-05-05-01 → resolved + new IN-2026-05-25-02 (this commit)
- `docs/sessions/sentry-eas-resumption/` — full SPEC, ROADMAP, TESTS, SPEC_SYNC, STATUS, PR_DRAFT, PLAY_CONSOLE_v10_UPLOAD.md (PR #85)

---

### D-2026-05-25-02: Reinforce Verify-Before-Delete Protocol after 5/16 work-loss incident

**ההחלטה:** Verify-Before-Delete Protocol מ-CLAUDE.md (introduced after the 2026-05-04 incident) הופעל בהצלחה ב-PR #85 לפני שCC נמחק את branch `pkg/sentry-eas-resumption` — אכיפה אופרטיבית של הכלל עובדת. בנוסף, חבילת `pkg/sentry-eas-resumption` הוסיפה דפוס חדש ל-INTEGRATION_LEARNINGS (`IN-2026-05-25-02`): "pause > 5 days → merge phase-complete commits to main via PR even mid-package", כדי למנוע חזרה על אובדן 2026-05-16.

**הסיבה:**
- 2026-05-16: שני packages נעצרו mid-Phase-4 עם branches שעמדו 9 ימים בלי merge. ה-branches נמחקו לפני שbase regression חזרה — וכל ה-work נעלם.
- Verify-Before-Delete Protocol הקיים מ-2026-05-04 דורש "branch deletion → must verify content present in main first" — וזה נכון ועדיין מספיק.
- מה שחסר היה: protocol לפני pause ארוך. Adi לא ידעה שbranch של 9 ימים בסיכון. ה-IN entry מוסיף את הקיים: כל pause > 5 days → merge מה שעבר tests עכשיו, גם אם החבילה כולה לא הסתיימה.
- ה-tag הזה לא מוסיף rule חדש ל-CLAUDE.md (Adi's prerogative), רק מתעד את ה-lesson ב-INTEGRATION_LEARNINGS לקריאה עתידית.

**מסמכים מושפעים:**
- `docs/INTEGRATION_LEARNINGS.md` — IN-2026-05-25-02 (this commit)
- `CLAUDE.md` § Verify-Before-Delete Protocol — לא נוגעים (כלל הקיים עובד; ה-lesson ב-IN המיועד לקריאה לפני pause ארוך)

---

## 3 במאי 2026 — Workflow Foundation

### D-2026-05-03-30: ה-Workflow Foundation חי ב-main

**ההחלטה:** ה-workflow תלת-צדדי (D-26) קיבל היום את התשתית המלאה שלו ב-`main`, וזה הופך אותו מ"כיוון מוסכם" ל"מתודולוגיה אכיפה".

**מה נוסף ב-`main` (PR `workflow-foundation`, merge 5d374b3):**
- `CLAUDE.md` (שורש הריפו) — חוקי הפרויקט שCC קורא ראשון בכל סשן
- `docs/WORKFLOW.md` — המסמך המגדיר של הלולאה (472 שורות, 14 סעיפים)
- `docs/INTEGRATION_LEARNINGS.md` — זיכרון ארוך טווח, 6 FLAGs פתוחים מתועדים
- `docs/sessions/_template/` — 7 קבצים: README, SPEC (כולל Capability Check + Values Check), PRINCIPLES, ROADMAP, TESTS, SPEC_SYNC, STATUS
- עדכוני `docs/README.md` ו-`.gitignore`

**מה זה אומר בפועל:**
- כל חבילת שיפור עתידית מועתקת מ-`docs/sessions/_template/` לתיקייה חדשה ב-`docs/sessions/{slug}/`
- כל סשן CC מתחיל בקריאת `CLAUDE.md` → `WORKFLOW.md` → `BUFF_VALUES.md` → SPEC של החבילה
- 5 modes של Claude.ai (Package Design / Log Analysis / Spec Sync + sub-modes Capability Check ו-Values Check) פועלים אוטומטית לפי זיהוי הסיטואציה
- spec drift, FLAGs פתוחים, וצומתי החלטה כולם מתועדים במבנה אחיד

**הסשן הבא (כשיהיה זמן):** Improvement Package ראשון — **DevEx: Expo build + Android emulator hookup**. מטופל בדיוק לפי המתודולוגיה החדשה, ומשמש גם test case ל-workflow עצמו.

**מסמכים מושפעים:** ראי commit 5d374b3 (13 קבצים).

**מסכם וסוגר:** D-2026-05-02-26 (אימוץ workflow), D-2026-05-02-27 (BUFF_VALUES כעוגן), D-2026-05-02-28 (VS Code).

---

## 2 במאי 2026 — Workflow setup, Values, ושינוי טווח גילאים

### D-2026-05-02-29: לא להשתמש במונח "Cog Fun" / "קוגפאן" עד שיש קלינאית שותפה

**ההחלטה:** המונחים **"Cog Fun"** ו-**"קוגפאן"** לא יופיעו בשום מסמך, קוד, אתר, או תוכן שיווקי של BUFF, אלא אם יום אחד תצטרף קלינאית מקצועית שתסכים להיות חתומה על האפליקציה.

**הקשר:** Cog-Fun הוא מודל טיפולי ממוסד של פרופ' אדינה מאיר (אוניברסיטת העברית והדסה), עבר RCT, יש לו גרסה למתבגרים (Teen Cog-Fun) וגרסה למבוגרים (Cog-Fun A). השם והמודל הם IP מוגן.

**סיבה:** סיכון IP. שימוש במונח בלי הסכמה מקצועית פורמלית עלול להציג את BUFF כיישום של המודל בלי שיש לכך בסיס.

**מה כן מותר:**
- להשתמש ב**עקרונות הגנריים** של התחום (תפקודים ניהוליים, חיזוק חיובי, התאמה לחיי היומיום, מודעות עצמית)
- מונחים מקצועיים תקניים: "Executive Function" (כבר ב-buffadhd.com), "ADHD support", "self-regulation"
- כל המונחים שב-BUFF_VALUES.md (Intrinsic Motivation, Positive Coaching, Independence-Building)

**אם בעתיד תצטרף קלינאית:** נחזור להחלטה הזו, נבחן יחד עם הקלינאית את האפשרות לקשר רשמי למודל — או לא.

**מסמכים מושפעים:** BUFF_VALUES.md (כבר נבנה ללא המונח); כל תוכן שיווקי עתידי.

---

### D-2026-05-02-28: VS Code + Claude Code Extension כסביבת עבודה רשמית

**ההחלטה:** סביבת העבודה הרשמית של Adi לפיתוח BUFF היא **VS Code** עם **Claude Code Extension** הרשמי של Anthropic. החלפנו את הסביבה הקודמת (File Explorer + Notepad + טרמינל ישיר של Claude Code).

**סיבה:**
1. **בעיית clipboard עם עברית** — פרומפטים ארוכים בעברית נחתכים והופכים RTL כשמועברים מ-Claude.ai לטרמינל. ה-Extension של VS Code פותר את זה כי הוא קורא טקסט נקי, לא מ-clipboard.
2. **Plans, diffs, ואישורים ויזואליים** — ה-extension מציג תוכניות לפני ביצוע, diffs בצבעים, ואישור/דחייה בלחיצה. זה תואם את עיקרון Plan Mode.
3. **עריכת קבצים** — VS Code הוא עורך טקסט/קוד אמיתי, לא Notepad. גם בלי קלוד קוד זה שדרוג חוויית עבודה.

**מה הותקן ב-2.5.2026:**
- Visual Studio Code (https://code.visualstudio.com)
- Extension: "Claude Code for VS Code" (publisher: Anthropic, verified ✓)

**שינוי תפעולי:**
- כל פעולת CC מחר ואילך מבוצעת דרך VS Code, **לא** דרך טרמינל.
- במקרי קצה (פעולות bash מהירות, debug) — אפשר להשתמש בטרמינל הפנימי של VS Code, או טרמינל חיצוני.

**מסמכים מושפעים:** CONVERSATION_STARTER.md (עודכן ב-D-28); WORKFLOW.md (יבנה מחר ויפנה ל-VS Code).

---

### D-2026-05-02-27: BUFF_VALUES.md — שלושת עמודי המוצר כמסמך עוגן

**ההחלטה:** נוצר מסמך חדש `docs/BUFF_VALUES.md` המקבץ את שלושת עמודי הערכים של המוצר במקום אחד עם checklist פעולתי.

**שלושת העמודים:**
1. **Intrinsic Motivation / מוטיבציה פנימית** — הילד עושה את המשימה כי הוא רוצה את מה שמחכה בסוף, לא כי האפליקציה שיחקה אותו
2. **Positive Coaching / אימון חיובי** — חיזוק חיובי בלבד, אין sad buddy, אין השוואה, אין שיים
3. **Independence-Building / בניית עצמאות** — המטרה: שהילד לא יזדקק ל-BUFF

**מקור:** הערכים כבר נוסחו ב-PRD §1, §3.2, §6.1, §6.3 — אבל היו פזורים. המסמך החדש מקבץ + מוסיף checklist פעולתי (3 שאלות per pillar = 9 שאלות שכל פיצ'ר חייב לעבור).

**Workflow integration:**
- כל `SPEC.md` של חבילת שיפור עתידית כולל סעיף **`Values Check`** — תשובה מנומקת ל-9 השאלות
- כל `TESTS.md` של פאזה כולל check אחד קבוע: `[ ] Values check passed for this phase`
- ה-universal preamble של פרומפטים לקלוד קוד דורש קריאה של `docs/BUFF_VALUES.md` בתחילת כל סשן

**שינוי כיוון מהפסיכי:** במקום שלכל חבילה יהיה PRINCIPLES.md משלה (כמו ב-workflow של Tomer), אצלנו **PRINCIPLES.md הוא רק לעקרונות ספציפיים לחבילה** (אם בכלל). הערכים הקבועים יושבים ב-BUFF_VALUES.md וחלים על כל החבילות.

**סיבה:** הכאב #4 שזיהינו — "אני לא רגועה שאתה זוכר שכל פיצר שאנחנו מעדכנים וכותבים צריך להיות ברוח... ולאמן את הילדים והנערים למסוגלות אישית". המסמך הזה הופך את הערכים מ"דבר שאני מקווה שזוכרים" ל"שער שאי אפשר לעבור בלעדיו".

**מסמכים מושפעים:** docs/BUFF_VALUES.md (חדש — ב-main); CONVERSATION_STARTER.md (יעודכן בעדכון נוכחי כדי לכלול קריאה חובה); WORKFLOW.md (יבנה מחר); _template/SPEC.md (יבנה מחר — יכלול Values Check).

---

### D-2026-05-02-26: אימוץ Workflow תלת-צדדי (Adi / Claude.ai / Claude Code)

**ההחלטה:** BUFF מאמצת מתודולוגיית עבודה תלת-צדדית, מבוססת על המודל המוכח של Tomer ב-Admilio, עם התאמות ל-React Native / Expo / Windows.

**שלושת התפקידים:**
1. **Adi** — Product Owner, Reviewer, Tester. מאשרת scope, סוקרת תוכניות של CC, מריצה בדיקות ידניות באמולטור.
2. **Claude.ai (פה, בצ'אט)** — Designer, Reviewer, Coordinator. עוצבת חבילות שיפור (session folders), מנתחת logs, מתאמת spec sync. **לא** כותבת קוד מימוש.
3. **Claude Code (CC) ב-VS Code** — Implementer. עובד ב-Plan Mode, כותב קוד, מעדכן docs, רץ tests.

**הלולאה:**
1. **Adi + Claude.ai** מעצבים חבילת שיפור → תיקייה ב-`docs/sessions/{slug}/` עם SPEC, ROADMAP, TESTS, SPEC_SYNC, STATUS
2. Adi מקומיטה את התיקייה
3. **Adi + CC** מבצעים פאזות ברצף, פאזה אחרי פאזה
4. **Adi + Claude.ai** עושים log analysis או spec sync לפי הצורך
5. סגירה: git tag, STATUS.md closeout checklist הושלם

**כללים קבועים:**
- CC עובד תמיד ב-Plan Mode
- אסור self-approved decisions — CC מציף אי-בהירות, לא פותר אותה לבד
- Inspect actual code לפני הצעות — spec docs יכולים להיות מיושנים
- Plan שולח chunk-by-chunk, סקירת diff אחרי כל אחד
- STATUS.md ועדכוני canonical docs הם חלק מאותו commit כמו הקוד, לא צעד נפרד

**הבדלים מ-Admilio:**
- **VS Code Extension** במקום טרמינל ישיר (D-28)
- **BUFF_VALUES.md** כעוגן ערכי קבוע (D-27) — ב-Admilio אין מקבילה
- **PROMPTS.md לכל חבילה — בוטל**. הפרומפטים נמסרים ב-chat מ-Claude.ai עם universal preamble inlined, כי הם מתעדכנים תוך כדי החבילה והקובץ מתיישן.
- **Capability Check** mode — בתחילת כל חבילה Claude.ai מוודאה במפורש מה היא יכולה / מה CC יעשה / מה Adi חייבת לעשות בעצמה. תוצרת ב-SPEC.md.

**מסמכים מושפעים:**
- `docs/WORKFLOW.md` (יבנה מחר) — המסמך המגדיר של הלולאה
- `docs/sessions/_template/` (תבנית חבילה — תיבנה מחר)
- `docs/INTEGRATION_LEARNINGS.md` (חדש — יוקם מחר)
- `CLAUDE.md` בשורש הריפו (יוקם מחר — חוקי הפרויקט לקלוד קוד)
- BUFF_DECISIONS_LOG.md (זה המסמך — D-26)
- CONVERSATION_STARTER.md (עדכון נוכחי)

**הסיבה:** הכאבים שזוהו היום:
- "לא עבדנו לפי האפיון המקורי שלנו וכתבנו סתם קוד של סתירות" — דורש מבנה SPEC.md מחייב
- "אתה לא אומר לי תמיד מה אתה יכול ולא יכול" — דורש Capability Check מבני
- "אני לא רגועה שאתה זוכר את הרוח" — דורש Values Check מבני (D-27)

**הסטטוס:** המסמכים הספציפיים (WORKFLOW.md, _template/, INTEGRATION_LEARNINGS.md, CLAUDE.md) ייבנו מחר. ההחלטה הזו מתעדת את **כיוון העבודה** שאומץ.

---

### D-2026-05-02-25: Teen Mode מורחב ל-13-18 (במקום 13-15)

**ההחלטה:** Teen Mode (Dashboard UI) יכסה את גילאי **13-18** במקום 13-15.

**ההשלכה:**
- Children Mode (6-12) — ללא שינוי
- Teen Mode (13-18) — אותו UI שאישר Itay, עכשיו מכסה גם 16-18
- טווח כולל של BUFF: 6-18 (במקום 6-15)

**סיבה:** "אני לא רוצה מצב שנפריע למישהו בן 16 לעבוד עם האפליקציה או להרגיש נחות כי משתמש בה."
מתבגרים בגילאי 16-18 חולקים את אותם אתגרי תפקודים ניהוליים, ויש להם זכות לאותה תמיכה
שמכבדת את האוטונומיה שלהם — בדיוק כפי ש-Teen UI עוצב למתבגרי 13-15.

**מה לא משתנה ב-MVP (החלטות אחידות עד 18):**
- מודל תשלום — ההורה הוא ה-account owner גם ל-Teen 16-18 (self-managed teen accounts נדחה ל-1.1+)
- אישור פרסים — ההורה מאשר פרסי Teen גם בגילאי 16-18 (זהה ל-13-15)
- כינוי — "Teen" באנגלית, "מתבגר/ת" בעברית
- פרסונות שיווקיות — אחת בלבד: "Parent of a child with ADHD, ages 6-18"
- עיצוב Teen UI — ללא שינוי. 6 המסכים של Stitch תקפים לכל הטווח 13-18.

**מה צריך לעדכן בקוד (סשן עתידי "Age Range Update"):**
- UI auto-detection של מצב לפי גיל: "13-15 = teen" → "13-18 = teen"
- כל מקום שגיל מופיע hard-coded או ב-validation
- string ב-onboarding screen (אם יש "13-15")

**מבטל את הנחת היסוד מ-D-2026-05-02-04, D-2026-05-02-05, D-2026-05-02-06, D-2026-05-02-12, D-2026-05-02-13** ש-Teen Mode הוא 13-15 בלבד. **לא מבטל אותן** — רק מרחיב את הטווח.

**מסמכים מושפעים:** PRD §1, §3.1, §3.2, §4.1, §4.2, §7.1; BUFF_VALUES.md §3; GAP_ANALYSIS חלק ד'; BUDDY_SYSTEM Teen sections; USER_STORIES persona TEEN; FEATURE_AUDIT; FEATURE_PRIORITIZATION; teen-ui-design/*/DESIGN.md (8 קבצים); README.md; CONVERSATION_STARTER.md.

**הקוד יעודכן בסשן עתידי** ולא במסגרת העדכון התיעודי הזה.

---

## 2 במאי 2026 — סשן עיצוב Stitch עם Itay

### D-2026-05-02-18: 6 מסכי Teen UI עוצבו ב-Stitch ואושרו ע"י Itay

**ההחלטה:** הבאים אושרו על-ידי Itay כעיצוב Teen UI ל-MVP:

| מסך | תיאור | אישור |
|---|---|---|
| 01 — Dashboard with Buddy | Wolf "STORMY" + neon green + hearts | ✅ |
| 02 — Dashboard without Buddy | Stat cards (32/7) במקום buddy | ✅ |
| 03 — Buddy Toggle Modal | אין אייקון, רק typography + buttons | ✅ |
| 04 — Tasks Detail | 4 stages, current highlighted, next-up indicator | ✅ |
| 05A — Me & Buddy | Wolf hero + 3 stats + Boosters horizontal scroll | ✅ |
| 05B — My Stats | Sound wave hero + LEVEL 4 + dots | ✅ |
| 06 — Rewards Shop | 2 tabs (FROM PARENT / FROM BUDDY) | ✅ |

**הקבצים:** `docs/teen-ui-design/[01-06]/` — כל מסך עם code.html + DESIGN.md + screen.png

**פתוחים לסשן הבא:**
- מסך 07 — Settings
- מסך 08 — Teen Onboarding Choice (חדש — בעקבות D-13 גרסה 2)

---

### D-2026-05-02-13 (revised, evening 2.5.2026): BUDDY ב-Teen Mode — Choose at Onboarding

**ההחלטה (גרסה מתוקנת מהבוקר):**

ב-Teen Mode (13-15), ה-onboarding **שואל** את המתבגר:
> "Want a Buddy character on your home screen?"

שתי אפשרויות עם preview ויזואלי:
- **Yes, with Buddy** → מסך 5A style (wolf, hearts, name)
- **No, keep it clean** → מסך 5B style (stat cards, abstract pattern)

ההעדפה נשמרת. ניתן לשנות מ-Settings בכל זמן.

**מבטל את ההחלטה הקודמת מ-2.5 בוקר ש-Default = With Buddy.**

**סיבה לתיקון:**
Itay (קו-יוצר, target user) ראה את שתי הגרסאות ב-Stitch ובחר מסך 5B
(without buddy) במפורש. זה תואם את מה שאמר בשאלון המקורי
("לא משנה לי / בלי דמות בכלל") — שאני (Adi) ו-Claude לא לקחנו ברצינות
מספיק בהתחלה.

**העיקרון:** מתבגרים מקבלים **בחירה**, לא ברירת מחדל שמישהו אחר קבע.
זה תואם "Be the Coach, Not the Boss" + "BUFF for ages 13-15: built for autonomy."

**ל-Children Mode (6-12):** Buddy תמיד מוצג — אין שאלה. אופציה להסתיר תוסף ל-1.1.

**מסמכים מושפעים:**
- BUFF_BUDDY_SYSTEM.md (סעיף Teen Mode)
- BUFF_GAP_ANALYSIS.md (Teen UI requires onboarding choice screen)
- צריך מסך 8 חדש: Teen Onboarding — Buddy choice

---

### D-2026-05-02-19: Hearts ב-Buddy בירוק במקום אדום

**ההחלטה:** Friendship Level hearts יוצגו בירוק ניאון (#39FF14) במקום אדום.

**סיבה:** Stitch ייצר את מסך 5A עם hearts ירוקים (במקום הצעת המקור באדום), והתוצאה הייתה consistent יותר עם design system. Adi אישרה.

**ההשלכה:** במסך 1 (Dashboard with Buddy) שעובד עם hearts אדומים — לעדכן לירוקים במימוש.

---

### D-2026-05-02-20: Wolf "STORMY" — דמות BUDDY ראשונה ל-Teen

**ההחלטה:** ה-Buddy הראשון בעיצוב הוא **זאב עם hoodie**, שם "STORMY". זה ה-default ל-Teen Mode (אם הילד בחר With Buddy).

**סיבה:**
- Itay אישר באיטרציה הראשונה של Stitch
- מתאים לאסתטיקה Teen (gaming, edgy, לא חמוד-מדי)
- שונה מהדמויות הקיימות בקוד (capybara/panda/unicorn) — מבדיל את Teen Mode

**ההשלכה ל-implementation:** צריך להוסיף Wolf skin לקטלוג Skins בקוד (יש כבר HEROIC_SKINS — להוסיף להם).

**שאלות פתוחות:** האם השם "STORMY" יישאר default או שהילד יבחר את שמו?

---

### D-2026-05-02-21: Sort order של משימות — current period only + click to navigate

**אישור:** המסך הראשי מציג את חלק היום הנוכחי בלבד (Morning/Noon/Afternoon/Evening), עם pills למעבר לחלק יום אחר. **כפי שכבר ממומש בקוד.**

**עיבוד:** מסך "Today's Plan" (04) מציג את **כל היום** עם 4 stages — נגיש דרך swipe או button "View all."

**סיבה:** Itay אמר "עדיף מיקוד ביום ובקליק לעבור."

---

### D-2026-05-02-22: Visual indicator למשימה הבאה (next-up)

**ההחלטה:** המשימה הבאה (next undone task in current stage) מסומנת ב-2 דרכים:
1. **Green border** סביב הקארד
2. **Vertical green bar** בקצה השמאלי של הקארד

**סיבה:** Stitch הוסיף את שני הסימנים במסכים 1 ו-4. עוזר לילד לזהות מיד מה הצעד הבא בלי לחפש.

**ההשלכה:** במימוש, זה לא רק styling — צריך לוגיקה שמזהה "next undone task in current stage."

---

### D-2026-05-02-23: 3-dot menu (⋮) על משימה — opt-in

**ההחלטה:** Menu של 3 נקודות אנכיות ליד שם המשימה (כפי ש-Stitch הוסיף במסך 4) **לא חובה ב-MVP**. אם נכנס — האפשרויות הן:
- Edit task (אם child-proposed)
- Skip (משתמש ב-Skip Token Booster)
- Mark not for today

**ההמלצה:** דחוי ל-1.1. במ-MVP — tap ארוך על הקארד יספיק.

---

### D-2026-05-02-24: אמי (בת 9, בת של Adi, אחותו של Itay) — פרסונה עתידית ל-Children Mode

**ההחלטה:** אמי תהיה **co-designer של Children Mode (גילאים 6-12) בעדכון עתידי**, לא ב-MVP הנוכחי.

**מה אמי כבר נתנה:**
- ראתה את 6 מסכי ה-Teen UI שעוצבו ע"י Itay
- הגיבה שהם "סבבה" — מאשרת את ה-base aesthetic
- לא ביקשה שינויים בשלב זה

**מה צריך לעשות במהלך:**
- **לדייק את התמונות של BUDDY** — Wolf STORMY מתאים ל-Teen, אבל ה-Children Mode דורש שיווי משקל אחר (capybara/panda/unicorn קיימים בקוד — לעצב את ה-states שלהם בצורה ויזואלית עקבית)

**מה דחוי לעתיד:**
- Children Mode design pass עם אמי כ-co-designer
- ייתכן שיתווסף **theme alternative** (pastel, cute) בנוסף ל-neon — אבל לא כברירת מחדל
- שאלון נפרד לאמי — בעתיד, כשהיא תשתמש באפליקציה בפועל

**עיקרון:** שני קו-יוצרים בני 15 ו-9 = שני קולות שונים. כרגע נבנה לפי Itay (Teen) ונשמור את אמי לסיבוב הבא של עיצוב ה-Children Mode.

---

## 2 במאי 2026 — סשן עם Itay (בוקר)

### D-2026-05-02-04: Itay כשותף עיצוב פורמלי

Itay (בנה של Adi, בן 15, עם ADHD) הוא שותף עיצוב פורמלי של Teen UI ושל מערכת BUDDY.

### D-2026-05-02-05: Teen UI — Must Have ל-MVP

Teen UI (T-01 עד T-04) ייכלל ב-MVP, לא יידחה ל-1.1.

### D-2026-05-02-06: Teen UI Design Language — ירוק ניאון על שחור

Spotify/gaming/cyberpunk inspired. צבע ראשי: ירוק ניאון (#39FF14). רקע: שחור עמוק (#0A0A0A).

### D-2026-05-02-07: ביטול Streaks רגילים — רק Winning Streak

Streak רגיל (1 יום בלי השלמה = שובר) יבוטל. נשמר רק "Winning Streak" — רצף ימים של 70%+.

### D-2026-05-02-08: Buddy System V0.5 — מערכת רמות + Boosters

5 רמות חברות: Buddy Buddies / Good Friends / Close Friends / Best Friends / Forever Friends.
6 Boosters: Custom Theme Color, ×2 Buffs, Skip Token, הנחת פרס, Buddy Mood Pack, Skin חדש.
יום מוצלח = 70%+ השלמה. ימים מצטברים, לא רצופים.

### D-2026-05-02-09: Tap על BUDDY → Me & Buddy screen

Tap על דמות BUDDY במסך הראשי → פותח "Me & Buddy" (Itay's idea).
3 דרכים נגישות: Tap on buddy + Sub-tab in Profile + Toast on level up.

### D-2026-05-02-10: Daily Vibe Check ב-MVP, Rest Tickets ל-1.1

Vibe Check משפיע על כל יום (השפעה רחבה). Rest Tickets — צרה. שניהם חשובים, רק אחד דחוף.

### D-2026-05-02-11: עיצוב ב-Stitch לפני קוד

Teen UI יעוצב ראשית ב-Google Stitch ע"י Adi + Itay. רק אחרי mockups, Claude Code יבנה.

### D-2026-05-02-12: Notifications לפי קטגוריית גיל

ילד 6-12: ההורה בוחר שעות. מתבגר 13-15: הילד בוחר. Default: צהריים + ערב, לא בוקר. Max 2 ביום.

### D-2026-05-02-14: Pause Mode חוזר ל-MVP

לחופשים, יציאה משגרה, מצבי קיצון. שדה `pause_mode_active` + `pause_until` ב-`app_settings`. ההורה מפעיל.

### D-2026-05-02-15: "Boosters" — שם רשמי לקטגוריה

Itay בחר. קצר, אנרגטי, לא ילדותי, מתאים לכל גיל, ניטרלי מבחינת gender.

### D-2026-05-02-16: Sort order של משימות — אישר Itay

מיקוד ביום נוכחי + click to navigate (כפי שכבר ממומש).

### D-2026-05-02-17: Welcome Back Behavior — חיבוק בלי האשמה

אחרי 3+ ימים בלי כניסה: BUDDY מחבק עם "Hey, you're back! Let's start fresh today."
אין שאלות, אין סטטיסטיקה של ימים שפספס, אין reset.

---

## 2 במאי 2026 — תיעוד מערכתי

### D-2026-05-02-01: יצירת תיקיית `docs/` כ-source-of-truth

מסמכי המוצר ישבו בתיקייה `docs/` בריפו `buff-mobile`, בפורמט Markdown.

### D-2026-05-02-02: Continuity protocol בין שיחות

בתחילת כל שיחה ב-claude.ai, Adi מדביקה הודעה סטנדרטית שמכוונת לקרוא DECISIONS_LOG, GAP_ANALYSIS, BUDDY_SYSTEM, ו-SESSION_LOG.

### D-2026-05-02-03: PRD באנגלית, שאר התיעוד בעברית

PRD ו-User Stories באנגלית. Gap Analysis, Decisions Log, Buddy System, סיכומי סשן בעברית.

---

## 1 במאי 2026

### D-2026-05-01-01: שני Supabase projects נפרדים — לא ממזגים

Lovable ומובייל ימשיכו עם DB-ים נפרדים. אין מיגרציה. ביטא של Lovable = הוכחת יכולת.

### D-2026-05-01-02: Lovable יישאר חי עד פרודקשן + landing page אחר כך

Landing page ביום עליית המובייל. אחרי שכולם עברו, ה-Supabase של Lovable יימחק. 49 emails שמורים.

### D-2026-05-01-03: Founding Members — מי שיעבור מהלוובל

`is_lifetime_access = true` כברירת מחדל. השדה כבר קיים ונקרא ב-`useSubscription.ts:81`.

### D-2026-05-01-04: BUDDY V0 — נדחה לעיון מחודש

החלטה מ-1.5 ("BUDDY V0 = visual פשוט") הוחלפה ע"י **D-2026-05-02-08** (Buddy System V0.5 מלא ל-MVP).

### D-2026-05-01-05: RevenueCat מוגדר ועובד

Android API key אמיתי: `goog_JXENrpCCcYObBesSjSeFGoKvuaA`. iOS key: לא קיים. Entitlement: "BUFF Premium".

### D-2026-05-01-06: Build path נדחה

Keystore גובה. סיסמאות שמורות. אפשר לבחור build path בכל רגע.

---

## 28-29 באפריל 2026

### D-2026-04-28: Google OAuth מוגדר וחתום
OAuth 2.0 client + Supabase provider + buff://auth/callback. עובד ב-Pixel_7 AVD.

### D-2026-04-28: ParentOnboardingModals — תיקון crash
custom component בתוך Stack.Navigator → תוקן ל-Stack.Group.

### D-2026-04-29: ChildJoinScreen — תיקון keyboard ב-Android
KeyboardAvoidingView behavior undefined → undefined ב-Android.

### D-2026-04-29: Email confirmation — מבוטל
ילדים משתמשים ב-fake @buff.app emails. Supabase email confirmation מבוטל.

---

## הנחיות תחזוקה

1. **כל החלטה משמעותית** מתועדת כאן עם תאריך ונימוק
2. **לא להשמיט נימוק**
3. **בכל סוף סשן** עם Claude — להוסיף החלטות חדשות
4. **בכל תחילת סשן** — Claude מתבקש לקרוא לפני שמתחיל
5. **אם החלטה משתנה** — לא למחוק! להוסיף החלטה חדשה שמתקנת, עם הפנייה לקודמת

---

**סוף מסמך.**
