# play-device-migration — SPEC (spike + recommendation)

> מצב היעד לחבילה הזו. סמכותי עד שמוחלף בסשן מאוחר יותר.
> זו חבילת **spike + החלטה** — היא לא כותבת קוד ריצה; היא ממפה מסלולים וממליצה. מימוש בפועל הוא חבילת-המשך נפרדת שתאושר בנפרד (נוגעת ב-auth flow ובמודול נייטיב → אישור Adi חובה לפי CLAUDE.md).

**מקור הדרישה:** Google Play "new app quality requirements" (אוג' 2026) — Secure & seamless device migration. אפליקציה עם sign-in חייבת לתמוך ב-**Zero-Tap Sign-In restoration** במעבר מכשיר (device-to-device או cloud backup). אכיפה ~אפריל 2027. **חלון grandfather: אינטגרציית Block Store עד 30.9.2026 נחשבת תואמת.**

---

## תמצית מנהלים (Adi — קראי רק את זה)

- **להגירה אין סיכון מוצר ל-BUFF.** כל הנתונים בשרת (Supabase). מצב-ההתחברות היחיד שנשמר על המכשיר ניתן לשחזור מלא: הורה מתחבר מחדש ב-Google; ילד נכנס מחדש עם **קוד משפחה** (creds נגזרים דטרמיניסטית מ-`profiles.id`). **אושר בשטח:** איתי עבר מכשיר ונכנס — נדרש רק לשלוח את קוד המשפחה.
- מה שנשאר זה **חיכוך UX קטן** ("לשלוח את הקוד") + **תיבת-סימון של החנות** (Google בודקת אוטומטית שיש Restore Credentials/Block Store).
- **ההמלצה:** מסלול מדורג ומינימלי. עכשיו — לתעד/להקשיח את Auto Backup (config בלבד, אפס קוד נייטיב). את חבילת התאימות (Block Store) בונים **רק אם** Play Console מסמן את BUFF כלא-תואם — לא לפני. לא לבנות passkeys עכשיו.
- **דחיפות:** נמוכה. דדליין אפריל 2027; grandfather ספט' 2026 רלוונטי רק אם נבחר מסלול Block Store.

---

## Capabilities & Bottlenecks

### מה CC עשה בחבילת ה-spike הזו
- מיפה שלושה מסלולי תאימות אפשריים + אימת ישימות מול הסטאק של BUFF.
- אימת את מנגנון ה-auth בפועל (`src/utils/childAuth.ts`, `src/screens/auth/ChildJoinScreen.tsx`, `src/integrations/supabase/client.ts`).
- בדק שאין כיום שום exclusion של Auto Backup בריפו → ברירת המחדל של אנדרואיד (allowBackup=true, כולל `databases/RKStorage`) כבר בתוקף.

### מה Adi חייבת להחליט (פלט ה-spike)
- לאשר את **המסלול המומלץ** (למטה) או לבחור אחר.
- למשל: להריץ את בדיקת ה-Play Console (Device migration / onboarding) כדי לראות אם BUFF כבר מסומן תואם/לא-תואם — זה קובע אם בכלל צריך את Phase 1.

### צוואר בקבוק
- **אין מודול Expo/RN מוכן** ל-Block Store או ל-Restore Credentials. כל מסלול תאימות "אמיתי" דורש **מודול נייטיב מותאם (Kotlin, Expo Modules API) + config plugin**.
- **Restore Credentials = passkey (FIDO2)** — דורש תמיכת relying-party בצד השרת. Supabase Passkeys ב-**beta** (מאי 2026), דורש `@supabase/supabase-js ≥ 2.105.0` (BUFF על ^2.101.1), ותמיכת passkey נייטיב ב-RN עדיין לא ודאית. כבד ולא בשל.

---

## מיפוי המסלולים (הליבה של ה-spike)

| מסלול | מה זה | קוד נדרש | תואם לבדיקת Google? | סיכון/עלות | המלצה |
|---|---|---|---|---|---|
| **A. Auto Backup** | ברירת מחדל של אנדרואיד מגבה את `RKStorage` (ה-session של Supabase) ל-Google Drive (E2E). שחזור ענן במכשיר חדש מחזיר את ה-session → נחיתה מחוברת, אפס טאפים. | **אפס** (או config קטן להקשחה) | ⚠️ נותן את ה-UX, אבל **לא** ה-API שהבדיקה האוטומטית מחפשת | נמוך מאוד | ✅ **עכשיו** (הקשחה/תיעוד) |
| **B. Block Store** | מודול נייטיב מותאם ששומר את ה-refresh token של Supabase ב-Block Store; במכשיר חדש מאחזר ומאמת בשקט. | מודול נייטיב Kotlin + config plugin | ✅ תואם; **grandfather עד 30.9.2026** | בינוני (בנייה + תחזוקה) | 🟡 **רק אם** Play Console מסמן לא-תואם |
| **C. Restore Credentials** | passkey/restore-key דרך Credential Manager; שחזור אוטומטי בהקמת המכשיר. | מודול נייטיב + **תשתית passkey בצד Supabase** | ✅ המסלול ה"רשמי" של Google | גבוה (passkey RP, supabase-js upgrade, beta) | ❌ **לדחות** — לא בשל, overkill |

---

## המלצה מפורטת — מדורג ומינימלי

### Phase 0 — עכשיו (config בלבד, אפס קוד נייטיב) ✅
מטרה: להפוך את התנהגות ה-Auto Backup הקיימת מ"מקרית" ל"מכוונת ומתועדת", כדי ש-session ההורה **והילד** ישוחזרו בשחזור ענן ← zero-tap במסלול ההגירה הנפוץ.
- להחליט מפורשות: להשאיר default (כולל `RKStorage`) או להוסיף `dataExtractionRules`/backup-rules מפורשים דרך config plugin שמכלילים במפורש את `RKStorage`.
- **שיקול ילדים (Pillar 2):** ה-token מגובה מוצפן-E2E ב-Google Backup; מקובל. חובה: `clearCredentialState`/מחיקת מפתח ב-sign-out מכוון כדי לא לשחזר אחרי יציאה יזומה.
- זו חבילת-המשך קטנה ובטוחה; אפשר לצרף לחבילת R8 או להריץ בנפרד.

### Phase 1 — תאימות פורמלית (רק בהינתן טריגר) 🟡
**טריגר לבנייה:** Play Console מציג את BUFF כ**לא-תואם** בסעיף Device migration/onboarding.
- לבנות מודול נייטיב **Block Store** (פשוט מ-passkeys): `StoreBytes(refreshToken)` בהתחברות, `retrieveBytes()` באתחול מכשיר חדש → `setSession()` מול Supabase.
- אם רוצים את ה-grandfather → לסיים לפני **30.9.2026**. אחרת יש עד אפריל 2027.

### Phase 2 — Restore Credentials passkey ❌ (לדחות)
לשקול רק אם Google תפסול Block Store, **וגם** Supabase Passkeys יצא מ-beta **וגם** תהיה תמיכת passkey נייטיב ב-RN. לא עכשיו.

---

## Values Check

### Pillar 1 — Intrinsic Motivation
1. בלי תגמול וירטואלי? — N/A (תשתית auth). עובר.
2. מקרב לפרס שהילד בחר? — N/A. עובר.
3. "אני רוצה" מול "אני חייב"? — N/A. עובר.

### Pillar 2 — Positive Coaching
1. ניסוח משפיל? — אין copy. עובר.
2. empathy מול pressure? — **חיובי:** הסרת חיכוך הכניסה מיטיבה עם ילד שעבר מכשיר; אין האשמה. עובר.
3. מנגנון סבל/איבוד? — אין. עובר. **שמירה:** גיבוי token של ילד חייב הצפנה + מחיקה ב-sign-out.

### Pillar 3 — Independence-Building
1. מסוגלות בלי האפליקציה? — נייטרלי; לא יוצר תלות. עובר.
2. קול לילד? — N/A. עובר.
3. בעוד 6 חודשים הכרחי? — דרישת-חנות מתמשכת. עובר.

**Values Check Pass:** [x] כן — בכפוף להצפנה + מחיקת-token ב-sign-out בכל מסלול שמגבה credentials.

---

## Goals (של ה-spike)
- החלטה ברורה על מסלול תאימות, עם טריגר מוגדר למתי בונים.
- אפס בנייה מיותרת לפני הצורך (BUFF pre-launch; "no architecture beyond scope").

## Non-goals
- מימוש מודול נייטיב כלשהו בחבילה הזו.
- שדרוג supabase-js או הפעלת passkeys.
- שינוי מנגנון ChildJoin (עובד).

## Open Questions → כולן סגורות ל-spike
- *האם המשתמש ננעל בהגירה?* → **לא.** שחזור מלא דרך ChildJoin/OAuth; אושר בשטח (איתי).
- *האם צריך passkeys?* → **לא עכשיו.** beta + לא בשל ב-RN.
- *מה המסלול הזול לתאימות?* → **Block Store** (Phase 1), רק אם Play Console דורש.

## Out of Scope
- iOS.
- אופטימיזציית זיכרון/R8 (חבילות נפרדות).

## מקורות
- Restore Credentials implementation (developer.android.com/identity/sign-in/restore-credentials-implementation) — restore-key = passkey/FIDO2.
- Supabase Passkeys (beta, מאי 2026; supabase-js ≥2.105.0).
- Play Console technical quality requirements (answer 17492799).
- קוד BUFF: `src/utils/childAuth.ts`, `src/screens/auth/ChildJoinScreen.tsx`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/authStorage.ts`.
