# Mobile Prompts — 2026-05-25 (11:00 burn-window-1 session)

> **המטרה:** להפעיל את חלון 5 השעות הראשון מהנייד בעבודה, כך ש-window 2 (16:00–21:00) יהיה רענן לעבודת ערב כבדה עם CC.
> **איפה לפתוח:** Claude.ai mobile app (לא Claude Code — אין לו אפליקציית נייד).
> **למה הוא חולק קוטה עם CC:** כי שניהם דרך אותו חשבון Anthropic. שימוש ב-Claude.ai = שימוש באותה window.
> **חזרה הביתה:** את מביאה את כל הפלטים (כקובץ או paste) ל-CC ב-16:00, ו-CC הופך אותם ל-SPEC.md ולקוד.

---

## איך זה עובד בפועל

1. ב-11:00 (אזעקה בטלפון) — פותחת את Claude.ai באפליקציה.
2. בוחרת **פקג אחד** מהארבעה למטה. **לא יותר** — המטרה לא לסיים את כולם, אלא להפיק תוצר רציני אחד.
3. מעתיקה את ה-prompt לפי "**Prompt to paste**" של אותו פקג.
4. שולחת. עוקבת בעלייה לאוטו / בהפסקה.
5. כשמסיימת — מעתיקה את הפלט לפתק/דוא"ל/Drive. תביאי אותו ב-16:00 ואני אשתל אותו בקובץ הנכון.

**אזהרה:** מקסימום 30–45 דקות עבודה מהנייד. אם החלון נגמר לפני 16:00, את מאבדת חפיפה. בקיצור — אל תתעמקי, תני ל-Claude.ai לעשות עבודת ניסוח ראשונית.

---

## פקג 1 — buffadhd.com tagline alignment (Marketing) 🟢 קל

**מצב נוכחי:** האתר עדיין מזכיר "Executive Function" בעוד BUFF_VALUES.md מגדיר Intrinsic Motivation כעמוד 1. FLAG פתוח: marketing alignment בסשן עתידי.

**מה הפקג עושה:** מייצר 3 חלופות hero copy שמתיישרות עם BUFF_VALUES, מוכן להעתקה ל-Lovable.

**Prompt to paste:**

```
את עוזרת לי לחדש את ה-hero copy של buffadhd.com (אתר הסיכת של BUFF — אפליקציית ADHD לילדים בני 6-18).

עקרונות BUFF (חובה לעקוב):
1. Intrinsic Motivation — מובילים בתוצאות (הילד רוצה, הילד בוחר), לא במכניקה (BUFFs, BUDDY, אחוזים).
2. Positive Coaching — אף פעם לא לחץ, אשמה, "אתה חייב", רק נוכחות.
3. Independence-Building — מטרה: הילד לא יזדקק לנו. אנחנו "until they don't need us".

אנטי-עקרון מ-Adi: "WHY/WHAT not HOW" — לעולם לא להוביל ב"איך" (rewards, מערכת, BUDDY, 70%). תמיד ב"למה" (אוטונומיה, רגיעה, ביטחון פנימי).

מצב נוכחי באתר: hero מזכיר "Executive Function support" / "תפקודים ניהוליים" — שזה נכון רפואית אבל מתאר את HOW, לא את WHY.

תייצרי לי:
1. שלוש גרסאות hero TAGLINE קצרות (עד 7 מילים) — בעברית ובאנגלית. כל אחת בסגנון אחר (רגשי / מבטיח / רגוע).
2. לכל גרסה: SUB-TAGLINE של עד 15 מילים שמרחיב את הוויב.
3. לכל גרסה: justification של שורה אחת איך היא עומדת ב-3 העמודים.
4. בסוף: ההמלצה שלך לאיזו לבחור ולמה, עם הסתייגות אחת.

פורמט: markdown table, מוכן להעתקה לקובץ או ל-Lovable.

חשוב: אל תזכירי "ADHD" ב-tagline עצמו אלא אם זה ממש מובן מאליו — BUFF פונה גם להורים שעדיין לא מאבחנים. אבל את יכולה להזכיר ב-sub-tagline אם זה מתאים.
```

**מה תקבלי:** טבלת markdown עם 3 חלופות + המלצה.
**ערב:** CC ידביק את הפלט ב-`docs/sessions/buffadhd-tagline-refresh/SPEC.md` ויכין PR ל-Lovable repo.

---

## פקג 2 — Founder Story draft (Brand family — חסר היום) 🟡 בינוני

**מצב נוכחי:** `docs/BUFF_FOUNDER_STORY.md` רשום ב-CLAUDE.md תחת "when created" — הוא לא קיים עדיין. זה חסר קריטי לסיפור BUFF (פיצ'ר ביוגרפי שהורים מתחברים אליו במהירות).

**מה הפקג עושה:** טיוטה ראשונה של סיפור Adi/Itay/Emi — מבנה, נקודות עוגן, ציטוטים אפשריים.

**Prompt to paste:**

```
את עוזרת לי לכתוב את BUFF_FOUNDER_STORY.md — מסמך שמסביר איך BUFF נולד, ושיורד בערוצים: About page באתר, Reels intro, הודעות פתיחה לפורומים, גב' עמוד 1 ב-deck למשקיעים.

עובדות העוגן (אל תמציאי מעבר לזה):
- Adi (אני) — אמא, PM, מייסדת BUFF.
- Itay (15) — הבן שלי. ADHD. שותף Co-creator על Teen UI.
- Emi (9) — הבת שלי. ADHD. הפרסונה העתידית של Children Mode.
- BUFF נולד בבית — מהצורך של Adi לעזור לילדים שלה לבנות הרגלים בלי להפוך לשוטר ההרגלים שלהם.
- תיאוריה מרכזית שצמחה אצלי: "The Anchor Theory of BUFF survival" — ילד צריך עוגן בלתי תלוי בהורה (ביולוגי/רפואי/אוטונומי, לא bundled עם משימות אחרות) כדי שההרגל ישרוד תקופות של זמן-אפס-של-הורה. Etay (15) שרד עם תרופות כעוגן עצמאי. Emi (9) נשרה כי כל המשימות שלה היו "bundled" סביב בית-ספר.
- BUFF נבנה ב-React Native Expo עם Supabase. צמצמתי 6 שנים של product management בחברות גדולות לפרויקט פרטי.

עקרונות סיפור:
1. אל תפרגני יותר מדי לעצמך — הסיפור צריך להיות אנושי, לא "linkedin".
2. הילדים הם לא props — הם co-creators. Itay רואה את עצמו ב-BUFF, לא רק שאמא שלו בנתה.
3. הכאב הוא לא "ילדי לא עושה שיעורי בית" — הוא "אני לא רוצה להיות התראה הולכת על שתי רגליים".
4. הפתרון הוא לא "אפליקציה שעוזרת ל-ADHD" — הוא "אפליקציה שהילד שולט בה, ובסוף, לא צריך אותה".

תייצרי לי:
1. **3 גרסאות פתיחה** (כל אחת 80–120 מילים): גרסה A רגשית-אמא, גרסה B אנליטית-PM, גרסה C משלבת.
2. **מבנה מלא** של הקובץ (כותרות + 1 משפט מסביר לכל סעיף): The Trigger / The First Prototype / The Anchor Insight / Itay's Voice / Emi's Pattern / What BUFF Refuses to Be.
3. **5 ציטוטים שניתן לי להגיד** (תעצבי אותם כך שיתאימו ל-Adi — לא מנופחים).
4. **המלצה** באיזו גרסת פתיחה ללכת ולמה.

פלט בעברית, בטון של "Adi מדברת" — לא מקצועית מדי, לא רגשנית מדי.
```

**מה תקבלי:** טיוטה של 600–900 מילים מוכנה לשיפור.
**ערב:** CC יצור את `docs/BUFF_FOUNDER_STORY.md`, יוסיף הפניה ב-CLAUDE.md, ויעדכן MEMORY.

---

## פקג 3 — pkg/drop-egg-evolution-stage SPEC draft 🟡 בינוני

**מצב נוכחי:** FLAG פתוח (IN-2026-05-16-01 השני). מנגנון evolution_stage ב-`src/types/pet.ts` הוא pre-V0.5 ושובר את 3 העמודים (אנטי-pattern של "טפל בדמות"). מתוכנן כפקג אחרי `pkg/teen-ui-with-buddy-character`.

**מה הפקג עושה:** SPEC draft מלא ל-pkg/drop-egg-evolution-stage, מוכן לפתיחת branch ב-CC בערב.

**Prompt to paste:**

```
את עוזרת לי לכתוב SPEC.md ל-pkg/drop-egg-evolution-stage בפרויקט BUFF (React Native Expo + Supabase, ADHD app לילדים).

הקשר:
- ב-src/types/pet.ts (קוד נוכחי) יש מנגנון EvolutionStage = 'egg' | 'hatchling' | 'scout' | 'guardian' עם thresholds 0/3/7/13 ימים.
- זה מנגנון מ-pre-V0.5. ב-V0.5 (BUDDY V0.5) הילד רואה את החיה ב-day 0 ב-Friendship Level L1. אין שלב ביצה.
- שלב הביצה שובר את 3 העמודים של BUFF:
  1. Intrinsic Motivation — "egg-hatch reveal" הוא בדיוק dopamine-trigger pattern ש-BUFF דוחה (כמו D-2026-05-02-07 שדחתה streaks).
  2. Positive Coaching — ילד שמשתמש יומיים ועוזב לעולם לא רואה את ה-buddy שלו = soft failure.
  3. Independence-Building — האפליקציה מחליטה מתי הילד רואה את הבחירה שלו = אין קול לילד.
- בנוסף, שובר coherence בין מינים (זאבים, קפיברות, פנדות, חד-קרנים לא בוקעים מביצים).
- pet_state ב-AsyncStorage בלבד — אין DB migration.

קבצים מושפעים (מתוך FLAG):
- src/types/pet.ts (להסיר EvolutionStage, EVOLUTION_THRESHOLDS, getEvolutionStage, getNextEvolutionThreshold, STAGE_VISUALS, evolution_stage: 'egg' default)
- src/components/PetDisplay.tsx
- src/components/EmojiPet.tsx
- כל pet.stage.* i18n keys (EN + HE)
- docs/BUFF_BUDDY_SYSTEM.md:94 (שורה סותרת — "egg/hatchling/scout/guardian")

תכתבי SPEC.md לפי המבנה של BUFF (תוכלי להתבסס על מבנה גנרי, ב-Adi יש convention שאחזיר ל-CC להתאים בערב):
1. **Goal** — מה הפקג עושה ולמה.
2. **Scope** — IN / OUT.
3. **Architectural Decisions** — האם פשוט מוחקים, או משאירים deprecated alias? איך מטפלים בנתונים קיימים ב-AsyncStorage?
4. **Files to change** — רשימה מסודרת עם השינוי בכל קובץ.
5. **Values Check** — 9 שאלות (3 לכל עמוד), עם תשובה לכל אחת.
6. **Tests** — שלוש בדיקות מינימום: typecheck, אין AsyncStorage crash על read של evolution_stage ישן, רענון UI.
7. **Open Questions** — דברים שצריך לשאול את Adi לפני התחלת קוד.

פלט: markdown מוכן לקובץ. שפה: עברית בטקסט, אנגלית בכותרות וסעיפים טכניים (כמו ש-BUFF עובדת).
```

**מה תקבלי:** SPEC draft של 400–600 שורות.
**ערב:** CC ייצור branch `pkg/drop-egg-evolution-stage`, ידביק את ה-SPEC, ויתחיל phase 1.

---

## פקג 4 — Persona deep-dive: "אם נטועה ועייפה" 🟢 קל

**מצב נוכחי:** `BUFF_PERSONAS.md` מכיל 9 פרסונות. ב-`BUFF_MESSAGING.md` יש hooks ו-forum replies — אבל כיסוי הפרסונות לא אחיד. הפרסונה "אם עובדת + ילד עם ADHD" היא הקהל הכי גדול ב-Israel ומקבלת הכי פחות messaging ייעודי.

**מה הפקג עושה:** מייצר 3 hooks + 3 forum replies שמכוונים ספציפית לפרסונה הזו, מוכנים לפרסום ב-Facebook groups / Reddit.

**Prompt to paste:**

```
את עוזרת לי לכתוב messaging targeted לפרסונה אחת ספציפית של BUFF: "האם הנטועה והעייפה".

הפרסונה:
- אם בת 35–45 לילד/ה עם ADHD (אבחנה רשמית או חשד).
- עובדת במשרה מלאה. בעל לרוב גם עובד.
- 17:00–21:00 = הניהול היומיומי (שיעורים, מקלחת, ארוחה, מסכים).
- מתעוררת בלילה מהמחשבה "מה עוד לא עשיתי בשבילו".
- אובחנה בעצמה עם ADHD ב-3-4 שנים האחרונות (כמו רוב ההורים האלה).
- כבר ניסתה: עוגנים מגנטיים על המקרר, אפליקציות chore, מערכת מטבעות, מורה פרטית.
- מה שלא מעבר עם הזמן: כולם דורשים שהיא תזכור / תאכוף / תפקח.
- "המצב הפסיכולוגי בבית" חשוב לה פי 10 מ-"שיעורי בית הושלמו". היא תוותר על הציון בשביל שקט.

עקרונות BUFF שחייבים להופיע ב-messaging:
1. WHY before WHAT — אל תתחילי במכניקה (BUFFs, BUDDY, פרסים).
2. הפרסה: היא לא צריכה להיות יותר משמעת. היא צריכה פחות להיות שוטר.
3. "until they don't need us" — היעד הוא לא תלות ב-BUFF, היעד הוא ילד אוטונומי.
4. הילד בוחר את הפרסים שלו — לא ההורה, לא האפליקציה.
5. BUFF לא מאשים את ההורה ב-shaming language ("אם רק היית עקבית"). פתאום ההורה גם נושם.

מה לא לעשות:
- אל תזכירי "ADHD support app" — קלישאה.
- אל תזכירי "gamification" / "rewards" / "מערכת מטבעות" — אנטי-עמוד.
- אל תפסידי קונקרטיות — מקרים, ציטוטים, רגעי ביוגרפיה.

תייצרי לי:
1. **3 hooks** (1–2 משפטים כל אחד) — לפוסט Facebook / Reels intro. כל hook עם angle שונה (רגש / שאלה רטורית / observation מפתיע).
2. **3 forum replies** (פסקה אחת כל אחת) — לתגובה לפוסט אמא בקבוצת ADHD שכותבת "כל יום זה מאבק עם שיעורי הבית של הילד שלי, אני שבורה". שלוש גישות: empathy-first / experience-share / soft-recommend.
3. **5 micro-copy snippets** — למודעות (1 משפט כל אחד) שאפשר להריץ כ-A/B test.
4. **המלצה** איזה hook להתחיל איתו לתקופה הזו של השנה (מאי 2026, סוף שנה"ל בישראל = ילדים יותר עייפים, הורים בקצה).

פלט בעברית, בטון של "אישה לאישה" — לא קליני, לא יומרני. כאילו את מדברת עם חברה.
```

**מה תקבלי:** ערכת messaging מוכנה ל-Facebook / Reddit / Reels.
**ערב:** CC יוסיף את הפלט ל-`BUFF_MESSAGING.md` תחת סעיף ייעודי "Persona: האם הנטועה והעייפה — May 2026".

---

## סדר עדיפויות מומלץ

אם יש לך זמן ל-**פקג אחד בלבד** ב-11:00 — לכי על **פקג 1** (tagline). זה הכי קצר, הכי mobile-friendly, וזה FLAG פתוח שמחכה למצב אסטרטגי.

אם יש לך זמן ל-**שניים** — הוסיפי **פקג 4** (persona messaging). הוא משלים את פקג 1 כי שניהם marketing/voice.

אם יש לך **חצי שעה+** — לכי על **פקג 2** (founder story). הוא הכי משמעותי לטווח ארוך, אבל דורש שאת תקדישי לו ראש.

**פקג 3** (drop-egg SPEC) — הכי טכני, פחות מתאים לנייד עם רעש. שמרי לערב עם CC.

---

## מה לעשות בערב כשאת חוזרת

1. ב-16:00 תפתחי VS Code + Claude Code. השעון של ה-window החדש מתחיל אז.
2. תגידי לי בצ'אט: "ראן 1 + 4 הם בקליפבורד" (או 2, או 3, מה שעשית).
3. אני אקח את הפלטים, אדביק במקומות הנכונים, אבדוק vs. canonical docs, ואכין PR.
4. בלילה — תאשרי PRs ונסיים את היום עם 2-3 חבילות שגדלו ביום אחד.

---

**עודכן:** 2026-05-25, לפני יציאתך לעבודה.
**אם משהו לא ברור בנייד —** שלחי לי screenshot כשתחזרי, ואני אתקן ל-mobile-quickstart הבא.
