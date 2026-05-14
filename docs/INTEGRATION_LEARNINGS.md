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
- **סטטוס:** `open` — to address in a dedicated "expo-health" Improvement Package before EAS Build submission.
- **קשור ל:** admin-dashboard-port Phase 2 (discovered), pkg/admin-dashboard-port-phase-2

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

  1. **`/philosophy` page on buffadhd.com** — referenced in 2 of 3 advisor pitches; ~2 hr work in buff-main worktree. Per [BUFF_GO_TO_MARKET.md §2.3](BUFF_GO_TO_MARKET.md). Highest-leverage Wave 1 unblocker.

  2. **Israeli ADHD voices gap** — [BUFF_ADVISOR_OUTREACH_KIT.md §3 Bucket C](BUFF_ADVISOR_OUTREACH_KIT.md) needs 2–3 names from Adi. Israeli market is highest-trust + lowest-competition channel (96% of beta is IL per PRD §4.3) but currently underserved by target list.

  3. **In-app rating prompt** (Track B in [MARKETING_BACKLOG](BUFF_MARKETING_BACKLOG.md)) — needs SPEC + Values Check before engineering. Concern: Pillar 2 — does asking parent for review feel pressure-y? Defer until Play Store live AND first 50 users converted (Google permits 1 review ask per year per user — burning it early = no review ever).

  4. **Adina Maeir (Cog-Fun) outreach decision** — special case per D-2026-05-02-29. Pursuing her would unlock the Cog-Fun question. Pitch is fundamentally different from routine outreach — partnership conversation, not advisor email. Adi to decide separately.

- **השפעה:** Marketing rollout depends on these. Wave 1 (`/philosophy` + meta data) blocks Wave 2 (advisor outreach). Wave 3 (blog) is independent but compounds slowly.
- **סטטוס:** `open` — awaits Adi prioritization
- **קשור ל:** [BUFF_GO_TO_MARKET.md](BUFF_GO_TO_MARKET.md) Phase 2 / D-2026-05-02-29 / [BUFF_MARKETING_BACKLOG.md §7](BUFF_MARKETING_BACKLOG.md)

---

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
