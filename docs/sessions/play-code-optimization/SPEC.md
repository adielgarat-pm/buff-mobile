# play-code-optimization — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**מקור הדרישה:** Google Play "new app quality requirements" (הודעה אוג' 2026) — Code optimization: כל AAB חייב כיסוי מינימלי של **25%** על shrinking / optimization / obfuscation (R8 או כלי שקול). אכיפה ~פבר' 2027; אי-עמידה → הפחתת visibility ויכולת פרסום בחנות.

---

## Capabilities & Bottlenecks

### מה Claude Code (CC) יעשה
- מוסיף ומגדיר את הפלאגין `expo-build-properties` ב-`app.json` כדי להפעיל R8 (shrink + minify + resource-shrink) ב-release build של אנדרואיד.
- מריץ `expo prebuild` (dry) ו-typecheck/Jest כ-sanity לפני build אמיתי.
- כותב את exit deliverables (STATUS row, עדכון canonical לפי SPEC_SYNC, learnings אם צריך).

### מה Adi חייבת לעשות בעצמה
- **לאשר התקנת תלות חדשה:** `expo-build-properties` (Improvement Package, לא fix ישיר — כלל CLAUDE.md).
- להריץ / לאשר **EAS production build** (AAB) — זו הדרך היחידה לאמת ש-R8 לא שובר את ה-build.
- להתקין את ה-AAB על מכשיר/אמולטור ולעשות smoke test (התחברות, Paywall של RevenueCat, קריסת-בדיקה של Sentry).
- לוודא ב-Play Console שסעיף Code optimization עובר לירוק אחרי העלאת ה-build.

### צוואר בקבוק / נקודות עצירה צפויות
- **R8 עלול לשבור release build בשקט** — מחלקות שספריות נייטיב טוענות ברפלקציה עלולות להיחתך. חשודים: `react-native-purchases` (RevenueCat), `@sentry/react-native`, `react-native-svg`, `xlsx`. מרביתן משלחות consumer ProGuard rules, אך זה חייב הוכחה ב-build אמיתי.
- **סימבוליקציה של Sentry** — ערפול דורש שקובץ `mapping.txt` יעלה ל-Sentry, אחרת ה-stack traces של הקריסות ייהפכו לבלתי-קריאים ← ניטור הקריסות (Pillar 2) יידרדר בשקט.
- אין `android/` בריפו (managed workflow), אז אין gradle.properties לערוך ידנית — כל השליטה דרך `expo-build-properties`.

---

## Values Check

> חבילת תשתית/build — אין משטח משתמש, אין copy, אין מנגנון BUDDY. 9 השאלות נענות טריוויאלית "עובר", עם חריג אחד לשמירה על Pillar 2.

### Pillar 1 — Intrinsic Motivation
1. **בלי תגמול וירטואלי?** — N/A, שינוי build פנימי. עובר.
2. **מקרב לפרס שהילד בחר?** — N/A. עובר.
3. **"אני רוצה" מול "אני חייב"?** — N/A. עובר.

### Pillar 2 — Positive Coaching
1. **ניסוח משפיל/משווה/כשל?** — אין copy בחבילה. עובר.
2. **empathy מול pressure בכישלון?** — N/A. עובר.
3. **מנגנון סבל/איבוד/כעס?** — אין. עובר. **חריג לשמירה:** ניטור הקריסות של Sentry הוא דרישת Pillar 2 (אפליקציית ילדים חייבת יציבות). לכן שמירה על סימבוליקציית Sentry היא acceptance criterion בחבילה — לא רק "nice to have".

### Pillar 3 — Independence-Building
1. **מסוגלות בלי האפליקציה?** — N/A. עובר.
2. **קול לילד?** — N/A. עובר.
3. **בעוד 6 חודשים עדיין הכרחי?** — כן, זו דרישת-חנות מתמשכת. עובר.

**Values Check Pass:** [x] כן — בכפוף לשמירת סימבוליקציית Sentry.

---

## Goals
- release AAB של אנדרואיד עומד בדרישת Google Play "Code optimization ≥ 25%" באמצעות R8 (minify + shrink resources).
- אפס רגרסיה פונקציונלית: התחברות, RevenueCat, Sentry, ניווט, deep links — כולם עובדים ב-build המכווץ.
- סימבוליקציית Sentry נשמרת (mapping.txt עולה).

## Non-goals
- אופטימיזציית זיכרון / bitmaps (חבילה נפרדת, תלוית דוח Play Console).
- הגירת מכשיר / Restore Credentials (חבילה נפרדת).
- שינוי iOS build (הדרישה היא Google Play בלבד).

## Behavior Contract
- לאחר החבילה: `eas build --profile production --platform android` מפיק AAB עם R8 פעיל. האפליקציה עולה ורצה זהה ל-build הנוכחי, וקריסות מגיעות ל-Sentry עם stack trace קריא.

## Schema Changes
- אין.

## API / Route Changes
- אין.

## UI Changes
- אין.

## הצעת ה-diff (app.json)

```jsonc
// plugins: [...]  — מוסיפים בלוק:
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
]
```
+ התקנה: `npx expo install expo-build-properties` (מיישר לגרסה של SDK 54). **ממתין לאישור Adi.**

## Open Questions
- האם צריך `extraProguardRules` ל-RevenueCat/xlsx? — ייקבע רק מ-build אמיתי; אם ה-build הראשון נכשל, נוסיף keep-rules ממוקדות (עדיף על השבתת minify).
- האם Sentry Expo plugin מעלה mapping.txt אוטומטית ב-SDK 54, או שצריך צעד ידני? — לאמת מול דוח ה-build ומול Sentry Issues.

## Out of Scope
- iOS.
- כל אופטימיזציית זיכרון/bitmap.
- שינוי מבנה assets/תמונות.
