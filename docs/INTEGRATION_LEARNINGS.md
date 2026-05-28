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
