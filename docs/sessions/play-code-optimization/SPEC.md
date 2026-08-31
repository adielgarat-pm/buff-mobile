# play-code-optimization — SPEC

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> מנצח על canonical docs במהלך החבילה; canonical docs מתעדכנים בסוף לפי SPEC_SYNC.md.

**מקור הדרישה:** Google Play "new app quality requirements" (הודעה אוג' 2026 — Android Developers Blog). דרישת **Code optimization**: כל AAB חייב כיסוי מינימלי של **25%** על shrinking / optimization / obfuscation (R8 או כלי שקול). אכיפה ~פבר' 2027; אי-עמידה → הפחתת visibility ויכולת פרסום בחנות. (מקור לאימות עצמאי של הדדליין: עמוד Help "Play Console technical quality requirements", answer 17492799.)

**סטטוס תכנון:** עבר ריוויו ארכיטקטורה (סוכן Plan) + אימות מפתחות מול תיעוד Expo/Sentry. **אין Open Questions טכניות פתוחות.** ממתין רק לאישור Adi להתקנה + החלת ה-diff.

---

## Capabilities & Bottlenecks

### מה Claude Code (CC) יעשה
- מוסיף ומגדיר את הפלאגין `expo-build-properties` ב-`app.json` — מפעיל R8 (minify) + resource-shrinking ב-release build של אנדרואיד.
- מוסיף ל-בלוק הפלאגין הקיים של Sentry (`@sentry/react-native/expo`) את `experimental_android.enableAndroidGradlePlugin` + `autoUploadProguardMapping` — כדי שקובץ ה-`mapping.txt` של R8 יעלה אוטומטית ל-Sentry.
- מריץ JS-sanity בלבד (typecheck + Jest) — **אלה לא בודקים R8** (ראה Exit Criteria).
- כותב exit deliverables (STATUS row, עדכון canonical לפי SPEC_SYNC, learnings).

### מה Adi חייבת לעשות בעצמה
- **לאשר התקנת תלות חדשה:** `expo-build-properties` (Improvement Package — כלל CLAUDE.md).
- להריץ / לאשר **EAS production build** (AAB) — הדרך היחידה לאמת ש-R8 לא שובר build ושהוא באמת רץ.
- להתקין את ה-AAB על מכשיר/אמולטור ולעשות את ה-smoke test (רשימה למטה).
- לוודא ב-Play Console שסעיף Code optimization עובר לירוק (≥25%).

### צוואר בקבוק / נקודות עצירה צפויות
- **R8 עלול לשבור release build או להפיל בזמן ריצה בשקט** — מחלקות שספריות נייטיב טוענות ברפלקציה עלולות להיחתך. זה מתגלה **רק ב-build אמיתי**, לא בבדיקות שרצות ב-CI/מקומית.
- **סימבוליקציית קריסות עלולה להידרדר בשקט** — ראה §Sentry. זו דרישת Pillar 2 (יציבות אפליקציית ילדים), לכן acceptance criterion.
- אין `android/` בריפו (managed workflow) — כל שליטת ה-build דרך `expo-build-properties`/config plugins בלבד; אין gradle.properties לערוך ידנית, ואין `res/raw/keep.xml` אלא דרך config plugin.

---

## Values Check

> חבילת תשתית/build — אין משטח משתמש, אין copy, אין מנגנון BUDDY. 9 השאלות נענות טריוויאלית "עובר", עם חריג-שמירה אחד ל-Pillar 2.

### Pillar 1 — Intrinsic Motivation
1. בלי תגמול וירטואלי? — N/A (build פנימי). עובר.
2. מקרב לפרס שהילד בחר? — N/A. עובר.
3. "אני רוצה" מול "אני חייב"? — N/A. עובר.

### Pillar 2 — Positive Coaching
1. ניסוח משפיל/משווה/כשל? — אין copy. עובר.
2. empathy מול pressure בכישלון? — N/A. עובר.
3. מנגנון סבל/איבוד/כעס? — אין. עובר. **חריג-שמירה:** ניטור קריסות Sentry = דרישת Pillar 2 (יציבות). שמירה על סימבוליקציה מלאה (JS + native) היא acceptance criterion, לא nice-to-have.

### Pillar 3 — Independence-Building
1. מסוגלות בלי האפליקציה? — N/A. עובר.
2. קול לילד? — N/A. עובר.
3. בעוד 6 חודשים עדיין הכרחי? — כן, דרישת-חנות מתמשכת. עובר.

**Values Check Pass:** [x] כן — בכפוף לשמירת סימבוליקציית Sentry (JS source maps + native mapping.txt).

---

## Goals
- release AAB של אנדרואיד עומד בדרישת Google Play "Code optimization ≥ 25%" באמצעות R8 (minify + shrinkResources).
- אפס רגרסיה פונקציונלית: התחברות (הורה OAuth + ChildJoin), RevenueCat Paywall, ניווט, deep links, notifications, splash/adaptive-icon, fonts — כולם עובדים ב-build המכווץ.
- **שני** ארטיפקטי סימבוליקציה נשמרים ל-release החדש: Hermes source maps (frames של JS) + R8 `mapping.txt` (frames נייטיב).

## Non-goals
- אופטימיזציית זיכרון / bitmaps (חבילה נפרדת, תלוית דוח Play Console).
- הגירת מכשיר / Restore Credentials (חבילה נפרדת).
- שינוי iOS build (הדרישה היא Google Play בלבד).

## Behavior Contract
לאחר החבילה: `eas build --profile production --platform android` מפיק AAB עם R8 פעיל (minify + shrinkResources). האפליקציה עולה ורצה זהה ל-build הנוכחי. קריסות JS מגיעות ל-Sentry עם stack trace קריא (source maps), וקריסות נייטיב מגיעות עם stack trace קריא (mapping.txt).

## Schema Changes
- אין.

## API / Route Changes
- אין.

## UI Changes
- אין.

---

## הצעת ה-diff (app.json) — ממתין לאישור Adi

**(1) מוסיפים פלאגין `expo-build-properties`** ל-`plugins`:

```jsonc
[
  "expo-build-properties",
  {
    "android": {
      "enableMinifyInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
]
```

> הערת גרסה: ב-Expo SDK 54 המפתח הישן `enableProguardInReleaseBuilds` **הוחלף** ב-`enableMinifyInReleaseBuilds` (שניהם מפעילים R8 עם `minifyEnabled true`; משתמשים בחדש). `enableShrinkResourcesInReleaseBuilds` **חייב** להיות עם minify פעיל (AGP דורש את הזיווג — ה-diff מקיים זאת). `enablePngCrunchInReleaseBuilds` כבר default=true, אין צורך להוסיף.

**(2) מרחיבים את בלוק הפלאגין הקיים של Sentry** (app.json:83-90) כדי להעלות את mapping.txt:

```jsonc
[
  "@sentry/react-native/expo",
  {
    "url": "https://sentry.io/",
    "organization": "buffadhd",
    "project": "react-native",
    "experimental_android": {
      "enableAndroidGradlePlugin": true,
      "autoUploadProguardMapping": true
    }
  }
]
```

**(3) התקנה:** `npx expo install expo-build-properties` (מיישר לגרסת SDK 54). **ממתין לאישור Adi.**

---

## Sentry symbolication — סיפור סגור (לא Open Question)

- הפעלת R8 היא מה ש**מפעיל לראשונה** את נתיב העלאת ה-`mapping.txt` של ה-Sentry Android Gradle Plugin — לפני החבילה הזו לא היה בכלל mapping.txt מכיוון שלא היה minify.
- **תלות build-time:** ההעלאה דורשת `SENTRY_AUTH_TOKEN`. הוא כבר קיים כ-**EAS secret מסוג Secret** (id `da05ed42`), build-only. שים לב: `eas.json` (production env) מגדיר `SENTRY_ORG`/`SENTRY_PROJECT` אבל **לא** את הטוקן — הטוקן מוזרק כ-secret, לא מ-eas.json. אין צורך בשינוי eas.json.
- **שני ארטיפקטים, שני נתיבים, שתי בדיקות:**
  1. **JS frames** (רוב הקריסות של BUFF — האפליקציה כמעט כולה React/TS ב-Hermes) → **Hermes source maps**, מועלים אוטומטית מאז SDK 50 + Sentry 5.16 (נתיב ה-JS bundle). R8 **לא** נוגע בהם.
  2. **Native frames** → **R8 `mapping.txt`**, מועלה ע"י SAGP רק כשה-minify פעיל (מה שהחבילה מדליקה).
- **אזהרה שה-SPEC סוגר:** `mapping.txt` **לא** הופך קריסות JS לקריאות, ו-source maps **לא** הופכים קריסות נייטיב לקריאות. חייבים לוודא ש**שניהם** נחתו ל-release החדש, אחרת אפשר "לתקן" אחד ולפספס רגרסיה בשני.

---

## Keep-rules reality (מה שכבר מכוסה, ומה ה-fallback)

R8 מכווץ **רק** bytecode של Java/Kotlin — **לא** את חבילת ה-JS/Hermes. לכן ספריות JS-only (xlsx/SheetJS, supabase-js, react-i18next וכו') **אינן** בסיכון R8 ואי אפשר/אין צורך ב-keep-rule עבורן.

ספריות נייטיב — כולן משלחות consumer ProGuard rules שמוחלות אוטומטית תחת managed prebuild:
- **React Native core + Hermes + fbjni/JNI** — consumer rules ב-`react-native/ReactAndroid` (שומרים `@DoNotStrip`, `@ReactModule`, native methods). בטוח.
- **react-native-svg** — consumer `proguard-rules.pro`. סיכון נמוך.
- **@sentry/react-native** — consumer rules ב-AAR. בטוח.
- **react-native-purchases (RevenueCat)** — keep-rules רחבים (`-keep class com.revenuecat.**`) ב-AAR הבסיסי; משתמש ברפלקציה, לכן הכללים רחבים בכוונה. **נתיב ה-smoke החשוב ביותר** (Paylwall). ⚠️ יש באג ידוע של התנגשות גרסאות R8/AGP מול `react-native-purchases-ui` בגרסאות AGP ישנות — SDK 54 מביא AGP חדש ולכן צפוי תקין; אם ה-build נכשל על R8 dependency resolution, זה החשוד הראשון (mitigation: כפיית גרסת R8, לא השבתת minify).

**ה-fallback היחיד המותר לכל keep-rule נדרש:** `extraProguardRules: "<rules>"` באותו בלוק `android` של `expo-build-properties`. **לעולם לא** להשבית minify כדי "לתקן".

---

## Resource-shrink blind spot (checks חובה)

`shrinkResources` מסיר resources שהוא לא רואה שמוזכרים בקוד/XML. משאבים שנטענים ב-runtime לפי **שם מחרוזתי** עלולים להיחתך → קריסת "resource not found" ש-smoke ברמת JS עלול לא לתפוס. לכן ה-smoke חייב לכלול ויזואלית:
- **notification icon** מוצג נכון (app.json:77/93).
- **splash** ו-**adaptive icon** מרונדרים (app.json:20-24, 39-42).
- **fonts** (רשומים דרך `expo-font`) נטענים.
- **ה-escape hatch** אם משאב נחתך: `res/raw/keep.xml` עם `tools:keep` / `shrinkMode="strict"` — ב-managed workflow זה דורש config plugin קטן (אין `android/` לערוך ידנית). לתעד אם נדרש; לא צפוי לרוב הנכסים כי הם מחווטים דרך Expo config.

---

## OTA / runtimeVersion — עובדה תפעולית

`app.json` משתמש ב-`runtimeVersion.policy: "fingerprint"` ו-OTA מופעל. הוספת הפלאגין ושינוי דגלי ה-build **משנים את ה-fingerprint** → runtimeVersion חדש. משמעות:
- חובה לשלוח **binary production טרי** (AAB חדש) — OTA לבדו לא מספיק.
- ערוצי OTA (preview/production) יתיישרו מחדש ל-fingerprint החדש. אין רגרסיה, אבל **לבדוק deep links/ניווט על ה-build הטרי**, לא מול runtime ישן.

---

## Exit Criteria (מדיד — לא "האפליקציה עולה")

1. **EAS production build מצליח** עם הדגלים החדשים (build לא נכשל על R8/AGP).
2. **Play Console → Code optimization ≥ 25% / ירוק** אחרי העלאת ה-AAB.
3. **דלתא בגודל AAB מתועדת** — build שבו R8 "לא עשה כלום" עדיין "רץ" אבל נכשל בדרישה; ירידת גודל היא הסיגנל האמיתי שה-R8 פעל.
4. **Smoke על ה-build הטרי:** התחברות הורה (OAuth) + ChildJoin, RevenueCat Paywall נפתח, notifications+icon, splash/adaptive-icon, fonts, deep link `buffadhd.com/join`.
5. **Sentry:** ל-release/dist החדש מצורף ארטיפקט **mapping** (native), וקריסת-בדיקת JS **וגם** קריסת-בדיקה נייטיב מסמבלקות. 
6. `typecheck` + `jest` ירוקים (JS-sanity — **מסומן במפורש שאינו בודק R8**).

---

## Out of Scope
- iOS.
- כל אופטימיזציית זיכרון/bitmap.
- שינוי מבנה assets/תמונות.
