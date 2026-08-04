# Child Access Paths — "אין טלפון" ≠ "לא בשבילנו" — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; מתעדכן בסוף לפי SPEC_SYNC.md.
>
> **Slug:** `child-access-paths` · **נוצר:** 2026-08-04 · **בעלים:** Adi (PM) · **מעצב/מתאם:** Claude.ai/CC · **מבצע:** CC
> **גרסה:** v3 (אחרי סבב סקירה אדוורסרי PM / CSM-UX / Growth — ראה REVIEW.md; כל הכרעות Adi נסגרו 2026-08-04)
> **קרוב-משפחה:** מרחיב את `onboarding-redesign` (#345, merged). תלות רכה ב-#301 (`pkg/smart-join-link`, OPEN) — לא חוסם.

---

## 0. Why this package exists (הבעיה, מבוססת דאטה + מקרה מבחן)

**הטענה המרכזית:** אנחנו מאבדים משפחות לא בגלל חוסר עניין, אלא בגלל שהאונבורדינג **מציג תנאי כניסה שגוי** — "יש לילד טלפון?" — שגורם להורים שאין לילד שלהם טלפון להסיק ש-BUFF לא בשבילם. זו הנחת-יסוד סמויה שסותרת את המוצר (View-as-Child + PWA בדפדפן קיימים ועובדים).

### מקרה מבחן — Keren Kalif (family `37f44353`, נרשמה 2026-07-31, android)
- **אמרה ל-Adi במפורש:** "לאיתן אין מכשיר משלו ולכן לא השתמשתי ב-BUFF."
- שחזור מה-DB: אונבורדינג מלא ב-7:39 בבוקר → יצירת איתן → 5 משימות → הוסיפה **ידנית** משימה משלה (הורה מושקעת) → פתחה את מסך ההזמנה **3 פעמים ולא הקישה על אף אופציה** → ההשלמה היחידה אי-פעם היא `source='onboarding_first_task'` (נגיעת הדמו, 20 שניות אחרי יצירת המשימות) → ומאז כלום.
- **יש לקרן טוקן פוש תקין. לא נשלח אליה דבר מאז.**
- לקח כפול: (א) המסגור מבריח, (ב) **מי שלא בוחר כלום הוא ה-persona המרכזית** — הזרימה חייבת לטפל ב-abandon, לא רק בשלוש הבחירות.

### דפוס רחב (חקירת מוות 2026-08-04, קוהורט 60 יום, משפחות עם ילד אמיתי בלבד)
- 30 משפחות אמיתיות → 10 הפעילו → **19 מתו בלי אף השלמה**.
- **כל 10 הילדים עם לוגין משלהם שייכים למשפחות שהתלקחו. 10/10.** ל-19 המתות: אפס.
- מסלול המכשיר-המשותף לא ייצר כמעט הישרדות — לא כי הוא לא עובד, אלא כי **שום דבר לא מוליך אליו** (ראה §מנגנון, סעיף 2).
- **עדכון החלטה (Adi, 2026-08-04): web הוא מסלול הפעלת-ילד לגיטימי** — מחליף את DG1 של #345 ("web = מסירה בלבד"). ראיה: family `de60` — ילד web עם לוגין משלו, 11 ימים פעילים, 29 השלמות, נראה 2026-08-04. רישום מוצע ל-BUFF_DECISIONS_LOG ממתין לאישור Adi (הדוק שלה).

⚠️ **N קטן — קורלציה, לא סיבתיות מוכחת.** ייתכן שמשפחות מחויבות גם נותנות גישה וגם מתמידות. מה שכן ודאי: (א) המסך משדר תנאי-כניסה שגוי (אושש בקוד), (ב) מסלול "אין טלפון" הוא קוד מת (אושש בקוד), (ג) הורה אחד לפחות אמר לנו במילים שלו שזו הסיבה שנשר.

### מנגנון הכשל (אושש בקוד — `src/screens/onboarding/unified/UStep7_Phone.tsx` + `src/i18n/*.json`)
1. **המסגור:** "האם ל{name} יש טלפון משלו/ה?" — ממסגר את BUFF כאפליקציית-טלפון-של-ילד.
2. **מסלול "אין טלפון" = קוד מת:** `noPhone()` (שורה 104) עושה רק `console.log`. מחרוזות ההכוונה `noPhoneTipTitle/Body` קיימות ב-i18n **ולעולם לא מוצגות**. שום דבר לא מוליך ל-View-as-Child.
3. **מחשב/טאבלט לא קיימים:** אין אופציה כזו; `inviteMessage` שולח רק Play Store + `buff://` המת בדפדפן.
4. **אחרי הבחירה — אין המשך:** `hasPhone` לא מפעיל כלום; אין מגע יום-1 גם למשפחות עם טוקן.
5. **תזכורת 24ש' קיימת** (`inviteLater`) עם ניסוח guilt-toned ("אל תשכח/תשכחי") — תבוטל (ראה Phase 1) לטובת בעלים יחיד להתראות.

**מה שכן עובד ולא נוגעים בו:** מחולל המשימות, Step D (first-task-together), באנר ה-resume של #345.

---

## 1. Decision Gates — כולם נסגרו (Adi, 2026-08-04)

| # | Gate | הכרעה |
|---|---|---|
| **DG1** | ניסוח 3 המסלולים | ✅ אושר העיקרון + ה-copy. **סדר והדגשה לפי פלטפורמת הרשמה** (אושר בסקירה): native → shared_device מודגש ראשון; web → home_device מודגש ראשון. שלושתם תמיד גלויים. Copy Table סופי עובר אישור שורה-שורה לפני merge. |
| **DG2** | #301 | ✅ לא מחכים. **תנאי-קדם חדש (סקירה A2): אימות E2E של מסלול join ב-www לפני ש-copy מבטיח לינק.** עד אז — קוד משפחה + הוראות כניסה לאפליקציית ה-web הקיימת. |
| **DG3** | פוש יום-1 | ✅ **ניסוח Adi:** שאלה צופה-קדימה שמציעה את 3 המסלולים (ראה Copy Table). ההקשה מנחיתה על מסך הגישה. **תזמון ערב** (אושש בדאטה: שיא 19:00-21:00, רוחב מרבי ב-20:00; וריאנט 20:30 נבדק). **מימוש: התראה מקומית מתוזמנת במכשיר** — "מקומי" בחינם, בלי עמודת TZ ובלי cron (סקירה A4). cap 1-2 cross-channel + opt-out (ראה Phase 2). |
| **DG4** | אין מסך לוגין לילד | ✅ View-as-Child = parent session. אימות Hat-4. |
| **DG5** (חדש) | web = מסלול ילד | ✅ **#345 DG1 נפתח והוחלף** — ראה §0. |

---

## Capabilities & Bottlenecks

### מה CC יעשה
`UStep7_Phone` → `ChildAccessStep` (3 כרטיסים מדורגי-פלטפורמה, re-enterable); שיגור View-as-Child in-flow; ביטול תזכורת 24ש'; התראת יום-1 מקומית מתוזמנת + opt-out; מיגרציית `access_mode`; אירועי funnel; אימות E2E של join ב-www; jest + tsc; אימות דו-פלטפורמי.

### מה Adi חייבת
אישור שורה-שורה של Copy Table הסופי. אישור רישום D-2026-08-04 ב-BUFF_DECISIONS_LOG. Hat-4 לכל מסלול (כולל cold-join מהמחשב הביתי). ראיונות win-back (Phase 0) אם תרצה — CC מכין נוסח.

### צוואר בקבוק
אימות join ב-www (תנאי-קדם לכרטיס המחשב). N קטן → מדדים directional.

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. **בלי תגמול וירטואלי?** כן — המסך עוסק בגישה.
2. **מקרב לפרס שהילד בחר?** ניטרלי — מסיר חסם.
3. **"אני רוצה" ולא "חייב"?** כן — 3 מסלולים גלויים תמיד; ההדגשה מדרגת, לא כופה.

### Pillar 2 — Positive Coaching
1. **ניסוח משפיל/משווה?** לא — הפוש בניסוח Adi הוא שאלה צופה-קדימה, **בלי משפט-חסר** ("עדיין לא..."). התזכורת הישנה "אל תשכח" מבוטלת.
2. **אם נכשל — empathy?** כן — cap 1-2 ואז עצירה מוחלטת + opt-out ממומש (flag + פעולה בפוש).
3. **ציר בושת-ההורה:** עבר — אין הצגת כישלון בשום מגע.

### Pillar 3 — Independence-Building
1. **מסוגל יותר בלי האפליקציה?** כן — "הרגע שלו על הטלפון שלך, הוא מסמן בעצמו".
2. **לילד קול?** כן — כל מסלול מסתיים בילד שמסמן בעצמו; shared_device משגר View-as-Child מיד.
3. **בעוד 6 חודשים?** המסך re-enterable אך שקט אחרי הפעלה; מתפוגג.

**Values Check Pass:** [x] כן (v3) — אימות סופי מול ההתנהגות הממומשת ב-exit.

---

## Goals
- **G1** — reframe: "איך {child} ישתמש ב-BUFF?" — 3 מסלולים גלויים, מדורגים לפי פלטפורמה.
- **G2** — מסלול shared-device אמיתי: הבחירה **משגרת View-as-Child מיד** — ההקשה היא טקס המסירה.
- **G3** — מסלול מחשב/טאבלט: קוד משפחה + כניסת web שעובדת היום; לינק join אחרי אימות E2E.
- **G4** — מגע יום-1: התראה מקומית מתוזמנת בערב, ניסוח Adi, cap 1-2, opt-out, נחיתה על מסך הגישה.
- **G5** — מדידה כנה: `access_mode` על הפרופיל + אירועים כולל abandon; ללא טענות lift מבולבלות.

## Non-goals
עיצוב-מחדש של כל האונבורדינג · מחולל משימות · תמחור · Web push חדש · email (אין sender) · referral.

## Success Metrics (directional; before/after, בלי flag-split — משמעת #345)

| מדד | הגדרה | תפקיד |
|---|---|---|
| **M-activation by access-mode** | daily_progress non-seed מפוצל לפי `profiles.access_mode` | **Primary** |
| **סף החלטה X/N** | נקבע מראש ב-Phase 0 מול run-rate ההרשמות (לא "לשבור 0" — משפחה בודדת ≠ אות) | gate ל-ship-to-all |
| shared→own upgrade | % בוחרי shared_device שעברו לגישה עצמאית תוך 30 יום | **בוחן התאוריה** (10/10) |
| access_mode distribution + abandon rate | פילוח בחירות + `access_step_abandoned` | discovery |
| day1_push delivery | sent/opened — **תיאורי בלבד**, לא lift (אין קבוצת ביקורת תקפה ב-N הזה) | delivery |
| **Guardrails הניתנים להערכה** | add-child · abandonment בצעד הגישה (יש baseline: קרן) | חוסם ship |
| Guardrails הצהרתיים | Day-7 retention (לא ניתן להערכה ב-N נוכחי — מוצהר, נעקב בלבד) | מעקב |

**היקף כן של הפוש (Phase 0 מכמת):** ~5.5% token reachability → צפי מגע ~1-3 משפחות/חודש. הערוץ הראשי לרוב = באנר ה-resume הקיים. הפוש = תוסף צר, לא "quick win".

---

## Behavior Contract (end-to-end)

**המסך:** "‏{child} — איך נשתמש ב-BUFF?" (מבנה bidi-safe לשם לטיני). שלושה כרטיסים, תמיד גלויים, **סדר והדגשה לפי פלטפורמת הרשמה** (native: 3→1→2; web: 2→1→3):

1. **📱 בטלפון שלו/ה** → share של ההזמנה. affordance משני: **"אשלח הערב"** → מצטרף לקוהורט יום-1 (מחליף את תזכורת ה-24ש' המבוטלת). אישור כן: "הלינק מוכן לשליחה" (share sheet לא מדווח השלמה אמינה); "✓ נשלח" שמור ל-join מאומת בלבד.
2. **💻 במחשב או טאבלט בבית** → קוד משפחה גדול + הוראות כניסה ("פותחים יחד הערב"). לינק join רק אחרי אימות E2E (תנאי-קדם Phase 1).
3. **👨‍👩‍👧 כאן, אצלי במכשיר** → **משגר View-as-Child מיד** בפריים של הילד — ההקשה היא המסירה. חוזרים מ-View-as-Child לסיום onboarding רגיל.

**Abandon (ה-persona של קרן):** יציאה בלי בחירה → `access_step_abandoned` + **המסך נגיש שוב מהדשבורד** (כרטיס "איך {child} ישתמש?"). קוהורט הפוש = "הגיע לצעד **ולא הפעיל**", לא "בחר מסלול".

**בוקר-אחרי (shared_device):** הדשבורד מציג כרטיס "הרגע של {child}" בראש — הקשה אחת ל-View-as-Child.

**פוש יום-1:** התראה מקומית מתוזמנת ל-~19:00-19:30 (וריאנט 20:30), ניסוח Adi (Copy Table), deep-link למסך הגישה. מבוטלת אוטומטית אם המשפחה הפעילה לפני. cap 1-2 (מונה יחיד — אין ערוץ שני אחרי ביטול תזכורת ה-24ש'), ואז עצירה. opt-out: פעולת "הפסיקו להזכיר" + `day1_push_optout`.

**Invariants:**
- שלושת המסלולים גלויים תמיד; אין מסלול כופה; אין dead-end; המסך re-enterable.
- כל אישור מגובה בפעולה מאומתת, אחרת מנוסח כטענה בת-כיבוד ("הועתק", "מוכן לשליחה").
- הילד לעולם לא רואה מסך לוגין ([[feedback_kids_never_login]]).
- Android + Web parity ([[feedback_android_web_platform_parity]]); `crossAlert` בלבד.
- copy דרך `t()`; הטיות ילד לפי מגדר הפרופיל (בלי לוכסנים); פניות הורה ברבים-ניטרלי; bidi-safe עם שם לטיני; RTL pass ב-Hat-3 ([[project_child_language_latin_name_trap]], [[project_i18n_three_language_sources]]).

---

## ROADMAP

| Phase | תוכן | Size | תלות |
|---|---|---|---|
| **Phase 0 (במקביל ל-1, לא חוסם)** | כימות token-coverage של קוהורט מת; קביעת סף X/N מול run-rate; ראיונות win-back ממוקדים **במשפחות שבחרו-כלום/לא-שלחו** (לא שולחי-הזמנה — הם הבעיה של #301); מחקר כוריאוגרפיית 72ש' Finch/Duolingo/Greenlight. | S | — |
| **Phase 1 (MVP core)** | `ChildAccessStep` (3 כרטיסים מדורגים, re-enterable, abandon event) + שיגור View-as-Child in-flow + **ביטול תזכורת 24ש'** + מיפוי `hasPhone`→`access_mode` + **אימות E2E join ב-www** (לפני חשיפת לינק בכרטיס 2) + מיגרציית `access_mode`. | M | Copy סופי (Adi) |
| **Phase 2** | התראת יום-1 מקומית מתוזמנת (ערב, ניסוח Adi, deep-link, ביטול-על-הפעלה, cap, opt-out flag + surface). | M | Phase 1 |
| **Phase 3** | שדרוג כרטיס 2 ללינק חכם (#301 כשחי): "✓ נשלח" מאומת-join, autofill קוד. | M | #301 |

**MVP cut-line:** Phase 1 עומד לבד. Phase 2 מיד אחרי. Phase 3 כש-#301 חי.

## Schema Changes
```sql
-- Phase 1 (apply_migration; existing-user impact: כל הפרופילים הקיימים access_mode=null = "לא נבחר", תקין)
alter table public.profiles add column access_mode text;        -- על פרופיל הילד: own_phone|home_device|shared_device (current-state; אירועים = היסטוריה)
alter table public.profiles add column day1_push_optout boolean not null default false;  -- על פרופיל ההורה

-- onboarding_events: אירועים חדשים (אין שינוי סכמה)
-- access_mode_selected{method}, access_step_abandoned, day1_push_scheduled|sent|opened|optout
-- כלל attribution: access_mode על הפרופיל בזמן ההשלמה הראשונה הלא-seed = המסלול המיוחס.
```

## API / Route / Hook Changes
- **Changed:** `UStep7_Phone.tsx` → `ChildAccessStep` (re-enterable route, נגיש גם מהדשבורד). `hasPhone` מוסר מ-`RootStackParamList` → `access_mode`; audit צרכני `hasPhone`; legacy mapping: own_phone→true, אחרת false. `inviteLater` scheduler — **נמחק**.
- **New:** deep-link route למסך הגישה (יעד הפוש); שיגור View-as-Child מתוך onboarding; כרטיס דשבורד "הרגע של {child}" (shared_device, יום 2+); התראה מקומית מתוזמנת (expo-notifications, קיים — לא dep חדש).
- **Reuse:** `shareInvite`, resume banner, View-as-Child, ערוץ notifications קיים.

## UI / Copy Table (EN + HE — טעון אישור שורה-שורה של Adi לפני merge)

| מקום | EN | HE | הערה |
|---|---|---|---|
| כותרת | "{child} — how will we use BUFF?" | "‏{child} — איך נשתמש ב-BUFF?" | bidi-safe: שם בגבול המשפט |
| כרטיס 1 | "On their own phone" | "בטלפון שלו" / "בטלפון שלה" | הטיה לפי מגדר פרופיל |
| כרטיס 1 sub | "Send the invite now" | "שולחים הזמנה עכשיו" | — |
| כרטיס 1 secondary | "I'll send it tonight" | "אשלח הערב" | מזין קוהורט יום-1 |
| כרטיס 2 | "On a computer or tablet at home" | "במחשב או טאבלט בבית" | — |
| כרטיס 2 sub | "Open it together tonight — here's your family code" | "פותחים יחד הערב — עם קוד המשפחה שלכם" | בלי הבטחת לינק עד אימות E2E |
| כרטיס 3 | "Right here, on my device" | "כאן, אצלי במכשיר" | מודגש ב-native |
| כרטיס 3 sub | "Their moment on your phone — they tap it themselves" | "הרגע שלו על הטלפון שלך — הוא מסמן בעצמו" (הטיה לפי מגדר) | ההקשה משגרת View-as-Child |
| אישור share | "The link is ready to send" | "הלינק מוכן לשליחה" | כן; "✓ נשלח" רק ב-join מאומת (Phase 3) |
| כרטיס דשבורד יום-2 (shared) | "{child}'s moment" | "הרגע של {child}" | הקשה אחת ל-View-as-Child |
| כרטיס דשבורד (abandon) | "How will {child} use BUFF?" | "איך {child} ישתמש ב-BUFF?" | re-entry למסך |
| **פוש יום-1 (ניסוח Adi)** | "How would you like {child} to try BUFF for the first time? Their own phone, the family computer, or right on your device 🌱" | "איך תרצו ש{child} ינסה את BUFF בפעם הראשונה? בטלפון שלו, במחשב בבית, או אצלכם במכשיר 🌱" | הורה ברבים-ניטרלי; ילד לפי מגדר; deep-link למסך הגישה |
| opt-out | "Stop reminding me about this" | "הפסיקו להזכיר לי את זה" | בפוש + במסך הנחיתה |

## Open Questions (CC פותר ב-Plan Mode)
- מימוש מדויק של שיגור View-as-Child מתוך ה-onboarding stack (nav reset נקי חזרה).
- מיקום כרטיס ה-re-entry בדשבורד (מעל/מתחת לבאנר resume של #345 — לא שניהם יחד).
- ביטול ההתראה המתוזמנת על הפעלה: listener על השלמה ראשונה או בדיקה ב-app-open.

## Out of Scope
עיצוב-מחדש כולל של האונבורדינג · מחולל משימות · תמחור · Web push · email · referral · Teen/Children Mode UI.

---

## מקורות
- REVIEW.md (סבב אדוורסרי מלא + הכרעות Adi 2026-08-04).
- מקרה Keren Kalif: family `37f44353` + אמירה מילולית ל-Adi.
- חקירת מוות: [[project_kid_own_login_ignition]].
- קוד: `src/screens/onboarding/unified/UStep7_Phone.tsx`, `src/i18n/he.json:1583-1594`.
- תלות: #301 [[project_smart_join_link]] · מרחיב: #345 [[project_onboarding_redesign_pkg]].
