# BUFF — Manual Test Playbook

> **המסמך המרכזי** של בדיקות ידניות ב-BUFF. כל מה שאת חייבת להריץ בעצמך — ידני, על מכשיר אמיתי או אמולטור — מרוכז כאן.
> מה שאני (CC) יכול לכסות באוטומציה או ב-Expo web preview — מתויג בכובע אחר, ואת מדלגת.
> מה ששינתה חבילה אחרונה — מסומן ב-`§ Delta Rules`, ושם מוצעת רשימת ריצה ייעודית לפי מה שזז בגיט.

**נוצר:** 2026-05-16
**מתחזק:** CC מעדכן בכל סגירת חבילה שמשנה התנהגות נצפית. את ממלאת תוצאות אחרי כל ריצה.
**מקור 12 ה-flows:** `BUFF_GAP_ANALYSIS.md` §"קריטריון 'מוכן לפרודקשן'" + Track 6 בbeta-2026-06-01 (commit `e5dc1f7`, לא ב-main כרגע).

---

## ⚡ Quick refs

- 🔧 [Emulator setup — 3 דרכים](#emulator-setup) — תזכורת בכל ריצה
- 🎩 [3 הכובעים — מה אני מכסה / מה את חייבת](#3-hats)
- 👤 [Test Accounts Inventory](#test-accounts)
- 📋 [Scenarios Index](#scenarios-index)
- 🎯 [Delta Rules — מה לרוץ אחרי שינוי](#delta-rules)
- ✍️ [Live Sign-off — הריצה הנוכחית](#sign-off)

---

<a name="emulator-setup"></a>
## 🔧 Emulator setup — 3 דרכים

> תזכורת מלאה בכל פעם. את ביקשת. אל תוותרי על הסעיף הזה.

### Path A — Expo dev mode (הכי מהיר, לקוד תוך-כדי-פיתוח)

**מתי להשתמש:** בודקת קוד שעדיין לא נבנה כ-AAB. מתאים ל-PRs שלא מבשילים עוד.

1. **הפעלת האמולטור:**
   - פתחי Android Studio → AVD Manager (אייקון של טלפון עם 🔧)
   - בחרי `Pixel_7` (או ה-AVD שיש לך) → לחצי ▶ Play
   - חכי שהאמולטור עולה מלא (Home screen + שעון נראה)
2. **הפעלת Metro + טעינת האפליקציה:**
   - ב-PowerShell, בתיקיית הריפו: `npx expo start --android`
   - אם זה תקוע ב-"Loading", השתמשי ב-`npx expo start --android --clear` (מנקה cache)
3. **רענון מהיר:** ב-terminal של Metro לחצי `r`. או ב-emulator: `Ctrl+M` ואז Reload.
4. **דיבוג:** ב-emulator `Ctrl+M` → "Debug" → פותח Chrome DevTools.

### Path B — מכשיר אמיתי דרך USB (Adi/Itay phone)

**מתי להשתמש:** רוצה לבדוק על מסך אמיתי, מבחני touch, OAuth אמיתי, Hebrew RTL מדויק.

1. **הכנת המכשיר (פעם אחת):**
   - Settings → About phone → לחצי 7 פעמים על "Build number" כדי לפתוח Developer options
   - Settings → Developer options → USB debugging **ON**
2. **חיבור:**
   - חברי טלפון ל-PC ב-USB. אם צץ דיאלוג "Allow USB debugging?" — Allow + "Always allow from this computer".
   - ודאי שזיהה: `adb devices` — צריך לראות serial number, לא "unauthorized".
3. **הרצה:**
   - `npx expo start` → לחצי `a` ב-terminal → נטען על הטלפון.

### Path C — התקנת AAB אמיתי (regression על production build)

**מתי להשתמש:** לקראת Play Store upload. בודקת את הbuild שיוצא לסטור, לא קוד dev.

1. **השגת ה-AAB:** EAS Build artifact (כרגע `2d91bc38-...` v8 או `9e0af79f-...` v9, פג תוקף 2026-06-15).
2. **המרה ל-APK להתקנה:**
   ```powershell
   bundletool build-apks --bundle=app.aab --output=app.apks --mode=universal
   ```
3. **חילוץ ה-APK הuniversal** מתוך ה-`.apks` (זה zip; שמרי את ה-`universal.apk`).
4. **התקנה:**
   - מכשיר/אמולטור מחובר: `adb install -r universal.apk`
   - (ה-`-r` מחליף גרסה קיימת אם יש)
5. **הפעלה:** מ-app drawer של המכשיר. **לא דרך Expo Metro** — זה כל הפואנטה של Path C.

### Common failures & fixes

| תסמין | תיקון |
|---|---|
| `adb: no devices` | `adb kill-server; adb start-server`. נתקי וחברי USB. |
| Metro תקוע על "Loading" | `npx expo start --clear` (מנקה cache) |
| Metro על port אחר | אם 8081 תפוס: `npx expo start --port 8082` |
| OAuth נופל באמולטור | האמולטור לפעמים חסר Google Play Services. תעברי ל-Path B (מכשיר אמיתי). |
| Hebrew לא התהפך RTL | Force-quit האפליקציה (Recents → swipe up) → פתחי מחדש. RN cache-ing direction. |
| `adb` לא מוכר ב-PowerShell | הוסיפי ל-PATH: `C:\Users\<user>\AppData\Local\Android\Sdk\platform-tools` |
| "App not installed" כשמתקינים APK | חתימה שונה מהגרסה הקיימת. `adb uninstall com.buff.app` (או שם החבילה), ואז install נקי. |

### Useful adb commands תוך כדי בדיקה

```powershell
adb logcat | Select-String "buff"     # רואים JS errors בזמן אמת
adb shell pm list packages | findstr buff   # מוודאת שהאפליקציה מותקנת
adb shell am force-stop com.buff.app  # סגירה כפויה, useful לבדיקת cold start
adb shell input keyevent KEYCODE_HOME # שולח Home, בודקת background behavior
```

---

<a name="3-hats"></a>
## 🎩 3 הכובעים — מה אני מכסה ומה את חייבת

> פילוסופיה: לא תבזבזי זמן על מה שאני יכול לוודא בעצמי. נשמור את הזמן שלך לדברים שרק את יכולה.

### 🤖 Hat 1 — Automated / static (CC מכסה, את מדלגת)

**מה זה:** דברים שאני רץ אוטומטית בכל סגירת פאזה, או יכול לבדוק דרך MCP/CLI.

**כיסוי היום:**
- ✅ `expo-doctor` clean (17/17 pass) — נסגר ב-pkg/expo-health-and-eas-android Phase 1
- ✅ TypeScript typecheck — `npx tsc --noEmit`
- ✅ Supabase schema sanity — `mcp__supabase__list_tables`, `list_migrations`
- ✅ SQL queries לאימות seed/state — `mcp__supabase__execute_sql`
- ✅ Sentry config code review — beforeSend scrubbers, DSN config
- ✅ BUDDY V0.5 cron job — `SELECT * FROM cron.job_run_details` דרך MCP
- ✅ Lifetime cohort grants — `SELECT * FROM pending_lifetime_grants` דרך MCP

**מה לא בכיסוי האוטומטי היום (גאפ אמיתי):**
- ❌ אין Jest tests כתובים (התשתית מותקנת, אבל אפס בדיקות נכתבו)
- ❌ אין Detox / Maestro E2E
- ❌ אין lint pipeline אוטומטי שרץ ב-CI
- ❌ אין visual regression (Storybook screenshots)

> **לאן זה הולך:** הקמת Jest tests בסיסיים זו חבילה עתידית (`pkg/automated-test-foundation`). עד שהיא תקרה — הכובע הזה דק.

---

### 🌐 Hat 2 — CC manual via web preview (אני יכול לבדוק לבד, את מאשרת אם אני בספק)

**מה זה:** מריץ `npm run web` + משתמש ב-Claude_Preview MCP tools (screenshots, clicks, fills, console logs). זה ה"דרך שלי לוודא ידני" לפני שאני מבקש ממך לבדוק.

**מה אני מצליח לכסות:**
- Navigation בסיסי — תפריט, tab bar רנדר, מעבר מסכים
- Hebrew strings טוענים (פונט נכון, לא תיבות)
- Onboarding לא קורס בין steps
- כפתורים מגיבים, טפסים נשלחים, error states מופיעים
- Theme switch ברמת CSS — Pastel ↔ Gamer
- Component rendering — מיקום, צבעים, גדלים (ברמה כללית)
- Console errors / warnings (קונסול נקי)

**מה Web Preview *לא* יודע לעשות נכון** (גם אם נראה שהוא עבד, אל תסמכי על האימות שלי):
- Native date picker — באנדרואיד זה native modal, באינטרנט זה fallback
- Google OAuth — באינטרנט זה web flow, באנדרואיד זה Google Play Services
- Push notifications — לא קיימות בweb
- RTL — react-native-web מטפל ב-RTL שונה מאשר native
- Animations - performance שונה לחלוטין
- Bottom sheets / system gestures
- אורך bundle, cold start time — לא רלוונטי בweb
- Memory / battery — לא רלוונטי בweb

> **כלל אצבע:** אם בדקתי ב-Hat 2 ו-יש לי אישור 🤔 (uncertain), זה דורש ממך בדיקה ב-Hat 3 גם כן. אם ב-Hat 2 הכל ✅ ברור, את יכולה לדלג על הסעיף הספציפי.

---

### 👁 Hat 3 — Adi only (רק את יכולה)

**מה זה:** דברים שאני באמת לא יכול להגיע אליהם. את חייבת מכשיר אמיתי או אמולטור פעיל + עיניים אנושיות.

**מה זה כולל:**
- **Native date picker behavior** — F-2026-05-03-01. רק על אנדרואיד באמת מתנהג נכון.
- **Google OAuth on installed AAB** — D-2026-04-28. רק על production build.
- **Push notifications** — מופיעות במגש מערכת? צליל? בנוף השכבה?
- **Hebrew RTL on Android** — react-native-web ≠ native RN
- **Tab bar visuals** — צבע, מיקום, האם נעלם בלחיצה
- **Real device performance** — cold start time, animations חלקות, גלילה חלקה
- **Touch gestures** — swipe, long press, drag-and-drop, double tap
- **Camera, mic, photo picker, gallery**
- **Bluetooth, Sensors, Background work**
- **Cohort-flagged account experience** — איך זה מרגיש למשתמש שיש לו `is_lifetime_access = true`
- **Sentry events arriving** — את הgisterת לdashboard ויש לך גישה, אני לא
- **Reading the room** — האם זה "מרגיש" כיף? האם זה מבלבל? (עיניים אנושיות)
- **Itay testing** — בן 15 ש-co-creator. עיני נוער.

---

<a name="test-accounts"></a>
## 👤 Test Accounts Inventory

> מקור אחד של אמת: איזה חשבון לאיזה תרחיש.

| Account label | Role | Family | Theme | Lifetime flag | Use for |
|---|---|---|---|---|---|
| `parent-main` (החשבון הראשי שלך) | Parent | family A | Pastel | N | רוב flows הורה, family overview |
| `teen-itay` | Teen 15 | family A | Gamer | N | T-1..T-4, CC-1 theme switch על מכשיר Teen |
| `child-emi` (או child test profile) | Child 9 | family A | Pastel | N | C-1..C-4, Pause Mode child UI |
| `parent-fresh-<n>` (Gmail חדש פר ריצה) | Parent | new code | Pastel | N | P-1 onboarding — חייב להיות חשבון חדש לחלוטין |
| `parent-cohort-test` | Parent | cohort family | Pastel | Y | CC-4 lifetime bypass |
| `child-stale` (DB-seeded `last_active_at = 4d ago`) | Child | family A | Pastel | N | C-5 Welcome Back trigger |
| `child-buddy-l2` (DB-seeded 3 successful days) | Child | family A | Pastel | N | P-4 BUDDY booster trigger |

### חוקי שימוש

- **Onboarding** (P-1) חייב חשבון `parent-fresh` חדש כל ריצה. או:
  - א) מחקי את החשבון הקודם ב-Supabase Auth + Tables לפני ריצה חדשה
  - ב) צרי Gmail חדש (יש לך ~3 burner emails לפי הזיכרון)
  - ג) קשרי איתי דרך chat והרצי `delete from auth.users where email = '...'` דרך MCP. 30 שניות.
- **Lifetime cohort** — אל תשתמשי באחד מ-24 הcohort האמיתיים. צרי חשבון נפרד `parent-cohort-test` ועלייה את הדגל ידנית.
- **DB-seeded states** — אני מריץ את ה-UPDATE/INSERT דרך Supabase MCP, אחרי שאת אומרת לי מה למלא. 30 שניות.

### Setup helpers — מה אני יכול להריץ ב-30 שניות

```sql
-- Reset child to "4 days ago last active"
UPDATE profiles SET last_active_at = NOW() - INTERVAL '4 days' WHERE id = '<child_id>';

-- Seed buddy at L2 with 3 successful days
INSERT INTO buddy_daily_check (child_id, day, completion_rate)
SELECT '<child_id>', NOW() - (n || ' days')::INTERVAL, 0.75
FROM generate_series(1,3) n;
UPDATE buddy_relationships SET friendship_level = 2 WHERE child_id = '<child_id>';

-- Apply lifetime flag to a test account
UPDATE profiles SET is_lifetime_access = TRUE WHERE id = '<parent_id>';
```

---

<a name="scenarios-index"></a>
## 📋 Scenarios Index

> כל תרחיש = שורה. עמודת "Hat" = מי אחראי לוודא. "Last run" + "Result" = הסטטוס המעודכן.

| # | Scenario | Persona | Hat | Last run (commit) | Last result | Notes |
|---|---|---|---|---|---|---|
| **Parent flows** |  |  |  |  |  |  |
| P-1 | Parent onboarding (fresh acct) | Parent | 3 | — | ⬜ | F-2026-05-03-01 close — native date picker |
| P-2 | Family overview render | Parent | 2+3 | — | ⬜ | |
| P-3 | Pause Mode toggle | Parent | 2+3 | — | ⬜ | shipped PRs #22-25 |
| P-4 | BUDDY booster proposal | Parent | 1+3 | — | ⬜ | DB-seeded child-buddy-l2; cron must fire |
| P-5 | Reward fulfillment | Parent | 3 | — | ⬜ | |
| **Child 6-12 flows** |  |  |  |  |  |  |
| C-1 | Child first open (Pastel) | Child | 3 | — | ⬜ | depends on `lucid-sinoussi` for orphan claim |
| C-2 | Daily Win Bonus celebration | Child | 3 | — | ⬜ | GAP P-07 partial — branding hookup pending |
| C-3 | Vibe Check + Low Power | Child | 3 | — | ⬜ | depends on `pkg/daily-vibe-check` |
| C-4 | Reward redemption | Child | 3 | — | ⬜ | |
| C-5 | Welcome Back 3+ days | Child | 1+3 | — | ⬜ | DB-seeded child-stale |
| **Teen flows** |  |  |  |  |  |  |
| T-1 | Teen onboarding choice (Buddy y/n) | Teen | 3 | — | ⬜ | depends on Stitch 08 + `pkg/teen-ui-with-buddy-bundle` |
| T-2 | Teen no-Buddy dashboard (5B) | Teen | 2+3 | — | ⬜ | PR #28 base shipped |
| T-3 | Teen with-Buddy dashboard (5A) | Teen | 3 | — | ⬜ | depends on `pkg/teen-ui-with-buddy-bundle` |
| T-4 | Settings variant toggle | Teen | 2+3 | — | ⬜ | depends on Stitch 07 |
| **Cross-cutting** |  |  |  |  |  |  |
| CC-1 | Theme switch (tab bar stays) | Cross | 2+3 | — | ⬜ | PR #41 shipped — pending Adi Android verify |
| CC-2 | Child no-paywall CTAs | Cross | 2+3 | — | ⬜ | PR #40 shipped |
| CC-3 | Hebrew RTL | Cross | 3 | — | ⬜ | F-2026-05-16-01 — date format hardcoded en-GB |
| CC-4 | Lifetime access bypass | Cross | 1+3 | — | ⬜ | depends on Track 5 cohort flag flip |
| CC-5 | Google OAuth on AAB | Cross | 3 | — | ⬜ | D-2026-04-28 |
| CC-6 | i18n completeness | Cross | 2+3 | — | ⬜ | walk-through Hebrew |
| CC-7 | Offline mode | Cross | 3 | — | ⬜ | PRD §9.3 NFR |
| **Infrastructure** |  |  |  |  |  |  |
| S-1 | Sentry capture + PII discipline | Infra | 1+3 | — | ⬜ | `pkg/sentry-crash-monitoring` paused mid-phase-4 |

**Result codes:**
- ✅ pass · ❌ fail · ⚠️ blocked · 🤔 I'm uncertain (need second look) · ⏭️ skipped-no-change-since-last-pass · ⬜ never run

---

## 📜 Per-Scenario Test Cases

> כל תרחיש: Setup → Steps → Pass criteria → Hat per step → Known issues.
> שלבים מתויגים `[Hat-1]` / `[Hat-2]` / `[Hat-3]` כדי שתדעי מי אחראי.

### P-1 — Parent onboarding (fresh account)

**Hat:** 3 (Adi only — native date picker + Google OAuth)
**Setup:** Fresh install על מכשיר/אמולטור שלא ראה BUFF. Google account חדש לחלוטין.

**Steps:**
1. השקה → Splash → "Sign up / Get started" [Hat-3]
2. Google OAuth → אישור הרשאות [Hat-3 — חייב מכשיר אמיתי או AAB]
3. Family creation → קוד משפחה מוצג [Hat-2 + Hat-3]
4. UStep1 Child Profile: שם ילד + תאריך לידה → **native date picker** נפתח (F-2026-05-03-01 close) [Hat-3]
5. תאריך "19 Oct 1998" מוצג בפורמט הצפוי [Hat-3]
6. UStep2 Goal — בחירת מטרה ראשית [Hat-2 + Hat-3]
7. UStep3 Challenges — multi-select, התוכן נגלל [Hat-3 — ScrollView fix]
8. UStep4/5 — Preview/Confirm [Hat-2]
9. נחיתה ב-Parent Dashboard [Hat-2 + Hat-3]

**Pass criteria:**
- [ ] כל 5 השלבים בלי crash
- [ ] Date picker = native modal (לא text input)
- [ ] תאריך מוצג בפורמט "19 Oct 1998" על הכפתור
- [ ] Profile נוצר ב-Supabase `profiles` עם `user_id IS NULL` (orphan — מחכה לילד)
- [ ] Parent Dashboard רנדר תוך 2s (PRD §9.3)
- [ ] משימות מוצגות תואמות לstage שנבחר

**Known limitations (don't fail beta on these):**
- 🚩 F-2026-05-16-01 — שמות חודשים hardcoded ל-en-GB גם בעברית
- 🚩 Step 2/3 option dedup partial — צייני אם רואה דופליקטים גלויים

---

### P-2 — Family overview render

**Hat:** 2 + 3
**Setup:** Parent מחובר (parent-main), יש לפחות child אחד פעיל במשפחה.

**Steps:**
1. Login as parent → Dashboard [Hat-2]
2. ניווט ל-Family Overview [Hat-2]
3. כל הילדים במשפחה מוצגים [Hat-2 — אני יכול לוודא ב-web preview]
4. כל child card מציג: name, BUFFs balance, streak, last activity [Hat-3 — visual]
5. תפריט Action מופיע לכל ילד (Award DWB, Pause, etc) [Hat-3]

**Pass criteria:**
- [ ] כל הילדים נטענים (לא חסרים)
- [ ] Stats מעודכנים מ-DB (אני יכול לוודא דרך MCP cross-check)
- [ ] Actions פעילות
- [ ] Pull-to-refresh עובד [Hat-3]

---

### P-3 — Pause Mode toggle

**Hat:** 2 + 3
**Status:** ✅ shipped via PR #22-25 — regression only.

**Setup:** Family עם משימות פעילות. Child signed in on second device.

**Steps:**
1. Parent: Family Settings → Pause Mode toggle [Hat-2]
2. Toggle ON → confirmation "Pause everything for the family?" [Hat-2]
3. Confirm [Hat-2]
4. Child opens app → Pause banner מופיע: "Family is on pause" [Hat-3 — visual on real device]
5. Tasks hidden, BUDDY במצב **resting** (לא sad — BUFF_VALUES Pillar 2) [Hat-3]
6. Parent: toggle OFF → resume confirmation [Hat-2]
7. Child opens → Welcome Back modal (Flow 11 אם 3+ ימים, או "Welcome back" קטן) [Hat-3]

**Pass criteria:**
- [ ] Pause פעיל תוך 2s
- [ ] Banner מופיע מיד בילד
- [ ] Task taps disabled (no errors, גם)
- [ ] BUDDY visual = resting (לא sad — Values Check)
- [ ] Resume משחזר משימות

---

### P-4 — BUDDY booster proposal (after 3 successful days)

**Hat:** 1 + 3
**Setup:** child-buddy-l2 (DB-seeded 3 successful days @ 70%+ via SQL above).

**Steps:**
1. [Hat-1] CC מאמת ש-EOD pg_cron עבד: `SELECT * FROM cron.job_run_details WHERE jobname = 'buddy_eod' ORDER BY end_time DESC LIMIT 5`
2. [Hat-1] CC מאמת `friendship_level` עלה ל-2 ב-`buddy_relationships`
3. [Hat-3] Child פותח אפליקציה בבוקר → toast/modal: "Your buddy has a gift!"
4. [Hat-3] Tap → Theme Color picker
5. [Hat-3] בחירה → צבע מוחל מיידית על UI
6. [Hat-1] CC מאמת row חדש ב-`buddy_gifts_history`

**Pass criteria:**
- [ ] cron fire אוטומטי (אני מוודא)
- [ ] friendship_level increment נכון (אני מוודא)
- [ ] Gift toast מופיע (את)
- [ ] Theme color persists בין sessions (את)
- [ ] History row created (אני מוודא)

---

### P-5 — Reward fulfillment (parent side)

**Hat:** 3
**Setup:** ילד redeemed reward (אחרי C-4). Parent מחובר.

**Steps:**
1. Parent מקבל notification "Itay redeemed Movie Night" [Hat-3]
2. Parent: Rewards queue → pending row [Hat-2]
3. Mark as fulfilled [Hat-2 + Hat-3]
4. Child sees confirmation "Movie Night confirmed by parent" [Hat-3]

**Pass criteria:**
- [ ] Notification arrived within 30s (parent side)
- [ ] Reward queue updates
- [ ] Child confirmation visible

---

### C-1 — Child 6-12 opens (Pastel)

**Hat:** 3
**Setup:** Child profile exists from P-1 (orphan עם user_id IS NULL). Child signs in via family code on second device.

**Steps:**
1. Fresh sign-in screen → "I'm a child" / family code entry [Hat-3]
2. Enter family code from P-1 + child name [Hat-3]
3. אם `lucid-sinoussi` shipped → ChildJoin **claims** the orphan (לא יוצר duplicate) [Hat-1 — אני מוודא ב-DB]
4. נחיתה ב-Child Dashboard (Pastel — default 6-12) [Hat-3]
5. BUDDY visible (egg/hatchling/scout/guardian לפי stage) [Hat-3]
6. Today's tasks visible — clear, one focus per row [Hat-3]
7. Tap task → completion flow → submit [Hat-3]
8. Parent sees pending approval [Hat-3]

**Pass criteria:**
- [ ] No duplicate profile (single `user_id IS NOT NULL` row matching name + family_id) — אני מוודא ב-MCP
- [ ] BUDDY רנדר בstage נכון
- [ ] משימות ADHD-friendly (אחת בכל פעם, אין overload)
- [ ] Submit מגיע ל-backend (אני מוודא)
- [ ] BUFFs balance מעודכן אם auto-credit או אחרי parent approval

**Known limitations:**
- 🚩 IN-2026-05-14-03 — אם `lucid-sinoussi` לא ship-ed, יווצר duplicate profile. Flag, don't fail.

---

### C-2 — Daily Win Bonus celebration

**Hat:** 3
**Setup:** ילד השלים לפחות משימה אחת היום. Parent ב-Family Overview.

**Steps:**
1. Parent: Family Overview → child card → "Award Daily Win Bonus +20 BUFFs" [Hat-2]
2. Confirmation modal [Hat-3]
3. Confirm [Hat-2]
4. Child device: BUFFs balance מעולה +20 עם animation [Hat-3]
5. Celebration modal בילד: "YOU JUST GOT A DAILY WIN! +20 BUFFs" [Hat-3]

**Pass criteria:**
- [ ] BUFFs balance increment בילד תוך 5s (push or polling)
- [ ] Celebration modal מציג
- [ ] Branding consistent עם BUFF_BRAND.md (uses "BUFFs", lime-bolt accent)

**Dependency:** Daily Win Bonus branding hookup — 🟡 PARTIAL (GAP P-07).

---

### C-3 — Vibe Check + Low Power Mode

**Hat:** 3
**Setup:** First app open ביום חדש. Child account.

**Steps:**
1. App detects new day → Vibe Check prompt לפני dashboard [Hat-3]
2. Pastel: 5 emoji faces (😴 😔 😐 🙂 ⚡). Gamer: 5 energy bars [Hat-3]
3. Child picks ≤2 (low energy) [Hat-3]
4. **Low Power activates:**
   - Reduced 1-2 lightweight tasks
   - SOS button visible
   - Instant Buff option (+5 BUFFs)
5. Repeat ביום אחר עם ≥3 — verify Low Power **doesn't** activate [Hat-3]

**Pass criteria:**
- [ ] Vibe Check פעם ביום, לא יותר
- [ ] Rating saved ב-`child_vibes` (אני מוודא)
- [ ] Low Power threshold ≤2 בלבד
- [ ] Reduced task list works
- [ ] SOS שולח notification להורה
- [ ] Instant Buff awards +5

**Dependency:** `pkg/daily-vibe-check` (GAP S-07).

---

### C-4 — Reward redemption

**Hat:** 3
**Setup:** Child has enough BUFFs לreward בshop.

**Steps:**
1. Child: Rewards Shop (Pastel: ChildRewardsScreen; Gamer: GamerRewardsScreen PR #30) [Hat-3]
2. Selects affordable reward [Hat-2 — אני מוודא affordability check בקוד]
3. "Cash in this reward" / "Redeem" [Hat-3]
4. Confirmation "Are you sure?" [Hat-3]
5. Celebration animation ≥3s [Hat-3]
6. BUFFs balance decrements (אני מוודא atomic ב-DB)
7. Parent מקבל notification [Hat-3]
8. Parent can mark fulfilled [Hat-3 — see P-5]

**Pass criteria:**
- [ ] Shop renders (Pastel + Gamer)
- [ ] Affordability check נכון (אני מוודא)
- [ ] Celebration ≥3s עם brand animation
- [ ] BUFFs deducted atomic (אני מוודא)
- [ ] Parent notification תוך 30s

---

### C-5 — Welcome Back after 3+ days

**Hat:** 1 + 3
**Setup:** child-stale (DB-seeded `last_active_at = NOW() - 4 days`).

**Steps:**
1. [Hat-1] CC מאמת DB state: `SELECT last_active_at FROM profiles WHERE id='<child>'`
2. [Hat-3] Open app → Welcome Back modal לפני dashboard
3. [Hat-3] Copy warm: "Welcome back! Let's pick up where you left off"
4. [Hat-3] No streak loss penalty (D-2026-05-02-07)
5. [Hat-3] Options: "Catch me up on missed days" / "Reset and start today"

**Pass criteria:**
- [ ] Modal fires exact 3+ days threshold
- [ ] Copy passes BUFF_VALUES Pillar 2 (no failure framing)
- [ ] Both options work
- [ ] Streak data לא מעונש

**Status:** ✅ shipped pkg/pause-mode (PR #24) — regression only.

---

### T-1 — Teen onboarding choice (Buddy yes/no)

**Hat:** 3
**Setup:** Fresh teen profile, age 13-18, signing in via family code.

**Steps:**
1. Family code + teen name [Hat-3]
2. **Onboarding Choice screen** (Stitch 08): "Show Buddy character (Wolf STORMY)" vs "Just dashboard, no character" [Hat-3]
3. Teen picks one [Hat-3]
4. Choice persists ב-`buddy_relationships.buddy_visible` (true/false) [Hat-1 — אני מוודא]
5. Lands in correct variant [Hat-3]

**Pass criteria:**
- [ ] Choice screen מופיע (לא דילוג לteens)
- [ ] שתי האופציות עם visual preview
- [ ] Selection persists (אני מוודא ב-DB)
- [ ] Correct variant loads (T-2 או T-3)
- [ ] שינוי אפשרי דרך Settings (T-4)

**Dependency:** Stitch 08 design + `pkg/teen-ui-with-buddy-bundle`.

---

### T-2 — Teen no-Buddy dashboard (5B)

**Hat:** 2 + 3
**Setup:** Teen profile עם `buddy_visible = false`.

**Steps:**
1. App opens → `GamerDashboardScreen` (PR #28) [Hat-2]
2. Stat grid: BUFFs balance, successful days, current streak [Hat-3]
3. No BUDDY character anywhere [Hat-2 + Hat-3]
4. Today's tasks via tab bar [Hat-3]
5. Rewards shop via tab bar (GamerRewardsScreen PR #30) [Hat-3]
6. MyStats — 3-stat grid only, no LEVEL/BOOSTERS (IN-2026-05-14-01 lite) [Hat-2]

**Pass criteria:**
- [ ] No buddy on dashboard
- [ ] Tab bar רנדר כל 4 tabs (verifies fix-runtime-theme-switch — NOT blank)
- [ ] Stats display correctly
- [ ] Theme = Gamer (deep violet + lime, BUFF_BRAND §7.5)

---

### T-3 — Teen with-Buddy dashboard (5A)

**Hat:** 3
**Setup:** Teen עם `buddy_visible = true`.

**Steps:**
1. App opens → dashboard עם Wolf STORMY [Hat-3]
2. Tap buddy → 5A "Me & Buddy" screen [Hat-3]
3. 5A shows: Wolf, friendship LEVEL pill, "Progress to LEVEL N" bar, YOUR BOOSTERS carousel [Hat-3]
4. Back to dashboard [Hat-3]

**Pass criteria:**
- [ ] Wolf STORMY רנדר
- [ ] Tap navigates ל-5A
- [ ] LEVEL pill = `buddy_relationships.friendship_level`
- [ ] Progress bar = XP toward next level
- [ ] BOOSTERS carousel: unlocked items or empty state
- [ ] Character art לא מטושטש

**Dependency:** `pkg/teen-ui-with-buddy-bundle`.

---

### T-4 — Settings variant toggle

**Hat:** 2 + 3
**Setup:** Teen ב-T-2 או T-3.

**Steps:**
1. Settings (Stitch 07) [Hat-3]
2. BUDDY toggle: "Show Buddy character" [Hat-2]
3. Toggle → re-render immediate [Hat-3]
4. Toggle back — round-trip without crash [Hat-2 + Hat-3]
5. Theme toggle Mint ↔ Gamer בנוסף (regression PR #41) [Hat-2]

**Pass criteria:**
- [ ] Toggle persists לDB (אני מוודא)
- [ ] UI switches without crash
- [ ] Tab bar **לא** מתרוקן (regression check)
- [ ] 3 toggles ברצף = יציב

**Dependency:** Stitch 07 + `pkg/teen-ui-with-buddy-bundle` Buddy Toggle Modal.

---

### CC-1 — Theme switch doesn't blank tab bar

**Hat:** 2 + 3
**Status:** Code verified PR #41 — pending Adi real-device verify (per FLAG).
**Setup:** כל ילד/teen logged in.

**Steps:**
1. Settings → toggle Mint ↔ Gamer בקצב 5 פעמים [Hat-2 + Hat-3]
2. תפריט תחתון חייב להישאר נראה אחרי כל switch [Hat-3 — visual]

**Pass criteria:**
- [ ] Tab bar visible אחרי כל switch
- [ ] No flicker / blank state >300ms

---

### CC-2 — Children don't see paywall CTAs

**Hat:** 2 + 3
**Status:** ✅ PR #40 shipped.
**Setup:** Sign in as child (any age).

**Steps:**
1. Buddy locked → "Ask your parent to unlock" — **NOT** "Subscribe" [Hat-2 + Hat-3]
2. Rewards Shop locked → "Ask your parent to unlock" [Hat-2 + Hat-3]
3. Skin picker locked → "Ask your parent to unlock" [Hat-2 + Hat-3]

**Pass criteria:**
- [ ] No "Subscribe" / payment CTA visible לילד
- [ ] Replacement copy clear + child-friendly

---

### CC-3 — Hebrew RTL renders correctly

**Hat:** 3 (web ≠ native RTL — חייב מכשיר)
**Setup:** System language = Hebrew.

**Steps:**
1. הפעלת אפליקציה → entire UI flips RTL [Hat-3]
2. Tab bar order מתהפך [Hat-3]
3. Text wraps correctly בכל המסכים [Hat-3]
4. Date picker מציג חודשים בעברית [Hat-3 — אבל F-2026-05-16-01 — hardcoded en-GB]

**Pass criteria:**
- [ ] All screens flip RTL
- [ ] No clipped/cut text
- [ ] Numbers stay LTR בתוך RTL text (per RTL conventions)

**Known limitation:** 🚩 F-2026-05-16-01 — month names hardcoded. Flag, don't fail beta.

---

### CC-4 — Lifetime access cohort doesn't see paywall

**Hat:** 1 + 3
**Setup:** parent-cohort-test account עם `is_lifetime_access = TRUE`.

**Steps:**
1. [Hat-1] CC מוודא `SELECT is_lifetime_access FROM profiles WHERE id='<acct>'` = TRUE
2. [Hat-3] Sign in as cohort acct
3. [Hat-3] Navigate ל-paywall feature (rewards shop, full buddy skins, etc.)
4. [Hat-3] חייב לעקוף paywall — content renders as subscribed

**Pass criteria:**
- [ ] No paywall באף feature
- [ ] All premium features accessible
- [ ] בקשת payment לא צצה

---

### CC-5 — Google OAuth still works on production AAB

**Hat:** 3
**Setup:** AAB installed (Path C). Signed out state.

**Steps:**
1. Sign in → Google OAuth [Hat-3]
2. אישור הרשאות [Hat-3]
3. Sign in successful [Hat-3]
4. Verify no "OAuth misconfiguration" error (D-2026-04-28) [Hat-3]

**Pass criteria:**
- [ ] OAuth flow completes
- [ ] User lands in correct dashboard
- [ ] No console errors (אם adb logcat פעיל)

---

### CC-6 — i18n — all visible strings localized

**Hat:** 2 + 3
**Setup:** Hebrew system language.

**Steps:**
1. Walk through onboarding בעברית [Hat-2 — אני יכול לסרוק בweb]
2. Walk through Teen mode בעברית — Gamer-specific strings localize [Hat-2 + Hat-3]
3. Celebration modals, error states, paywall replacement text [Hat-3]

**Pass criteria:**
- [ ] No English fallback strings (אלא אם מכוון, e.g. "BUFFs" brand term)
- [ ] All copy reads naturally in Hebrew

---

### CC-7 — Offline mode

**Hat:** 3
**Setup:** Airplane mode ON.

**Steps:**
1. Open app — task list still visible (PRD §9.3 NFR) [Hat-3]
2. Task completion queues for sync [Hat-3]
3. Airplane mode OFF → queued completions sync [Hat-3]

**Pass criteria:**
- [ ] App usable offline
- [ ] No crash on submit-while-offline
- [ ] Sync ב-reconnect

---

### S-1 — Sentry capture + PII discipline

**Hat:** 1 + 3
**Status:** `pkg/sentry-crash-monitoring` paused mid-phase-4 — v9 build queued (`9e0af79f-...`).
**Setup:** v9 AAB installed + Sentry dashboard access (Adi).

**Steps:**
1. [Hat-1] CC מאמת DSN configured + auth token secret ב-EAS
2. [Hat-3] Launch app — confirm `sentry.io` project receives hello event
3. [Hat-3] Force JS error (dev menu "Throw test error" button if exists, או trigger known crash)
4. [Hat-3] Verify shows up בSentry תוך 60s
5. [Hat-3] Stack trace = real function names (לא minified `a.b.c`)
6. [Hat-3] Disable wifi during task completion → verify error logged עם context
7. [Hat-3] Performance trace: ≥1 transaction (`OnboardingScreen → Dashboard`)
8. [Hat-3] **PII discipline:** inspect captured event → NO email addresses, child names, task content. Only user_id hashes.

**Pass criteria:**
- [ ] All 8 ✅
- [ ] **No PII leakage in event bodies** (critical — beta blocker if fail)

---

<a name="delta-rules"></a>
## 🎯 Delta Rules — מה לרוץ אחרי שינוי

> מטרה: לא לחזור על מה שכבר עבר אם הקוד לא זז.
> **תהליך:** אחרי שאת אומרת לי "סוגרים חבילה X", אני מריץ את הטבלה הזו נגד `git diff <last-pass-commit>..HEAD --name-only`, ונותן לך **רשימת ריצה ייעודית** — לא את כל הטבלה.

| If this code area touched... | Re-run | Skip these |
|---|---|---|
| `src/screens/onboarding/**` | P-1, CC-3 (RTL on onboarding), CC-6 (i18n) | All Teen/Child mode flows |
| `src/screens/teen-*/**`, `TeenContext`, `pkg/teen-ui-*` | T-1, T-2, T-3, T-4, CC-1 | Child + Parent flows, Onboarding |
| `src/screens/Pause*`, `usePause*` | P-3, C-5 (Welcome Back), CC-3 RTL on pause banner | Onboarding, rewards |
| `src/components/Buddy*`, `useBuddy*`, `buddy_*` tables | T-3, P-4, C-3 (vibe→Low Power buddy) | Onboarding (no buddy) |
| `src/theme/**`, `ThemeContext` | CC-1, T-2, T-3, C-1 | Rewards math, OAuth, S-1 |
| Supabase migration / schema | S-1 + any flow reading from changed table | UI-only flows |
| `lifetime_access` flag code | CC-4 only | All others |
| Sentry config (`sentry.ts`, `App.tsx` wrap) | S-1 only | All others |
| Hebrew/i18n strings | CC-3, CC-6 + screens with changed strings | Logic-only flows |
| Auth (`google-oauth`, `auth.ts`) | CC-5, P-1 | Internal flows |
| Rewards (`src/screens/Rewards*`, `rewards_*`) | C-4, P-5 | Onboarding, Vibe Check |
| Vibe Check (`src/screens/VibeCheck*`, `child_vibes`) | C-3 | All others |
| Daily Win Bonus (`src/components/DailyWin*`) | C-2 | All others |
| Family flows (`family_*` tables) | P-2 + the specific flow touched | Unrelated |

### Rule of thumb

- אם `git diff <last-pass-commit>..HEAD --name-only` לאזור הקוד של תרחיש מחזיר ריק → מסמן `⏭️ skipped-no-change` עם prior pass commit כreference
- אחרי 30 commits מ-last-pass — חשד שדברים זזו ולא תפסנו. רוצי שוב.

### דוגמה לתהליך

> נסגרה חבילה `pkg/daily-vibe-check`. שואלת אותי: "מה לבדוק?"
> אני בודק את ה-diff, רואה ששינויים רק ב-`src/screens/VibeCheck*` ו-`child_vibes` migration.
> אומר לך: **"רוצי רק C-3, פלוס S-1 אם זה גם built חדש. כל השאר ⏭️ skipped-no-change."**

---

<a name="sign-off"></a>
## ✍️ Live Sign-off — Current run

> ממלאים כאן בכל ריצה. אחרי ריצה מלאה — אני מעתיק את התוצאות חזרה ל-Scenarios Index ומאפס.

**Started:** _TBD_
**Build:** _TBD_ (e.g. v9 AAB `9e0af79f-...` או Expo dev sha `abc123`)
**Goal:** _TBD_ (e.g. beta-2026-06-01 launch gate)
**Tester(s):** Adi / Itay / both

| # | Scenario | Hat | Tester | Device | Result | Notes |
|---|---|---|---|---|---|---|
| P-1 | Parent onboarding | 3 | Adi | Pixel 7 | ⬜ | |
| P-2 | Family overview | 2+3 | CC + Adi | — | ⬜ | |
| P-3 | Pause Mode toggle | 2+3 | CC + Adi | Pixel 7 | ⬜ | |
| P-4 | BUDDY booster | 1+3 | CC + Adi | Pixel 7 + DB seed | ⬜ | |
| P-5 | Reward fulfillment | 3 | Adi | Pixel 7 | ⬜ | |
| C-1 | Child first open | 3 | Adi | Pixel 7 (second profile) | ⬜ | |
| C-2 | Daily Win Bonus | 3 | Adi + Emi | 2 phones | ⬜ | |
| C-3 | Vibe Check + Low Power | 3 | Itay + Emi | 2 phones | ⬜ | |
| C-4 | Reward redemption | 3 | Adi + Emi | 2 phones | ⬜ | |
| C-5 | Welcome Back 3+ days | 1+3 | CC + Adi | Pixel 7 + DB seed | ⬜ | |
| T-1 | Teen onboarding choice | 3 | Itay | his phone | ⬜ | |
| T-2 | Teen no-Buddy dashboard | 2+3 | CC + Itay | his phone | ⬜ | |
| T-3 | Teen with-Buddy dashboard | 3 | Itay | his phone | ⬜ | |
| T-4 | Settings variant toggle | 2+3 | CC + Itay | his phone | ⬜ | |
| CC-1 | Theme switch tab bar | 2+3 | CC + Itay | his phone | ⬜ | |
| CC-2 | Child no-paywall | 2+3 | CC + Adi | Pixel 7 | ⬜ | |
| CC-3 | Hebrew RTL | 3 | Adi | Pixel 7 | ⬜ | F-2026-05-16-01 known |
| CC-4 | Lifetime access bypass | 1+3 | CC + Adi (cohort acct) | Pixel 7 | ⬜ | |
| CC-5 | Google OAuth | 3 | Adi | Pixel 7 (AAB) | ⬜ | |
| CC-6 | i18n complete | 2+3 | CC + Adi | Pixel 7 | ⬜ | |
| CC-7 | Offline mode | 3 | Adi | Pixel 7 | ⬜ | |
| S-1 | Sentry capture + PII | 1+3 | CC + Adi | Pixel 7 + dashboard | ⬜ | beta blocker if PII fails |

**Definition of full pass:** כל שורה ✅, או `⚠️ deferred` עם הערה מפורשת + הסכמה שלך + Itay (לפי המקרה).

---

## 🔁 Values Check על ה-playbook עצמו

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | All 3 | ה-playbook מוודא שflows שילדים אכפת להם (reward redemption, Buddy gift, autonomy in Teen mode) עובדים, לא רק engineering pass/fail. |
| Positive Coaching | All 3 | מספר criterion בודקים "no failure framing" (Welcome Back, Pause resting buddy, no streak penalty). |
| Independence-Building | All 3 | Teen flows (T-1..T-4) מוודאים את הבחירה with/without Buddy — autonomy בgate, לא רק functionality. |

**All 9 pass.** ה-playbook values-aligned.

---

## 🚫 מה ה-playbook הזה לא מכסה

- **Long-running retention** (month-2 churn cliff per PRD §8.1) — רק beta cohort use יחשוף
- **Cross-family edge cases** (siblings, divorced households) — out of MVP per PRD
- **iOS** — out of beta (waitlist only)
- **High-load performance** — small-cohort beta לא יעמיס
- **A/B variations of copy** — out of beta
- **RevenueCat real charge flow** — cohort = lifetime; payment path נבדק נפרד ב-`founding-100-payment`

אלה גאפים מכוונים. אם משהו מהרשימה הופך לbeta blocker — scope expansion → SPEC חדש → חבילה חדשה.

---

## 🔧 Maintenance

- **אני מעדכן כשcommit:** סגרתי חבילה שמשנה התנהגות נצפית → CC מעדכן Scenarios Index + מוסיף שורות פר-תרחיש אם הוסיפו פיצ'ר.
- **את ממלאת תוצאות:** אחרי כל ריצה — Result column + Notes.
- **Stale skip claims:** אם last-pass-commit הוא `> 30 commits old`, ה-`⏭️ skipped-no-change` חשוד. רוצי שוב לפחות smoke pass.
- **Open failures מריצות קודמות:** עוברות ל-`docs/INTEGRATION_LEARNINGS.md` כ-F-{date}-{n}.

---

**Last updated by CC:** 2026-05-16
**Initial draft:** new document; flows מבוססים על Track 6 regression script ב-commit `e5dc1f7` (לא ב-main).
