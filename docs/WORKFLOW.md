# BUFF — Workflow

> **המסמך המגדיר** של איך עובדים על BUFF. הלולאה תלת-צדדית: Adi / Claude.ai / Claude Code.
> כל חבילת שיפור, ניתוח לוגים, ו-spec sync — לפי המסמך הזה.

**גרסה:** 1.1
**עודכן:** 9 ביוני 2026
**מקור החלטות:** D-2026-05-02-26 (אימוץ workflow), D-2026-05-02-27 (BUFF_VALUES), D-2026-05-02-28 (VS Code)

---

## למה המסמך הזה קיים

הכאבים שזיהינו ב-2.5.2026:

1. **"לא עבדנו לפי האפיון המקורי"** — ספק נסחף בין שיחות, לא היה anchor שכל סשן חוזר אליו
2. **"אתה לא אומר לי תמיד מה אתה יכול ולא יכול"** — בעיות יכולת התגלו מאוחר
3. **"אני לא רגועה שאתה זוכר את הרוח"** — ערכי המוצר היו פזורים, לא מובנים בכל פיצ'ר
4. **בלגן בין שיחות וכלים** — ידני, מותלה זיכרון, קל לטעות

ה-Workflow פותר את ארבעתם דרך משמעת מבנית: SPEC לפני קוד, Capability Check בכל סשן, Values Check בכל פיצ'ר, ופורמט אחיד לחבילות שיפור.

---

## תפקידים

### Adi (את)

- **Product Owner** — בעלת החזון, הקול הסופי בכל החלטה
- **Reviewer** — סוקרת תוכניות לפני ביצוע, sciacching diffs לפני אישור
- **Tester** — מריצה את האפליקציה באמולטור, מאשרת שהפיצ'ר באמת עובד

### Claude.ai (אני, בצ'אט הזה)

- **Designer** — מעצבת חבילות שיפור (session folders) עם Adi
- **Reviewer** — סוקרת תוכניות של CC, מציפה עניינים שלא תפסה הבדיקה הראשונה
- **Coordinator** — מתאמת בין סשנים, מתחזקת context לאורך זמן
- **Log Analyst** — מנתחת שגיאות מהאמולטור / Sentry / Crashlytics

**מה אני לא עושה:** לא כותבת קוד מימוש בעצמי. לא דוחפת ל-GitHub. לא מקבלת החלטות אסטרטגיות לבד.

### Claude Code (CC, ב-VS Code Extension)

- **Implementer** — כותב קוד, מעדכן docs, מריץ pkg, מבצע git operations
- **תמיד ב-Plan Mode** — מציג תוכנית, מחכה לאישור, מבצע
- **מציף אי-בהירות, לא פותר** — אם משהו לא ברור ב-SPEC, שואל ולא מנחש

**מה CC לא עושה:** לא מקבל החלטות אסטרטגיות. לא מתעלם מ-SPEC. לא דוחף ל-main בלי אישור.

---

## הלולאה התלת-צדדית

```
┌─────────────────────────────────────────────────────────┐
│  1. SCOPE — Adi + Claude.ai                             │
│     מה הבעיה? מה ה-acceptance? מה לא נוגעים בו?         │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. DESIGN — Adi + Claude.ai                            │
│     נוצרת תיקייה: docs/sessions/{slug}/                 │
│     SPEC + ROADMAP + TESTS + SPEC_SYNC + STATUS         │
│     Capability Check + Values Check בתוך SPEC.md        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. COMMIT — Adi                                        │
│     את מקומיטה את תיקיית ה-session ל-main               │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  4. EXECUTE — Adi + Claude Code (Phase by Phase)        │
│     לכל פאזה:                                            │
│     a. CC ב-Plan Mode מציג תוכנית                       │
│     b. את סוקרת + מאשרת ("approved, proceed")           │
│     c. CC מבצע chunk-by-chunk עם diffs                  │
│     d. את מריצה bedikot (TESTS.md)                      │
│     e. CC מסיים phase: STATUS.md + canonical docs       │
│        + INTEGRATION_LEARNINGS.md אם הפתעות             │
│        — הכל ב-commit אחד                                │
│     f. עוברים לפאזה הבאה רק אם tests עברו               │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  5. CLOSEOUT — Adi + Claude.ai                          │
│     git tag, STATUS.md closeout checklist הושלם         │
│     Spec sync run אם canonical docs לא סונכרנו במלואם   │
└─────────────────────────────────────────────────────────┘
```

---

## כללי הברזל

> כללים שלא נשברים, גם אם משהו "דחוף". הם הגנה עלייך, לא נטל.

1. **CC עובד תמיד ב-Plan Mode.** אין יוצא מן הכלל.
2. **אסור self-approved decisions.** CC חייב להציף אי-בהירות, לא לפתור אותה לבד.
3. **תמיד inspect actual code לפני הצעות.** Spec docs יכולים להיות מיושנים. CC מאמת מול הקוד.
4. **Plan שולח chunk-by-chunk.** סקירת diff אחרי כל chunk לפני שממשיכים.
5. **Exit deliverables באותו commit כמו הקוד.**
   - עדכוני canonical docs לפי `SPEC_SYNC.md`
   - שורת STATUS.md
   - INTEGRATION_LEARNINGS.md אם הפתעות
6. **Universal preamble inlined בכל phase prompt** — לא קובץ נפרד שמתיישן.
7. **Values Check חובה לכל פיצ'ר.** 9 שאלות מ-`BUFF_VALUES.md`. נכשל בעיקרון אחד = הפיצ'ר לא ממשיך עד דיון.
8. **Capability Check בתחילת כל חבילה.** "מה אני יכולה / מה CC יעשה / מה Adi חייבת בעצמה".
9. **לא לעדכן מסמכים של Adi חד-צדדית.** GAP_ANALYSIS, DECISIONS_LOG, BUFF_VALUES — אם נדמה לי שצריך עדכון, אני שואלת ראשונה.
10. **לא לדחוף ל-main בלי אישור Adi.** אפילו אם זה רק תיעוד.
11. **בדיקת "מגע ראשון" (Reachability) — פיצ'ר לא "בוצע" עד שהמסע מקצה-לקצה נבדק.** כל פיצ'ר שמופעל ע"י משתמש (התראה, בקשה, badge, empty-state) חייב לפחות בדיקה אחת שמתחילה **מנקודת הכניסה של המשתמש** ומסתיימת **בהשלמת הפעולה** — בלי קיצורי-דרך של מפתח (הזרקת JWT, ניווט ישיר למסך, קריאה ישירה ל-RPC). בדיקה שמתחילה באמצע המסך מאמתת את *המנוע*, לא את *הפיצ'ר*. אם נתיב הכניסה לא נבנה — הפיצ'ר לא "בוצע", גם אם המנוע ירוק. _(מקור: IN-2026-06-09-01 — pkg/reward-redemption נבדק עם parent JWT שנכנס ישר למסך האישור; המסע "התראה → לחיצה → כפתור אישור" מעולם לא נבדק, ו-3 פערי-גילוי שרדו עד פרודקשן.)_
12. **דחייה = FLAG, לא הערת קוד.** כל החלטה לדחות חלק מההיקף ("נשלים אחר כך" / "wiring deferred if needed") חייבת להירשם כ-🚩 ב-`INTEGRATION_LEARNINGS.md` (ובמידת הצורך שורה ב-GAP_ANALYSIS) **לפני ה-merge**. הערת קוד בלבד בלתי-נראית ללולאה — "נדחה" הופך בשקט ל"נשלח בלי זה". _(אותו IN — ה-deep-link מהתראה נדחה כהערת קוד פעמיים, מעולם לא סומן, ולכן נשלח חסר.)_

---

## הפעלות (Modes) של Claude.ai

ל-Claude.ai (אני) יש 3 modes ראשיים + 2 sub-modes שרצים תוך כדי. **את לא צריכה לבחור.** אני מזהה את הסיטואציה מהמסר הראשון שלך ומפעילה את ה-mode המתאים.

### זיהוי אוטומטי — מתי להפעיל מה

| המסר שלך מתחיל ב... / מכיל... | ה-Mode שאני מפעילה |
|---|---|
| "אני רוצה לבנות / להוסיף / לתקן [פיצ'ר]" | **Package Design** |
| "פותחים / מתחילים חבילה של..." | **Package Design** |
| "X לא עובד" / "יש באג" / "האפליקציה קרסה" + לוג / screenshot | **Log Analysis** |
| "הקוד שונה אבל הdocs לא" / "לעדכן את הdocs" / "spec drift" | **Spec Sync** |
| "נסכם / נשנה את ה-PRD" / "החלטה חדשה" | **Decision Log Update** (sub-flow ל-Package Design) |
| בלתי ברור / שיחה כללית | **שואלת בקצרה ומחליטה איך להמשיך** |

**אם זיהיתי לא נכון** — תקני אותי מיד. דוגמה: "זה לא Package, זה Spec Sync" — ואני אעבור Mode בלי שתצטרכי להסביר את כל המבנה מחדש.

**בכל הפעלה**, מה שתראי בתחילת התשובה הראשונה שלי:

> 🎯 **Mode:** Package Design
> 📋 **Capability Check:** [רשימה של 4 פריטים]
> 📂 **Reading first:** [קבצים שאני קוראת או מבקשת]

ככה את תמיד יודעת איפה אנחנו, גם אם לא ביקשת mode מסוים.

---

### Mode 1 — Package Design (הנפוץ ביותר)

**מתי אני מפעילה אוטומטית:** את מתארת פיצ'ר חדש, באג שמערב 2+ קבצים, או שינוי זרימה.

**מה אני עושה — בסדר הזה:**
1. מריצה **Capability Check** (sub-mode A — תמיד)
2. שואלת רק שאלות שלא ענית עליהן בפתיחה
3. סוקרת project knowledge — מה כבר קיים, מה במצב drift
4. מציגה SPEC outline → את עורכת → איטרציה
5. מריצה **Values Check** (sub-mode B — תמיד, לפני סגירת SPEC)
6. מפיקה את 6 הקבצים: README, SPEC, PRINCIPLES (אם רלוונטי), ROADMAP, TESTS, SPEC_SYNC, STATUS
7. מעבירה לך לקומיט

**Output:** תיקיית `/mnt/user-data/outputs/{slug}/` ל-`docs/sessions/{slug}/`.

---

### Mode 2 — Log Analysis

**מתי אני מפעילה אוטומטית:** את מדביקה לוג / screenshot של שגיאה / מתארת התנהגות לא צפויה באמולטור.

**מה אני עושה:**
1. מריצה **Capability Check** מהיר — האם יש לי מספיק קונטקסט לנתח, או שאני צריכה ממך עוד מידע?
2. מתאימה את הלוג ל-canonical doc הרלוונטי (FLOWS, ARCHITECTURE, BUDDY_SYSTEM)
3. מסווגת כל issue: Resolved / Regressed / New / Still pending
4. מצליבה מול INTEGRATION_LEARNINGS.md
5. מסיקה: spec drift או implementation bug?
6. ממליצה: Continue / Fix specific / Open new package / Investigate further

**Output:** סיכום מובנה בצ'אט. אם "Open new package" — אני עוברת אוטומטית ל-Package Design.

---

### Mode 3 — Spec Sync

**מתי אני מפעילה אוטומטית:** קוד שונה (חבילה הסתיימה, או תיקון מהיר עקף את ה-workflow), וה-canonical docs לא תואמים.

**מה אני עושה:**
1. מריצה **Capability Check**
2. מזהה מה השתנה (commit log או דברייך)
3. עוברת על כל ה-canonical docs ומסווגת: needs update / still correct / needs extension
4. מפיקה Spec Sync Manifest (כמו ה-UPDATES_2026-05-02 שיצרנו)
5. את לוקחת ל-CC, הוא מבצע

**Output:** קובץ `SPEC_SYNC_{date}.md` בשורש הריפו (זמני, נמחק אחרי merge).

---

### Sub-mode A — Capability Check (רץ בכל Mode, לא עצמאי)

**מתי:** בתחילת כל סשן, ובכל פעם שמשהו חדש מתבקש שאולי דורש יכולת אחרת.

**מה אני מצהירה במפורש — תמיד 4 פריטים:**

| # | מה | דוגמה |
|---|---|---|
| 1 | **מה אני יכולה לעשות עכשיו** | לקרוא קבצים שאת מעלה / web_search / web_fetch על URLs |
| 2 | **מה CC יעשה** | לערוך קבצים / להריץ commands / git operations |
| 3 | **מה את חייבת לעשות בעצמך** | merge ב-GitHub / login / החלטות אסטרטגיות |
| 4 | **איפה הצוואר בקבוק** | "אני לא קוראת ישירות מ-GitHub — את צריכה להעלות" |

**מה את רואה:** סעיף 📋 בראש התשובה שלי. **אם הסיטואציה משתנה במהלך הסשן** (בקשה חדשה דורשת יכולת אחרת), אני עושה Capability Check חדש בו במקום, לא ממשיכה בשקט עם הנחות ישנות.

**Output:** סעיף `Capabilities & Bottlenecks` ב-SPEC.md של החבילה.

---

### Sub-mode B — Values Check (רץ בכל Package Design, לא עצמאי)

**מתי:** לפני סגירת SPEC, ובסוף כל פאזה ב-TESTS.md.

**מה אני עושה — 9 שאלות מ-BUFF_VALUES.md:**

**Pillar 1 — Intrinsic Motivation:**
1. האם הילד היה רוצה את הפיצ'ר גם בלי תגמול וירטואלי?
2. האם הפיצ'ר מקרב לפרס שהילד בחר בעצמו?
3. האם הצלחה מורגשת כ"אני רוצה" או "אני חייב"?

**Pillar 2 — Positive Coaching:**
1. האם הניסוח אי-פעם משפיל / משווה / מציג כשל?
2. אם הילד נכשל — האם התגובה היא empathy או pressure?
3. האם יש מנגנון "סבל / איבוד / כעס" של ה-BUDDY?

**Pillar 3 — Independence-Building:**
1. האם הפיצ'ר הופך את הילד למסוגל יותר *בלי* האפליקציה?
2. האם לילד יש קול בפיצ'ר?
3. בעוד 6 חודשים, הפיצ'ר עדיין הכרחי או עשה את עבודתו?

**Output:** סעיף `Values Check` ב-SPEC.md, עם תשובות מנומקות. **נכשל באחד = עצירה ודיון איתך, לא ממשיכים בשקט.**

---

## מבנה תיקיית סשן (`docs/sessions/{slug}/`)

ראי `docs/sessions/_template/` לתבנית מלאה. כל סשן כולל:

| קובץ | תפקיד |
|---|---|
| `README.md` | כותרת + סטטוס + הפניה לקבצים |
| `SPEC.md` | מצב יעד — מה קורה אחרי שהחבילה נסגרת + Capability Check + Values Check |
| `PRINCIPLES.md` | עקרונות ספציפיים לחבילה (אופציונלי — מחק אם לא רלוונטי). **לעקרונות קבועים: BUFF_VALUES.md** |
| `ROADMAP.md` | רצף פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני פאסה/פייל לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב סטטוס פאזות — מתעדכן ע"י CC בכל phase exit |

**מה לא בתיקייה:** `PROMPTS.md`. הפרומפטים נמסרים בצ'אט מ-Claude.ai עם universal preamble inlined. הסיבה: פרומפטים מתעדכנים תוך כדי החבילה ויוצרים drift אם נשמרים.

---

## Universal Preamble (Inlined בכל Phase Prompt)

זה הטקסט שמופיע בתחילת כל פרומפט שאני נותנת לך לקלוד קוד. תופס את הכללים הקבועים בלי לחזור עליהם בעל-פה.

```
Read the following before doing anything:
1. /CLAUDE.md (repo root — חוקי הפרויקט)
2. /docs/README.md (אינדקס)
3. /docs/WORKFLOW.md (המסמך הזה)
4. /docs/BUFF_VALUES.md (3 העמודים — חובה)
5. /docs/sessions/{slug}/SPEC.md (יעד החבילה)
6. /docs/sessions/{slug}/PRINCIPLES.md (אם קיים)
7. /docs/sessions/{slug}/SPEC_SYNC.md (איזה docs לעדכן)
8. /docs/BUFF_DECISIONS_LOG.md (סקירה של החלטות רלוונטיות)
9. The relevant docs from /docs/ based on the task

You are in PLAN MODE. Do NOT make any code changes until I explicitly approve your plan.

Critical rules:
- Do not self-approve any decisions. Surface ambiguity, wait for me.
- No architecture beyond scope. Flag refactor temptations and stop.
- Inspect actual code AND any platform configs (app.json, eas.json, package.json) before proposing.
- Plan ships chunk by chunk. Show diff, wait for approval, continue.
- Values Check: every feature passes the 9 questions in BUFF_VALUES.md before code is written.
- Reachability: a user-triggered feature is not "done" until its first-touch path (notification / badge / empty-state -> completed action) is tested end-to-end. No dev shortcuts (JWT injection, direct screen nav, direct RPC call). Testing the engine != testing the feature.

Exit deliverables for every phase (same commit as the code):
- Update relevant canonical docs per SPEC_SYNC.md (this phase's row)
- Update STATUS.md with the phase row (state, date, commit, tests, learnings link)
- Append to /docs/INTEGRATION_LEARNINGS.md anything surprising
- Any DEFERRED scope must be a flag in INTEGRATION_LEARNINGS.md before merge — never just a code comment.

Now read the task below and produce a detailed plan.
```

---

## מתי משתמשים באיזה Workflow

| מצב | מה לעשות |
|---|---|
| **שינוי שנוגע ב-2+ קבצים, או משנה התנהגות נצפית** | Improvement Package. תמיד session folder. אפילו לקטנים. |
| **תיקון של שורה אחת או ב-1 קובץ, ללא השפעה על behavior contract** | Direct CC fix. קומיט ישיר. רישום קצר ב-INTEGRATION_LEARNINGS.md. |
| **רץ-ולא-עובד באמולטור** | Log Analysis. Output: continue / fix / open package. |
| **קוד שונה מהspec לאחר חבילה** | Spec Sync run. Manifest → CC מבצע. |
| **שינוי DB schema (Supabase)** | תמיד Improvement Package. אף פעם לא direct fix. |
| **שינוי טקסט ב-UI** | בדרך כלל Direct CC fix, אלא אם מתקרב לפיצ'ר Values-sensitive (אז Package). |
| **הוספת dependency חדש (npm install)** | Improvement Package. הסיבה: תלויות חדשות יוצרות risk surface שצריך לתעד ולבדוק. |

---

## עבודה ב-Plan Mode עם CC — הכללים המעשיים

> זה הסעיף הכי "מעשי" של המסמך — מה קורה כשאת באמת ב-VS Code עם פרומפט ביד.

### לפני שמדביקה את הפרומפט
1. **וודאי שאת ב-branch נקי** — לא main. שם הbranch לפי slug של החבילה.
2. **וודאי שיש pull עדכני** — `git pull origin main` ו-rebase אם צריך.
3. **תפתחי שיחה חדשה ב-Claude Code** (לא ממשיכה ישנה) אלא אם יש סיבה ספציפית.

### בתוך הסשן
1. **מדביקה את הפרומפט המלא** (universal preamble + task) שאני נתתי לך.
2. **קוראת את התוכנית של CC עד הסוף** — לא לאשר על-בלייט.
3. **שואלת על כל "Decision (confirmed)"** שCC הניח. אלה הם self-approvals שהוא לא היה אמור לעשות.
4. **מאשרת בכתיב מדויק:** `approved, proceed`
5. **סוקרת כל diff** לפני שCC ממשיך לchunk הבא.
6. **מקבלת tests run** מ-TESTS.md — או CC רץ אותם, או את (תלוי באופי הtest).
7. **בסוף phase:** verifying ש-STATUS.md, canonical docs, ו-INTEGRATION_LEARNINGS.md עודכנו באותו commit.

### אם משהו לא מסתדר
- **CC מתחיל לכתוב קוד בלי plan?** — `Stop. You're in PLAN MODE. Show me the plan first.`
- **CC ניחש החלטה?** — `That decision wasn't in the SPEC. Surface it as a question, don't resolve it.`
- **CC הציע refactor שלא ביקשנו?** — `That's out of scope. Flag it for a future package and proceed only with what's in SPEC.`
- **את לא מבינה את התוכנית?** — שואלת אותו להסביר. אם עדיין לא ברור — עוצרת ובאה אליי.

### אחרי הסשן
- **commit עם message מתאים** (formato: `feat(slug): phase X — description` או `fix(slug): description`)
- **לא לדחוף ל-main** עד שכל הphases הושלמו והgit tag מוכן.
- **closeout** — מעבירה לClaude.ai לסקירה אחרונה של STATUS.md ו-canonical docs לפני tag.

---

## Snapshots — Adi / Claude.ai / CC handoff

### Snapshot Prompt Template (Claude.ai → CC)

Claude.ai must use this template instead of free-form "give me a summary":

```
SNAPSHOT REQUEST — [date]

Files to read:
- [list with paths]

Output format:
1. HEADER: files read + line counts + files requested-but-not-read with reason
2. VERBATIM SECTIONS: copy-paste these passages exactly (no rewording)
   - [list specific sections, e.g. "last 6 entries of DECISIONS_LOG", "GAP_ANALYSIS executive summary table", "open FLAGs from INTEGRATION_LEARNINGS"]
3. ❌/🟡 ROWS: every row from GAP_ANALYSIS marked ❌ or 🟡, copied verbatim
4. UNVERIFIED CLAIMS: anything you'd write that you can't anchor to a specific file:line
5. VOLUME CHECK: produced X items vs Y requested
6. CONFLICTS: any contradictions between sources, both copied verbatim, no resolution
```

### Claude.ai Verification Gate (binding)

Before building any recommendation on a CC snapshot:

1. Tag every claim: `[CC-claim, anchored to file:line]` or `[CC-claim, unverified]`
2. Block on unverified — ask Adi to confirm, OR ask CC to re-run with anchor required
3. Cross-check critical claims — anything driving package sequencing or scope MUST be anchored
4. **Pushback rule:** Claude.ai must NOT issue strong pushback (changing package order, redirecting strategy) based on a claim that has not passed the gate

Violating this rule was the root cause of incident 2026-05-03.

---

## EOD Protocol — סגירת יום

### מי כותב את ה-EOD

Claude.ai (לא CC) כותבת את תוכן ה-EOD ישירות בסוף הסשן. הסיבה:
1. EOD הוא סיכום של דיון בין Adi ל-Claude.ai — Claude.ai מחזיקה את ההקשר המלא
2. אין צורך לעבור דרך CC רק כדי לכתוב טקסט סטטי
3. CC נכנס רק לפעולות ה-git (branch, commit, push, merge)

### Workflow

1. **Claude.ai יוצרת את הקובץ** באמצעות `create_file` ומגישה אותו דרך `present_files`
2. **Adi מורידה את הקובץ** ושומרת ב-`docs/sessions/{relevant-package}/EOD_CLOSING_YYYY-MM-DD.md`
   - אם ה-EOD שייך לחבילה ספציפית — תחת תיקיית החבילה
   - אם זה EOD יומי בלי חבילה — `docs/sessions/_eod/EOD_CLOSING_YYYY-MM-DD.md`
3. **CC מעבר דרך branch + PR + merge** כמו כל שינוי docs אחר. **אין חריג ל-Rule 7.** EOD ב-`main` תמיד דרך PR.

### למה לא direct commit ל-main

Rule 7 (NO direct commits to main) חל על EOD. הסיבה:
- חריגים שוחקים את הכלל
- Branch + PR ל-EOD לוקח 2 דקות נוספות
- מבטיח שכל שינוי ב-`main` עובר אותו gate

### תוכן EOD סטנדרטי

| חלק | תוכן |
|---|---|
| 1 | מה הושלם היום (חבילות, commits, FLAGs חדשים) |
| 2 | פתוח למחר (החלטות אסטרטגיות, שאלות פתוחות, סדר עבודה מוצע) |
| 3 | איך לפתוח את הסשן הבא (starter prompt, רשימת קבצים לקרוא) |
| 4 | הערות מפתח (תהליכי + מוצרי) |

### תקרית 2026-05-03

ב-2026-05-03 נוצר EOD הראשון אבל הוא נדחף ישירות ל-main בלי PR (commit `b86dd2f`). זה היה חריגה לא מכוונת ל-Rule 7. החל מסשן 2026-05-04 — כל EOD עובר branch + PR.

---

## Cleanup Procedure — אחרי merge ל-main

### למה נדרש פרוטוקול ייעודי

תקרית 2026-05-04 חשפה ש-cleanup branches יכול להיכשל בשקט אם המ-merge בעצם לא קרה. הפרוטוקול הזה מבטל את הסיכון.

### השלבים אחרי שAdi אומרת "merged"

1. **CC לא מוחק כלום עדיין.** במקום זאת, מבצע verification:
   - `git checkout main`
   - `git pull origin main`
   - `git log --oneline -5` — לראות שיש merge commit חדש
   - בדיקת תוכן spezificit ל-package (grep על strings ייחודיים מהקבצים שהשתנו)

2. **CC מציג ל-Adi את תוצאות ה-verification.** דוגמה:
```
   ✓ main updated: e76d30e Merge pull request #3
   ✓ Content present: F-2026-05-03-07 found in INTEGRATION_LEARNINGS.md (count: 2)
   ✓ Content present: EOD Protocol found in WORKFLOW.md (count: 1)
   Ready for cleanup. Awaiting "verified, clean up" instruction.
```

3. **Adi בודקת ומאשרת:** "verified, clean up"

4. **רק אחרי אישור מפורש** — CC מבצע:
```
   git branch -d <branch-name>
   git push origin --delete <branch-name>
```

### מה לעשות אם verification נכשל

- **Merge commit לא נמצא:** ה-merge לא קרה ב-GitHub. Adi צריכה לחזור ל-PR ולעשות merge.
- **Merge commit נמצא אבל תוכן חסר:** מצב חריג — אולי merge בוצע על branch שגוי. STOP, חקירה.
- **חלק מהתוכן נמצא וחלק לא:** Partial merge / cherry-pick partial. STOP, חקירה.

בכל מקרה של failure: **לא למחוק שום branch.** לחקור עם Adi.

### Reference
- CLAUDE.md § Verify-Before-Delete Protocol (binding rules)
- INTEGRATION_LEARNINGS.md § Lesson 2026-05-04 (incident reference)

---

## טיפול בהפתעות

> "INTEGRATION_LEARNINGS" הוא הזיכרון ארוך הטווח של הפרויקט.

**מתי לרשום:**
- מצאת שתלות בין רכיבים שלא תיעדנו
- bug "פתרת" שהיה תסמין של בעיה גדולה יותר
- API של Supabase / Expo / RN התנהג לא כצפוי
- החלטה שעשינו ב-fly שלא הופכת ל-DECISION רשמית אבל לא רוצה להיעלם
- FLAG פתוח שמחכה למידע נוסף

**איפה לרשום:**
- `docs/INTEGRATION_LEARNINGS.md` (יוקם מחר). פורמט: תאריך + nature + impact + status (open / resolved).

**מי רושם:**
- CC כותב כשמגלה משהו במהלך phase execution
- Adi כותבת כשגילית בbedika ידנית באמולטור
- Claude.ai כותבת אחרי log analysis

---

## Spec drift — הזיהוי והטיפול

**Spec drift** = הקוד עושה X, ה-spec doc אומר Y.

**איך נוצר:**
- שינוי קוד ישיר בלי `SPEC_SYNC` (anti-pattern)
- חבילה שהושלמה בלי לעדכן את כל ה-docs ב-`SPEC_SYNC.md`
- ה-spec עודכן (DECISION חדש) בלי שהקוד עוד תפס

**איך מזהים:**
- בתחילת חבילה — Claude.ai עושה `project_knowledge_search` ומשווה ל-state
- במהלך CC plan mode — CC מאמת מול הקוד ומציף discrepancy
- בlog analysis — אם behavior שונה מspec, אחד מהם שגוי

**איך מטפלים:**
1. מחליטים מה ה-source of truth (בדרך כלל הקוד, אבל לא תמיד)
2. אם הקוד הוא הנכון → עדכון spec דרך Spec Sync
3. אם הspec הוא הנכון → תיקון קוד דרך Improvement Package
4. תיעוד ב-INTEGRATION_LEARNINGS

---

## פלטפורמה: התאמות ספציפיות ל-RN/Expo/Windows

ה-workflow של Tomer נבנה ל-Next.js + Supabase ב-Web. שלך RN + Expo + Android. כמה התאמות:

### Inspect actual configs (לא רק קוד)
- **`app.json` / `app.config.js`** — Expo configuration
- **`eas.json`** — EAS Build profiles
- **`package.json`** — dependencies + scripts
- **`metro.config.js`** — Metro bundler
- **`android/app/build.gradle`** — אם CC עושה native changes
- אלה חלק מ-"actual code" לצורך כללי הברזל.

### Test universe
- **Jest** לunit tests (אם יש)
- **בדיקות ידניות באמולטור** — חלק עיקרי מ-TESTS.md
- **EAS Build artifacts** — לבדיקה על device אמיתי
- **Future:** Detox / Maestro לE2E (סשן עתידי)

### Observability
- **Sentry / Crashlytics** — לcrashes (התקנה: סשן עתידי)
- **Console logs ב-Metro** — לdev
- **Supabase Logs** — לDB queries
- **Expo dev menu** — לdebugging during dev

### Distribution
- **Internal testing track ב-Google Play Console** — ל-MVP
- **Closed/Open testing** — אחרי validation
- **EAS Submit** — אם מאמצים ענן (החלטה במסגרת DevEx session)
- **Play Console UI** — לפעולות שAdi חייבת לעשות לבד (אישורי גרסאות, screenshots, store listing)

### Windows-specific
- **PowerShell / CMD** ולא bash — CC מתאים בכל פעם
- **`type` במקום `cat`** לקריאת קבצים בטרמינל
- **Forward slashes ב-paths בקוד**, אבל `\` בbash CC commands
- **VS Code Extension** הוא הממשק העיקרי, לא טרמינל ישיר (D-2026-05-02-28)

---

## מסמכים קנוניים (Canonical Docs)

> רשימת המסמכים שהם source of truth. כל spec sync חייב לעבור דרך כולם. כל שינוי משמעותי משאיר את עקבותיו פה.

### Top-level
- `CLAUDE.md` (שורש הריפו) — חוקי הפרויקט לCC. **יוקם מחר.**

### `docs/`
- `README.md` — אינדקס
- `WORKFLOW.md` — המסמך הזה
- `CONVERSATION_STARTER.md` — פרומפט פתיחה לכל שיחה ב-Claude.ai
- `BUFF_VALUES.md` — שלושת העמודים + checklist (D-27)
- `BUFF_PRD.md` — Product Requirements Document
- `BUFF_DECISIONS_LOG.md` — תיעוד החלטות
- `BUFF_GAP_ANALYSIS.md` — PRD ↔ קוד + תוכנית
- `BUFF_BUDDY_SYSTEM.md` — אפיון BUDDY (Spec Status: target, not current)
- `BUFF_USER_STORIES.md` — סיפורי משתמש
- `BUFF_FEATURE_AUDIT.md` — פיצ'רים מקיפה
- `BUFF_FEATURE_PRIORITIZATION.md` — סדר העדיפויות
- `INTEGRATION_LEARNINGS.md` — זיכרון ארוך טווח. **יוקם מחר.**
- `ARCHITECTURE.md` — מבנה טכני (Supabase, navigators, hooks). **יוקם בסשן עתידי.**

### `docs/sessions/`
- `_template/` — תבנית חבילת שיפור. **יוקם מחר.**
- `{slug}/` — חבילות פעילות. כל אחת folder עצמאי.

### `docs/teen-ui-design/`
- 6 מסכים מאושרים ע"י Itay (2.5.2026). כל מסך = code.html + DESIGN.md + screen.png + design-notes.md.

### `buff-mobile/` (root, לא docs)
- `app.json`, `eas.json`, `package.json`, `metro.config.js` — platform configs
- `src/` — קוד. בעצמו לא canonical doc, אבל הוא ה-ground truth כשspec drift.

---

## עקרונות עבודה אישיים — לסיכום

> הדברים שלמדנו ב-2.5.2026 שלא חוזרים על עצמם:

1. **עברית בטרמינל = clipboard hell.** עובדים בVS Code Extension או דרך קבצים על הדיסק.
2. **קלוד.ai לא יכולה לקרוא מ-GitHub ישירות.** הקבצים מועלים לשיחה או נמצאים ב-Project Knowledge.
3. **GAP_ANALYSIS, DECISIONS_LOG, BUFF_VALUES — מסמכים של Adi.** Claude.ai לא מעדכנת חד-צדדית. שואלת ראשונה.
4. **Verification מבוססת grep, לא זיכרון.** "אני צופה ש-X מופעים" צריך להיות אחרי `grep`, לא לפני.
5. **Branch + PR ל-main לכל חבילה.** גם לעדכוני docs. fast-forward merge בסוף.
6. **`.claude/settings.local.json`** — קובץ שמשתנה לכל סשן CC. כדאי ב-`.gitignore`.

---

## גרסאות

| גרסה | תאריך | שינוי |
|---|---|---|
| 1.0 | 3.5.2026 | יצירה ראשונית. בוסס על ה-workflow של Tomer (Admilio) עם התאמות ל-BUFF: VS Code Extension, BUFF_VALUES, Capability Check, Values Check, התאמות RN/Expo. |
| 1.1 | 9.6.2026 | כללי ברזל **11 (Reachability — "מגע ראשון")** + **12 (דחייה = FLAG, לא הערת קוד)**, משתקפים גם ב-Universal Preamble. מקור: IN-2026-06-09-01 — pkg/reward-redemption נשלח עם מנוע תקין אך נתיב-הגילוי (התראה→אישור) לא נבנה ולא נבדק, ודחייתו תועדה כהערת קוד בלבד. |

---

**סוף מסמך.**
