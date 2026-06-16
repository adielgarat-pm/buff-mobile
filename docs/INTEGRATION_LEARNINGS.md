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

## Implementation Notes

### IN-2026-06-16-01: BUFF runs on the web (Expo Web) for iPhone users — 3 workstreams; the "9 native modules crash on import" premise was wrong

- **תאריך:** 2026-06-16
- **מקור:** CC — סשן "להעלות גרסה לאתר / לאפשר לבעלי אייפון web app כמו ב-Lovable" עם Adi. תוכנית: `C:\Users\adiel\.claude\plans\hazy-frolicking-swan.md`.
- **תיאור:** iOS חסום על אישור חשבון Apple (TestFlight), אז בעלי אייפון צריכים את האפליקציה בדפדפן. **לא** מפנים ל-`buffadhd.com` (Lovable) — הוא על פרויקט Supabase **נפרד וקפוא** (split families + פיצ'רים ישנים + שני codebase-ים; נגד D-2026-05-14). במקום, מקמפלים את אפליקציית ה-RN הקיימת ל-Web (Expo Web / react-native-web) — codebase אחד, אותו דאטה, אותם פיצ'רים. שלושה זרמים:
  1. **דף נחיתה** — הועתק 1:1 מ-repo ה-Lovable (`adielgarat-pm/buff`, Vite/React/shadcn) ל-workspace חדש `landing-web/` (Vercel, כמו admin-web); testimonials כ-snapshot סטטי (לא תלוי ב-DB הקפוא). PRs #245/#246/#249 (merged).
  2. **אפליקציית הווב + PWA** — PR #251 (merged). כל השינויים `Platform.OS==='web'`-gated → **אפס שינוי התנהגות באנדרואיד**.
  3. **סאונד + קונפטי** ("פער חושי", ראו למטה) — PR #253.
- **הפתעות / לקחים:**
  - **ה-bundle לווב עובר נקי.** ההנחה (מ-Explore בתכנון) ש-~9 מודולים native יתרסקו ב-import הייתה **שגויה** — Expo SDK 54 משלב web-stubs (RevenueCat/notifications/date-picker/file-system/Sentry/haptics). שלב הקומפילציה — שנחשב הסיכון הגדול — היה בחינם. **לקח: לבדוק אמפירית (`expo export -p web`) לפני שמניחים crashes.**
  - **Web OAuth:** `detectSessionInUrl: true` בווב (היה `false`) הכרחי — בלעדיו ה-tokens מ-redirect של Google לא נקלטים → `SIGNED_IN` לא נורה → דשבורד ריק עד reload ידני. + לגדר את `AppState` listener ל-native בלבד.
  - **RevenueCat בווב:** המפתח שלנו הוא מפתח אנדרואיד (`goog_`) → ה-RC Web SDK זורק `Invalid API key`. מדלגים בווב (כמו ב-iOS Phase-1) ומתייחסים כ-entitled.
  - **bundling לווב חייב worktree מחוץ ל-`.claude/`** — בדיוק בגלל ה-blockList שמתועד ב-[IN-2026-06-14-03]. ה-worktree של זרם 2/3 הוא sibling: `C:\Users\adiel\buff-expo-web` / `C:\Users\adiel\buff-kid-delight`, עם node_modules משלו, dev server `expo start --web`. (watcher של Windows צולע → `--clear` כשעריכה לא נתפסת.)
  - **באג realtime שגרם למסך לבן:** `useAppSettings`/`useChildrenDashboard` נתנו שם channel עם `Date.now()` בלבד — re-run של effect באותה מילישנייה (React dev double-invoke) → אותו topic → supabase מחזיר channel שכבר `subscribe()`-ד → `.on()` זורק → קריסה. תוקן עם שם ייחודי-מובטח (counter/random). dev/timing; פרודקשן (בלי StrictMode double-invoke) כמעט ולא נפגע.
  - **דפוס מיזוג-מוקדם:** Adi ממזגת PRs מהר; commits שנדחפו *אחרי* פתיחת ה-PR פספסו את המיזוג פעמיים (#245 ללא הדפים המשפטיים; #246 ללא תמר המשולבת) → נדרש forward-port (#249). לקח: לוודא שכל ה-commits על הענף לפני שמבקשים merge.
- **השפעה:** בעלי אייפון יקבלו את האפליקציה המלאה + התקנה למסך הבית, על אותו דאטה כמו אנדרואיד. **נשאר רק deploy** — צעדי Adi אצל הספקים: Vercel (`npx expo export -p web`→`dist` ב-`app.buffadhd.com` + פרויקט נחיתה), Google Cloud web OAuth redirect, Supabase Auth allowlist, Namecheap CNAME.
- **סטטוס:** `open` (קוד הושלם; deploy ממתין ל-Adi)
- **קשור ל:** D-2026-05-14 (Web Strategy & Lovable Sunset), F-073 (Web build), F-2026-05-14-01 (web-compat לפני dep), [IN-2026-06-14-03] (metro/.claude), [IN-2026-06-16-02] (פער חושי), PRs #245/#246/#249/#251/#253, `landing-web/`, `pkg/expo-web-app`, `pkg/kid-delight-parity`

### IN-2026-06-16-02: Why a kid kept asking for the old Lovable app — the gap is sensory (mobile had ZERO audio + confetti-stub), not features

- **תאריך:** 2026-06-16
- **מקור:** CC — diff דו-סוכני של שני ה-codebases (Lovable `adielgarat-pm/buff` מול `buff-mobile/src`) אחרי ש-Adi דיווחה שהבן של שני (ואחרים) ממשיכים לבקש לחזור לאפליקציה הישנה.
- **תיאור:** הפער **חושי**, לא פיצ'רים. למובייל היה: **אפס audio** (חיפוש קוד: 0 קבצים/imports; `PetDisplay.tsx:15` מודה "Not yet ported"), וקונפטי = stub. ל-Lovable: 3 מנועי Web-Audio (`soundEffects`/`celebrationAudio`/`petSounds` — צ'יים + דינג + מנגינות-חיה + קול בקיעה) + `lottie-react` קונפטי + XP fly-in + Pack-Completion trophy. **המובייל לא נחות בהכול** — הוא מוסיף BUFF Catch + מערכת BUDDY עשירה ש-Lovable חסר. הגירעון ספציפי בשכבת ה-completion החושית (הדופמין המיידי שילד ADHD נתפס אליו). (סייג: הסקה מעושר-קוד, לא מהסיבה המוצהרת של הילד.)
- **השפעה / פתרון:** זרם 3 (PR #253) — צ'יים (`expo-audio`, WAVs מחוללים) + קונפטי (`Animated` טהור, ללא lottie, אפס deps) על כל השלמת משימה, mute-aware, low-dopamine לפי הפילרים. משפר אנדרואיד מיד + יורש לווב.
- **סטטוס:** `resolved` (קוד; feel + Hat-3 ממתינים ל-Adi)
- **קשור ל:** [IN-2026-06-16-01], `pkg/kid-delight-parity`, `scripts/gen-sfx.js`, `src/lib/sfx.ts`, `src/components/ConfettiBurst.tsx`, `memory/project_buff_war_non_return.md` (habit-fragility), `project_buff_anchor_theory.md`

### IN-2026-06-15-01: Off-Routine tasks leaked into parent views as phantom incompletes — exit never cleaned them up + 3 read surfaces forgot the filter

- **תאריך:** 2026-06-15
- **מקור:** CC — בהקשר של `pkg/off-routine-leak-fix` (התיקון הקבוע, אחרי ניקוי הדאטה החד-פעמי ב-`fix/off-routine-orphan-cleanup` / #241)
- **תיאור:** הסימפטום שדיווח עליו Adi: תצוגת "אתמול" אצל ההורה הראתה 6 משימות off-routine כ-○ (לא-הושלמו) שמעולם לא היו חלק מהשגרה של אותו יום. שני שורשים:
  1. **יציאה מ-off-routine לא ניקתה כלום** — `OffRoutineCard.apply('off')` רק איפס את `off_routine_until`, והשורות `is_off_routine=true` נשארו חיות לנצח (19 יתומים שנוקו ב-#241). אין job של תפוגה שמנקה אותן.
  2. **שלושה משטחי-קריאה הוריים שכחו לסנן** — `useChildrenDashboard` + `useChildProgress` (סיכומי "היום") ו-`useYesterdayRecap`/`yesterdayRecapUtils` (העבר) שלפו `tasks` בלי תנאי `is_off_routine`. **אפליקציית הילד דווקא הייתה תקינה** — `useChildData` כבר עושה partition נכון (`isOffRoutineActive` → מציג רק את הקבוצה הרלוונטית).
  - הערה שהפתיעה: **`src/lib/taskScheduling.ts` שה-brief הניח שקיים — לא קיים.** כל לוגיקת רשימת המשימות יושבת ב-hooks, לא ב-lib נפרד.
  - התיקון: util משותף `isTaskInActivePlan` (offRoutineUtils) כמקור-אמת יחיד לכל "מה הילד רואה עכשיו", מנותב דרך 3 ה-hooks; ה-recap מחריג off-routine מה-sieve; ו-RPC אטומי `exit_off_routine(p_child_id)` (SECURITY DEFINER + שמירת הורה-באותה-משפחה) שמוחק את שורות ה-off-routine **ומאפס** את הדגל בטרנזקציה אחת. כניסה מחדש זורעת מחדש (idempotent).
- **השפעה / מגבלה מודעת (Decision A של Adi):** המודל שומר רק `off_routine_until` (סוף החלון), בלי start/היסטוריה → **אי אפשר לשחזר אם *אתמול ספציפית* היה יום off-routine.** בחרנו לחקות את Pause V1: מחריגים off-routine מה-recap תמיד, ובנוסף **מסתירים את כרטיס הילד אם יש לו חלון off-routine *פעיל כרגע*** (`buildChildYesterdayRecap` מחזיר null). מגבלה שנשארת: חלון שהסתיים *בדיוק* בגבול אתמול→היום יציג את משימות השגרה של אתמול כ"לא-בוצעו" (נדיר; שחזור היסטורי מדויק = `off_routine_started_at` עתידי, deferred). אומת חי: ה-RPC כהורה מדומה → `off_routine_tasks_left=0, off_routine_until_is_null=true`; guard כקורא לא-מורשה → `insufficient_privilege`. 43 בדיקות util ירוקות; הסוויטה המלאה 400/401 (כשל יחיד = timeout עומס ב-`EditChildScreen`, עובר בבידוד). נשארו ב-DB **2 חותמות `off_routine_until` ישנות (past, inert)** — לא דליפה (0 משימות off-routine), ינוקו ב-toggle-off הבא.
- **סטטוס:** `resolved` (מגבלת השחזור ההיסטורי: `deferred`)
- **קשור ל:** `pkg/off-routine-leak-fix`, `fix/off-routine-orphan-cleanup` (#241), migration `030_off_routine_exit_rpc`, `src/utils/offRoutineUtils.ts`, `src/utils/yesterdayRecapUtils.ts`, `memory/project_editchild_rls_blocks_owndevice.md` (אותה מחלקת RLS שה-SECURITY DEFINER עוקף)

### IN-2026-06-14-03: A worktree under `.claude/worktrees/` can't be Hat-3 tested directly — `metro.config.js` blockList `/[\\/]\.claude[\\/]/` ignores the worktree's own root, so every bundle fails entry resolution

- **תאריך:** 2026-06-14
- **מקור:** CC — בהקשר של `sessions/buff-catch-game/` (Hat-3 verification attempt)
- **תיאור:** ניסיתי `metro_acquire` מתוך ה-worktree (`...\.claude\worktrees\buff-catch-game`). Metro אכן עלה מושרש ב-worktree, אבל כל בקשת bundle החזירה `UnableToResolveError: Unable to resolve module ./index` — למרות ש-`index.ts` קיים. הסיבה: `metro.config.js` חוסם כל path שמכיל `\.claude\` (כדי לא לסרוק עשרות worktrees כשמריצים מ-main). כשמריצים מ*תוך* worktree, ה-root עצמו מכיל `.claude\worktrees\` → כל הקבצים שלו (כולל ה-entry) מסוננים → אין bundle.
- **השפעה:** אי אפשר לאמת קוד של worktree לא-ממוזג ב-Hat-3 ישירות. אימות אינטראקטיבי על האמולטור חייב לרוץ מ-**main** (Metro מושרש ב-root הראשי, שאין בו `.claude` ב-path) — כלומר **אחרי merge**. עד אז: typecheck + מוקאפ עיצוב הם הראיה הזמינה. תיקון עתידי אפשרי (מחוץ לסקופ): לחדד את ה-blockList כך שיחריג רק worktrees *אחרים* ולא את ה-`__dirname` הנוכחי.
- **סטטוס:** `open`
- **קשור ל:** `metro.config.js`, buff-emulator/buff-testing skills, `docs/DEV_SERVER_LIFECYCLE.md`, `pkg/buff-catch-game`

### IN-2026-06-14-01: Two different "gamer" palettes coexist — the legacy `ThemeContext` gamer tokens (cyan/navy) are NOT what Gamer screens actually look like (violet/lime brand)

- **תאריך:** 2026-06-14
- **מקור:** CC — בהקשר של `sessions/buff-catch-game/` (chunk 1)
- **תיאור:** ה-SPEC ביקש "ערכת נושא לפי הילד (ThemeContext — Mint/Gamer)". אבל `ThemeContext.GAMER` הוא ציאן על נייבי (`#22D3EE`/`#171C2E`), בעוד שכל מסכי ה-Gamer בפועל (Dashboard/Tasks/Stats/Me&Buddy) משתמשים בפלטת המותג סגול/ליים (`#A8E63E`/`#1a1636`, BUFF_BRAND §7.5) דרך קבוע `COLORS` מקומי, לא דרך ThemeContext. כלומר ה-ThemeContext gamer tokens הם למעשה legacy/לא-בשימוש במסכי הילד החדשים.
- **השפעה:** כל פיצ'ר עתידי ש"קורא ThemeContext לגיימר" יקבל מראה ציאן שלא תואם את שאר האפליקציה. ב-BuffCatch בחרתי במכוון בפלטת סגול/ליים (אושר ע"י Adi 2026-06-14) להמשכיות חזותית. שווה לשקול לאחד: או לעדכן את ThemeContext.GAMER לטוקנים של המותג, או לתעד שמסכי גיימר משתמשים ב-`COLORS` המקומי ולא ב-ThemeContext.
- **סטטוס:** `open`
- **קשור ל:** `pkg/buff-catch-game`, BUFF_BRAND §7.5, `pkg/color-consolidation`

### IN-2026-06-14-02: No client telemetry infrastructure exists — BUFF Catch's `buff_catch_played` shipped as a Sentry breadcrumb, server-side analytics deferred

- **תאריך:** 2026-06-14
- **מקור:** CC — בהקשר של `sessions/buff-catch-game/` (chunk 3)
- **תיאור:** SPEC §10 ביקש event `buff_catch_played` כדי לבדוק את ההשערה "המשחקון מחזיר ילדים". אבל אין באפליקציה שום תשתית אנליטיקס client-side (אין טבלת events, אין helper `track`/`logEvent`). מימשתי טלמטריה קלה: breadcrumb של Sentry + console.log ב-dev (`src/lib/buffCatchTelemetry.ts`), בלי טבלה ובלי שינוי schema — נאמן ל"בלי schema/deps" של ה-SPEC. החיסרון: breadcrumb לא ניתן לתשאול ולכן לא באמת עונה על שאלת ה"חזרה".
- **השפעה:** כדי לבדוק את השערת §10 צריך טבלה queryable per-child שמזינה את ה-Admin Tester Board. הצעה: `pkg/buff-catch-telemetry-table`.
- **סטטוס:** `deferred`
- **קשור ל:** `pkg/buff-catch-game`, Admin Tester Board (`memory/project_admin_tester_board.md`)

### IN-2026-06-13-02: Streak moved per-device → per-child, derived on read from daily_progress (fix B, resolves the IN-2026-06-13-01 FLAG)

- **תאריך:** 2026-06-13
- **מקור:** CC — Adi asked to also do fix B ("את מתעכבת עם גרסה") so the shared-device streak ships in the same release as fix A.
- **תיאור (decision):** instead of storing a per-child streak counter (the obvious move — add `daily_streak`/`last_task_completion_date` to `buddy_relationships` + an upsert RPC + backfill), the streak is now **computed on read** from `daily_progress` — the table `completeTask` already writes live. New SQL function `child_task_streak(p_child_id)` (migration `029_child_task_streak.sql`, **applied to the mobile DB**) returns the run of consecutive calendar days, ending today or yesterday (UTC, matching how `daily_progress.date` — a TEXT ISO key — is written via `toISOString`), with ≥1 completed task. Classic gaps-and-islands (`day + row_number() over (order by day desc)` constant within a run). `SECURITY INVOKER` so `daily_progress` RLS scopes rows to the caller's family on its own (an arbitrary child_id the caller can't see → 0); `GRANT EXECUTE` to anon+authenticated.
- **תיאור (why derive, not store):** (1) **per-child by construction** — kills the shared-device bug completely; (2) **can't drift** — no stored counter to get out of sync (the opposite of the credit-balance fragility, project_buff_credit_fragility); (3) **zero backfill** — it reads history, so every existing tester gets their *real* streak the moment the build ships (Alon included); (4) far less code than a stored-counter + migration + backfill.
- **Client:** new `useChildStreak(childId)` hook (RPC + focus refetch, session-mode-agnostic like `useIncomingSticker`); both dashboards now read the streak from it instead of `petState.daily_streak`. Gamer HQ also calls `refetchStreak()` after an on-screen task tap (HQ completion doesn't change focus). Mint dashboard dropped its `usePetState` usage entirely (it only fed the streak).
- **השפעה:** the streak Alon reported is now correct AND per-child. `pet_state.daily_streak` (AsyncStorage) is no longer read for display; `applyTaskCompletionToPet` (fix A) stays — it still drives the Buddy's `evolution_days_count`/XP.
- **Verified by CC:** function deployed + probed live on the mobile DB — active child with a run ending today = **4**, war-non-return child (last completion 2026-04-06) = **0**, unknown child = **0**, gap-splitting correct (a separate earlier run is excluded). `tsc --noEmit` clean (only the 2 pre-existing `expo-apple-authentication` env errors, unrelated); 28 child/hook tests pass.
- **DEFERRED (residual, smaller):** 🚩 the Buddy's **evolution/XP** (`evolution_days_count`, `experience`, `rest_cards_balance`) are still per-device in AsyncStorage. Not what Alon reported; a future package can move them to `buddy_relationships` if shared-device evolution becomes a real complaint. 🚩 on-device Hat-3 still pending (shared-emulator contention).
- **סטטוס:** `code-complete-pending-Hat-3` — `pkg/streak-per-child`. **The per-device-streak FLAG from IN-2026-06-13-01 is resolved.**
- **קשור ל:** IN-2026-06-13-01 (fix A — the wiring), `buddy_relationships`/`buddy_daily_check` (the BUDDY V0.5 per-child model — note `buddy_daily_check` is a cron snapshot with `tasks_completed=0` on the current day, which is why the live streak derives from `daily_progress`, not it).

### IN-2026-06-13-01: Day-streak stuck at 0 for every tester — the increment function existed but was wired to nothing

- **תאריך:** 2026-06-13
- **מקור:** CC — אלון (tester) reported "הרצף של הימים לא עובד, תמיד על אפס".
- **תיאור (root cause):** the streak displayed on both child dashboards reads `petState.daily_streak` from `usePetState` (AsyncStorage). The only code that advances it is the hook's `onTaskCompleted` — and **`onTaskCompleted` was never called anywhere** (it was destructured in [`PetDisplay`](../src/components/PetDisplay.tsx) but never invoked; the celebration animation there is driven by the separate `justCompletedTask` prop). Task completion flows through `useChildData.completeTask` (`daily_progress` + credit vault in Supabase) — a completely separate path that never touched the pet state. So `last_task_completion_date` was never written and `daily_streak` stayed at its `0` default forever. Same disconnect also froze `evolution_days_count` (Buddy never evolved; partially masked because egg-crack visuals run off `completedToday`/`totalToday` props).
- **תיאור (fix — `pkg/fix-streak-counter`):** extracted the pet-completion logic into a pure `computeTaskCompletion(state, credits)` + a module-level `applyTaskCompletionToPet(credits)` (reads/writes AsyncStorage) in `usePetState.ts`; `onTaskCompleted` now delegates to the pure fn (behaviour identical). Wired `applyTaskCompletionToPet(task.credits)` into `useChildData.completeTask` on the real `!wasComplete` (incomplete→complete) transition — the single chokepoint all three task screens (Gamer HQ, Gamer Quests, Mint) share, right next to the existing vault credit. Idempotent per calendar day via the `lastDate !== today` guard. Added `reload()` to `usePetState`, called from both dashboards' `useFocusEffect`, so a streak advanced on the Quests tab's separate hook instance shows when returning to HQ.
- **השפעה:** streak now advances once per day on first completion; Buddy evolution also unblocks. Verified: `tsc --noEmit` clean; 41 existing child/hook tests pass; **4 new regression tests** (`usePetState.streak.test.ts`) lock the 0→1 start, same-day no-double-bump + XP accrual, yesterday→increment, and 5-day rest-card milestone.
- **DEFERRED:** 🚩 **streak is per-device (AsyncStorage), not per-child.** On shared devices (~65% of families, View-as-Child) all siblings share one streak. **Fix B = move the streak to Supabase keyed per `profile_id`** — Adi-approved as a follow-up package after this quick fix ships (requires schema, hence a separate package). 🚩 **on-device Hat-3** (tap a task → streak shows 1; next-day increment) pending a shared-emulator run.
- **סטטוס:** `code-complete-pending-Hat-3` — `pkg/fix-streak-counter`. Fix B `open`.
- **קשור ל:** `useChildProgress.ts` (`completeTask` chokepoint), `usePetState.ts`, the proposed `WORKFLOW.md` reachability gate (IN-2026-06-09-01 — same class: a feature whose engine existed but whose trigger was never wired).

### IN-2026-06-12-01: Full-app i18n sweep — 19 silently-shadowed duplicate JSON keys + four "wrong language leaks" bug shapes, now all guard-tested

- **תאריך:** 2026-06-12
- **מקור:** Adi — "יש לנו עדיין שבירות של עברית-אנגלית בכל האפליקציה" (Hebrew users seeing English, English users seeing Hebrew). Full sweep via `pkg/i18n-sweep`.
- **תיאור (what was actually broken — 4 distinct shapes, none of them the already-guarded `useLanguage()` ternary from PR #216):**
  1. **Hardcoded copy maps consumed in one language only:** `PhaseTaskCard` rendered `CATEGORY_LABELS` (English) on every child task card — `CATEGORY_LABELS_HE` existed but had **zero consumers**; `useParentInsights` carried full bilingual copy (`title`/`titleHe`…) but `ParentDashboardScreen` rendered only the English fields. Hebrew parents always saw English insight cards; Hebrew kids always saw English category chips.
  2. **Hebrew literals on code paths that surface to UI:** `timetableParser` threw Hebrew error strings (`'הקובץ ריק'`) that `TimetableScreen` alerts verbatim — English users got Hebrew alerts. `NotificationRow` picked relative-time copy (`'עכשיו'`/`'just now'`) with an inline ternary.
  3. **Device-locale formatters:** 13 bare `toLocaleString()` + 1 `toLocaleTimeString([])` format numbers/times by DEVICE locale, leaking the wrong format in View-as-Child. New `src/lib/uiLocale.ts` (`uiLocale()`/`formatNum()`) now routes all of them off `i18n.language`.
  4. **19 duplicate keys in EACH of en.json/he.json** (`onboarding.step*`, `joinFamily.*`, `timetable.*`) — `JSON.parse` silently keeps the LAST occurrence, so the first definitions were dead copy that *looked* live in the file. Removed the shadowed lines (keep-last = exactly the previous runtime behavior).
- **השפעה:** parent dashboard insights, child task-card category chips, timetable import errors, notification-feed timestamps, and all number/time formatting now follow the active UI language; catalog is duplicate-free with full en↔he parity (1861 = 1861 keys).
- **Guard (the recurrence stopper):** new `src/lib/__tests__/i18nCatalogIntegrity.test.ts` (zero-dep, like `i18nNoHardcodedCopy.test.ts`) fails the build on: duplicate catalog keys, en↔he key-set drift, bare `toLocaleString()`/`toLocaleTimeString([])`, and **any Hebrew literal in components outside an explicit bilingual-data/parser allowlist**.
- **Known non-fixes (out of scope, flagged):** task/reward TITLES stored in the DB stay in whatever language they were created in (onboarding-time language) — that's content, not chrome, and needs a product decision; `'Buddy'`/`'BUDDY'` brand-name fallbacks left as-is; `settings.profileRole` Hebrew copy ("הורה · מלווה BUFF") is CC-drafted — Adi to review.
- **סטטוס:** `resolved` (pending merge)
- **קשור ל:** PR #216 (`pkg/off-routine-i18n`, the ternary guard), IN-2026-05-27-04 (data-path pick), D-2026-06-06 (₪ currency rule).

### IN-2026-06-09-01: Reward redemption shipped "engine-complete" but not "reachable" — discovery wiring deferred as a code comment, never flagged + "let's talk" redesigned as a reset

- **תאריך:** 2026-06-09
- **מקור:** CC — Shani reported "מתן ניצל פרס והבאפים לא ירדו" (expected the old Alert-only bug). Investigation found the engine works; the **parent-side discovery path** was never built. Adi then confirmed it herself: as a parent she got a notification for Emmy's request but "no way to approve, just a notification," and the request didn't appear in the Rewards tab.
- **תיאור (retrospective — why we shipped incomplete, the real lesson):** `pkg/reward-redemption` (PR #165) shipped a correct **engine** (ledger + atomic `approve_reward_redemption` RPC + request/approve/discuss), and Hat-3 "passed" — but the test drove the parent screen **directly with a parent JWT**, entering mid-flow. It never tested the user's actual first touch: *notification → tap → reach the approve button*. Three gaps survived: (1) tapping a redemption notification only called `navigation.goBack()` — the deep-link was deferred as the code comment *"wiring deferred to a follow-up if needed"* in `NotificationFeedScreen`, with **no FLAG** in this file or GAP_ANALYSIS, so "deferred" silently became "shipped without it" (same deferral also sat dormant in `notificationRouter`'s "wiring happens in App.tsx" comment); (2) the request only rendered under the **selected child's tab** (`usePendingRedemptions(selectedChildId)`), invisible if another child was selected; (3) **no refetch on focus / no realtime**, so a request arriving while the screen was open never showed. Net lesson: **"tested the engine" was reported as "done the feature."** Two process rules proposed to Adi for `WORKFLOW.md` (separate from this code package): (a) a first-touch *reachability* gate — every user-triggered feature needs one test that starts at the entry point (notification/badge) and ends at task completion, no dev shortcuts; (b) **deferrals must be a 🚩 here, never a code comment.**
- **תיאור (fix — this package, `pkg/redemption-talk-reset`, commit `0bebdf5`):** Discovery: notification tap now `navigate('ParentApp', {screen:'ParentRewards', params:{childId}})` and pre-selects the requesting child (`route.params.childId` + `ParentRewards` param type); Parent Rewards fetches pending **family-wide** and shows a dot on each child tab with an open request; `useFocusEffect` refetch on focus.
- **תיאור (new flow — Adi-approved "let's talk = reset", new status `discussed`):** "let's talk" is no longer a persistent open state. Parent "let's talk" → `discussing`, **leaves the parent's list**. Child sees "ההורה רוצה לדבר על זה 💬" + a **"הבנתי 👍"** button → `discussed` (new terminal), **leaves the child's view**. After the IRL talk the child **re-requests** (rewards are repeatable; the open-per-reward unique index covers only `requested`/`discussing`, so `discussed` frees it). Deliberate change: the parent no longer approves a discussed item directly. No decline anywhere (Pillar 2); re-initiation sits with the child (Pillar 3). migration `025_redemption_lets_talk_reset.sql`: added `discussed` to the status check; relaxed the child UPDATE policy to allow `withdrawn`|`discussed`.
- **השפעה:** redemption requests are now reachable from the notification and discoverable across children; "let's talk" is a clean conversational reset instead of a stuck queue item. The migration is **already live on the DB** (constraint + RLS verified via `pg_constraint`/`pg_policy`); client changes ship with the next build.
- **Verified by CC:** `tsc --noEmit` clean; Jest 351/351 (4 load-induced 5s timeouts under ~13 parallel sessions — pass in isolation/`--runInBand`); DB: status check includes `discussed`, child policy with_check = `{withdrawn,discussed}`, open-per-reward index unchanged.
- **DEFERRED (flagged, not silent — the whole point of this entry):** 🚩 **on-device Hat-3 full-journey** (notification→tap→approve; let's-talk→got-it→re-request→approve→atomic deduct; multi-child tab dot) pending a coordinated **shared-emulator** run — not done here because repointing the single Metro/emulator would disrupt the ~13 concurrent sessions. 🚩 **cross-device push** alerting the child to "parent wants to talk" depends on FCM device-token registration = the existing **Hat-4 / FCM flag** (0 tokens ever registered); in-app discovery works today (child's card shows `discussing` directly), the push does not.
- **סטטוס:** `code-complete-pending-Hat-3` — `pkg/redemption-talk-reset`.
- **קשור ל:** `pkg/reward-redemption` (PR #165, the engine), `pkg/fcm-push-notifications` (Hat-4 token-registration flag), `useChildSuggestions` (the no-decline deal-making mirror), proposed `WORKFLOW.md` reachability + deferral-as-FLAG rules (Adi's call).

### IN-2026-06-08-01: Parent edits to own-device kids silently vanished — same RLS-0-rows class as the credit_vault bug, but on `profiles` UPDATE

- **תאריך:** 2026-06-08
- **מקור:** CC — Adi found, on her daughter's device, that the app stayed Hebrew after she set English in Edit Child ("saved every time, keeps resetting"), and the menu showed a 🐉 dragon instead of the real buddy.
- **תיאור (root cause, DB-confirmed):** the `profiles` UPDATE policy `Parents can update child profiles in their family` required **`user_id IS NULL`**. The active profile (`Emmy`, `388d34df…`, own-device ChildJoin session) has `user_id` set, so the parent's UPDATE matched **0 rows with NO error** — EditChild navigated back as if it saved. Every parent edit (name/avatar/birthday/age_group/**language**) was silently dropped. The language code itself was correct: per-child language = `pro_settings.language` via `ChildLanguageBinder`/`resolveChildLang`; `pro_settings` was empty so the Hebrew display_name forced `'he'`.
- **תיאור (second bug, same screenshot):** [`ChildSettingsScreen`](../src/screens/child/ChildSettingsScreen.tsx) initialised `selectedSkin` to a hardcoded `'🐉'` and never read `pet_state`, so the menu's profile card + skin grid ignored the child's actual buddy and could never persist a change.
- **תיאור (fix):** (1) RLS — relaxed the UPDATE policy to drop `user_id IS NULL`, keeping `role='child'` + parent-in-same-family in USING and WITH CHECK (migration `022_parents_update_owndevice_children.sql`, applied live). The child still self-updates via `Users can update their own profile`. (2) Code guard — EditChild now `.select()`s the updated rows and errors on a 0-row result, so a silently-blocked write can never masquerade as success again. (3) Buddy — ChildSettingsScreen now drives the skin from `usePetState` + `getSkinsForTheme(themeName)` (theme-correct set, persists via `changeSkin`). **Note:** the skin grid is now theme-filtered (mint = 6 sweet skins, gamer = 4 heroic) instead of a flat 11-emoji list — a deliberate visible change that aligns the menu with `PetSkinPicker`.
- **תיאור (data fix, live):** set `pro_settings.language='en'` + `preferred_language='en'` on `Emmy` (388d34df…) via service-role SQL. (Briefly edited the wrong profile first — a stale seed/demo row named "אמי" `33e7adc7…` in another family, matched by an over-broad `ilike '%emi%'`; reverted it. The active device profile is "Emmy", confirmed by `last_seen` = screenshot time.)
- **השפעה:** server-side RLS + data fixes need no app build (the installed app already attempts the writes). The code/buddy fixes ship in the next build. Same masking lesson as IN-2026-06-06-02: own-device child writes must be tested in a real child session, not view-as-child.
- **תיאור (deeper gap, deferred — NOT fixed):** `usePetState` is device-local AsyncStorage only — it never reads/writes `profiles.pet_state`, so a child's chosen skin doesn't follow them across devices/reinstalls (Lovable→mobile). Proposed as a separate package.
- **Verified by CC:** policy live (`user_id IS NULL` gone from `pg_policies`); `tsc --noEmit` clean; Jest 18/18 (ChildSettings + EditChild, incl. a new 0-row-update guard test). Hat-3 (own-device child, real device) + Hat-4 (Adi confirms English sticks + real buddy shows after relaunch) pending.
- **סטטוס:** `code-complete-pending-Hat-3/4` — `pkg/fix-owndevice-child-edit`.
- **קשור ל:** IN-2026-06-06-02 (credit_vault, same RLS-0-rows class + view-as-child masking), `child-login-stable-identity` RLS audit (read-side; missed this write gap). **If Lovable web kids use own-device login, the separate Lovable Supabase project needs the same `profiles` UPDATE policy relaxation (out of MCP reach — flag for Adi).**

### IN-2026-06-07-01: Duplicate-child guard — atomic RPC + friendly dialog (no hard constraint); the duplicate also silently broke child login

- **תאריך:** 2026-06-07
- **מקור:** CC — session `fix/duplicate-child-guard`. A parent re-added the same child 4.5 min apart (empty dashboard + weak post-add feedback made the first add look like it failed). Architect decision (Adi): atomic RPC guard + friendly confirm dialog, **NO hard unique constraint** (legitimate same-name kids + soft-deleted rows would collide, and a constraint can't carry an "open existing vs add anyway" choice).
- **תיאור (the bug was worse than cosmetic — it broke child login):** `list_family_children` and `link_child_profile` both return/claim children **by name, filtered only on `is_deleted=false`**. With two active same-name orphans, the child picks from a list of identical entries and can claim the **empty twin** → sees 0 BUFFs / no history. Confirmed live: family `cd2ef9bf…` had two active "פלד" — `9dff9e4b` (real: 27 daily_progress, vault 10,165) and `e9d9378a` (empty: 0 progress, vault 100).
- **תיאור (data fix, applied live 2026-06-07, reversible):** soft-deleted the empty twin — `UPDATE profiles SET is_deleted=true WHERE id='e9d9378a…'`. Because both child-connect RPCs filter `is_deleted=false`, this immediately removes it from the child's pick-list (child now resolves to the real פלד). Revert = flip the flag. **No hard delete, no merge.**
- **תיאור (guard — migration 021):** new SECURITY DEFINER RPC **`create_child_profile(p_display_name, p_pro_settings, p_force)`**. Derives `family_id` + parent authorization **server-side** (mirrors the `Users can insert their profile` RLS check — never trusts the client). If `p_force=false` and an **active** (`is_deleted=false`) same-name child exists (`lower(btrim(display_name))`), returns `{status:'duplicate', existing_child_id, existing_child_name}` **without inserting** — check + insert are one transaction, no TOCTOU race. The existing AFTER INSERT triggers (`create_buddy_relationship_for_child`, `create_default_tasks_for_child`) still seed buddy/tasks/rewards/credit_vault inside the same statement. Verified end-to-end under a simulated parent JWT in a rolled-back txn: create→`created`, repeat→`duplicate`, force→`created` (count=2, buddy seeded=2), 0 rows persisted.
- **תיאור (client):** `UStep5_Preview` now calls the RPC instead of a direct `profiles.insert` (new-profile branch only — the `existingChildId` empty-state path is untouched). On `duplicate` it shows a 3-button `Alert` (he/en): **Open [name]** (→ Parent Tasks, no new profile) / **Add another** (re-calls with `p_force=true`) / **Cancel**. Positive-coaching copy ("{name} is already here") — passes Values Check (Pillar 2: no shaming/blame; Pillars 1 & 3 N/A, parent-facing). Also filtered `is_deleted=false` in 6 parent-facing child-list reads (`ManageChildrenScreen`, `useChildrenDashboard`, `useChildProgress`, `useYesterdayRecap`, `useUnlinkedChildren` ×2) — previously only `useParentCapture` filtered it, so soft-deleted kids still showed on the parent side.
- **תיאור (delete_child_profile was BROKEN — fixed in the same migration):** the deployed RPC did `DELETE FROM store_rewards WHERE assigned_to = p_child_id`, but `store_rewards` has **no `assigned_to` column** (it's `child_id`) → 42703 → whole txn rolled back → **child never deleted**. Fixed the column, and — per `pg_constraint` — added the two **NO ACTION** FK cleanups that would otherwise FK-block the final profile delete (`child_suggestions.child_id`, `stickers.to_child_id`); everything else child-scoped is `ON DELETE CASCADE`. So the "one-line fix" was really three statements. This is the same NO-ACTION-FK pattern as the co-parent old-family cleanup (IN-2026-06-06-03).
- **השפעה:** prevents the duplicate-profile + lost-progress-on-child-login class of bug at its source; restores the (previously broken) parent delete-child path; hides soft-deleted children from the parent UI. Migration 021 + the פלד data fix are **already live on the DB** (no build needed for those); the client changes (RPC call, dialog, list filters) ship with the next build.
- **FLAG (open, not touched — out of scope):** the `create_default_tasks_for_child` **trigger front-runs the client's `generateStarterTasks` engine** — it inserts 6 hardcoded default tasks/rewards on every child insert, then `UStep5` sees `existingTaskCount>0` and **skips** its personalized set. Net: personalized starter tasks never land in prod; every child gets the 6 hardcoded defaults. Owned by `pkg/starter-task-engine`. Also: `src/lib/parentCapture/__tests__/stubParser.test.ts` has **1 pre-existing failing test on `origin/main`** ("stubParse image input -> single item") — unrelated to this package (parentCapture untouched); flagged, not fixed.
- **Hat-3 (2026-06-07) — VERIFIED LIVE on emulator-5554** (worktree JS via Metro 8083, dev-client; no native changes so reused the installed debug build). Authenticated parent `ParentTest520` already had child "Itay"; granted the test account temp premium to pass the >1-child paywall (reverted after). Add child → "Itay" → **dialog appeared live**: "Itay is already here…" with OPEN ITAY / ADD ANOTHER / CANCEL. DB checked mid-dialog: still 1 active Itay → guard returns `duplicate` without inserting. **ADD ANOTHER** created a 2nd Itay live (triggers seeded buddy/tasks/rewards); the fixed **`delete_child_profile`** then removed it cleanly (`{success:true}`, cascaded buddy rows) — proving the `assigned_to`→`child_id` fix works on a child that actually has rewards. Cleaned up to the original single Itay; premium reverted; 0 orphan rows.
- **BUG found & fixed in Hat-3 (commit `25890aa`):** CANCEL called `navigation.goBack()`, returning to the transient "Building plan" loading screen which doesn't re-advance → parent **stranded**. Fixed to exit to `ParentApp/ParentTasks` (same proven target as "Open" + the existing-child path).
- **Note:** the RevenueCat `BILLING_UNAVAILABLE` LogBox red-box (dev-only; emulator has no billing) repeatedly interrupts adb-driven flows — dismiss between steps. Not a product issue.
- **סטטוס:** `Hat-3-verified` (Hat-4 optional) — branch `fix/duplicate-child-guard`, [PR #181](https://github.com/adielgarat-pm/buff-mobile/pull/181).
- **קשור ל:** migration `021_duplicate_child_guard.sql`, `UStep5_Preview.tsx`, `ManageChildrenScreen.tsx` + 4 hooks, `i18n/{en,he}.json`. Related FLAG: ChildJoin duplicate-orphans (IN-2026-05-14-03), soft-delete (`pkg/soft-delete-child`), starter-task engine (`pkg/starter-task-engine`).

### IN-2026-06-06-03: Co-parent (second parent) join — the data model already supported it; one RPC + family-wide premium were all that was missing

- **תאריך:** 2026-06-06
- **מקור:** CC — session `co-parent-join`. Triggered by Tamar (user) asking whether her partner can join as a second parent with his own Google account + the family code. Adi prioritized; chose to mirror the behavior the web version already shipped.
- **תיאור (finding that de-risked it):** the schema already supports **N parents per family**. Every RLS policy on family data is scoped by `family_id` (verified against `pg_policies`), there are **no `owner_parent`/`created_by` authorization columns** (the `parent_id`/`resolved_by`/`from_parent_id`/`revoked_by_parent_id` columns are audit fields, not access boundaries), and there is **no `UNIQUE(family_id, role='parent')` constraint**. So a second `profiles` row with the same `family_id` and `role='parent'` transparently reads/manages the family's children, tasks, rewards, redemptions, vibes, settings. No table/column/constraint/RLS changes were needed.
- **תיאור (implementation):** Phase 1 added one SECURITY DEFINER RPC **`switch_user_family(p_new_family_code)`** (migration `020_switch_user_family.sql`, applied live 2026-06-06). It resolves the target family by `short_code` (case-insensitive), moves the caller's profile into it **with role preserved**, and — if the caller was the old family's last member — cleans the old family up. Returns `{success, new_family_id|reason}` with machine reason codes (`not_authenticated|profile_not_found|invalid_input|code_not_found|already_member`) for client i18n. Also made premium **family-wide** in [`useSubscription.ts`](../src/hooks/useSubscription.ts): replaced the child-only `childInheritedAccess` with `familyHasEntitlement = parents.some(...)`, so a co-parent who didn't purchase still inherits the family plan (children already did).
- **תיאור (gotcha — old-family cleanup vs FK):** deleting the now-empty old family could hit FK violations. Checked `pg_constraint`: of the 15 tables referencing `families(id)`, **12 are `ON DELETE CASCADE`**, `pwa_events` is `SET NULL`, and **3 have no action — `child_suggestions`, `push_subscriptions`, `stickers`**. The RPC therefore explicitly `DELETE`s those three before `DELETE FROM families` (they are empty in the normal 0-member case anyway, but this makes it violation-proof). Cleanup only fires at 0 members, so all child-scoped CASCADE tables are already empty.
- **תיאור (security — why this is safe):** the join is a **switch that preserves role** and the entry UI lives only in parent-only Settings, so there is **no privilege-escalation path** (unlike an earlier discarded draft that branched at signup and let a code-holder pick "parent"). 
- **תיאור (open edge):** a parent who still owns children switching away leaves the old family with ≥1 member (the kids) → cleanup does NOT fire and the kids are left parent-less. The web version does not guard this; matched that behavior intentionally (BUFF's real case = partner has no kids of their own). Flag if it ever bites.
- **השפעה:** removes a single-parent bottleneck — both parents can now run the scaffold on their own devices/accounts (realtime via `useFamilyMembers`). Premium correctly extends to the co-parent.
- **Verified by CC (code/DB layer):** migration applied (`switch_user_family('ZZZZZZ')` → `not_authenticated` from a session-less context, confirming callable + auth branch); `tsc --noEmit` clean (both phases); Jest 334/334 (4 initial timeout-flakes under parallel load all pass in `--runInBand`); i18n+settings 38/38 (Phase 2). Hat-4 (real second Google account, two devices; visual check of the settings "Join Family" card) pending.
- **סטטוס:** `code-complete-pending-Hat-4` — Phases 1+2 on `pkg/co-parent-join`, [PR #179](https://github.com/adielgarat-pm/buff-mobile/pull/179).
- **קשור ל:** `pkg/co-parent-join` (SPEC/ROADMAP/TESTS under `docs/sessions/co-parent-join/`), migration `020_switch_user_family.sql`, `useSubscription.ts`, `JoinFamilyCard.tsx`, `ParentSettingsScreen.tsx`. Behavior matches the prior web implementation (`switch_user_family` + a settings "Join Family" section), implemented natively.

### IN-2026-06-06-02: Own-device kids' BUFFs never persisted — `credit_vault` write RLS was parent-only; masked for weeks because every prior credit fix was verified in view-as-child (parent session)

- **תאריך:** 2026-06-06
- **מקור:** CC — Tamar reported Alon's dashboard showing **0 BUFFs** (one screenshot 20:37 showed 20, the next 20:39 showed 0), while "דלק מיקוד 4/8" was identical in both.
- **תיאור (root cause, DB-confirmed):** `credit_vault` had exactly one **write** policy — `Parents can manage family vaults` (`role = 'parent'`). Children had **SELECT-only** (`Children can view own vault`). A child on their **own device** (own-auth `ChildJoin` session, `role=child`) therefore:
  - `daily_progress` upsert → ✅ succeeds (`Users can manage their progress` is family-scoped, not role-gated) → the focus/fuel bar fills.
  - `credit_vault` insert/update via [`useChildProgress.updateTotalBalance`](../src/hooks/useChildProgress.ts) **and** [`useDailyVibe.awardInstantBuff`](../src/hooks/useDailyVibe.ts) → ❌ silently blocked by RLS. Balance updated optimistically in React state (the "20"), then reverted to the DB value (0) on every reload/focus.
  - Alon (`418ec500`, Tamar Belek family, own auth `4f131ee2`) had **4 completed tasks today × 20 = 80 BUFFs** but **no `credit_vault` row at all**.
- **תיאור (why it recurred / "weren't we here already"):** PR #151 (`fix(child-credit)` only-credit-on-real-transition), #118 (childsettings real balance), #132 (dashboard refetch) all touched this area but were verified in **view-as-child** mode, where the active session is the **parent** → vault writes are allowed → the bug is invisible. The `child-login-stable-identity` RLS audit (`RLS_FINDINGS.md`) caught read holes but not this **write** gap.
- **תיאור (fix):**
  1. **RLS (live):** new policy `Children can manage own vault` (`FOR ALL`, child-owns-row: `family_id = get_my_family_id() AND child_id = (SELECT id FROM profiles WHERE user_id = auth.uid())`), mirroring the established `child_vibes` / `reward_redemptions` / `buddy_relationships` pattern. Migration `child_can_write_own_credit_vault`.
  2. **Data (live):** backfilled Alon's vault row → 80 (earned 80, spent 0). Audited all 37 own-device kids: only Alon had earned-but-unpersisted BUFFs; the rest legitimately 0.
  3. **Code guard:** `updateTotalBalance` now checks & logs the vault read/write errors instead of swallowing them — the silent failure is what hid this. (`useDailyVibe.awardInstantBuff` already surfaced errors.)
- **השפעה:** **server-side fix needs no app build** — the installed app already attempts the writes; they now persist. Affects only own-device (separate-device) kids, not shared-device / view-as-child families (which write under the parent session). Coverage map: `credit_vault` was the **only** child-write table lacking a child policy (daily_progress, child_vibes, buddy_relationships, reward_redemptions, child_suggestions, stickers-mark-seen, profiles-self all already allow it).
- **Verified by CC (DB layer):** policy live (`policy_exists=1`); Alon's auth uid resolves to his child profile id (policy predicate matches his row); 0 duplicate vault rows table-wide (uniqueness already enforced by expr index `credit_vault_family_child_unique` on `(family_id, COALESCE(child_id,…))`); `tsc --noEmit` clean; 52/52 child/vault tests pass. Hat-3 (own-device child completes task → reload → balance persists) + Hat-4 (Tamar/Alon confirm on real device) pending.
- **סטטוס:** `resolved-server-side; code-guard pending PR + Hat-3/4` — RLS + backfill live on mobile project `gfrongfnyigxsexuofrg`. Code guard on `pkg/child-vault-write-rls`.
- **קשור ל:** PR #151 / #118 / #132 (prior credit fixes verified in view-as-child — the masking), `child-login-stable-identity` `RLS_FINDINGS.md` (read-side audit that missed the write gap), [project_buff_credit_fragility] (no ledger — arbitrary-balance write is still possible at the API level; the proper long-term fix is a `SECURITY DEFINER` atomic-increment RPC, logged there). **If Lovable web kids also use own-device login, the separate Lovable Supabase project needs the same policy (out of MCP reach — flag for Adi).**
### IN-2026-06-06-01: The notification bell's "always opposite the title" fix was incomplete — a floating overlay can't share a corner with a screen action; made it an inline header element

- **תאריך:** 2026-06-06
- **מקור:** CC — Adi reported the bell overlapping the **"+ Add Task"** button on the parent Tasks tab (screenshot), and asked to "solve it once and for all" for English + Hebrew.
- **תיאור (why the prior fix was incomplete):** [IN-2026-06-04-01](#in-2026-06-04-01-rtl-position-bug--leftright-are-auto-swapped-by-rn-but-the-logical-end-did-not-flip-reliably-plus-a-parallel-session-stash-incident) landed `right: 16` on the **floating** bell with the reasoning "always physical-opposite the flex-start title." That only holds on screens whose trailing corner is empty. **Tasks / Rewards / Timetable** put their primary action (`+ Add Task`, `+ Add Reward`, `Update`) in that same trailing corner, so the bell floated on top of it. It collides in **both** directions: native RTL swaps the overlay (`right`→physical-left) **and** flips the header row, so the bell and the action land on the same physical side again. A floating overlay is fundamentally blind to per-screen layout — no `left`/`right` value can fix a shared corner.
- **תיאור (fix):** stop floating. `ParentNotificationBell` is now a plain inline element (no `position:absolute`/`zIndex`/insets). It lives in each screen header's trailing **action cluster**, so flex layout gives it its own slot and direction is handled by the row (no absolute hacks). New [`HeaderActions`](../src/components/parent/HeaderActions.tsx) renders the screen's primary action as a compact circular `+` button next to the bell (Tasks/Rewards). Dashboard/Settings render the bell inline; Timetable view-mode only (sub-flows bell-free). Global floating bell removed from `ParentTabs`.
- **תיאור (gotcha):** on Dashboard/Settings the header is inside a `ScrollView`, so the inline bell now scrolls with the page instead of staying pinned (standard top-bar behavior, accepted). Tasks/Rewards/Timetable headers are fixed.
- **השפעה:** replaces the floating-overlay pattern for the bell. Future headers should add the bell via `HeaderActions` (or inline), never as an absolute overlay.
- **Verified by CC (code layer):** `tsc --noEmit` clean. **Pending Adi Hat-4** (auth-gated parent screens): EN + Hebrew, RTL via cold relaunch (`forceRTL`), not just a language toggle.
- **סטטוס:** `code-complete-pending-Hat-4` — `pkg/bell-header-cluster` (commit `f5da272`), [PR #173](https://github.com/adielgarat-pm/buff-mobile/pull/173).
- **קשור ל:** `ParentNotificationBell.tsx`, `HeaderActions.tsx`, `ParentTabs.tsx`, the 5 parent tab screens; supersedes the floating-overlay approach in IN-2026-06-04-01.

### IN-2026-06-04-02: Child-login duplicate accounts — root cause was name-keyed credentials (NOT "random"), fixed via pick-from-list keyed on profiles.id

- **תאריך:** 2026-06-04
- **מקור:** CC — session `child-login-stable-identity` (Phase 0 code investigation). Triggered by Noa: logging in as a child (Liah) created a NEW user instead of connecting to the existing one.
- **תיאור (root cause, code-confirmed):** child credentials were **deterministic but keyed on the *typed display name***, not random as the early SPEC assumed. [`ChildJoinScreen.tsx:58-65`](../src/screens/auth/ChildJoinScreen.tsx) (pre-fix) derived `email = <ascii(name)>@buff.app`, `password = <name>_<CODE>_buff2026`, and called `auth.signUp` **first**, only falling back to `signIn` on "already registered". So any variance in the re-typed name (Hebrew "ליה" vs Latin "Liah", spacing, spelling) — or the **second derivation formula** in [`SignupScreen.tsx:66`](../src/screens/auth/SignupScreen.tsx) (`<rawUsername>@buff.app`) — produced a *different* email → a brand-new `auth.users` row + orphan profile instead of signing into the existing account. On the original device it never recurred because AsyncStorage held the password and the session persisted; the duplicate only appears on a **fresh device / cleared session**. Prod confirmed email = f(name): `c5dc5d95d4@buff.app`→"ליה", `itay@buff.app`→"Itay", `emmy@buff.app`→"Emmy", `matan@buff.app`→"matan".
- **תיאור (fix, Adi-approved):** **pick-from-list keyed on the immutable `profiles.id`.** Kid enters family code → `list_family_children` RPC returns the family's non-deleted children (id/display_name/avatar/linked) → kid taps their card → credentials derived from the profile id ([`src/utils/childAuth.ts`](../src/utils/childAuth.ts)), never from the typed name. Per pick: stable `signIn` → (orphan) `signUp` + `link_child_profile` (race-guarded on `user_id IS NULL`, never inserts a profile) → (already-linked legacy child) `signIn` via creds reconstructed from the **DB** display_name + code (back-compat **Option A**, no re-key, no abandoned auth rows). Migration `018_child_login_stable_identity.sql` (applied live).
- **תיאור (gotchas):**
  1. **`linked` flag needed to avoid stray auth users.** Without knowing whether the picked profile is already linked, the orphan path would `signUp` a stray stable auth user for a legacy-linked profile, then fail to link (profile.user_id not null) — and that stray would then *succeed* on the next stable `signIn` and land the kid on an empty profile. `list_family_children` returns `linked = (user_id IS NOT NULL)` so the client branches before creating anything.
  2. **`profiles.user_id` is already unique-enforced** (RLS_FINDINGS) → the integrity gap was preventing a duplicate **`auth.users`** at signup, not profile-link uniqueness.
  3. **Expo web can't verify this flow** — Supabase blocks `signUp` to `@buff.app` emails on web (documented in the sibling childjoin-claim-orphans TESTS). The auth round-trip is emulator-only (Hat-4).
- **השפעה:** any child using the affected entry path on a new device could spawn a duplicate (losing access to tasks/rewards/BUDDY = the exact Pillar-2 "progress wiped" anti-pattern, by accident). 60 of 95 child profiles are `user_id IS NULL` orphans that depend on a working link. Fix protects continuity and absorbs orphans on first pick.
- **Verified by CC (code/DB layer):** `list_family_children('CWYNQB')` → Liah's profile `74638016`; `tsc --noEmit` clean; locale JSON valid; cred logic 7/7 — incl. `legacyChildCreds('ליה','CWYNQB') === c5dc5d95d4@buff.app` = Liah's **real prod auth email** (proves the legacy fallback signs the 35 linked kids in). Pending Hat-4 for the auth round-trip + no-new-rows stop conditions.
- **סטטוס:** `code-complete-pending-Hat-4` — Phases 0/1/2 built on `pkg/child-login-stable-identity` (commits 8912796 → 9f8f2a2). Liah instance repaired manually 2026-06-04 (relink to `b1b98417`, kept). Mass orphan cleanup deferred (data task, Adi/Noa sign-off).
- **קשור ל:** `pkg/child-login-stable-identity`, migration 018, `ChildJoinScreen.tsx`, `src/utils/childAuth.ts`; supersedes the typed-name mechanism behind IN-2026-05-14-03 (childjoin-claim-orphans). Proposed Adi-only follow-ups: DECISIONS_LOG entries (see session `DECISION_DRAFT.md`), GAP_ANALYSIS auth-status update, `rls-tighten` package, hardened service-role credential minting.

### IN-2026-06-04-01: RTL position bug — `left`/`right` are auto-swapped by RN, but the logical `end` did NOT flip reliably; plus a parallel-session stash incident

- **תאריך:** 2026-06-04
- **מקור:** CC — Adi reported the parent notification bell "still doesn't look good in Hebrew" (overlapping the right-aligned "משימות" title). Earlier fix (`fix(bell-rtl-overlap)`, commit `b257574`) hadn't actually resolved it.
- **תיאור (gotcha 1 — the real fix):** [`ParentNotificationBell`](../src/components/parent/ParentNotificationBell.tsx) floats over the header. Two failed approaches before the right one:
  1. Original used the **logical `end: 16`** — should track writing direction, but in this build it did **not** flip with native RTL (behaved like `right`), so the bell stayed on the title side in Hebrew → the overlap.
  2. First "fix" used `isRTL ? {left:16} : {right:16}` driven by `LanguageContext.isRTL`. **This made it worse:** React Native's default `I18nManager.swapLeftAndRightInRTL` auto-swaps explicit `left`/`right` under native RTL, so `left:16` in Hebrew became **physical right** — back on the title.
  3. **Correct fix:** plain **`right: 16`**, no conditional. Let RN's auto-swap do the work → physical right in LTR, physical left in RTL, always opposite the flex-start title. Verified on emulator via UI-hierarchy dump: bell bounds `[42,147]` (physical left) in Hebrew on dashboard + Tasks.
  - **Lesson:** for absolute-positioned overlays in this app, use plain `left`/`right` and rely on `swapLeftAndRightInRTL` — do NOT gate on `isRTL` (double-flips) and do NOT trust logical `start`/`end` (didn't flip here). Also: native RTL only takes effect after an app restart (`forceRTL` + reload), so verifying RTL on the emulator requires a cold relaunch, not just a language toggle.
- **תיאור (gotcha 2 — process):** Metro served a **stale transform cache** on Windows after the edit (Fast Refresh + warm reload both kept showing the old bundle); only `expo start -c` (clear cache) + cold relaunch loaded the new code. Burned ~real time chasing a "fix didn't work" that was actually a cache miss.
- **תיאור (gotcha 3 — parallel sessions):** mid-task, a **parallel CC session switched the shared working dir** (`C:\Users\adiel\buff-mobile`) from `pkg/parent-stickers` → `main` → `release/v26-aab`, committed CC's *intermediate* (buggy `isRTL`) bell version as `b257574` into `main` + `release/v26-aab`, and **stashed** CC's correct final edit into `stash@{0}`. The verified fix was recovered from that stash and landed cleanly on `main` via a dedicated worktree (`fix/bell-rtl-swap`, PR #157). Reinforces the existing rule (parallel sessions = separate worktrees; check `Get-Process claude` before branch ops) and the 2026-05-24 lesson.
- **השפעה:** the buggy `isRTL` bell is on `main` and `release/v26-aab` (V26). PR #157 corrects `main`; V26 ships fixed only if built from `main` (per "build from main, merge first") or cherry-picked.
- **סטטוס:** `resolved` (code) — PR #157 → `main`. Pending: merge + build from main.
- **קשור ל:** `ParentNotificationBell.tsx`, commit `b257574`, PR #157, Lesson 2026-05-24 (parallel-session stomp), "build from main, merge first".

### IN-2026-06-01-01: Transient profile re-fetch failure ejects a logged-in user mid-session ("shows my data then throws me to login")

- **תאריך:** 2026-06-01
- **מקור:** CC — issue report from user Noa (branch `claude/noa-issue-report-BTQtn`). "כל פעם שאני מנסה להיכנס לאפליקציה אני נזרקת החוצה לשלב ההתחברות... הוא מציג לשנייה את המידע ואז זורק אותי החוצה." Persisted across software update, clear-data, and uninstall/reinstall → not corrupted local state.
- **תיאור:** [`AuthContext.fetchProfile`](../src/contexts/AuthContext.tsx) collapsed two distinct outcomes into a single `null`: a genuine "no profile row" AND any query/network failure (RLS denial, timeout, `maybeSingle()` error). On every `TOKEN_REFRESHED` event, `onAuthStateChange` re-fetches the profile in a `setTimeout`; one transient failure called `setProfile(null)`, and [`RootNavigator`](../src/navigation/RootNavigator.tsx) `!profile` branch immediately routed the user out of the app to AuthCallback (role-selection) mid-session. Token auto-refresh fires on app foreground (`AppState` active → `startAutoRefresh` in [`client.ts`](../src/integrations/supabase/client.ts)) — so "open app → see data for a beat → ejected" matches a refresh-triggered re-fetch blip exactly. "Sees data first" rules OUT the deterministic duplicate-profile class (IN-2026-05-14-03 / IN-2026-05-29-08): if `maybeSingle` errored on duplicate rows, the *first* fetch would also fail and she'd never see data.
- **השפעה:** Any logged-in user on a flaky connection (or transient RLS/edge error) could be ejected on a background token refresh — not Noa-specific. Profile-fetch robustness across all sessions.
- **Fix (commit on `claude/noa-issue-report-BTQtn`):** `fetchProfile` now returns a discriminated `ok | empty | error` result and retries transient failures with backoff (300ms, 900ms). On `error`, `onAuthStateChange` / `refreshProfile` **keep the existing profile** instead of nulling it — only an explicit `empty` (query succeeded, zero rows) clears it. Cold-start `initializeAuth` still falls through to AuthCallback on `error`, but the in-fetch retry absorbs most blips first. typecheck clean; jest 271/271.
- **Open — theory B (server-side `SIGNED_OUT`) not closed:** the fix covers the profile-fetch path. If the ejection is a Supabase-emitted `SIGNED_OUT` (refresh-token revoked / "Invalid Refresh Token: Already Used"), that is a separate auth-layer issue. **Code audit finding:** nothing in app code calls `signOut()` automatically (only user-initiated in DashboardScreen / ParentSettingsScreen) — so if Noa lands on the **real email/password Login** screen, it can ONLY be a Supabase-emitted `SIGNED_OUT` (theory B); if she lands on **role-selection**, it's the profile-null path (theory A, now fixed). Added PII-free diagnostic logs (`[Auth] onAuthStateChange: <event>` + a `SIGNED_OUT` warning) so the next Logcat repro classifies A vs B definitively. Confirming B needs Supabase → Authentication → Logs for Noa's user (no Supabase MCP in this session).
- **סטטוס:** `open` — code fix pushed (theory A); awaiting (a) Noa re-test on the fixed build, (b) Supabase auth-log read to confirm/rule out theory B.
- **קשור ל:** IN-2026-05-14-03 + IN-2026-05-29-08 (duplicate-profile class — ruled out here by "sees data first"), `AuthContext.tsx` (`fetchProfile`, `onAuthStateChange`, `refreshProfile`, `initializeAuth`), `RootNavigator.tsx` (`!profile` → AuthCallback branch), `client.ts` (AppState-gated `autoRefreshToken`).

### IN-2026-05-30-10: EAS build fast-fails on "Install dependencies" — unpinned `react-test-renderer` drifted to a react-incompatible version

- **תאריך:** 2026-05-30
- **מקור:** CC — V22 release cut (buff-release skill). vc21 built fine at 14:00; vc22 + vc23 errored ~18s into "Install dependencies" with only `UNKNOWN_ERROR`, on **identical repo code**.
- **תיאור:** `react-test-renderer` was **not pinned** in `package.json` — it's pulled transitively via `@testing-library/react-native@^12.7.2` (`peer react-test-renderer@">=16.8.0"`). Sometime after 14:00 today, `react-test-renderer@19.2.6` was published; a fresh resolve grabs it, and its `peer react@"^19.2.6"` conflicts with the project's pinned `react@19.1.0` → **ERESOLVE**. `npm ci` (local + my pre-build check) **passed** because it installs the committed lock tree (which pinned the good `19.1.0`) without re-resolving peers — so the break was invisible locally. **EAS re-resolves**, hits ERESOLVE, and fast-fails the install phase. This is why a third-party publish broke the build with zero repo changes.
- **השפעה:** Any production build (and any `npm install`, not `npm ci`) off `main` would fail until pinned. Diagnostic trap: `npm ci` green ≠ build will install; to reproduce an EAS install failure locally, run a fresh `npm install` (which re-resolves), not `npm ci`.
- **Fix:** pinned `react-test-renderer@19.1.0` (exact, test-only devDep, matches react — no runtime/bundle impact) in `22d7f24`; regenerated lock; vc24 (`fb1fae19`, commit `2516ed9`) built clean.
- **סטטוס:** `resolved` 2026-05-30 — via `pkg/release-v22`. Watch-item: other RN/react-ecosystem peers are also unpinned and could drift the same way; consider pinning `react-dom`/test deps to exact react version in a future hygiene pass.
- **קשור ל:** `pkg/release-v22`, buff-release skill Step 5 (build), `package.json` devDependencies, `@testing-library/react-native` peer set.

### IN-2026-05-29-09: View-as-child greeting reads "היי תצוגה" — Adi wants the child's real name + smaller font

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "יש טקסט מיותר 'היי תצוגה' אמור בטח להופיע שם הילד.ה צריך להקטין כי אין מספיק מקום במסך ולעדכן באמת להיי שם הילדה."
- **תיאור:** [GamerDashboardScreen.tsx:241](../src/screens/child/GamerDashboardScreen.tsx:241) renders the greeting name as `isChildPreview ? t('gamerDashboard.previewName') : (profile?.display_name ?? t('gamerDashboard.fallbackName'))`. `gamerDashboard.previewName` = "תצוגה" ([he.json:276](../src/i18n/he.json:276)), so in view-as-child the header reads "היי תצוגה" instead of the child's name. The `greetingName` font is `fontSize: 28, fontWeight: '900'` ([:439](../src/screens/child/GamerDashboardScreen.tsx:439)) — large; Adi reports it doesn't fit the screen.
- **Two changes (Adi):** (1) **show the child's real name in preview too** — i.e. use `profile?.display_name` (or the preview child's name) even when `isChildPreview`, since the "Parent Preview — tap to exit" banner already signals preview, making the "תצוגה" swap redundant; (2) **reduce the greeting font size** so the name fits.
- **⚠️ Decision reversal — surface before implementing:** the "Preview" name swap was an **intentional** cue per IN-2026-05-27-01 ("the 'Preview' display-name swap in greetings stay — they help the parent recognize they're in preview"). Adi now wants the real name. This is her call, but it reverses a prior logged decision — note it (and propose a DECISIONS_LOG line) rather than flipping silently. The preview **banner** remains the preview signal.
- **סטטוס:** `resolved` 2026-05-30 — shipped via `fix/gamer-parent-polish` (PR #126, merge `607c4d1`). The previewed child's real `display_name` is now threaded through `ModeContext.previewChildName` and shown in preview; `greetingName` font reduced 28 → 22; "תצוגת הורה" banner remains the preview signal. Decision-reversal confirmed by Adi 2026-05-29 — DECISIONS_LOG entry D-2026-05-30-01 proposed in the PR for Adi to add.
- **קשור ל:** IN-2026-05-27-01 (the intentional Preview-name swap being reversed), `GamerDashboardScreen.tsx` (`greetingName` style + the `isChildPreview` ternary), `gamerDashboard.previewName` / `fallbackName` i18n keys, `ModeContext.previewChildId` (the real preview-child name source if Adi wants the previewed child's name, not the logged-in profile's).

### IN-2026-05-29-08: Duplicate starter tasks/rewards for Itay — likely a stuck/re-run onboarding; possible re-run guard gap

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "יש כפילות במשימות ובפרסים שנוצרו - אולי כי האונבורדינג של איתי נתקע ולא הצלחתי לסיים אותו. אצל אמי אין משימות כפולות."
- **תיאור:** Itay's profile has duplicate tasks and rewards; Emi's does not. Adi's hypothesis: Itay's onboarding got stuck and was re-run, inserting a second set. Plausible mechanisms in [UStep5_Preview.tsx](../src/screens/onboarding/unified/UStep5_Preview.tsx): the `hasSaved` ref guard ([:118](../src/screens/onboarding/unified/UStep5_Preview.tsx:118)) is reset to `false` on error ([:267](../src/screens/onboarding/unified/UStep5_Preview.tsx:267)) to allow retry, and `goNext` re-calls `saveAll()` if `childProfileId` is still null ([:276](../src/screens/onboarding/unified/UStep5_Preview.tsx:276)). If the **profile** insert succeeded but the **tasks** insert errored (it's non-fatal — only `console.warn`, [:230](../src/screens/onboarding/unified/UStep5_Preview.tsx:230)) and the screen was re-entered, a fresh full run from UStep1 would create a **new profile + new task/reward set** (compounding with the orphan-duplicate pattern IN-2026-05-14-03). There is no idempotency/dedupe on the tasks/rewards INSERT.
- **השפעה:** Data quality in the mobile DB (no prod users — safe to inspect/clean per CLAUDE.md memory `mobile_db_no_prod_users`). Two angles: (a) **data cleanup** of Itay's duplicates now; (b) a possible **code guard** so a re-run attaches to the existing child / dedupes tasks instead of duplicating (overlaps with the empty-state `existingChildId` reuse path, which already guards the profile but not task re-insertion).
- **חקירה (2026-05-29, CC code-read — Adi's scenario: "added tasks from the empty state after onboarding; after it built Itay's plan it didn't return to the dashboard"):**
  - **`existingChildId` threading is INTACT** — ruled out as the cause. Empty-state CTA `handleSetupTasks` ([ParentTasksScreen.tsx:56-86](../src/screens/parent/ParentTasksScreen.tsx:56)) passes `existingChildId` to `UStep2_Goal` (age known) or `UStep1` (age unknown). UStep1 forwards it explicitly ([:89](../src/screens/onboarding/unified/UStep1_ChildProfile.tsx:89)); UStep2/3/4 all `{...params}`-spread; `ULoadingScreen` passes `params` whole ([:35](../src/screens/onboarding/unified/ULoadingScreen.tsx:35)). So UStep5 reliably sees `existingChildId` → reuses the profile, **no duplicate profile** from this path.
  - **PROVEN duplicate mechanism — no idempotency on the task/reward INSERT.** UStep5 `saveAll` inserts the task rows ([:225](../src/screens/onboarding/unified/UStep5_Preview.tsx:225)) and reward rows ([:252](../src/screens/onboarding/unified/UStep5_Preview.tsx:252)) **unconditionally on every run, including the `existingChildId` path** — there is no "does this child already have tasks?" guard. `saveAll` re-runs whenever the screen remounts (the `hasSaved` ref is per-mount and is reset to `false` on any error, [:267](../src/screens/onboarding/unified/UStep5_Preview.tsx:267)) or when `goNext` re-invokes it with a null `childProfileId` ([:276](../src/screens/onboarding/unified/UStep5_Preview.tsx:276)). Any retry / back-nav / second entry → a second full task+reward set. This matches "duplicates for Itay, none for Emi" (Emi's flow completed cleanly once).
  - **"Didn't return to dashboard" — hypothesis to confirm on emulator.** Existing-child `goNext` calls `navigation.navigate('ParentApp')` ([:286](../src/screens/onboarding/unified/UStep5_Preview.tsx:286)), which lands on ParentTabs' **default tab (Dashboard), not the Tasks tab**. The new-child path instead goes to `UStep7_Phone`→`UStep8_Complete`. `RootNavigator` mounts the UStep group as **modals over ParentApp** ([RootNavigator.tsx:171-180](../src/navigation/RootNavigator.tsx:171)) and re-fetches children on `profile` change ([:69](../src/navigation/RootNavigator.tsx:69)) — a re-render mid-flow could interrupt the dismiss. Needs an emulator repro to pin which symptom Adi hit (stuck on UStep5 vs landed on wrong tab vs sent through phone steps).
- **סטטוס:** `resolved` 2026-05-30 — shipped via `fix/empty-state-duplicate-tasks` (PR #122, merge `102a8a4`, feat commit `8dca8cc fix(onboarding): idempotent task/reward save + return to Tasks tab`). UStep5_Preview now gates each insert on a live per-table `count(*)` for the resolved child id and skips when rows already exist (separate guards for tasks + rewards so a partial prior failure backfills). Existing-child `goNext` navigates to `ParentApp/ParentTasks` (via `NavigatorScreenParams<ParentTabsParamList>`), so the parent lands back on Tasks instead of the default Dashboard tab. **Itay's existing duplicates: data-cleanup still pending** (CC can inspect/clean on Adi's go-ahead).
- **קשור ל:** IN-2026-05-14-03 (ChildJoin orphan duplicates — adjacent duplicate-profile class), IN-2026-05-27-05 (daily_progress upsert — the non-fatal-error-suppression pattern), `UStep5_Preview.saveAll` (`hasSaved` guard, non-fatal task insert).

### IN-2026-05-29-07: Parent Tasks view shows an empty checkbox circle — false affordance (parent can't complete)

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "להציג עיגול CHECKBOX רק במקומות שאפשר לסמן בהם, בצפה כילד, ולא בכל מקום."
- **תיאור:** [ParentTasksScreen.tsx:157-160](../src/screens/parent/ParentTasksScreen.tsx:157) renders each task row with a 24px round `checkCircle` ([styles, :192](../src/screens/parent/ParentTasksScreen.tsx:192)) inside a plain **non-pressable `View`**. Empty when incomplete, filled `✓` when the child completed it. In the parent's own Tasks tab the parent **cannot** complete a task (only the child does), so the empty circle is a pure status indicator that reads as an interactive checkbox — the same false-affordance class as IN-2026-05-27-03 (the notification check-circle icon). In **view-as-child** the checkbox is legitimately interactive (GamerTasksScreen check-circle is a `TouchableOpacity`→`onTaskTap` at [:285](../src/screens/child/GamerTasksScreen.tsx:285); Mint `PhaseTaskCard` whole-card press at [:81](../src/components/PhaseTaskCard.tsx:81)) — so the circle belongs there, not in the parent management view.
- **השפעה:** Parent sees a tappable-looking control that does nothing → "this surface doesn't respond to me." Adi's rule: show the checkbox circle only where completing is possible (child interface / view-as-child), not on read-only parent surfaces.
- **תיקון (proposed, pending Adi):** in `ParentTasksScreen` replace the empty circle with a non-checkbox status glyph — e.g. render the filled `✓` only when `task.completed`, and an empty/neutral dot (or nothing) otherwise — so the row reads as status, not a control. Smallest-blast-radius option; no behavior change elsewhere.
- **סטטוס:** `resolved` 2026-05-30 — shipped via `fix/gamer-parent-polish` (PR #126, merge `607c4d1`). `ParentTasksScreen` task rows now render a status-only glyph: green `✓` when `task.completed`, a small muted dot otherwise (styles `statusDone`/`statusPending`/`statusDot`). The live checkbox in the child / view-as-child surfaces is untouched.
- **קשור ל:** IN-2026-05-27-03 (notification icon false-affordance — same lesson), IN-2026-05-27-01 (view-as-child interactive — why the child surface keeps the live checkbox), `ParentTasksScreen.tsx`, `PhaseTaskCard.tsx`, `GamerTasksScreen.tsx`.

### IN-2026-05-29-06: Onboarding starter-task content corrections (Adi)

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review of the starter tasks Emi/Itay received.
- **תיאור:** Two content changes to `STARTER_TASKS_BY_CHALLENGE` ([onboardingData.ts:108](../src/screens/onboarding/unified/onboardingData.ts:108)):
  1. **Remove "Make your own breakfast / להכין ארוחת בוקר לבד"** (`in_1`) — Adi: "להעיף". It appears in the `independence` and `life_independence` challenges ([:165](../src/screens/onboarding/unified/onboardingData.ts:165) + [:170](../src/screens/onboarding/unified/onboardingData.ts:170)). Removing it leaves those challenges with 2 starters unless a replacement is added (`DEFAULT_TASKS_COUNT` slices to 3, so 2 is allowed).
  2. **Add a "pack your bag yourself per the school timetable" task** — Adi: "דיברנו על לסדר תיק לבד לפי המערכת אם קיימת". "המערכת" = the school timetable (cf. the timetable-import feature, [TimetableScreen.tsx](../src/screens/parent/TimetableScreen.tsx)). Likely home: `organisation` / `organisation_memory` (today: set-out-clothes / check-bag-checklist / write-tomorrow-tasks). Open question for Adi: exact wording, and whether this is a **static** starter task or one that **integrates with the imported timetable** ("אם קיימת" implies conditional on a timetable existing — a bigger scope).
- **השפעה:** Pure content/copy edits to the starter library (user-facing Hebrew strings → Adi sign-off per CLAUDE.md). No schema or logic change for #1; #2 is static-easy or timetable-integrated-bigger depending on Adi's intent.
- **סטטוס:** `resolved` 2026-05-30 — shipped via `pkg/onboarding-starter-tasks` (PR #120, merge `5ac0fbc`). #1 "make breakfast alone" kept for `life_independence` 15-18 only (removed from younger ages). #2 "pack bag per timetable" added as a **static** task across ages 6+ in both `organisation` + `independence`. Timetable-integration variant deferred to a separate future package.
- **קשור ל:** IN-2026-05-29-02 (onboarding personalization), IN-2026-05-29-05 (time-of-day), `onboardingData.ts` (`STARTER_TASKS_BY_CHALLENGE.independence/life_independence/organisation`), timetable-import feature.

### IN-2026-05-29-05: Starter-task time-of-day is assigned positionally — mis-buckets evening tasks

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "לכבות מסכים לפני השינה זו פעילות ערב ולא להכין שיעורים בלי פלאפון."
- **תיאור:** The `time` written to each starter task is assigned **by array position**, not by the task's actual time of day. [UStep5_Preview.tsx:45](../src/screens/onboarding/unified/UStep5_Preview.tsx:45) `TASK_TIMES = ['08:00','16:00','20:00']` and [:197](../src/screens/onboarding/unified/UStep5_Preview.tsx:197) `time: TASK_TIMES[index]`. So task[0]→morning, task[1]→afternoon, task[2]→evening regardless of meaning. For `screen_time` ([onboardingData.ts:129](../src/screens/onboarding/unified/onboardingData.ts:129)): `st_1` no-phone-at-meals→08:00, **`st_2` screens-off-before-bed→16:00 (afternoon — wrong)**, `st_3` earn-screen-time→20:00. The parent's Tasks tab buckets by this `time` via `stageForTime(t.time)` ([ParentTasksScreen.tsx:149](../src/screens/parent/ParentTasksScreen.tsx:149)) and the child phase views do the same, so "screens off before bed" surfaces in the afternoon phase.
- **השפעה:** Starter tasks land in the wrong day-phase whenever their natural time doesn't match their position in the challenge array. Evening-by-nature tasks (screens off before bed, phone-free hour before sleep) are the clearest victims.
- **תיקון (proposed, pending Adi):** give each `StarterTask` a `timeOfDay` (`morning`|`afternoon`|`evening`) or an explicit `time` hint in `onboardingData.ts`, and have `UStep5_Preview` map that to a clock time instead of the positional `TASK_TIMES[index]`. Keep a positional fallback for tasks with no hint.
- **Research note (2026-05-29):** Adi asked CC to "research what tasks a child should do in each part of the day by age, per the parent-selectable focus areas, and fix accordingly," recalling that "we created a table for this — go back to the SPEC." **A thorough docs search (Explore agent, 2026-05-29) found NO such design table in the repo.** Closest assets: (1) the static `STARTER_TASKS_BY_CHALLENGE` (challenge-keyed only, age/time-blind); (2) [anchor-recovery/SPEC.md:348-350](sessions/anchor-recovery/SPEC.md) — real-world *completion* data by age (standalone-meds anchors that survived), useful research input but not a task-by-time-by-age design table. The table Adi recalls likely lives in a Claude.ai web conversation, not the repo. **The work therefore includes BUILDING that table** (task × age-group × time-of-day × focus area) as the design artifact, grounded in ADHD time-of-day routine principles + our completion data, then wiring `onboardingData.ts` + `UStep5_Preview` to it.
- **סטטוס:** `resolved` 2026-05-30 — shipped via `pkg/onboarding-starter-tasks` (PR #120, merge `5ac0fbc`). `StarterTask` gained a `timeOfDay: 'morning'|'afternoon'|'evening'` field; `UStep5_Preview` now maps it to a clock time via `TIME_OF_DAY_CLOCK` (`morning→08:00`, `afternoon→16:00`, `evening→20:00`) instead of positional `TASK_TIMES[index]`. The design table (`docs/sessions/onboarding-starter-tasks/STARTER_TASK_TABLE.md`) was built v1.1 with Adi's reviewed corrections and is committed in main. Hat-3 verified 2026-05-30 (ZTestDup529 12-14 `time_management`: `Write today's 3 priorities` @ 08:00, `25-min timer for a task` @ 16:00, `Plan tomorrow tonight` @ 20:00 — all correct).
- **קשור ל:** IN-2026-05-29-02 (onboarding personalization), IN-2026-05-29-06 (content), `UStep5_Preview.tsx` (`TASK_TIMES`, `ADDITIONAL_TASK_TIMES`, `getCategoryForChallenge`), `ParentTasksScreen.tsx` (`stageForTime`), `PhaseTaskCard.isOutOfWindow`.

### IN-2026-05-29-04: Starter-task language follows global app locale, not the child — Adi's fix: derive from child-name script

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "לאיתי הוא פתח משימות בעברית ולאמי באנגלית - לפי איזו לוגיקה?" + proposed the fix herself ("נבחר בשפת הילד לפי השפה בה כתבו את השם שלו").
- **תיאור — answer to the question:** starter-task titles are written in `activeLang = i18n.language` ([UStep5_Preview.tsx:191](../src/screens/onboarding/unified/UStep5_Preview.tsx:191)) via `pickLang(t.title, activeLang)` ([:195](../src/screens/onboarding/unified/UStep5_Preview.tsx:195) + [:212](../src/screens/onboarding/unified/UStep5_Preview.tsx:212)). `i18n.language` is the **app's interface locale at the moment that child's onboarding ran** — a single global setting, not a per-child property. So Itay was onboarded while the app was Hebrew → Hebrew tasks; Emi while the app was English → English tasks (or the language was switched between the two flows). There is **no per-child language logic** today. Note this is the same write path that IN-2026-05-27-04 corrected from hardcoded `.en` to `activeLang`; that fix was right for a single-language family but doesn't serve a mixed-language family.
- **Adi's decision (to implement):** derive the **task** language from the **script of the child's display name** — Hebrew characters in `params.childName` → write Hebrew titles; Latin → English. Generic rule: "the child's language = the script their name was typed in."
- **Feasibility (verified):** `params.childName` is in scope at the INSERT ([UStep5_Preview.tsx:153](../src/screens/onboarding/unified/UStep5_Preview.tsx:153)). A small `detectLangFromName(name)` (Hebrew Unicode range test `/[֐-׿]/`) replaces `activeLang` for the task INSERT only. **Scope is tasks only:** rewards are written bilingually via `bilingualForDb(r.title)` ([:244](../src/screens/onboarding/unified/UStep5_Preview.tsx:244)) and the language is chosen at display via `pickI18nColumn`, so rewards already adapt per-viewer and need no change. The on-screen preview (`task.title[lang]`, [:354](../src/screens/onboarding/unified/UStep5_Preview.tsx:354)) can keep following the app locale or switch to the name-derived lang for consistency — Adi's call.
- **Edge cases for Adi:** mixed-script names, emoji-only / numeric names, and names typed in Latin by a Hebrew-speaking parent (would yield English tasks). Recommend: default to Hebrew (Israel-first MVP) when no Hebrew/Latin letters are detectable.
- **סטטוס:** `resolved` 2026-05-30 — shipped via `pkg/onboarding-starter-tasks` (PR #120, merge `5ac0fbc`) and further extended by `pkg/per-child-language` (PR #124, merge `5e9ba20`). PR #120: `detectLangFromName(name)` exported from `src/lib/i18nString.ts` (Hebrew range `/[֐-׿]/` → 'he', Latin → 'en', Israel-first 'he' fallback; 7 unit tests). Task INSERT in UStep5 now uses it instead of `i18n.language`. PR #124: per-child `pro_settings.language` stored at onboarding (default = `detectLangFromName(childName)`), parent-overridable in EditChild — covers the Latin-name-but-Hebrew-speaker anomaly. Does not revert IN-2026-05-27-04 helper/guardrail.
- **קשור ל:** IN-2026-05-27-04 (i18n string plumbing — the write path being refined), IN-2026-05-29-02 (onboarding personalization), `src/lib/i18nString.ts` (`pickLang`/`bilingualForDb`), `UStep5_Preview.tsx`.

### IN-2026-05-29-03: "Convert BUFFs to money" reward already exists — but narrowly gated, no money motivator, no protective exchange ratio

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "ילד שאוהב להרוויח צרכים גם צריך פרס של המרת נקודות בכסף ביחס גבוה שלא יהיה יקר להורה." Framed as a missing reward; CC investigation found it already exists but is reachable only by a narrow slice of children.
- **תיאור:** The reward **"Convert BUFFs to money" / "להמיר BUFFs לכסף"** (`pr_4`, 💰, `size: 'large'`) already ships in the onboarding reward library — but at [onboardingData.ts:317](../src/screens/onboarding/unified/onboardingData.ts:317) it sits **only** under motivator `privileges` **and only** in the `15-18` age group. Consequences:
  1. **A money-motivated younger kid never sees it.** `privileges` for `6-8`/`9-11`/`12-14` returns chef-night / movie-night / late-night-pass — no money option. Emi (9) cannot land on it regardless of how she's set up.
  2. **There is no "money / earning / allowance" motivator.** [MOTIVATORS](../src/screens/onboarding/unified/onboardingData.ts:72) = gaming / sports / creative / social / privileges. A parent whose child is money-driven has no signal to give beyond `privileges`.
  3. **No money-specific exchange ratio.** The credit cost of every reward (incl. this one) is the generic `calcRewardCredits` = `REWARD_CREDITS_RATIO × dailyBuffs × REWARD_DAYS[size]` ([onboardingData.ts:331](../src/screens/onboarding/unified/onboardingData.ts:331)). There is no intentionally-high BUFFs→₪ rate that keeps the cash payout cheap for the parent — Adi's explicit concern ("ביחס גבוה שלא יהיה יקר להורה").
- **השפעה:** Adi's ask is really three smaller asks, not "add a missing reward": (a) widen the money-conversion reward to money-motivated kids of any age; (b) add a money/earning motivator (or a "what motivates them" free-text/extra option); (c) introduce a configurable, deliberately-high BUFFs→money rate (e.g. a parent-set ₪ per N BUFFs) so the parent controls real-money exposure.
- **Values note (Pillar 1):** real money is the most extrinsic reward in the system — must be parent-configured and framed as the child's own chosen goal, never a default/auto-suggested reward. Worth a full Values Check at design time before widening exposure.
- **סטטוס:** `open` — proposed package `pkg/money-conversion-reward`. Scope (which of a/b/c) is Adi's call. **Not yet in `BUFF_GAP_ANALYSIS.md`** — proposed row pending Adi (Adi's doc, not edited unilaterally per CLAUDE.md Rule 5).
- **קשור ל:** IN-2026-05-29-02 (same onboarding-personalization weakness — both stem from coarse template targeting), `onboardingData.ts` (`REWARD_PICKS.privileges['15-18']`, `MOTIVATORS`, `calcRewardCredits`), `config/onboardingConfig.ts` (`REWARD_CREDITS_RATIO`).

### IN-2026-05-29-02: Onboarding "AI" is a static template — tasks key on challenge only, zero age/motivator personalization

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. "מטריד אותי שאמי ואיתי עם נושאים שונים ... קיבלו אותה רשימת משימות ופרסים דומים. ה-AI של האונבורדינג לא מספיק מדויק."
- **תיאור:** There is **no AI** in the onboarding flow — it is a deterministic lookup in `onboardingData.ts`:
  - **Tasks** (`STARTER_TASKS_BY_CHALLENGE`, [onboardingData.ts:108](../src/screens/onboarding/unified/onboardingData.ts:108)) are keyed **only on the selected challenge ID** — there is **no branch on age group or motivator**. Two children who pick the same challenge receive byte-identical starter tasks regardless of being 9 vs 15. This is the direct cause of "Emi and Itay got the same task list."
  - **Rewards** (`REWARD_PICKS`, [onboardingData.ts:229](../src/screens/onboarding/unified/onboardingData.ts:229)) **are** keyed on `motivator × ageGroup` (2 picks each), so there is *some* differentiation — but identical motivator selections yield heavily overlapping reward sets, matching "similar rewards."
- **השפעה:** Personalization is coarse: challenge → 3 fixed tasks (age-blind), motivator+age → 2 rewards. A 9yo and a 15yo are indistinguishable in their task list whenever the parent picks the same challenge. "Make the AI more precise" is therefore mis-scoped — there is no model to tune; the work is one of: (a) add age-aware task variants to the static table, (b) add motivator-aware task tailoring, or (c) introduce an actual LLM-generated starter set (new dependency + cost + Pillar-2 copy-safety review). (a)/(b) are cheap and deterministic; (c) is a product+cost decision.
- **סטטוס:** `resolved` 2026-05-30 — shipped via `pkg/onboarding-starter-tasks` (PR #120, merge `5ac0fbc`). `STARTER_TASKS_BY_CHALLENGE` was rebuilt from `STARTER_TASK_TABLE.md` so each challenge's 3 tasks are scoped to that challenge's age group (per `OPTIONS_BY_AGE`). All 22 challenge keys preserved (no regression). Scope (a) static age-aware expansion shipped; (b) motivator-aware task tailoring and (c) LLM-generated starter set deferred. Spec-sync: CLAUDE.md "Onboarding fixes" FLAG materially advanced — Adi to revisit on next FLAG-list update.
- **קשור ל:** IN-2026-05-29-03 (money-reward gating is the reward-side symptom of the same coarse targeting), `onboardingData.ts` (`STARTER_TASKS_BY_CHALLENGE`, `OPTIONS_BY_AGE`, `MOTIVATORS`), CLAUDE.md Open FLAG "Onboarding fixes".

### IN-2026-05-29-01: Child task list is a dead-end empty state — "Suggest a task" CTA is a non-functional stub

- **תאריך:** 2026-05-29
- **מקור:** Adi — post-V19 review. Saw the child empty state "אין משימות היום" and noted there is no way for the child to add a task: "תוסיף לעתיד הוספת משימות על ידי הילד לאישור ההורה."
- **תיאור:** The child's empty-task view shows `gamerDashboard.emptyAll` = "אין משימות היום. תיהנו." ([he.json:274](../src/i18n/he.json:274)) and offers the child no path to add or request a task. A **"Suggest a task to your parent" CTA already exists** at [GamerTasksScreen.tsx:334-343](../src/screens/child/GamerTasksScreen.tsx:334) (i18n `gamerTasks.suggestTask`) — but it is an explicit **stub**: `onPress={() => { /* TODO: hook into task-suggest flow when designed */ }}`. So the feature is half-built, not absent: a rendered button with no behavior, **Gamer-mode only** (no equivalent in Mint/young-child mode), **no backend**, **no parent-approval flow**.
  - **The same stub exists for rewards:** "Suggest a reward to your parent" at [GamerRewardsScreen.tsx:294](../src/screens/child/GamerRewardsScreen.tsx:294) (i18n `gamerRewards.suggestReward`, `onPress={() => { /* TODO: hook into reward-suggest flow when designed */ }}`). **Adi confirmed 2026-05-29 by tapping both CTAs — neither does anything.** So the child→parent suggest flow must cover *both* tasks and rewards.
- **Distinct from shipped work:** `pkg/empty-state-onboarding` (shipped, commit `1fa7421`) addresses the **parent** seeing a child's empty task tab → parent-initiated "Set up tasks for {name}" CTA ([SPEC.md:3-6](sessions/empty-state-onboarding/SPEC.md)). It does **not** give the **child** a way to add/request a task. This item is the child-side, child-initiated counterpart — no overlap.
- **השפעה:** Future feature (Adi): child adds a task → parent approval. This is a Pillar 3 (Independence / child voice) win and a Pillar 1 (the task is one the child chose) win, provided it routes through parent approval so the parent keeps control of the task list and reward economy. Wiring the existing stub is the natural entry point.
- **סטטוס:** `resolved` — shipped via **`pkg/child-suggest`** (2026-05-29, branch + PR; Hat-4 device verification pending Adi). See `docs/sessions/child-suggest/`.
- **פתרון:** A dedicated `public.child_suggestions` table (NOT a flag on `tasks`/`store_rewards`) keeps pending ideas isolated from the completion/EOD/buddy math until a parent promotes one through the existing insert path. **No `declined` state by design** — per Adi the parent's two moves are **"Yes, let's do it"** (creates the real task/reward, sets the dormant `proposed_by_child` column `true`) or **"Let's talk about it"** (`status='discussing'` — a warm conversation prompt, not a rejection). This reframes the feature as PRD §227 "deal-making" and removes the Pillar-2 shame risk entirely (there is no decline path). Covers **both** tasks and rewards, **both** Gamer and Mint. New `child_suggestion` notification type + `trg_notify_parent_on_child_suggestion` give the parent bell badge + FCM push for free. **Surprise:** the `proposed_by_child` columns (PRD §290) existed in the DB since the Lovable era but were wired nowhere in mobile — this package is the first to use them.
- **קשור ל:** `pkg/empty-state-onboarding` (parent-side counterpart, shipped), F-2026-05-18-01 (child-side empty Dashboard — silent-default-tasks Pillar 1/3 risk), `docs/sessions/child-suggest/SPEC.md`, `BUFF_PRD.md` §165/§227 (deal-making / child-is-a-stakeholder).

### IN-2026-05-28-02: Vibe Check Gamer selector — bars→battery (the split already half-existed)

- **תאריך:** 2026-05-28
- **מקור:** CC — `pkg/vibe-check-battery`. Adi asked to replace the Gamer-mode energy bars with a recharging-battery metaphor for teens, keeping Mint smileys for young kids.
- **תיאור:** Three things surprised the investigation:
  1. **The theme split already existed.** `VibeCheckScreen` already branched `isGamer` → `<VibeBars/>` vs Pastel → `<VibeFaces/>`. The task was a component swap inside an existing fork, not a new branch. Decision (Adi-confirmed): **keep the split by THEME** (`mint`/`gamer`), not by age — smallest blast radius, and `themeOverride` preview/View-as-Child keep working.
  2. **The copy was already values-safe.** `vibeCheck.subtitle` is literally "Pick whichever fits — there's no wrong answer" (en) / "בחר/י את מה שמתאים — אין תשובה לא נכונה" (he). No copy change needed.
  3. **The a11y labels are energy-framed, not bar-framed** (`level1`="Very low energy" … `level5`="High energy"). They map 1:1 onto battery charge, so VibeBattery **reused the exact keys → 0 new i18n keys → `i18n:check` trivially green**.
- **החלטות:**
  - **`vibe_type='battery'`** for teens (was `'bars'`). The DB column is free `text` — verified via Supabase MCP that `child_vibes` has **no CHECK constraint** on `vibe_type` (only `vibe_level` 1-5, FKs, PK, UNIQUE(child_id,date)). All 5 existing rows are `'emoji'`. EOD cron + parent SOS trigger are `vibe_type`-agnostic, so no functional impact and no migration. `VibeType` widened to `'emoji' | 'bars' | 'battery'` (kept `'bars'` for forward-compat with any historical rows).
  - **Parent visibility (Adi scope decision):** Adi initially said "the parent should really see the child's battery status." Surfaced that the parent sees **no** daily energy gauge today — only a child-initiated SOS dot — and that auto-broadcasting daily energy would be a Pillar-2/3 surveillance drift (PRD §6.4). Adi chose **"just restyle the existing SOS signal"** → the amber dot became a low-charge `BatteryGlyph`; consent model unchanged (child-initiated only). A standalone daily-gauge feature was explicitly **not** built.
  - **Shared `BatteryGlyph`** primitive serves both the kid selector (5 interactive cells) and the parent indicator (1 static low-charge glyph). Two real consumers → justified DRY, not premature abstraction.
- **Values (Pillar 2 — the sensitive one):** the selected cell glows the **same lime at every level** — deliberately **no** red-low/green-high danger gradient — so a low pick reads as a valid state, not failure. The battery is the kid's own charge self-report, **never a creature to keep alive** (not the Joon-Doter pattern).
- **Dep note:** charging bolt uses `@expo/vector-icons` Ionicons `flash` — already a dependency (used across the Gamer screens), so **no new dependency**.
- **Verification:** `tsc` clean, `jest` 250/250 (the 2 first-run failures were a flaky `EditChildScreen` timeout — green on re-run, unrelated to this diff), `i18n:check` clean. Web render was **attempted** via the `__VibeCheckPreviewHarness` on Expo web from the worktree (node_modules junction → `npm --prefix` launch config on port 8097), but the dev server proved unstable (died mid-bundle) and no faithful capture was obtained — consistent with the project precedent that react-native-web is low-fidelity/unreliable for theme-gated UI (see `pkg/fix-runtime-theme-switch` FLAG). Authoritative Android-emulator visual sign-off is therefore Adi's (or a `buff-testing` Hat-3 run).
- **סטטוס:** `open` — pending Adi merge + emulator sign-off. Spec-sync flag: `BUFF_BRAND.md` §7 (~line 350) still lists "energy bars ב-Gamer" as an allowed visual; proposed wording update pending Adi (not edited unilaterally — brand doc).
- **קשור ל:** `pkg/vibe-check-battery`, `docs/sessions/daily-vibe-check/` (origin of the selector + `vibe_type` contract), `pkg/fix-runtime-theme-switch` (web-preview-unreliable precedent), `BUFF_BRAND.md` §7.5 (Gamer palette).

### IN-2026-05-28-01: LanguageContext.reloadApp() was a no-op — he↔en switch never restarted the layout

- **תאריך:** 2026-05-28
- **מקור:** CC — discovered while building `pkg/settings-language` (in-app language switcher in Settings).
- **תיאור:** The header doc-comment on `src/contexts/LanguageContext.tsx` claimed a he↔en switch triggers an expo-updates reload OR a manual-restart Alert. In reality `reloadApp()` was an empty `return;` no-op. `setLanguage()` updated the i18n strings and called `I18nManager.forceRTL(targetRTL)` (which only takes effect at the *next* app launch), then `await reloadApp()` did nothing — no reload, no prompt. Net effect: switching language flipped the text immediately but left the layout direction (RTL↔LTR) wrong until the user manually killed and reopened the app, with no indication that was needed. This latent gap also affected the existing auth-screen globe `LanguagePicker` — the only place the picker was wired up before this package.
- **השפעה:** UX — the language switch appeared half-broken (text flips, layout doesn't). The new Settings "Language" rows (parent + child) would have shipped with the same defect had we "reused the existing flow" as originally scoped.
- **סטטוס:** `resolved` — fixed in `pkg/settings-language` (this commit). `reloadApp()` now shows a confirm Alert (new `language.restart{Title,Message,Confirm,Cancel}` keys) and on confirm calls `Updates.reloadAsync()` with a `.catch()` fallback for dev clients / Expo Go (where `reloadAsync` throws — strings + `forceRTL` are already applied, so the flip lands on the next manual restart).
- **קשור ל:** `pkg/settings-language`, `src/contexts/LanguageContext.tsx`, `src/components/LanguagePicker.tsx` (auth-screen picker shared the bug), `src/components/LanguagePickerModal.tsx` (new shared modal).

### IN-2026-05-27-05: daily_progress upsert silently failed in prod since 2026-04-09

- **תאריך:** 2026-05-27 (Hat-3 regression test of PR #100)
- **מקור:** CC — discovered during post-merge Hat-3 testing on Pixel_7 emulator. Tapped a task to mark complete; UI flipped to ✓ with "Phase Complete!" but DB row never appeared. SQL query confirmed last successful `daily_progress` write was 2026-04-09 — 48 days of silent failures.
- **תיאור:** `useChildProgress.completeTask` (`src/hooks/useChildProgress.ts:310-330`) used `supabase.from('daily_progress').upsert(...,  { onConflict: 'family_id,child_id,date,task_id' })`. supabase-js translates this to PostgREST `POST` with `on_conflict=family_id,child_id,date,task_id`, which generates `INSERT ... ON CONFLICT (family_id,child_id,date,task_id) DO UPDATE`. **But `daily_progress` had no unique index/constraint matching that column tuple** — Postgres returned `42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`. supabase-js surfaced this as a non-null `error`; the client's `if (!error)` guard suppressed the subsequent `credit_vault` update; React state never reverted the optimistic flip. Net effect: kid taps ✓, sees BUFFs incremented, reloads → ✗ back, balance reset.
- **השפעה:**
  - **48 days of broken task completion** for any kid using the mobile app. Lovable (web) likely used a different code path and was unaffected — explains why Adi's 3 returning kids (Etay/Leia/Mattan per `project_buff_war_non_return`) seemed to engage while mobile users churned.
  - **PR #100 (view-as-child) hot-spot:** the gate-removal in this PR newly allowed parent-in-preview taps to reach the mutation. Before #100, the read-only gate prevented `completeTask` from firing in view-as-child Gamer mode. Removing the gate exposed the latent bug — but the bug pre-dates #100 (Mint kids on mobile have been hitting it since 2026-04-09).
  - **Children Mode users on shared parent devices** (~65% of families per design doc) — every task completion since April 9 has been silently lost. The "tap, see ✓, reload, see ✗" feedback loop is consistent with the habit-fragility hypothesis in `project_buff_anchor_theory`.
- **סטטוס:** `resolved` — fixed in `pkg/daily-progress-upsert-fix` (this commit). Migration 016 adds `CREATE UNIQUE INDEX daily_progress_family_child_date_task_unique ON daily_progress (family_id, child_id, date, task_id)`. Pre-flight verified 0 duplicate groups in 1,372 prod rows → index creates cleanly with no data migration. Verified end-to-end on emulator: post-migration tap created a real row attributed to the correct child (`child_id` = אמי, not parent עדי). Test row + credit_vault row deleted as cleanup.
- **קשור ל:** `pkg/daily-progress-upsert-fix`, PR #100 (`pkg/view-as-child-interactive`, which exposed the bug), `project_buff_war_non_return` (memory), `useChildProgress.completeTask` / `useChildProgress.uncompleteTask` (`src/hooks/useChildProgress.ts:310-351`).

### IN-2026-05-27-04: Bilingual plumbing regression class — onboarding inserted English tasks into Hebrew users' DBs

- **תאריך:** 2026-05-27
- **מקור:** Noa Morag (parent user) → Adi 2026-05-27 feedback: "המסכים אצלי מופיעים בעברית אבל המשימות באנגלית גם בעברית". CC investigation traced the root cause and identified that the same bug class had already manifested twice with different fingerprints, without any guardrail to prevent recurrence.
- **תיאור:** Two independent code paths exhibited the same root cause — incomplete plumbing of bilingual data between in-memory shape (`{ en, he }` literals) and DB/display layers:
  - **Fingerprint A — INSERT side, monolingual write of bilingual data**: `src/screens/onboarding/unified/UStep5_Preview.tsx:179 + :196` hardcoded `t.title.en` when inserting onboarding starter tasks, even though a `lang` variable was computed two lines above. Every Hebrew-locale parent received English starter task titles in `tasks.title`.
  - **Fingerprint B — SELECT side, bilingual ignored**: `ParentRewardsScreen.tsx:68`, `ChildRewardsScreen.tsx:69`, `GamerRewardsScreen.tsx:102` issued `.select('id, title, emoji, ...')` against `store_rewards` — omitting `title_he` even though the column was populated correctly by UStep5_Preview's reward INSERT. Hebrew-locale users saw English starter rewards.
- **השפעה (evidence base):**
  - **DB query 2026-05-27** confirmed only 2 families in production data had English starter tasks: Noa `a29f83d9-b9eb-47cc-a90b-0ab078b25c7c` (created 2026-05-26 via buff-mobile onboarding) and Adi `37d6a2bd-dc0e-4d0f-8a4c-de51becfdcc8` (own QA pass 2026-05-26). Both got 5 English starters each — exactly the slice that UStep5_Preview inserts. Noa's older Lovable-era family `29f12376-...` (created 2026-02-03) had 0 English tasks; all 14 user-typed Hebrew. Conclusion: bug is **not** a Lovable migration artifact — it's current buff-mobile onboarding behavior, and would affect 100% of new parents completing the flow.
  - **Volume gating today**: the count is "only 2" because buff-mobile is pre-Play-Store; few users have completed full onboarding. 4 other recent parents (NewUser, ParentTest520, TestUser, plus one more) created profiles but did not reach UStep5_Preview INSERT, so they have 0 tasks at all. Going to public Play Store launch with this bug means every new parent in Hebrew sees English titles for the first task batch.
- **תיקון (this commit):**
  - `pkg/i18n-string-plumbing-fix` — systemic fix, not point fix. Adi chose systemic over point fix after CC presented the trade-off matrix (point fix = 30 min + bug recurs; systemic = ~2-3 hours + guardrail prevents recurrence).
  - **Single source of truth helper** at `src/lib/i18nString.ts`: `pickLang(I18nString, lang)` for in-memory bilingual literals; `pickI18nColumn(row, lang)` for DB rows with bilingual columns; `bilingualForDb(I18nString)` for writing into bilingual DB columns. 16 unit tests cover locale variants and null/empty fallbacks.
  - **INSERT side** (UStep5_Preview): tasks INSERT now writes `pickLang(t.title, activeLang)` — locale-appropriate. Rewards INSERT spreads `...bilingualForDb(r.title)` — same shape, helper-routed.
  - **SELECT + display side** (3 reward screens): added `title_he` to SELECT and routed every `reward.title` render through `pickI18nColumn(reward, i18n.language)`.
  - **Guardrail**: `scripts/check-bilingual-access.js` + `npm run check:i18n-access` — regex-based audit that rejects direct access to `.title.en`, `.title.he`, or `.title_he` outside `src/lib/i18nString.ts`. Run today returns 0 violations across 155 files. Defers a proper ESLint rule until ESLint itself is set up in the repo (no current config or `npm run lint`). When ESLint lands, the rule should be ported to `eslint.config.js` and the standalone script deleted.
  - **Backfill of historical data**: Phase 5 ran a single SQL UPDATE via Supabase MCP touching exactly 10 rows (5 starter tasks × 2 families — Adi + Noa). English titles replaced with the canonical Hebrew strings from `onboardingData.ts STARTER_TASKS_BY_CHALLENGE`. Post-state verification confirmed 0 English starter tasks remain in the DB. The UPDATE was reviewed and approved before execution.
- **Architectural decision (logged here, not promoted to D-log — minor):** for `tasks`, kept the single-column `title` schema rather than adding a `title_he` companion column. Reasoning: at the time of writing, ~72% of tasks per family are user-typed Hebrew (Noa: 13 user + 5 starter); the bilingual column would be NULL for the majority of rows and create staleness on edit. The bilingual-column pattern remains correct for `store_rewards` where the source data is a 1:1 designed library. If future use cases need live language switching for tasks (rare for an Israel-first MVP per current product framing), a follow-up package can introduce `tasks.title_key` as a translation-key reference for starters only, leaving user-typed rows unchanged.
- **General lesson:** any code that touches bilingual data must respect the contract end-to-end. Half-finished plumbing (data is bilingual on one side, monolingual on the other) causes silent data quality bugs that look like UI bugs at the user surface. The helper + audit script make the contract explicit; future bilingual fields must use them.
- **סטטוס:** `resolved` — shipped 2026-05-27 in `pkg/i18n-string-plumbing-fix` (4 commits: `da8d82a` helper, `34e21db` INSERT + display, `b1119c6` guardrail, plus Phase 6 docs commit). Hat-4 verification by Adi pending: complete a fresh onboarding in Hebrew on Android emulator, verify all 5 starter tasks render Hebrew; switch device locale to English and complete another family's onboarding, verify English; confirm the existing 10 backfilled rows display Hebrew for Adi/Noa accounts.
- **קשור ל:** `pkg/i18n-string-plumbing-fix`, IN-2026-05-27-03 (notification row icon affordance — Noa's parallel feedback), IN-2026-05-27-02 (family code accessibility — Noa's parallel feedback), IN-2026-05-27-01 (view-as-child read-only — Noa's parallel feedback). Future package suggestion: `pkg/eslint-setup` to introduce ESLint + port the guardrail rule properly.

### IN-2026-05-27-03: `task_completed` notification icon read as a checkbox affordance

- **תאריך:** 2026-05-27
- **מקור:** Noa Morag (parent user) → Adi 2026-05-27 feedback: "יש סיבה שהמשימות מופיעות בסימון של יכולת בחירה אבל אין אפשרות בחירה?". Adi framed it broadly as "the notification bell isn't intuitive enough"; CC narrowed it to the row-level icon after reading `NotificationRow.tsx`.
- **תיאור:** `NotificationRow.tsx:36` rendered `task_completed` rows with `checkmark-circle-outline` as the leading type-tag icon. The icon was chosen semantically (✓ = task done) but visually overlaps with the universal checkbox / toggle affordance — a circle with a check inside is the standard "select me" / "mark off" UI control. Users (parents reading the feed) saw the icon next to "X completed task Y" rows and tried to interact with the icon as if it were a control; the icon is purely decorative and the whole row Pressable is the actual hit target. Affordance ≠ behavior → friction + a feeling of "this surface doesn't respond to me."
- **השפעה:**
  - User-facing: parents (per Noa's report) feel the surface is broken even though the bell tap and row tap both work.
  - Pillar 2 risk: a feeling that the parent surface "doesn't respond" trains the parent to ignore the feed — exactly opposite to the design goal of a calm, glanceable history.
  - General lesson for future feed/list UIs: **decorative type-icons must not visually overlap with interactive control patterns** (checkbox, toggle, radio). When picking an icon for a type-tag, prefer shapes that read as labels (flag, bookmark, tag, leaf, gift) over shapes that read as toggles (check-in-circle, radio-on, switch).
  - The original SPEC for `pkg/parent-notification-feed` (OQ-B13 — equal-weight rows decision) was right about the principle (no per-type color emphasis, neutral row), but missed that the specific `checkmark-circle-outline` icon read as interactive. SPEC review checklist gap.
- **תיקון:** `fix/parent-notification-affordance` (this commit). Two small changes:
  1. `NotificationRow.tsx:36` — `checkmark-circle-outline` → `flag-outline` (neutral type-tag, no toggle affordance).
  2. `ParentNotificationBell.tsx` — added light haptic on press + solid `notifications` icon when there are unread items (outline when zero). The bell pressed-opacity stays at 0.7. These polish touches reinforce that the bell is a button without changing any SPEC-locked behavior.
- **סטטוס:** `resolved` — shipped 2026-05-27 in `fix/parent-notification-affordance`. Hat-4 emulator verification by Adi pending: tap the bell on the parent dashboard, confirm haptic + solid icon when unread; open NotificationFeed and confirm `task_completed` rows show a flag icon (not check-circle) and tapping the row marks read + navigates.
- **קשור ל:** `docs/sessions/parent-notification-feed/SPEC.md` OQ-B13 (equal-weight rows), `fix/parent-notification-affordance`. Noa's other 2026-05-27 feedback: IN-2026-05-27-01 (read-only view-as-child), IN-2026-05-27-02 (family code surface), PR #101 (i18n sweep).

### IN-2026-05-27-02: Family code was unreachable from the Dashboard

- **תאריך:** 2026-05-27
- **מקור:** Adi — reported that Noa (real user) couldn't find a way to send Leia the join link after finishing onboarding. CC investigation confirmed the gap.
- **תיאור:** The family code (`families.short_code`) is shown to the parent in exactly two places today: (1) a big purple card at the end of unified onboarding (`UStep8_Complete.tsx:145-154`) with `codeHint`, and (2) Settings → Account → Family code (`ParentSettingsScreen.tsx:42-53`) as a tap-to-copy row. **No surface on the Parent Dashboard.** Noa saw the code at end-of-onboarding, didn't copy it on the spot, and after returning to the dashboard had no way to retrieve it without digging into Settings → Account — a surface she didn't think to check.
- **השפעה:**
  - **The "kids never log in" design (per CLAUDE.md memory `feedback_kids_never_login`) hinges on parents being able to share the family code with kids who have a separate device.** Without an accessible surface, that flow is broken in practice even though the mechanism (`ChildJoinScreen` + orphan-claim RPCs) is fully implemented.
  - **Pre-written i18n keys went unused.** `familyCode.share`, `familyCode.showQR`, `familyCode.sendInvite`, `familyCode.microcopy`, `familyCode.addChild`, `familyCode.scanToJoin`, etc. (en.json + he.json L1195-1223) describe a richer "Add child / share / QR / scan" UI that was planned but never built. Recommend treating those as a future package (slug suggestion: `pkg/family-code-rich-share` — would add QR + scan-to-join flows; gated on `buildJoinUrl` deep link becoming usable, which is Option B / post-RevenueCat per CLAUDE.md FLAGs).
  - **`useChildrenDashboard` doesn't expose `user_id`/join-state.** Adding a per-child "Send invite" affordance (one approach considered) would require extending the hook. The chosen approach (family-level card below the children list) sidesteps this since the code is family-scoped anyway.
- **סטטוס:** `resolved` — fixed in `pkg/invite-card-on-dashboard` (this commit). A new `inviteCard.*` i18n namespace was added (7 keys, en+he) and a family-level card was inserted in `ParentDashboardScreen.tsx` below the Today children loop. The card uses React Native's built-in `Share.share()` (no new dependency) and reuses the dynamic `expo-clipboard` import pattern from Settings. The `shareMessage` is a draft (`inviteCard.shareMessage`); Adi can rewrite it without code changes.
- **קשור ל:** `pkg/invite-card-on-dashboard`, CLAUDE.md memory `feedback_kids_never_login`, `feedback_marketing_why_what`, open FLAG "Invite Link Option B (deep link `buff://join/:code`, post-RevenueCat)", `src/lib/buffConfig.ts:26` (`buildJoinUrl` — unused for now).

### IN-2026-05-27-01: View-as-Child was implemented as read-only — broke the majority use case

- **תאריך:** 2026-05-27
- **מקור:** Adi — reported via bug-report prompt. The parent's "צפה כילד" mode rendered the task list (and rewards / Vibe Check) as non-interactive. CC investigation confirmed via grep + read of the four affected screens.
- **תיאור:** Six client-side gates keyed on `ModeContext.isChildPreview` short-circuited child interactions whenever a parent entered preview-as-child. Locations: `GamerTasksScreen.tsx` (early-return in `onTaskTap` + `disabled` on the check-circle + `disabled` on Suggest CTA), `GamerRewardsScreen.tsx` (early-return in `handleClaim` + `disabled` on redeem + `disabled` on Suggest), `ChildDashboardScreen.tsx` (`!isChildPreview` in `shouldPromptVibe`), `GamerDashboardScreen.tsx` (`!isChildPreview` in `shouldPromptVibe`). Per the L61–63 comment in `ChildDashboardScreen.tsx`, the original intent was "skipped entirely during parent preview to avoid corrupting the kid's data with parent taps" — a design assumption that contradicts the actual deployment reality.
- **השפעה:**
  - **The "preview" framing was wrong for the majority of families.** Per current product design (CLAUDE.md + Adi's memory `feedback_kids_never_login`), kids never see a login screen and ~65% of children use the parent's device. In those families view-as-child IS the kid's actual interface — not a preview, not a parent-supervised "what would the kid see" inspection mode. The read-only behavior made the app unusable for those kids: they could not complete a task, redeem a reward, or log a vibe.
  - **No mutation / RLS change was needed.** `useChildProgress.completeTask` (`src/hooks/useChildProgress.ts:310-330`) already derived `childId = previewChildId ?? profile?.id`, so the write would have been attributed correctly. RLS on `daily_progress`, `credit_vault`, `store_rewards`, `tasks`, `daily_vibe` is family-scoped (`family_id = get_my_family_id()`), and the parent's auth session passes the policy for any child in the family — verified via Supabase MCP `pg_policies` query on 2026-05-27. The whole bug was a client-side gate.
  - **Visual cues retained.** The "Parent Preview — tap to exit" banner (ChildTabs L96, ChildDashboard L129, ChildSettings L77, GamerDashboard L215) and the `'Preview'` display-name swap in greetings stay — they help the parent recognize they're in preview without blocking the kid's interactions.
  - **Mint-mode task card was never gated.** `PhaseTaskCard.tsx` had no `isChildPreview` check, so Mint kids on a parent device were already able to complete tasks end-to-end. The bug was Gamer-specific (impacting Itay's UX and any teen on shared device) plus the Vibe Check on both themes.
- **סטטוס:** `resolved` — fixed in `pkg/view-as-child-interactive` (this commit). Hat-3 emulator verification deferred to Adi: she should confirm on the Android emulator that (a) tap-to-complete works in view-as-child on both Mint and Gamer themes; (b) reward redeem fires the Alert; (c) Vibe Check modal opens on first entry of the day; (d) the completion shows up under the correct child when she switches back to the parent dashboard.
- **קשור ל:** `pkg/view-as-child-interactive`, CLAUDE.md memory `feedback_kids_never_login`, `src/contexts/ModeContext.tsx`. Proposes a new DECISIONS_LOG entry (Adi to author): "View-as-child is the kid's actual interface on shared devices — no read-only gates."

### IN-2026-05-25-02: Lost-work pattern — branches paused > 5 days are at deletion risk

- **תאריך:** 2026-05-25 (discovered during `pkg/sentry-eas-resumption` Phase 0 diagnosis)
- **מקור:** CC — full diagnosis of why `pkg/expo-health-and-eas-android` (Phases 0-3 done, AAB v8 built) + `pkg/sentry-crash-monitoring` (Phases 0-3 done, v9 IN_PROGRESS) had all their commits absent from `main` despite explicit pause-and-resume documentation (`RESUMPTION_NOTES_2026-05-16.md` in git history at `b5c723e`, never landed on main).
- **תיאור:** Between 2026-05-16 (pause point) and 2026-05-25 (resumption attempt), both branches were deleted before regression testing resumed. Verify-Before-Delete Protocol (CLAUDE.md, post-2026-05-04 incident) was bypassed because the verbal "merged" check + branch cleanup happened with no merge actually performed. The branches were squash-merged or commits cherry-picked **without their Sentry/EAS work** — selective loss confirmed by 77 commits landing on main from 5/16 to 5/25 (vibe-check, teen-ui-buddy-character, FCM, buddy-sync, dashboard-toggle, timetable-import-fixes, anchor-recovery, yesterday-recap, dashboard-clarity-cleanup, parent-feed, mobile-quickstart) but **zero** Sentry/EAS commits.
- **השפעה:**
  - 9 days of phase-complete work erased. Recovery via `pkg/sentry-eas-resumption` (PR #85, merge commit `20fa598`, 2026-05-25) cost ~3 hours of CC time + 1 EAS build slot + 1 PR review cycle.
  - Cloud-side artifacts survived (EAS keystore `dG1dqozJHO`, secret `SENTRY_AUTH_TOKEN` id `da05ed42`, Sentry DSN, Play Console listing) — only the **code** was lost. Recovery would have been much costlier had any of these been rotated/revoked.
  - Mitigation: when pausing a package for > 5 days with phase-complete commits, **merge those commits to main via PR even mid-package** (don't wait for the package to fully complete). Phase-complete = passed TESTS.md criteria and committed. Subsequent phases can land in follow-up PRs. This requires no rule change to Verify-Before-Delete (the existing protocol is sufficient); it's a behavioral pattern to internalize before any pause that may extend past a week.
  - Related observation: long-paused branches are also at higher risk of merge conflicts as main advances. The 9 days of feature work landed on top of where v8/v9 were built — even if the branches had survived, they'd have needed rebase + retest.
- **סטטוס:** `resolved` — pattern documented, recovery shipped via `pkg/sentry-eas-resumption` (PR #85, merge `20fa598`). D-2026-05-25-02 ties this to Verify-Before-Delete Protocol reinforcement. Future packages: apply the 5-day rule.
- **קשור ל:** D-2026-05-25-01 (Sentry re-adoption), D-2026-05-25-02 (protocol reinforcement), CLAUDE.md § Verify-Before-Delete Protocol, deleted branches `pkg/expo-health-and-eas-android` + `pkg/sentry-crash-monitoring` (recoverable only via `git show b5c723e:...`).

### IN-2026-05-25-01: First trigger on `public.profiles` introduced for lifetime-grant mechanism

- **תאריך:** 2026-05-25
- **מקור:** CC — discovered during `pkg/pending-lifetime-grants` Phase 1 planning that the user's prompt assumed a `handle_new_user` trigger on `auth.users` to extend. Live-DB inspection: **no triggers existed on `auth.users` at all**, and `handle_new_user` did not exist.
- **תיאור:** The package introduces the first AFTER INSERT trigger on `public.profiles`: `tg_profiles_after_insert_grants`. It calls two SECURITY DEFINER functions (`grant_lifetime_if_pending(profile_id)` + `grant_lifetime_if_in_window(profile_id)`) that auto-flip `profiles.is_lifetime_access=true` for Lovable migrants whose email is in `pending_lifetime_grants`, or for any parent signup during the 2026-05-30 → 2026-06-30 beta window.
- **השפעה:**
  - **Profile creation today is fully client-side** ([AuthContext.tsx:417](../src/contexts/AuthContext.tsx:417)). The new trigger fires *after* every profile insert regardless of the auth path — Google OAuth, email/password, ChildJoin, future providers. Any future package that creates profiles will pass through this trigger.
  - **Open window is hard-coded (2026-05-30 .. 2026-06-30 Asia/Jerusalem)** in `grant_lifetime_if_in_window`. Self-disables silently after 6/30 — no cleanup needed. If Adi wants to extend, requires a follow-up migration that edits the function.
  - **Edge case: orphan auth.users.** Anyone signed up via Google OAuth without completing onboarding (e.g., `moragnoa@gmail.com` 2026-05-21) has an `auth.users` row but NO `profiles` row. The trigger only fires on profile insert, so they get auto-granted only when they finish onboarding and a profile row is created.
  - **Functions have EXECUTE revoked from PUBLIC** (only `postgres` + `service_role` retain it). The trigger itself runs in the inserting transaction's context with SECURITY DEFINER, so the REVOKE doesn't break trigger firing — verified via smoke test. The advisor warnings `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable` are clean post-REVOKE.
- **סטטוס:** `resolved` — shipped 2026-05-25 via migration 015. Hat-3 emulator verification deferred to Adi (TESTS.md Phase 4).
- **קשור ל:** `pkg/pending-lifetime-grants`, `docs/sessions/beta-2026-06-01/TRACK_5_findings.md` (originating Option B recommendation), migration `migrations/015_pending_lifetime_grants.sql`.

### IN-2026-05-20-01: SPEC Decision 9 (gender-aware HE friendship labels) — column doesn't exist on profiles

- **תאריך:** 2026-05-20
- **מקור:** CC — surfaced during `pkg/teen-ui-with-buddy-character` chunk 2c-a planning (i18n keys for friendship-level labels).
- **תיאור:** SPEC §"Architectural Decisions" Decision 9 ([SPEC.md:235](sessions/teen-ui-with-buddy-character/SPEC.md:235)) reads: "HE friendship-level labels are gender-aware, child-driven (model A). Form per child's `gender` field: `boy` → masculine-plural; `girl` → feminine-plural; `other` or `null` → masculine-plural fallback." Schema verification via Supabase MCP on 2026-05-20 found that `profiles` has only `display_name` and `role` — **`gender` column does not exist**. Decision 9 cannot run as written today.
- **השפעה:** Chunk 2c-a still added all 3 gender variants of the keys (`buddy.friendshipLevel.L{1..5}.{boy,girl,other}` × HE) so the i18n surface is future-proof. EN duplicates the same string across all 3 keys per level (English isn't gendered). Day-1 behavior: any future screen consuming these keys must resolve to the `other` variant unconditionally (masculine-plural), because no gender data exists to drive a branch. The Phase 2 screens (`GamerMyStatsScreen` 5B, `ChildSettingsScreen`) consume `LEVEL N` from `LevelPill` and not the friendship label — impact lands in Phase 3 (5A "Me & Buddy" screen) when the friendship-level label is rendered.
- **סטטוס:** `open` — a future package can add `profiles.gender` + an onboarding question, then flip the resolver to use the real value. Zero i18n changes needed at that point. Slug suggestion: `pkg/add-profile-gender-for-friendship-labels`. Decision 9 in the SPEC stays valid as the *target* behavior — only the day-1 implementation lands as uniform masculine-plural.
- **קשור ל:** `pkg/teen-ui-with-buddy-character` chunks 2c-a + 3b (5A), SPEC.md Decision 9.

### IN-2026-05-16-01: Egg/evolution-stage removal queued

- **תאריך:** 2026-05-16
- **מקור:** Adi + CC — surfaced during pkg/teen-ui-with-buddy-character Phase 1 design (Capybara added as parallel buddy, exposed the question "what does a capybara's egg look like?").
- **תיאור:** The pre-character evolution mechanic in [src/types/pet.ts:5-13](../src/types/pet.ts:5) (`EvolutionStage = 'egg' | 'hatchling' | 'scout' | 'guardian'` with thresholds 0/3/7/13 days) is vestigial pre-V0.5 spec drift. V0.5 Friendship Levels already start with the character visible at L1 day-0. The egg layer:
  - Violates Pillar 1 (extrinsic gamification — egg-hatch reveal is the exact dopamine-trigger anti-pattern BUFF rejects, cf. D-2026-05-02-07 streaks rejection).
  - Violates Pillar 2 (a child who uses BUFF day 1+2 then stops never meets their buddy — soft failure framing).
  - Violates Pillar 3 (app decides when child sees their own pick — no voice).
  - Breaks cross-species coherence (wolves, capybaras, pandas, unicorns don't hatch from eggs).
  - Is explicitly flagged as "reconciliation deferred" in [BUFF_BUDDY_SYSTEM.md:7-9](BUFF_BUDDY_SYSTEM.md:7).
- **השפעה:** Touches `src/types/pet.ts` (remove `EvolutionStage`, `EVOLUTION_THRESHOLDS`, `getEvolutionStage`, `getNextEvolutionThreshold`, `STAGE_VISUALS`, default `evolution_stage: 'egg'`), `src/components/PetDisplay.tsx`, `src/components/EmojiPet.tsx`, any `pet.stage.*` i18n keys, and the contradictory line at [BUFF_BUDDY_SYSTEM.md:94](BUFF_BUDDY_SYSTEM.md:94) ("egg/hatchling/scout/guardian"). `pet_state` is AsyncStorage-only so no DB migration needed — existing `evolution_stage` values can be read-once-then-ignored.
- **סטטוס:** `open` — queued as `pkg/drop-egg-evolution-stage` to run after `pkg/teen-ui-with-buddy-character` ships. The current package already builds against a no-egg world (BuddyHero renders Wolf STORMY / Capybara LUNA at friendship_level L1 from day 0).
- **קשור ל:** D-2026-05-16-?? (Adi to formalize in BUFF_DECISIONS_LOG.md), `pkg/teen-ui-with-buddy-character` (this package), `pkg/drop-egg-evolution-stage` (queued follow-up).

---

### IN-2026-05-14-04: Runtime theme switch (Mint ↔ Gamer) blanked the child tab bar

- **תאריך:** 2026-05-14
- **מקור:** Adi + CC — surfaced visually during pkg/hide-paywall-from-child preview verification.
- **תיאור:** Toggling between Mint and Gamer themes from the child Settings → Theme picker caused the entire tab navigator to render as a black screen with no tabs. Affected all child screens. Root cause was two compounding sources of React Navigation reference instability in `src/navigation/ChildTabs.tsx`:
  1. **Inline `tabBarButton: () => null`** and **inline `tabBarItemStyle: { display: 'none' }`** — fresh arrow function and object literal references every render. React Navigation's reconciler treats these as "different component" / "different style" and re-mounts the tab item; the conditional toggle on theme change cascaded into unmount loops the navigator couldn't recover from.
  2. **Inline `screenOptions` closure** — fresh function every render, causing per-route options re-evaluation on every parent render.
- **השפעה:** Adi could not switch themes mid-session without a full app restart. Blocked any UI verification cycle that involved toggling themes.
- **סטטוס:** `resolved` — fixed in `pkg/fix-runtime-theme-switch` (PR #41, commit b514c0b). Fix uses module-level stable constants (`HIDDEN_TAB_OPTIONS`, `HIDDEN_TAB_BUTTON`), `useCallback`-memoized `screenOptions`, per-screen `options` instead of conditional in-screenOptions, plus a self-redirect useEffect in `ChildMyStatsScreen` that navigates away if the user lands on the hidden tab after a theme switch.
- **קשור ל:** `pkg/fix-runtime-theme-switch`. Pending Adi's emulator verification (web preview was unreliable for repeated theme-toggle cycles).

---

### IN-2026-05-14-02: Paywall / subscribe CTAs visible to children — should be parent-only

- **תאריך:** 2026-05-14
- **מקור:** Adi — discovered while testing pkg/teen-ui-my-stats-lite in Pastel theme as Itay (child role)
- **תיאור:** Four places in the child UI showed payment/subscribe CTAs to non-subscribed users without checking that the logged-in user is a child (vs parent). The intended product behavior is: only parents see "subscribe" prompts since they are the buyer. Children should see a softer "ask your parent to unlock" message or just have the locked content hidden — never a CTA they can't act on.
  - `src/screens/child/ChildDashboardScreen.tsx:182` (Pastel) — "Buddy locked 🔒 → Unlock ✨" → opened Paywall
  - `src/screens/child/ChildRewardsScreen.tsx:78` (Pastel) — replaced shop with full `PaywallContent`
  - `src/screens/child/GamerRewardsScreen.tsx:139` (Gamer) — same — replaced shop with `PaywallContent`
  - `src/screens/child/ChildSettingsScreen.tsx:130` — locked skin picker overlays + Paywall nav
- **השפעה:** Children saw "subscribe" CTAs they couldn't action. Mild UX bug for non-paying families.
- **סטטוס:** `resolved` — fixed in `pkg/hide-paywall-from-child` (PR #40, commit a8c9424). Added `viewMode === 'child'` gates next to every `isSubscribed` check; replaced CTAs with calm "ask your parent" empty states. New i18n namespace `childLockedState.*` (EN + HE). Parent flow unchanged.
- **קשור ל:** `pkg/hide-paywall-from-child`.

---

### IN-2026-05-14-03: ChildJoin doesn't reconcile with pre-existing orphan profiles

- **תאריך:** 2026-05-14
- **מקור:** Adi — discovered trying to log in as Itay via the family-code flow while testing pkg/teen-ui-my-stats-lite
- **תיאור:** When a parent pre-creates a child profile during onboarding, the profile may end up with `user_id IS NULL` (no auth user linked) until the child signs in. When the child later joins via ChildJoin (name + family code), the flow creates a NEW profile linked to a new auth user, rather than claiming the existing orphan profile that matches the same name + family_id. Result: duplicate "child" profiles in the same family, only one of which is functional.
  - Reproduced on family KWYEL5: existed profile `איתי` (Hebrew, no user_id, created 2026-04-17). Adi entered name "Itay" + code "KWYEL5" → new profile `Itay` (Latin) created 2026-05-14 16:34, linked to existing `itay@buff.app` auth user. Original `איתי` orphan still dangling.
  - Same family also has `עדי בדיקה` orphan profile (no user_id, created 2026-04-17) from earlier test flow.
- **השפעה:** Data integrity — duplicate child profiles per family. Adi might also be confused about which is "real" Itay when she sees both in her family overview.
- **סטטוס (עודכן 2026-05-16):** `code-complete-pending-verify` — fix landed in `pkg/childjoin-claim-orphans` (branch `claude/lucid-sinoussi-235144`, awaiting Adi's emulator verification + PR merge).
  - **Approach:** Atomic claim via two new `SECURITY DEFINER` RPCs — `preflight_claim_orphan` (anon-callable; pre-validates before auth.signUp to avoid orphan auth.users rows on block) and `claim_orphan_profile` (authenticated; UPDATE with `user_id IS NULL` race guard). Both live in production Supabase as migrations `20260516082239` + `20260516082341`. Repo SQL: `migrations/007_childjoin_claim_orphan_profile.sql`.
  - **Matching:** `lower(normalize(trim(display_name), NFC))` on both sides + case-insensitive on `families.short_code`. Robust for Hebrew diacritics and Latin casing; intentionally does NOT cross scripts. Adi's Hebrew-vs-Latin edge case ("איתי" parent-orphan + child types "Itay") falls through to `cross_script_candidate_exists` reason → blocking error UX in Hebrew copy ("בקש מההורה לוודא את השם") — forces parent confirmation, prevents one sibling from claiming another's orphan.
  - **Client wiring:** `AuthContext.signUp` calls preflight before `supabase.auth.signUp`; on `match_found` calls claim post-auth; on `no_orphan_match` falls back to today's INSERT; on `ambiguous_match`/`cross_script_candidate_exists` returns blocking error tagged `auth.orphanAmbiguous`; ChildJoinScreen surfaces it via new i18n key.
  - **Verification done at code/RPC level (CC):** 8/8 SQL assertions passed (no-orphan / exact / trim / case-insensitive-Latin / ambiguous / cross-script / family-not-found / null-input / no-auth); typecheck zero errors; both i18n files parse. End-to-end Android emulator verification (5 cases per `docs/sessions/childjoin-claim-orphans/TESTS.md § Phase 2`) **pending Adi**.
- **Cleanup (2026-05-17, executed):**
  - **Deleted:** `Itay` bug-residue profile (`3dd54491-...`) + its orphan auth.users row (`9760c8b9-...`) created by the bug on 2026-05-14. 0 user data; cascaded 1 `buddy_relationships` + 1 `buddy_daily_check` row.
  - **Deleted:** stale test orphan `עדי בדיקה` (`04920920-...`); cascaded 4 tasks + 2 rewards + 2 buddy rows. Name self-identified as test data.
  - **Kept:** legitimate orphan `איתי` (`0b702f2d-...`, created 2026-04-17 by Adi's onboarding) as the live target for Itay's emulator claim test.
  - **Authorized by:** Adi "תטפל איך שאתה חושב" 2026-05-17.
- **קשור ל:** Originally surfaced during `pkg/teen-ui-my-stats-lite`; resolved in `pkg/childjoin-claim-orphans` (see [docs/sessions/childjoin-claim-orphans/](sessions/childjoin-claim-orphans/)).

---

### IN-2026-05-16-01: preflight_claim_orphan blocked returning users + new siblings (regression caught in emulator test)

- **תאריך:** 2026-05-16
- **מקור:** Adi — first emulator test post-merge of `pkg/childjoin-claim-orphans`. Existing child user (`Itay` with auth.users row) tried to re-join the family and the app silently blocked them via `cross_script_candidate_exists` instead of falling through to the existing signUp→signIn flow.
- **תיאור:** The Phase 1 RPC `preflight_claim_orphan` (migration 007) had two regressions:
  1. **Returning users blocked.** preflight only looked at orphans (`user_id IS NULL`). For a family with orphans, any input that didn't NFC-match an orphan returned `cross_script_candidate_exists` — including existing users typing their own name (whose profile has `user_id IS NOT NULL` so it's invisible to preflight's orphan filter). Pre-fix flow's "auth.signUp → already registered → signIn" recovery was bypassed.
  2. **New siblings blocked.** Same root cause: any new child joining a family with orphans for OTHER children was blocked even though they're legitimately a new profile (NCFC matches no orphan).
- **השפעה:** Both regressions block legitimate flows. Returning user gets "ask your parent" alert instead of signing in. New sibling gets the same alert instead of getting a fresh profile.
- **תיקון (migration 008, `childjoin_preflight_returning_user_and_multi_orphan`):**
  - Added existing-profile pre-check at top of preflight. If a non-orphan profile in the family matches input (NFC + lower + trim), return new reason `existing_profile_match` → client falls through to signUp→signIn.
  - Constrained `cross_script_candidate_exists` to fire only when `orphan_total = 1`. With 2+ orphans and no NFC match, return `no_orphan_match` → INSERT. Tradeoff: rare real cross-script case in a multi-orphan family creates a duplicate; recovered via existing `useUnlinkedChildren.linkChild` parent banner (the original IN-2026-05-14-03 fallback mechanism).
- **Verification (CC):** 7/7 SQL scenarios pass on live family KWYEL5: existing users `Itay`/`Emmy` → `existing_profile_match`; orphan exact-match `איתי`/`עדי בדיקה` → `match_found`; new sibling `Yossi` → `no_orphan_match`; multi-orphan cross-script `Dani` → `no_orphan_match` (was blocking pre-fix); bad code `NONE99` → `family_not_found`.
- **Lesson:** Bug-fix RPCs need to model **all relevant profile states** (orphan + non-orphan), not just the new state being introduced. The original 8-case SQL test suite covered orphans + family lookup + auth but did NOT include a non-orphan returning user — a gap caught only by Adi's emulator test against real data.
- **קשור ל:** IN-2026-05-14-03 (the original bug); `pkg/childjoin-claim-orphans` hotfix.

---

### IN-2026-05-14-01: Stitch 5B shipped as "lite" — full design depends on Buddy V0.5 backend

- **תאריך:** 2026-05-14
- **מקור:** CC — during pkg/teen-ui-my-stats-lite SPEC review
- **תיאור:** The Stitch 5B "My Stats" design ([docs/teen-ui-design/me-and-buddy/5b-my-stats/design-notes.md](teen-ui-design/me-and-buddy/5b-my-stats/design-notes.md)) requires Buddy V0.5 backend infrastructure that does not exist:
  - `buddy_relationships.buddy_visible` column (the toggle for hiding the buddy character)
  - `LEVEL N ●●●●○` indicator (friendship-level system)
  - `YOUR BOOSTERS` carousel (boosters table + history)
  - "Progress to LEVEL N" bar (level XP curve)
- After surfacing this dependency, Adi chose to ship a **lite** version that shows only the 3 stats already exposed by `usePetState` / `useChildData` (BUFFs balance, successful days, current streak), deferring LEVEL/BOOSTERS/hero to a future package.
- **השפעה:** The implemented `GamerMyStatsScreen` is intentional spec drift from the 2026-05-02 Itay-approved 5B. When Buddy V0.5 backend ships (`pkg/buddy-v05-backend`), the screen will be extended to add the LEVEL pill, "Progress to LEVEL N" bar, hero image, and BOOSTERS carousel — at which point this becomes the "real" 5B.
- **סטטוס:** `resolved` for the lite scope; `deferred` for the full 5B (queued behind `pkg/buddy-v05-backend`).
- **קשור ל:** `pkg/teen-ui-my-stats-lite`, FLAG F-2026-05-03-05 (BUDDY_SYSTEM.md spec-only)

---

### IN-2026-05-17-01: Declarative notification copy convention (research-backed)

- **תאריך:** 2026-05-17
- **מקור:** CC + Adi — pkg/daily-vibe-check Phase 4 design review
- **תיאור:** During Phase 4 of pkg/daily-vibe-check, Adi pushed back on the original SPEC's copy ("[Kid] needs a moment") as too directive — implies rescuer mode. WebSearch surfaced a clear pattern from ADHD therapist sources (CHADD, ADDitude, Childhood Collective, NN/G, Toptal, PatternFly): **declarative "I noticed" framing** beats directive language for parent-child communication. Lands as a convention for ALL future parent-facing notification copies — not just SOS. Specifically: (a) frame around the kid's agency ("wanted to share / sent a signal"), (b) describe state observationally ("low energy day"), (c) avoid action verbs that put parent in rescuer mode ("needs / requires / urgent"), (d) preserve privacy — never expose the underlying score/data.
- **השפעה:** All future notification copy in `pkg/fcm-push-notifications`, `pkg/parent-notification-feed`, and any new parent-facing alerts. The Phase 4 copy in pkg/daily-vibe-check is the reference implementation (EN + HE). Future packages should reference this entry.
- **סטטוס:** `resolved` (locked as ongoing convention; not a problem to track)
- **קשור ל:** pkg/daily-vibe-check SPEC § Decisions EX-1, future pkg/fcm-push-notifications

### IN-2026-05-17-02: PRD §7.1 line 215 spec drift — Vibe Check falsely claimed "fully implemented"

- **תאריך:** 2026-05-17 (discovered 2026-05-16 in pkg/daily-vibe-check Phase 0)
- **מקור:** CC — Phase 0 spec verification of pkg/daily-vibe-check
- **תיאור:** BUFF_PRD.md §7.1 line 215 reads: *"Daily Vibe Check ... Already fully implemented in current codebase."* `grep` of `src/` for any vibe/SOS identifiers returned 0 matches before Phase 1 of this package. The claim was carried over from Lovable web, where Vibe Check WAS implemented; mobile codebase never had it. Now corrected by pkg/daily-vibe-check Phases 1-4. PRD line is stale.
- **השפעה:** PRD §7.1 line 215 needs editing to either remove the claim or replace with current state (Vibe Check shipped in mobile via pkg/daily-vibe-check beta-2026-06-01). CC does NOT touch PRD unilaterally per CLAUDE.md; Adi to apply.
- **סטטוס:** `open` (pending Adi PRD edit)
- **קשור ל:** pkg/daily-vibe-check, Decision NEW-1 in pkg SPEC, BUFF_GAP_ANALYSIS.md S-07

### IN-2026-05-17-03: 3-package sequencing for the parent notification surface

- **תאריך:** 2026-05-17
- **מקור:** Adi — Phase 4 design discussion in pkg/daily-vibe-check
- **תיאור:** During Phase 4 of pkg/daily-vibe-check, Adi raised two MVP-critical scope items that I had under-scoped: (1) **FCM push notifications** are MVP, not Phase 2 — Lovable churn root cause was parents/kids not knowing to return to the app, so push is essential. (2) **Bell icon + notification feed in parent UI** — Lovable parity gap; the mobile app today doesn't surface ANY of the 396 historical notifications. Both became sibling packages: `pkg/fcm-push-notifications` (already in CLAUDE.md FLAGs, MVP-critical S-01) and `pkg/parent-notification-feed` (new, MVP, Lovable parity). Both will read from the same `public.notifications` table that pkg/daily-vibe-check Phase 4a established as the source of truth. No rework when they land. Sequencing for beta-2026-06-01: (1) Vibe Check (this pkg, in progress); (2) FCM push; (3) bell + feed. All independent; FCM doesn't block bell+feed.
- **השפעה:** Two new packages need session folders + SPECs (CC may scaffold on Adi's signal). CLAUDE.md FLAGs needs updating to mark `pkg/parent-notification-feed` as proposed MVP (Adi to apply — CC does not touch CLAUDE.md unilaterally).
- **סטטוס:** `resolved 2026-05-19` (SPECs scaffolded on `pkg/notification-spec` planning branch; CLAUDE.md FLAGs still Adi-pending)
- **קשור ל:** pkg/daily-vibe-check Phase 4, future `pkg/fcm-push-notifications` + `pkg/parent-notification-feed`

### IN-2026-05-19-01: Cross-platform notification mechanism = single FCM HTTP v1 backend

- **תאריך:** 2026-05-19
- **מקור:** Adi — pkg/notification-spec planning session
- **תיאור:** Cross-platform notification requirement (Android now, Expo Web Phase 2 per F-073, iOS later) reconciled by routing ALL push delivery through **FCM HTTP v1 API server-side**. Client SDKs differ by platform because the OS forces it: `expo-notifications` on mobile (Android FCM / iOS APNs-via-FCM), `firebase/messaging` web SDK + Service Worker on web. Same Edge Function, same `public.notifications` table, same copy library. This unified pipeline is THE work that enables Lovable retirement when Expo Web ships — without it, web push remains unreliable PWA. Decision triggered by Adi's reframing: "אנחנו עושים מיגרציה לאפליקציה בלוובל אלינו ... בסוף אנחנו רוצים codebase אחד".
- **השפעה:** ALL future notification packages assume this backend. `pkg/fcm-push-notifications` implements; `pkg/parent-notification-feed` reads from same table. No alternative backend (e.g., OneSignal, Pusher) gets considered without explicit re-scoping.
- **סטטוס:** `resolved` (locked principle)
- **קשור ל:** pkg/fcm-push-notifications, pkg/parent-notification-feed, future iOS package, F-039, F-063, AUDIT S-01

### IN-2026-05-19-02: Notification gating = foreground + recent-activity suppression, NOT device-aware

- **תאריך:** 2026-05-19
- **מקור:** Adi — pkg/notification-spec planning session (challenged the device-aware draft)
- **תיאור:** Original SPEC draft gated push delivery by a derived `child.has_own_device` flag (shared device → no push for child events). Adi challenged: this is brittle (flag derivation is opaque), changes behavior silently when a kid transitions to own-device, and breaks "why didn't I get notified?" debug. Replaced with **generic delivery + 2-stage suppression in Edge Function**: (a) if recipient's `device_tokens.last_seen_at < 5 min` → in-app surface is already showing → skip server push; (b) if app is in foreground (handled client-side via `setNotificationHandler`) → suppress tray, show in-app toast. Achieves the same UX goal (no redundant pushes when parent already sees the event) without "shared device" determination. Architecturally simpler, future-proof, easier to debug.
- **השפעה:** `pkg/fcm-push-notifications` Edge Function uses activity-based suppression, not device-aware gating. The `notifications` table always gets the row regardless of device situation; only the PUSH delivery is conditioned. The in-app feed always sees everything. No `has_own_device` flag needs to be derived or persisted.
- **סטטוס:** `resolved` (locked principle)
- **קשור ל:** pkg/fcm-push-notifications, pkg/parent-notification-feed

### IN-2026-05-19-03: Pillar-1 extension for kid-side push — presence + autonomy-marker ONLY (the "body double test")

- **תאריך:** 2026-05-19 (amended same day with body-doubling grounding)
- **מקור:** Adi — pkg/notification-spec planning session (challenged "reward mention" draft → later proposed body-doubling framing)
- **תיאור:** I drafted E5 (kid-not-opened-N-days) push copy as `"{reward_name} עוד מחכה לך — {buddy_name} מוכן/ה"` and claimed Pillar-1 alignment because the reward is kid-chosen. Adi corrected: **any mention of reward, task, BUFFs, count, or progress in a kid-facing push converts intrinsic motivation INTO extrinsic motivation**. The reward lives in the kid's mind as their own goal; surfacing it in a push pulls ownership to the app. Pillar-1 PURIST rule for kid-side push (and any kid-facing "come back" prompt): **presence + autonomy-marker only**. Examples that pass: `"{buddy_name}: כאן כשתרצה."` / `"{buddy_name} פה. בלי לחץ."` Examples that fail (even if "gentle"): `"{reward} עוד מחכה לך"` (extrinsic), `"{buddy_name} מוכן/ה ל-2 דברים"` (quantification), `"{buddy_name} חיכה לך"` (subtle pressure / sad-buddy adjacency).
- **Theoretical grounding (added 2026-05-19 amendment):** This convention operationalizes BUDDY as a **virtual body double** for the kid (per `BUFF_BUDDY_SYSTEM.md` line 25, locked in BUFF spec). Body doubling is an established ADHD scaffold: social-facilitation theory; ACM Transactions on Accessible Computing 2024 (first academic investigation with neurodivergent participants); CHADD/ADDitude consensus practice; Focusmate / Caveday / Discord study rooms prove product-market fit at scale. The mechanism: **present, non-judgmental, non-prompting companionship reduces task-initiation activation barrier without taking ownership of motivation**. The body double doesn't drive the kid's motivation; it removes the friction of starting.
- **The "body double test"** — every kid-side copy in BUFF should pass: *would a body double say this?* A body double:
  - ❌ Doesn't quantify ("you have 2 things")
  - ❌ Doesn't reward-bribe ("X is waiting")
  - ❌ Doesn't escalate ("you missed yesterday")
  - ❌ Doesn't prompt action ("let's do it")
  - ❌ Doesn't express need or sadness ("BUDDY misses you")
  - ✅ Says: *"I'm here, ready when you are."* / *"with you, at your pace"* / *"standing by"*
- **Canonical body-doubling copy templates (locked 2026-05-19):**
  - HE: `"{buddy_name}: פה, מוכן/ה כשתרצה"` · EN: `"{buddy_name}: here, ready when you are"`
  - HE: `"{buddy_name}: לידך, בקצב שלך"` · EN: `"{buddy_name}: with you, at your pace"`
  - HE: `"{buddy_name} עומד/ת לידך"` · EN: `"{buddy_name} standing by"`
- **Reference voice** (extracted from existing i18n + BRAND §6): Coach voice for parent-facing; **friend voice / body-double voice** for BUDDY-to-kid; brief; autonomy-marker required ("בלי לחץ" / "כשתרצה" / "אולי אחר כך" / "בקצב שלך"); period-not-exclamation. Reference samples: `lowPower.banner` ("היום יום של אנרגיה נמוכה. אנחנו איתך."), `sosButton.confirmBody` ("...בלי לדבר על הציון."), `vibeCheck.dismiss` ("אולי אחר כך").
- **השפעה:** All kid-side copy in `pkg/fcm-push-notifications` (E5, E9 server push; E7, E11 local). Also applies to in-app BUDDY-mediated prompts. Parent-side copy remains governed by IN-2026-05-17-01 (declarative + connection-not-rescue) — different lens for different recipient.
- **סטטוס:** `resolved` (locked principle + theoretical mechanism); proposed `BUFF_BRAND.md §6` update to capture the body-doubling voice template + the "body double test" — Adi to apply (CC does not touch BRAND.md unilaterally per CLAUDE.md).
- **קשור ל:** pkg/fcm-push-notifications (E5, E7, E9, E11), BUFF_VALUES.md Pillar 1, BUFF_BRAND.md §6, **BUFF_BUDDY_SYSTEM.md line 25 (canonical body-double framing)**, IN-2026-05-17-01 (parent-side counterpart)
- **External research references:** Oxford CBT · Mind Vortex · ADHD Vancouver · Medical News Today · ADDA · Beyond Clinics · ACM TACCESS 2024 ([dl.acm.org/doi/full/10.1145/3689648](https://dl.acm.org/doi/full/10.1145/3689648))

---

## FLAGs פתוחים

### F-2026-05-30-01: In-app "What's New" + update-nudge mechanism (TODO)

- **תאריך:** 2026-05-30
- **מקור:** Adi, סשן תכנון Release Protocol. בקשה מפורשת: "נצטרך בהמשך דרך לעדכן משתמשים בדברים שקרו ולוודא שהאפליקציה מציעה להם לעדכן גרסה."
- **תיאור:** עם כל release צריך שתי יכולות שעדיין לא קיימות באפליקציה:
  1. **"מה חדש" בתוך האפליקציה** — מסך/באנר שמציג למשתמש את ה-user-facing release notes (עברית, WHY/WHAT לא HOW) אחרי עדכון. מוזן מה-Release Manifest (שער 0 בפרוטוקול).
  2. **Update nudge** — האפליקציה מזהה שיש גרסה חדשה ב-Play ומציעה למשתמש לעדכן. אופציות לבדיקה בסשן ייעודי: Android **In-App Updates API** (Play Core — flexible/immediate flow), או בדיקת versionCode מול endpoint, או `expo-updates` ל-OTA (לתיקוני JS בלבד, לא משנה native/versionCode).
- **השפעה:** בלי זה, משתמשים נשארים על גרסאות ישנות בלי לדעת שיצא עדכון, ולא רואים מה השתנה. רלוונטי במיוחד אחרי שיוצאים מ-internal testing.
- **סטטוס:** `open` — לא בסקופ של אף חבילה פעילה. חבילה עתידית, slug מוצע `pkg/in-app-updates`. דורש החלטת מוצר: כפוי (immediate) מול אופציונלי (flexible).
- **קשור ל:** Release Protocol (שער 5 — release notes), `expo-updates` (לא מותקן כרגע — דורש אישור dependency).

---

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
- **סטטוס (עודכן 2026-05-16):** `partially-resolved` — אודיט קוד מול ה-flag (לקראת beta 2026-06-01) הראה שרוב הסעיפים כבר מומשו ב-refactor של ה-unified onboarding (`UStep1_ChildProfile.tsx`, `UStep2_Goal.tsx`, `UStep3_Challenges.tsx`). פירוט סטטוס לפי סעיף:
  - ✅ **datetimepicker** — dep מותקן (`package.json:18` @ 8.4.4); picker חי ב-`src/screens/onboarding/unified/UStep1_ChildProfile.tsx:4, :172-181, :198-206`; פורמט "19 Oct 1998" מיוצר ע"י `formatDate()` ב-`UStep1_ChildProfile.tsx:24-27`.
  - ✅ **"Homework & grades" → "Homework & focus"** — `Homework & grades` לא קיים בקוד. גיל 9-11 משתמש ב-`"Homework & school focus"` (`src/i18n/en.json:1316`); גיל 12-14 כבר משתמש ב-`"Homework & focus"` (`src/i18n/en.json:1320`). הסעיף N/A.
  - ✅ **Step 3 ScrollView** — חי ב-`src/screens/onboarding/unified/UStep3_Challenges.tsx:73-105` עם `keyboardShouldPersistTaps="handled"` ו-`paddingBottom: 110` ל-sticky footer.
  - ⚠️ **אופציות זהות Step 2 ↔ Step 3** — filter חלקי קיים ב-`UStep3_Challenges.tsx:31-33` (מסיר את ה-mainChallenge מ-Step 3). dedup מלא דורש Section B (סעיף הבא), שעדיין לא מומש. נשאר `open` כ-polish, לא חוסם beta.
  - 🚩 **Section B ב-Step 3** — עדיין לא מומש. נשאר `open` כ-polish (Adi דחתה במפורש מ-beta 2026-06-01 scope).
- **קשור ל:** Adi הורתה לא להוסיף ל-GAP_ANALYSIS חד-צדדית. ידון בסשן עתידי + יוסכם יחד מה להכניס. סגירת הסעיפים שתועדה כאן נעשתה ב-`pkg/close-f-2026-05-03-01` (docs-only).

---

### F-2026-05-03-02: Invite Link Option B (deep linking)

- **תאריך:** 3.5.2026 (התגלה ב-2.5.2026)
- **מקור:** Claude.ai — בזיכרון של תוכניות עתידיות
- **תיאור:** אחרי דדליין RevenueCat (1.5.2026), יישום Option B של invite link:
  - רישום `buff://join/:code` ב-`handleDeepLink`
  - Pre-fill של `SignupScreen` עם invite code
  - הוספת Universal Links לתמיכה ב-HTTPS domain
- **השפעה:** Invite flow המלא עוד לא ממומש. כרגע Option A (קוד-בלבד, ללא deep link) פעיל.
- **סטטוס (עודכן 2026-05-26):** `partially-resolved` — `pkg/fix-childjoin-install-link` (PR פתוח) מיישם 2 מתוך 3 הסעיפים המקוריים:
  - ✅ **רישום `buff://join/:code`** — `src/navigation/linking.ts:30` (`ChildJoin: 'join/:code'`)
  - ✅ **Pre-fill עם invite code** — `src/screens/auth/ChildJoinScreen.tsx:24-32` (`useRoute<Route>()` + initialState מ-`params?.code`)
  - ⚠️ **Universal Links (HTTPS)** — עוד לא ממומש. עומד מאחור כי דורש עבודה ב-Lovable (`buffadhd.com/join/:code` route + assetlinks.json hosted on domain) + intentFilters ב-app.json + AAB חדש. **נשאר `open` כסעיף יחיד** — slug מוצע `pkg/childjoin-universal-link`. מצריך גם domain decision (`buffadhd.com` או `buff.app`).
- **Trigger לתיקון:** Adi בקשה 2026-05-26 (אחרי שצילמה הזמנה ל-Emi ב-WhatsApp ש-v12 הפיק — הודעה ללא URL כלל). תחילה אדי תיקנה רק את ה-URL (PR phase 1+2), אז ביקשה גם prefilled code (phase 3). RevenueCat דדליין 1.5.2026 כבר עבר; הדחייה המקורית כבר לא חוסמת.
- **קשור ל:** `pkg/fix-childjoin-install-link` (PR), `src/lib/buffConfig.ts` `buildJoinDeepLink()`, F-2026-05-26-01 (icon — מאותו בקר WhatsApp screenshot session).

---

### F-2026-05-03-03: קוד עוד ב-13-15 לאחר D-25 (הרחבה ל-13-18)

- **תאריך:** 3.5.2026
- **מקור:** D-2026-05-02-25 (תיעוד) + סשן ה-docs update
- **תיאור:** ה-docs עודכנו לטווח 13-18, אבל הקוד עוד מכיל auto-detection של mode לפי "13-15 = teen". מקומות ספציפיים לבדוק:
  - UI mode auto-detection logic
  - Hard-coded גיל ב-validation
  - Strings ב-onboarding screens אם יש מפורש "13-15"
- **השפעה:** מתבגר בן 16-18 שירשם עכשיו לא יקבל את Teen UI אוטומטית.
- **סטטוס (עודכן 2026-05-16):** `RESOLVED — CONFIRMED-NOT-APPLICABLE`.
  Re-audit during `pkg/childjoin-claim-orphans` planning (Plan Mode investigation, beta 2026-06-01 prep) confirmed once more: zero `13-15` references in code. Onboarding buckets are `'6-8' | '9-11' | '12-14' | '15-18'` ([src/screens/onboarding/unified/onboardingData.ts:14](../src/screens/onboarding/unified/onboardingData.ts)). Mode detection is role-based (`profile.role === 'child'` → Children/Gamer UI) at [src/contexts/ModeContext.tsx](../src/contexts/ModeContext.tsx) and [src/navigation/RootNavigator.tsx:102](../src/navigation/RootNavigator.tsx) — no age-to-mode mapping exists anywhere. Earlier `CLOSED — STALE` status (2026-05-08) is now upgraded to fully resolved with explicit confirmation from a second exhaustive search. When age-based teen detection lands (separate future package), it should centralize in `src/constants/ageRanges.ts` with `TEEN_MIN_AGE=13` / `TEEN_MAX_AGE=17` per Adi 2026-05-08 decision (18+ are legal adults in some jurisdictions). **FLAG removal from CLAUDE.md proposed to Adi separately — CC does not edit CLAUDE.md unilaterally.**
- **קשור ל:** D-2026-05-02-25; `pkg/childjoin-claim-orphans` (where the re-audit happened).

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
- **סטטוס (עודכן 2026-05-15):** `partially-resolved` — `pkg/buddy-v05-backend` שופח את התשתית של V0.5 (3 טבלאות, EOD pg_cron, ל-1 → ל-3 logic, hook). מה שעוד נשאר ל-spec מלא: levels 4-5 logic, booster use mechanics, ה-UI consumers (toast, tap-on-buddy, hide/show, full 5B עם LEVEL/BOOSTERS). הפער הזה ממופה ל-`pkg/teen-ui-with-buddy-bundle` ולחבילות עתידיות.
- **קשור ל:** Spec Status header ב-BUDDY_SYSTEM.md; pkg/buddy-v05-backend (PR #__)

---

### F-2026-05-03-07: שתי קולקציות עיצוב Buddy מקבילות

**מה:** ה-Pets הקיימים (capybara, panda, unicorn) ו-skins חדשים שתוכננו (Wolf STORMY, Dragon, +) משתייכים לשתי משפחות עיצוב שונות:
- **Pastel / Cute collection** — חמוד, רך, צבעים פסטליים
- **Gaming / Edgy collection** — ניאון, חזק, אסתטיקה גיימינג

**עיקרון:** כל קולקציה תיווצר באותה תוכנה ובאותו סגנון פרומפט, כדי לשמור על קו ויזואלי אחיד בתוך כל קולקציה. שתיהן ניטרליות מגדרית.

**השפעה:** קוסמטית, לא חוסם MVP. אבל ייראה לא מקצועי כשיש skin selector שמציג שני סגנונות שונים מאותה קולקציה.

**טיפול:**
1. בחירת תוכנה ליצירה (דיון עתידי — Stitch/Midjourney/DALL-E/אחר)
2. יצירת קולקציה Pastel חדשה (החלפת capybara/panda/unicorn הקיימים)
3. יצירת קולקציה Gaming (Wolf, Dragon, +)
4. הילד בוחר בקולקציה במהלך onboarding (חלק מ-Package B עתידי)

**סטטוס:** open — דרוש דיון תוכנה + סשן יצירת assets לפני pet-skin-picker.

---

### F-2026-05-03-08: סשן Stitch ל-Pastel UI alternative

**מה:** חלק מהילדים יעדיפו UI פסטלי על-פני neon הנוכחי (D-2026-05-02-24 רמז לכך כ-"theme alternative … לא כברירת מחדל").

**טיפול:** סשן Stitch עתידי עם Adi (אולי עם אמי כ-co-designer) — יוגדר כחבילה עצמאית כשנגיע אליה. מתחבר ל-F-2026-05-03-07 (שתי קולקציות).

**סטטוס:** open — לעתיד אחרי MVP.

---

### F-2026-05-05-01: Pre-existing expo-doctor failures in buff-mobile

- **תאריך:** 2026-05-05 (discovered during admin-dashboard-port Phase 2)
- **מקור:** CC — during Chunk 2 of pkg/admin-dashboard-port-phase-2
- **תיאור:** `npx expo-doctor` reports 4 failures in the root buff-mobile project. Verified as pre-existing on main (before workspace addition) by running expo-doctor on both main and the phase-2 branch — same failures on both:
  1. `app.json` schema: `android.supportsRTL` is an unknown field
  2. Missing peer dependency: `expo-font` (required by `@expo/vector-icons`)
  3. Duplicate `expo-font` (55.0.6 vs 14.0.11) + duplicate `expo-constants` (same version ×3, harmless)
  4. `babel-preset-expo` major mismatch (expected ~54, found 55.0.15) + 8 patch-version mismatches across Expo packages
- **השפעה:** Not blocking current work (Metro starts, app runs). May cause unexpected build errors in EAS Build. Patch mismatches are minor; babel-preset-expo major mismatch is more significant.
- **סטטוס:** `resolved` — shipped 2026-05-25 via `pkg/sentry-eas-resumption` Phase 1 (commit `8e78ba1`, merged in PR #85 merge `20fa598`). `npx expo-doctor` now returns 18/18 ✓. First fix attempt in `pkg/expo-health-and-eas-android` Phase 1 (commit `cd6bce8`, 2026-05-16) was lost when that branch was deleted without merge — see IN-2026-05-25-02 for lost-work pattern.
- **קשור ל:** admin-dashboard-port Phase 2 (discovered), pkg/admin-dashboard-port-phase-2, pkg/sentry-eas-resumption (resolved), IN-2026-05-25-02 (lost-work pattern context).

---

### F-2026-05-05-02: admin-dashboard-port Phase 2 execution notes (deferred items)

- **תאריך:** 2026-05-05
- **מקור:** CC — pkg/admin-dashboard-port-phase-2 execution
- **תיאור:** Four in-flight decisions made during Phase 2 that deviate from SPEC/AUDIT or defer work:

  **React 19 (deviation from SPEC §3.1 / AUDIT §4):** SPEC and AUDIT referenced Lovable's React 18.3.1 stack. Root buff-mobile runs React 19.1.0. Decision (Adi, 2026-05-05): use React 19 in admin-web to match root and eliminate monorepo version drift. admin-web/package.json uses `react: ^19.1.0, react-dom: ^19.1.0`.

  **nohoist clarification 2026-05-05:** Phase 2 prompt specified nohoist for Expo packages, but nohoist is a Yarn workspaces feature, not npm. With React 19 matching root and admin-web having no RN/Expo dependencies, npm workspaces' default hoisting did not break Metro. CLAUDE.md § Tech Stack — Known Constraints will be updated in a plan-review-checklist package to reflect: monorepo isolation in npm workspaces relies on package.json deps separation, not nohoist.

  **`@types/node` addition (beyond AUDIT §4 list):** Required for `path.resolve(__dirname, ...)` in vite.config.ts. Pre-approved in chat 2026-05-05. Added as `@types/node: ^22.0.0` in admin-web devDependencies.

  **`@radix-ui/react-slot` deferred:** Phase 2 Button component omits asChild prop (requires @radix-ui/react-slot). Smoke test only — full Button functionality + other Radix-based shadcn primitives (Dialog, Dropdown, Portal, etc.) deferred to Phase 4 of admin-dashboard-port port work, where they will be added as a coordinated set.

- **סטטוס:** `deferred` — items noted, no action needed in Phase 2. Phase 4 picks up Radix deps; expo-health package picks up npm/expo issues.
- **קשור ל:** F-2026-05-05-01 (expo-doctor), admin-dashboard-port Phase 4

---

### F-2026-05-13-01: Marketing strategy session — open dependencies and strategic gates

- **תאריך:** 2026-05-13
- **מקור:** Claude Code — marketing strategy session with Adi
- **תיאור:** Strategic marketing session produced 3 new operational docs ([BUFF_MARKETING_BACKLOG.md](BUFF_MARKETING_BACKLOG.md), [BUFF_ADVISOR_OUTREACH_KIT.md](BUFF_ADVISOR_OUTREACH_KIT.md), [BUFF_BLOG_CONTENT_MAP.md](BUFF_BLOG_CONTENT_MAP.md)) and surfaced 4 dependencies that need resolution before execution scales:

  1. ✅ **`/philosophy` page on buffadhd.com** — **SHIPPED 2026-05-14** (PR `pkg/philosophy-pillars-and-meta-fixes` in `adielgarat-pm/buff`, awaits merge + deploy). 3-Principles hero added with WHY/WHAT-first framing. Pillar 3 (Independence-Building / outgrow) prominently articulated as the differentiator.

  2. **Israeli ADHD voices gap** — [BUFF_ADVISOR_OUTREACH_KIT.md §3 Bucket C](BUFF_ADVISOR_OUTREACH_KIT.md) needs 2–3 names from Adi. Israeli market is highest-trust + lowest-competition channel (96% of beta is IL per PRD §4.3) but currently underserved by target list.

  3. **In-app rating prompt** (Track B in [MARKETING_BACKLOG](BUFF_MARKETING_BACKLOG.md)) — needs SPEC + Values Check before engineering. Concern: Pillar 2 — does asking parent for review feel pressure-y? Defer until Play Store live AND first 50 users converted (Google permits 1 review ask per year per user — burning it early = no review ever).

  4. **Adina Maeir (Cog-Fun) outreach decision** — special case per D-2026-05-02-29. Pursuing her would unlock the Cog-Fun question. Pitch is fundamentally different from routine outreach — partnership conversation, not advisor email. Adi to decide separately.

  5. ✅ **Domain email setup** (`adi@buffadhd.com`) — **RESOLVED 2026-05-14**. Adi set up Google Workspace ($6/mo Business Starter) and has `adi@buffadhd.com` working. Additional addresses can be added if needed. All references in BUFF_ADVISOR_OUTREACH_KIT, BUFF_FOUNDING_100_KIT, and founding-100-payment session files reverted to canonical `adi@buffadhd.com`.

- **השפעה:** Marketing rollout depends on these. Wave 1 (`/philosophy` + meta data) ✅ shipped to PR; awaits merge to actually deploy. Wave 3 (blog) is independent but compounds slowly. Email infrastructure ✅ ready for Tier 1 outreach.
- **סטטוס:** `open` — items 2, 3, 4 still pending Adi prioritization; items 1 + 5 ✅ resolved
- **קשור ל:** [BUFF_GO_TO_MARKET.md](BUFF_GO_TO_MARKET.md) Phase 2 / D-2026-05-02-29 / [BUFF_MARKETING_BACKLOG.md §7](BUFF_MARKETING_BACKLOG.md) / Wave 1 PR `pkg/philosophy-pillars-and-meta-fixes` in `adielgarat-pm/buff`

---

### F-2026-05-14-01: Web compatibility check before adding any native dep

- **תאריך:** 2026-05-14
- **מקור:** Claude Code — Lovable sunset + web strategy planning session with Adi
- **תיאור:** Architectural decision (D-2026-05-14, see [BUFF_PRD.md §9.4 Web Strategy](BUFF_PRD.md)) commits BUFF to a future where the app compiles to Web via Expo Web (= React Native Web). Many native modules do not support web builds. If we install a dep that doesn't support web, the future Web build will silently break — and we won't know until we try to ship it.
- **Concrete risk examples:** native vibration, deep camera access, parts of FCM (PWA push is limited), some `react-native-*` packages without web maintainers.
- **Operational requirement:** **Before installing any new native dep in `package.json`** — run `expo install <dep>` and confirm no "no web support" warning. Alternatively, check the package README for `react-native-web` (or "web") in the supported platforms list. Either way, **avoid silent native-only deps.**
- **השפעה:** Without this discipline, F-073 (Web build, Phase 2) will require a large cleanup pass instead of a clean compile.
- **סטטוס:** `open` — methodological framing for all future development
- **קשור ל:** D-2026-05-14 (Web Strategy & Lovable Sunset Plan), F-073 (Web build), F-074 (Static landing), F-075 (Sunset Lovable), `pkg/lovable-parity-and-backlog`

---

### F-2026-05-16-01: Birthday date format ignores Hebrew locale

- **תאריך:** 2026-05-16
- **מקור:** Claude Code — code audit during `pkg/close-f-2026-05-03-01` (closure of F-2026-05-03-01)
- **תיאור:** `formatDate()` ב-`src/screens/onboarding/unified/UStep1_ChildProfile.tsx:24-27` מקודד ידנית `'en-GB'` כ-locale ל-`toLocaleDateString`. משתמשים בעברית (קהל ראשי per CLAUDE.md "User-facing app strings: Hebrew") יראו תאריך לידה באנגלית ("19 Oct 1998") במקום ("19 אוק׳ 1998") או פורמט עברי תקני. הקוד היחיד הרלוונטי:
  ```ts
  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  ```
- **השפעה:** UX miss מינורי ב-onboarding לקהל ישראלי. לא חוסם beta (פונקציונליות עובדת; רק locale). תיקון מועמד: שורה אחת — להעביר את ה-locale מ-`i18n.language` (בדומה ל-`useTranslation()` שכבר זמין במסך).
- **סטטוס:** `open` — מועמד ל-quick-fix package נפרד או bundle עם תיקוני onboarding polish עתידיים (Section B, Step 3 dedup, etc.).
- **קשור ל:** F-2026-05-03-01 (sister flag — נחשף תוך כדי האודיט שלו), `pkg/close-f-2026-05-03-01`

---

### F-2026-05-26-01: Generic Android-robot icon on Play Store install dialog (not BUFF logo)

- **תאריך:** 2026-05-26
- **מקור:** Adi — screenshot of Play Store internal-testing install dialog (06:55, com.buffapp.mobile (unreviewed), AAB ~30MB) shows the default Android-robot silhouette instead of the BUFF logo.
- **תיאור:** Internal-testing track installer in Hebrew Play Store displays the generic Android robot icon in the install confirmation dialog. The expected icon is the BUFF logo defined in [app.json:8](../app.json:8) (`./assets/BUFF_LOGO.png`, also wired for android.adaptiveIcon.foregroundImage at [app.json:24](../app.json:24)). Source asset exists (`assets/BUFF_LOGO.png`, 156KB, last modified 2026-04-16) but rendering on-device shows fallback.
- **Two distinct surfaces this could be hitting (verify both):**
  1. **Launcher / in-app icon** — embedded in the AAB from `android.adaptiveIcon.foregroundImage`. Likely cause: `BUFF_LOGO.png` is the full-bleed logo with no Android adaptive-icon safe zone (foreground should be 432×432 with the brand-critical mark inside the central 264×264 to survive circle/squircle/square cropping by launchers). If the source PNG doesn't follow the safe-zone spec, some launchers fall back to the system robot.
  2. **Play Console Store Listing icon** — a separate 512×512 PNG uploaded in Play Console → Store Listing → Graphic assets → App icon. Not in the AAB. If this slot is empty or has been replaced with a placeholder, the Play Store install dialog uses a generic icon. **The screenshot's "(unreviewed)" + "ללא סיווג" labels strongly suggest this surface — internal testing tracks fall back to the Play Console listing icon, not the AAB icon, on the install dialog.**
- **השפעה:**
  - **Beta launch optics (2026-06-01).** First impression for Lovable migrants installing the AAB will be a generic-Android icon, not the BUFF brand. Trust + brand recognition hit during the most critical install moment.
  - **Affects every install dialog** — Play Store opens this whenever a user clicks "Install" on the listing, whether through a direct link or browsing.
  - Unverified whether the *launcher* icon (post-install, on the home screen / app drawer) is also affected — needs Hat-4 device check.
- **סטטוס:** `open` — needs investigation before 1.6. Proposed package slug: `pkg/fix-app-icon-play-and-launcher`. Phase 0 = verify which surface(s) are broken (Play Console listing vs AAB-embedded) before any asset work. If Play Console listing only → Adi-only fix (upload 512×512 in Play Console, no code change). If launcher too → regenerate adaptive-icon assets with proper safe zone + new AAB build.
- **קשור ל:** beta-2026-06-01, `pkg/sentry-eas-resumption` (the package that produced v10/v11/v12 AABs), Play Console Store Listing (Adi-managed).

---

### F-2026-05-18-01: Empty Dashboard for newly-joined child (no tasks → cold-start moment lost)

- **תאריך:** 2026-05-18
- **מקור:** Adi — observed during web session-persistence diagnostic session (`claude/cranky-lederberg-6716ef` worktree, 2026-05-18). Diagnostic itself concluded NO code change needed for persistence (works tested in CC env via Claude_Preview headless Chromium: signup → reload → server stop/start → session restored every time). Empty-Dashboard observation surfaced incidentally while reviewing what a new child sees post-join.
- **תיאור:** Current flow for a child joining via `ChildJoinScreen` (name + family_code → `signUp` → ChildTabs):
  1. `signUp` succeeds, profile inserted with `family_id` set
  2. `RootNavigator` routes to `ChildTabs` → default tab `ChildDashboard`
  3. `useChildData` fetches tasks — returns **0 rows** for a brand-new child (no parent has assigned anything yet)
  4. Dashboard renders empty / near-empty state — no missions, no BUFFs, nothing to do
- **השפעה (PRD-relevant):** First-touch moment for the child is the critical engagement window for an ADHD kid. An empty Dashboard risks:
  - Confusion ("מה לעשות פה?")
  - Disengagement before parent has chance to set up
  - Negative emotional tone against `BUFF_VALUES.md` Pillar 2 (Positive Coaching)
- **Values Check tension (preview only — full check at SPEC time):**
  - **Pillar 1 (Intrinsic Motivation):** ⚠️ Default/starter tasks risk feeling imposed-not-chosen → fails Q1 ("would the child want this without virtual reward?")
  - **Pillar 2 (Positive Coaching):** ⚠️ Empty state could read as "nothing for me here" → may fail Q1 ("does the wording belittle / present as failure?")
  - **Pillar 3 (Independence-Building):** ⚠️ Starter tasks short-circuit the parent-child conversation about goals → undermines independence-by-design
- **המלצת ביניים (לא החלטה — מצריך session ייעודי):** ייתכן שהתשובה היא **לא משימות דיפולטיביות**, אלא **welcome screen חד-פעמי** עבור child בלי tasks:
  - "היי {שם}! ההורה שלך יכין לך משימות. בינתיים — תכיר את ה-BUDDY שלך 🐶"
  - לא ריק, לא דיפולטי, לא מציע tasks שהילד לא בחר
  - מהווה bridge עד שההורה משלים setup, ומפנה את הילד ל-engagement עם BUDDY (שכבר עומד ב-Values)
  - **Adi liked this direction (2026-05-18) — recorded as starting hypothesis, not commitment.**
- **סטטוס:** `open` — מועמד ל-package ייעודי. דורש:
  1. Session design עם Adi + Claude.ai
  2. Values Check מלא (9 שאלות) ב-SPEC.md
  3. Itay opinion (Teen UI co-creator) על העברית והטון
  4. החלטה אם זה חלק מ-package רחב יותר של "child first-touch experience" או focused
- **שמות מוצעים ל-package:** `pkg/child-first-experience` או `pkg/child-empty-state-welcome` או `pkg/onboarding-handoff`
- **קשור ל:** BUFF_VALUES.md (3 pillars), BUFF_PRD.md §2.2 (shared-device constraint — 65% של ילדים משתפים מכשיר עם הורה ולא בודקים תיכף), BUFF_BUDDY_SYSTEM.md (BUDDY כ-bridge engagement)

---

### IN-2026-05-20-01: service_role lacks GRANT on Lovable-era public tables

- **תאריך:** 2026-05-20
- **מקור:** CC — pkg/fcm-push-notifications Phase 3 E2E debugging
- **תיאור:** Edge Function `push-notification-fanout` failed E2E with `permission denied for table profiles` even though it was using `SUPABASE_SERVICE_ROLE_KEY`. Investigation: `has_table_privilege('service_role', 'public.profiles', 'SELECT')` returned `false` for most existing tables. The buff-mobile project (originally provisioned via Lovable) was missing the standard Supabase service_role grants on `profiles`, `notifications`, `tasks`, `daily_progress`, `buddy_relationships`, `child_vibes`, and others. Migration 005 (`grant_service_role_usage.sql`) covered USAGE on schema but did NOT include table-level GRANTs.
- **Symptom for future debugging:** `supabase-js` with service-role key returning `error.message = "permission denied for table X"` despite RLS being non-restrictive — first check `has_table_privilege('service_role', 'public.X', 'SELECT')`. If false → GRANT missing, not RLS.
- **השפעה:** Migration 014 (`service_role_grants.sql`) applied — `GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role` + `ALTER DEFAULT PRIVILEGES` so future tables auto-grant. This is now baseline for any Edge Function in buff-mobile. Future packages that create new public tables get the grant automatically via DEFAULT PRIVILEGES; older Lovable-era tables are now retroactively covered.
- **סטטוס:** `resolved` (migration 014 live; ALTER DEFAULT PRIVILEGES ensures durable fix)
- **קשור ל:** pkg/fcm-push-notifications Phase 3, migrations/005, migrations/014, all future Edge Functions

### F-2026-05-20-01: Supabase environment separation (dev/staging/prod) — deferred

- **תאריך:** 2026-05-20
- **מקור:** Adi — pkg/fcm-push-notifications Phase 1 execution
- **תיאור:** During Phase 1 execution (migration 012 application), CC paused to ask before applying schema changes to live `buff-mobile` Supabase project. Adi clarified: there are no production users yet on the mobile project (all 275 profiles + 191 families are test data + Lovable-era snapshot). For now, CC applies migrations directly. **When real production users arrive, this freedom needs to revert** — at that point we need proper environment separation:
  - Dev branch (CC autonomous)
  - Staging branch (Adi manual approval before merge)
  - Prod branch (Adi-only, gated PR)
- Supabase native branching (preview branches) would be the cleanest path. RevenueCat + Sentry + EAS already have separate environments configured per `BUFF_PRD.md §9`.
- **השפעה:** Once Play Store internal testing scales beyond Adi + family, this MUST be set up. Best done as a dedicated package (`pkg/env-separation`) after MVP ships.
- **סטטוס:** `open` (deferred — revisit before public launch)
- **קשור ל:** `feedback_mobile_db_no_prod_users.md` memory, CLAUDE.md (Modify Supabase schema rule will need amendment), future `pkg/env-separation`

### F-2026-05-19-01: Parent-initiated re-engagement tools for disengaged kids — v1.1 idea

- **תאריך:** 2026-05-19
- **מקור:** Adi — pkg/notification-spec planning session, after locking the automatic E5 (BUDDY presence after 5d/14d) cadence
- **תיאור:** MVP gives the parent **zero direct tools** to bring a disengaged kid back — only BUDDY's automatic re-engagement push (E5) fires after 5 days of no-open. Adi proposed giving parents agency in the loop: a way for the parent to actively reach out when they notice the kid hasn't been on. **Explicitly OUT OF MVP** — needs separate design work because of the Pillar tension:
  - **Pillar 2 risk:** "Send your kid a reminder" easily becomes parental nagging via the app. The whole BUFF thesis is "coach mode, not cop mode" (`BUFF_BRAND.md §6`).
  - **Pillar 3 risk:** Parent-as-pusher inverts the agency model. BUDDY (kid's friend) is the right voice; parent-direct-to-kid push could feel surveillant.
  - **Pillar 1 risk:** Easy to slide into reward-bribing ("if you come back, you'll get…").
- **Possible directions to explore** (not yet decided):
  - **(a) BUDDY-mediated:** Parent triggers a BUDDY-voiced push from their device ("BUDDY would like to say hi from {parent_name}") — keeps the friend voice, parent stays one step removed
  - **(b) Sticker / heart:** Parent sends a tiny non-verbal signal that lands in the kid's app, no push
  - **(c) Reduce BUDDY frequency knob:** Parent can adjust E5 cadence (5d → 3d, 14d → 7d) — gives agency through policy not action
  - **(d) Dashboard insight only:** Parent sees "{kid} hasn't been on for X days" with NO action button — pure awareness
- **השפעה:** Out of MVP scope. Should land as its own `pkg/parent-reengagement-tools` after beta-2026-06-01, with full Values Check + session design with Adi + Itay (Teen UI co-creator).
- **סטטוס:** `open` (idea logged; not in any backlog yet)
- **קשור ל:** pkg/fcm-push-notifications E5, BUFF_VALUES.md (all 3 pillars), BUFF_BUDDY_SYSTEM.md (BUDDY voice constraints), F-2026-05-18-01 (cold-start moment — adjacent concern)

### F-2026-05-28-01: Parent empty-task-state → existing-child task setup (pkg/empty-state-onboarding)

- **תאריך:** 2026-05-28
- **מקור:** CC — pkg/empty-state-onboarding (parent-side counterpart to the cold-start problem)
- **תיאור:** A parent viewing the Tasks tab for a child with **0 tasks** had only a neutral "No tasks" line — a dead end. This package adds a CTA ("Set up tasks for {name}") that launches the existing challenge-selection flow for **that existing child**. A new `existingChildId` param threads through onboarding (added to `UBase`, auto-spread by every step); UStep5 skips the profile INSERT and attaches tasks + rewards to the existing id, then returns the parent to the Tasks tab.
- **Adjacency to F-2026-05-18-01 (important):** F-2026-05-18-01 is the **child-side** empty Dashboard, where Adi's leaning hypothesis was a **BUDDY welcome bridge, NOT default tasks** (silent imposed tasks risk Pillar 1/3). This package is the **parent-side** empty *task* state and creates tasks only via the **deliberate challenge + motivator selection** (identical to shipped onboarding), so it sidesteps the "silent defaults" concern. **It does NOT resolve F-2026-05-18-01** — different surface, different solution direction. Kept open.
- **Surprising finding (Supabase, 2026-05-28):** only **3 of ~90** child profiles have `pro_settings.age_group` set (most are Lovable-era / pre-age-persistence). Since UStep2_Goal needs `ageGroup` to render options, the **UStep1 age-less fallback is the COMMON path, not an edge case.** Decision to build it (Adi) was load-bearing.
- **השפעה:** New parent affordance; no schema change; no product-contract change. Reuses the onboarding task/reward insert verbatim.
- **סטטוס:** `open` (code complete; pending Adi Hat-4 device verification + PR merge)
- **קשור ל:** F-2026-05-18-01 (adjacent, child-side), IN-2026-05-14-03 / CLAUDE.md FLAG (ChildJoin duplicate-profile — the `existingChildId` guard avoids a second profile), IN-2026-05-28-01

### IN-2026-05-28-01: useChildData has no focus/realtime refetch on tasks; UStep8 overwrites parent pro_settings

- **תאריך:** 2026-05-28
- **מקור:** CC — pkg/empty-state-onboarding investigation
- **תיאור:** Two pre-existing behaviours surfaced while wiring the empty-state CTA:
  1. **`useChildData` (`src/hooks/useChildProgress.ts`)** fetches tasks only on mount/`childId` change — no `useFocusEffect`, no realtime subscription on the `tasks` table (unlike `daily_progress`/`credit_vault`). Returning to a still-mounted ParentTasksScreen after creating tasks would show an empty list. Mitigated **in this package** by adding `useFocusEffect(refetch)` to ParentTasksScreen. Other screens reading `useChildData` may have the same staleness if tasks change while mounted.
  2. **`UStep8_Complete` (`src/screens/onboarding/unified/UStep8_Complete.tsx`)** does `update({ pro_settings: { onboarding_complete, onboarding_child_name, onboarding_child_id } })` — which **replaces the parent's entire `pro_settings`**, dropping any other keys. Latent risk for the existing "Add Child" flow (an already-onboarded parent). **Avoided in this package** by routing the existing-child path back to ParentApp and skipping UStep8 entirely. Not fixed here (out of scope) — flagged for a future fix (use `jsonb_set`/merge instead of replace).
- **השפעה:** Item 1 mitigated locally. Item 2 untouched — a real latent bug in Add-Child.
- **סטטוס:** `open` (item 2 deserves a small dedicated fix: merge `pro_settings` instead of overwriting)
- **קשור ל:** pkg/empty-state-onboarding, F-2026-05-28-01

---

## רשומות שנפתרו (Resolved)

### F-2026-05-21-01 (RESOLVED 2026-05-23): סייגים ל"פספוסים" בתצוגת "סיכום אתמול"

- **תאריך פתיחה:** 2026-05-21
- **תאריך סגירה:** 2026-05-23
- **מקור:** Adi + CC, סשן תכנון תגובה לבקשת בטא-יוזרית (שני, אמא של מתן) לראיית משימות שלא סומנו אתמול. SPEC ב-`docs/sessions/yesterday-recap/SPEC.md`.
- **תיאור מקורי:** ב-pkg/yesterday-recap (Parent Dashboard read-only), חובה להגדיר בקפידה **מה נחשב "לא סומן"** מול **מה כלל לא היה אמור להופיע אתמול**. הצגת משימה כ"מוחמצת" כשהיא לא הייתה רלוונטית היא false-positive שיגרום להורה חרדה לשווא ויפיל את אמון המוצר.

  **תרחישים שצריך היה לסנן החוצה מ"לא סומן":**
  1. משימות שאינן בתבנית schedule_days של היום
  2. ימים ללא בית ספר ad-hoc (חגים, יום חופש, יום מחלה, שביתה) — לא נתמך בנתונים
  3. משימות שנמחקו / שונו בין יום הבסיס לתצוגה
  4. משימות שהוקצו אחרי האתמול (`created_at > yesterday_end`)

- **איך נפתר:** ב-pkg/yesterday-recap (commits d4a28ca → c0d7cfb):
  - **#1, #3, #4 — נפתרו במלואם** ב-`src/utils/yesterdayRecapUtils.ts` → `isTaskEligibleForChild`. 31 unit tests מאמתים כל שילוב + boundary case.
  - **#2 — V1 פתרון: סמכים על Pause Mode הקיים** (`shouldHideRecap` בודק `isPauseActive`). הורה שצריך "אין בית ספר היום" משתמש ב-Pause Mode. דגל ad-hoc ייעודי נדחה ל-V1.1 אם נראה תלונות.
  - **Pillar 2 enforcement:** banned-string grep gate ב-TESTS.md מאמת אפס שימוש ב-`פספסת/החמצת/לא בוצעו/כשלון/missed/failed`. Component tests (`src/components/__tests__/YesterdayRecapCard.test.tsx`) מאמתים את היעדר ✗ / X / red-color בכל ה-render paths.
- **קשור ל:** Pause Mode (`docs/sessions/pause-mode/`), F-2026-05-19-01 (parent re-engagement tools — adjacent Pillar 2/3 tensions), `docs/sessions/parent-notification-feed/` (sibling parent observability surface), בקשת בטא של שני (2026-05-21).
- **לקח להמשך:** Beta-driven features may surface Pillar tensions that the original PRD didn't anticipate. The 3-iteration design loop (kid late-marking → parent retroactive marking → read-only view) shows the value of pre-design Values Check + explicit beta-user dialogue before committing scope. The "read-only" outcome is more aligned with all 3 pillars than any of the marking-enabled options would have been.

---

### F-2026-05-14-02 (RESOLVED 2026-05-14): Extract Lovable reviews → BUFF_TESTIMONIALS

- **תאריך פתיחה:** 2026-05-14
- **תאריך סגירה:** 2026-05-14 (אותו יום)
- **תיאור מקורי:** Lovable has a `reviews` table with user-submitted, admin-approved reviews of BUFF. Existing reviews are valuable testimonials but blocked on Lovable data access.
- **ההשפעה שהייתה:** F-074 (Static landing) and marketing materials lacked social proof. Beta-period user words were unused.
- **איך נפתר:** Adi exported the `reviews` table from Lovable admin (3 approved entries — Shani, Noa Morag long-form, Kelly). All reviews already had English translations produced by Lovable's `translate-review` edge function (Gemini Flash Lite). CC imported as T002, T003, T004 in `BUFF_TESTIMONIALS.md §2A` (PR `pkg/lovable-testimonials-import`). Consent for paid ads / Play Store still pending — captured as new Open Action Item in `BUFF_TESTIMONIALS.md §8`.
- **עדכון 2026-05-15:** T004 (Kelly) הוסרה מ-BUFF_TESTIMONIALS — Adi disclosed it was a family review submitted under a pseudonym, not a real third-party testimonial. Per BUFF_TESTIMONIALS §6 anti-patterns ("don't fabricate quotes"), it doesn't qualify. **For any future sync from Lovable's `reviews` table: skip the Kelly entry.** Adi to delete the row from Lovable's reviews table separately so it stops appearing on buff.lovable.app Landing. T002 (Shani) and T003 (Noa long-form) remain valid.
- **קשור ל:** F-071 (in-app reviews — Out), F-074 (Static landing), F-075 (Sunset Lovable), [BUFF_TESTIMONIALS.md](BUFF_TESTIMONIALS.md), D-2026-05-14, `pkg/lovable-parity-and-backlog` → `pkg/lovable-testimonials-import`, `pkg/testimonials-remove-t004` (removal of T004 2026-05-15)

---

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

### Lesson 2026-05-04 — Branch deleted before merge (data near-loss)

**Symptom:** Adi instructed CC "merged" on the morning-cleanup-2026-05-04 package without having actually created or merged a PR on GitHub. CC executed the standard cleanup sequence (`git checkout main && git pull origin main && git branch -d pkg/morning-cleanup-2026-05-04 && git push origin --delete pkg/morning-cleanup-2026-05-04`). The local `git pull` returned "Already up to date" (because nothing had been merged on GitHub). The `git branch -d` deleted the local branch despite it not being merged into main, and `git push origin --delete` removed it from origin. Result: 4 commits — F-2026-05-03-07, F-2026-05-03-08, EOD Protocol section, and the session folder — became orphaned. The branch existed nowhere as a named ref.

**Discovery:** Hours later, when Adi attempted to merge the next package (admin-dashboard-port), Claude.ai noticed that morning-cleanup content was missing from `main`. Diagnostic queries (`git log --all`, `grep` for FLAG IDs) confirmed the loss.

**Recovery:** Found 4 commits in `git reflog` and `git fsck --lost-found` as dangling commits. Created a new branch `pkg/morning-cleanup-2026-05-04-recovery` pointing to the tip SHA, pushed to origin, opened PR #3, merged. All content restored to main with no data loss.

**Root cause:** Three layers failed simultaneously.
1. **Adi's confirmation drift:** "merged" was said without actually performing the GitHub merge step. After many sessions, the verbal "merged" became habitual rather than tied to the actual GitHub action.
2. **CC trusted the verbal confirmation:** Standard cleanup ran without verifying that the merge had actually landed in `main`. The cleanup sequence assumed `git pull` would have brought down the merge — but if no merge happened, the pull is a no-op and the assumption fails silently.
3. **`git branch -d` did not protect us:** This command refuses to delete unmerged branches *only when comparing to the current HEAD*. Since `main` was checked out and the branch had never been merged anywhere, `-d` should have refused. The fact that it succeeded indicates either: (a) git considered the branch "merged" because of some intermediate state, or (b) the actual command used was `-D` (force). Either way, no safety net.

**Mitigation (this package):**
- Verify-Before-Delete Protocol → `CLAUDE.md` (binding rule for CC: never delete a branch until the merge content is verified in main)
- Cleanup Procedure section → `docs/WORKFLOW.md` (operational steps for the post-merge workflow, with verification gate)
- This entry as canonical incident reference

**Pattern to watch:** Verbal confirmations in long sessions drift from their original meaning. "merged" must be tied to a verifiable artifact (PR closed on GitHub, content present in `git log` of main), not to a verbal handshake.

**FLAGs opened:** None — process fix.

---

### Lesson 2026-05-24 — Parallel CC session stepped on this session's work twice (IN-2026-05-24-01)

**Symptom (two-phase incident):**

*Phase A — during `pkg/buddy-relationship-cross-screen-sync`:* CC made 4 Edit-tool calls adding `useFocusEffect` wiring. All returned "updated successfully" and a subsequent `jest` run actually exercised the new code. Minutes later, `git diff --stat` returned empty — disk content was silently reverted across all 4 files. CC also discovered it was on `pkg/anchor-recovery-impl` instead of the explicitly-created `pkg/buddy-relationship-cross-screen-sync`. A spurious stash-as-commit (`dcb6fa9`) referencing "WIP preserved 2026-05-24 before pkg/anchor-recovery-impl" appeared in the reflog.

*Phase B — during `pkg/buddy-sync-followups` (immediately after):* CC made 3 edits (LEARNINGS, STATUS.md, test file). Just before `git commit`, the branch silently switched to `main`, the changes were stashed by an unknown actor with message `On docs/yesterday-recap-visual-evidence: foreign WIP during cherry-pick`, and a brand-new branch `docs/yesterday-recap-visual-evidence` had appeared in the reflog with a commit `42fe322 docs(yesterday-recap): visual evidence + reusable preview harness` that CC had not authored. PR #73 was opened and merged for that branch while this session was working.

**Discovery:** Reflog inspection revealed checkouts and a commit that CC never issued. Stash messages used the word "foreign" — which is not standard git language but is consistent with how a second CC session might label changes it didn't make. Process inspection showed **15+ active `claude` processes** on the machine, with multiple recent ones (3 from 2026-05-24 morning).

**Root cause:** A **parallel Claude Code session** was running concurrently in the same repository and stepped on this session. The parallel session was working on `yesterday-recap-visual-evidence`, performed checkouts, stashed conflicting working-tree changes (this session's edits) as "foreign WIP", and cherry-picked its own commit onto a new branch. The branch-switches and disk reverts observed by this session were side effects of the parallel session's git operations, not a VS Code extension as initially hypothesized. The earlier hypothesis (VS Code Git extension) was wrong.

**Recovery:** This session's work was preserved in stash@{0}. After Adi confirmed the parallel session had merged its PR, CC rebased on the new main, re-created the branch, popped the stash, verified content + tests, and proceeded.

**Mitigation:**
- **Do not run multiple Claude Code sessions against the same working directory.** They will fight over branch state and the working tree. The git operations of one will appear as silent reverts to the other.
- If multiple sessions are needed in parallel, each must use a separate worktree (`git worktree add ../path branch-name`) so the working tree is not shared.
- For CC: when `git diff --stat` is unexpectedly empty after Edits, treat as a "parallel-session stepped on me" event — check `git stash list` and `git reflog` BEFORE re-applying edits. Stash messages may say "foreign WIP" or reference a branch you did not create.
- Always verify branch state with `git branch --show-current` before commit, not just after `git checkout -b`.

**Pattern to watch:** Multi-session shared-working-tree is the classic concurrent-editor failure mode at the filesystem level. Git is built for it (worktrees), but not transparently — both sessions assume they own the working tree until something obviously breaks.

**Asks of Adi:**
- Audit running `claude` processes (`Get-Process claude`) and kill zombies from old sessions
- If you want parallel CC sessions on the same repo, use `git worktree add` per session
- Consider whether scheduled background tasks (CronCreate / TaskCreate-style routines) are spinning up CC sessions you don't see in the VS Code UI

**FLAGs opened:** None — process / environment fix.

---

### Lesson 2026-05-25 — Lovable-parity comparison as a bug-discovery technique

**Symptom:** Adi flagged Import Schedule as "not good enough" without a specific bug report. CC fetched the original `adielgarat-pm/buff` (Lovable) `TimetableImporter.tsx` (1,393 lines), built a feature matrix, and wrote 44 unit tests for `timetableParser.ts`. The tests surfaced **3 bugs that no one had reported** plus 1 piece of dead code:
- A: `detectPivotFormat` only matched full Hebrew day names ("ראשון"), not the abbreviated form ("יום א") that many school exports use
- B: `parsePivotFormat` set `autoTime: false` even when the time was generated from a lesson number — orange "review me" banner never showed
- C: `processApiResponse` lost `t.autoTime` aggregation during the port from Lovable (Lovable handles it correctly at line 220)
- D: `parseStandardFormat` had a dead `if (hasHeaders)` branch calling `sheet_to_json({} as XLSX.WorkSheet)`

Round 2 with two parent-submitted real-world fixtures (a high-school Excel with banner rows + continuation-row split groups, and a 1st-grade photo with no time column) added 13 more tests and surfaced REG-4 (continuation-row data loss) — captured as a known-bug regression for a future package.

**Root cause:** No SPEC existed for the feature, no tests existed, so silent regressions accumulated during the Lovable→mobile port. "Lovable parity" was assumed because the parser file said "Ported from buff-lovable" — but parity was never verified.

**Mitigation (pkg/timetable-import-fixes):**
- 57 Jest tests covering pure helpers, pivot detection, pivot parsing, API response, and the two real-world parent files
- Real Excel committed as test fixture (`src/utils/__tests__/fixtures/schedule-real-1.xlsx`)
- 4 bug fixes shipped; 2 known-bugs documented as REG-tests (split groups + continuation rows)

**Pattern to watch:** When code says "Ported from X", treat that as a hypothesis, not a guarantee. Bring the original alongside, diff feature-by-feature, and write tests against both. Vague feedback like "not good enough" is often a signal that the user can see something is off but can't articulate exactly what — a structured Lovable-parity diff turns that signal into a list.

**FLAGs opened:**
- 🚩 REG-4: Continuation-row split groups (e.g., row 5 = math, row 6 with empty time cell = physics under same slot) silently dropped. Pending `pkg/timetable-split-groups` (covers BUG-F + REG-4 — both need the same "which group is my child in?" product decision)
- 🚩 REG-5: Photo-style pivot (no time column) works by accident because col 0 doubles as time-cell and first-day-data. Pending `pkg/timetable-col0-detection` (also covers BUG-E RTL pivot)

---

### IN-2026-05-25-02: BUG — expo-document-picker crashes the dev build on file selection

- **תאריך:** 2026-05-25
- **מקור:** CC — discovered during Hat-3 smoke test of the Import Schedule arc (S4 split-groups via real Excel fixture).
- **תיאור:** Flow: Schedule tab → Import Schedule → Excel/CSV → DocumentsUI opens → pick a file → app crashes (FATAL `java.lang.NullPointerException at java.util.Objects.requireNonNull at com.facebook.react.ReactActivityDelegate.onActivityResult:212`). The picker successfully returns the file URI (`content://com.android.providers.downloads.documents/...`) but RN's ReactActivityDelegate NPEs while delivering the result to MainActivity. Reproduces 100% on the dev build (`com.buffapp.mobile-dA5oo1ECFOtRKBGikFIflQ==`).
- **השפעה:**
  - **Excel/CSV import path is broken on the dev build** — Adi cannot verify Package A's split-groups detection via the real `schedule-real-1.xlsx` fixture (or any other Excel file) on the running app today.
  - **Photo/OCR path likely shares the issue** (also uses an activity-result handoff, via expo-image-picker). Not yet verified.
  - **Paste mode (Package C) is NOT affected** — verified working on emulator in the same session via `supabase.functions.invoke`, no document-picker dependency.
  - **NOT a regression from A/B/C** — neither Package A (parser pure logic) nor Package B (review-screen Modal) nor Package C (paste-mode UI) touches expo-document-picker, expo-image-picker, or ReactActivityDelegate. The crash is in shared infra both flows used pre-A/B/C.
  - **Root cause hypothesis:** version drift between `expo-document-picker` (declared `~14.0.8`) and the installed react-native ReactActivityDelegate inside the prebuilt APK. Possibly fallout from the parallel-session npm-install activity earlier today that mutated package.json (and was reverted, but the prebuilt APK on the emulator is from before either state). Needs a fresh `npx expo run:android` build to confirm whether it's an installed-app/source drift issue or a real package-version conflict.
- **סטטוס:** `open` — unverified on production AAB build. Pending `pkg/diagnose-document-picker-crash`. If repro confirms on a clean `expo run:android`, the package fixes it; if only on the stale dev build, the fix is just "rebuild the dev client".
- **קשור ל:** `pkg/timetable-split-groups` (the AC the smoke test was trying to verify), `pkg/timetable-paste-mode` (the unaffected entry path that worked end-to-end).
- **Workaround for parents today:** use paste mode (Package C) — they paste the schedule text and the AI parses it. Excel/photo paths are confirmed-broken until this bug is fixed.

---

### Lesson 2026-05-25 (2) — Import Schedule arc closed: 4 packages, 0 → 80% in one day

**Summary:** What started as Adi's vague "Import Schedule isn't good enough" turned into a 4-package arc that closed 8 bugs, added 65 unit tests with two real parent files as fixtures, and added one new entry method (paste mode) the project already had the backend for.

**The arc:**
1. **`pkg/timetable-import-fixes`** (PR #77, merged) — 4 bug fixes surfaced by Lovable-parity diff: detectPivotFormat regex, parsePivotFormat autoTime, processApiResponse hasAuto propagation, parseStandardFormat dead code. 44 tests added.
2. **`pkg/timetable-split-groups`** (PR #78, merged) — REG-1 + REG-4 closed. New `extractSubjectGroupsFromCell` helper splits cells on divider lines (────, ____, ====). New `slotKey`/`groupIndex`/`groupTotal`/`teacher` fields on ParsedPeriod. Continuation rows (empty time cell + content) now extend the previous slot. Purple banner + "1/3" badge in review UI. 8 new tests bringing total to 65 then 220 project-wide.
3. **`pkg/timetable-review-day-select`** (PR #80, merged) — Per-row day chip + Modal picker in review screen. When OCR misclassifies a day, fix is 2 taps instead of delete + re-enter. No new deps.
4. **`pkg/timetable-paste-mode`** (PR #81, merged) — 4th entry method: paste text from WhatsApp/school portal/Excel. Calls existing parse-schedule Edge Function with `fileType: 'text'` (the path was already deployed but had no UI). 9 new i18n keys, hint card + RTL textarea + live row count.

**What's left for 100%** (documented as REG-tests, deferred):
- 🚩 BUG-E: RTL Excel with שעה in rightmost column. Not seen in the wild yet.
- 🚩 REG-5: Photo-style pivot (no time column) works because col 0 doubles as time-cell + first-day-data. Fragile but functional.
- 🚩 Equipment surfacing in UI — data flows through but isn't rendered; rolls into separate P-05 "Bag Prep" feature in GAP_ANALYSIS.
- 🚩 Real-image OCR validation against parent-submitted photos (we have one from 2026-05-25, never ran through the deployed Edge Fn end-to-end).
- 🚩 TimetableScreen UI test suite (currently zero coverage — the screen is 1,000+ lines after all 4 packages).

**Process lesson — parallel sessions stepping on each other:**

While CC was executing A/B/C autonomously per Adi's "אני יוצאת לעבודה" delegation, two parallel sessions were active in the same working tree:
- `docs/mobile-quickstart-2026-05-25` ran, committed, and reset CC's WIP Package B edits via `HEAD@{4}: reset: moving to HEAD`.
- `pkg/sentry-eas-resumption` checked CC out to a completely different branch mid-stream (`docs/sessions/pending-lifetime-grants/` showed up untracked; CC's Package C work was stashed under a misleading "carried from pkg/timetable-review-day-select" message).

CC recovered both times by following the Lesson 2026-05-04 mitigation playbook: `git stash list` + `git reflog` *before* re-applying edits. Package C was recovered intact from `stash@{0}` after the cross-branch checkout. Package B was re-applied from scratch after the silent reset because no stash had been created.

**Pattern reinforcement:** When two CC sessions share a working tree, `git pull origin main` + `git checkout` in one session will silently shift the branch HEAD under the feet of the other. The session that runs `git status` next sees what looks like its own clean state — but it isn't. Always run `git branch --show-current` *between* `git checkout -b` and the first `git commit` if there's any chance of parallel activity.

**FLAGs opened:**
- 🚩 Long-tail timetable bugs above (4 items) — none blocking, all documented as REG-tests in `src/utils/__tests__/timetableParser.test.ts`.

**Linked:** Lesson 2026-05-25 (1) (Lovable-parity bug discovery), commits 4f3d830/036af0f/0807f5d/df6c584.

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
