# Launch QA — bugs & findings (2026-10-15)

P0 = breaks or badly misleads a NEW family in the first session (fix before launch).
P1 = degrades / loses activation; fix if cheap. P2 = polish / later.

| id | sev | surface | finding | status |
|---|---|---|---|---|
| B-01 | P0 | Parent dashboard hero (both platforms) | **Day-0 false "struggling" insight.** Right after onboarding (1 task done together) the hero card reads "14% · Morning Routine Challenge — Morning tasks have been challenging lately". Cause: `useParentInsights` rates each task over the last 7 calendar days including days BEFORE the task existed, and counts today as a miss before the task's time has come. Evidence: `shots/a23_insight.png`. Violates Pillar 2 (positive coaching) on the first screen every new parent sees.  Verified fixed on Android (HE: 7% low → 100% positive). | ✅ merged 10/17 (PR #511) |
| B-02 | P1 | Backend cron | `scan_disengaged_users_daily` failed every day since 2026-08-01 (75×): 3 child profiles with `family_id IS NULL` → notifications insert NOT NULL violation rolls back the whole scan. No disengaged nudges for 2.5 months. | ✅ fixed — migration 064 applied 10/17 (PR #517) |
| B-03 | P1 | Backend cron | `refresh-basic-insights-friday` never succeeded (16×): `compute_basic_insight` reads `credit_vault.balance`, real column is `total_balance`.  Also store_rewards.cost/is_active did not exist. | ✅ fixed — migration 064 applied 10/17 (PR #517) |
| B-04 | P1 | Child BUDDY stats | `src/hooks/useChildBuddyStats.ts:50-53` filters `daily_progress.child_profile_id` (column is `child_id`) → 400 in Postgres logs; BUDDY task count always fails.  **Reproduced live: teen My Stats shows 0 tasks completed right after completing one + console error.** | ✅ merged 10/17 (PR #515) |
| B-05 | P1 | Child device (branch 3) | PackingCard "Add mine" → `navigate('ChildAddActivity')` not registered for a real child login → silent no-op (works only in View-as-Child).  **Reproduced on real child login (logcat: NAVIGATE ChildAddActivity not handled).** | ✅ merged 10/17 (PR #514) |
| B-06 | P1 | Push | Tapping a push notification goes nowhere — no `addNotificationResponseReceivedListener`; `notificationRouter` never wired. | report |
| B-07 | P2 | Security advisors | ~49 SECURITY DEFINER fns executable by anon; cron/scan fns unguarded (scan_*, run_buddy_eod_for_all…). Revoke anon EXECUTE. Leaked-password protection off. | report |
| B-08 | P1 (activation) | Parent dashboard first fold | New parent's first fold = founder-call card + Smart Organizer + Coach upsell; the child card and "Invite a child" (the ignition step) start below the fold, under the notifications toast. | report |
| B-09 | P2 | Onboarding step 1 | Birthday picker opens on Jan 2010 regardless of chosen age group; no mismatch check (age group 9-11 + 2010 birthday accepted). | report |
| B-10 | P2 | Welcome | "Setting up on a shared computer?" shown on a phone. | report |
| B-11 | P2 | Step 5 → 6 | Button says "Connect {name}'s phone →" but next screen is "Is {name} with you right now?" (first mission), not connecting. | report |
| B-12 | P2 | Dashboard child card | Task done together in onboarding → "1/4 Missions · ⚡ 0 Buffs" (no BUFFs credited for it). Confirm intended. | check |
| B-13 | P2 | Mint teen | Stats tab shown by age band but screen redirects to HQ on Mint skin. | report |
| B-14 | P2 | Code hygiene | ChildTasksScreen + RootNavigator console.log every render (raw tasks JSON) in prod. | report |
| B-15 | P1 | Parent Rewards sheet (Android) | Soft keyboard hides the reward **Title** field while typing — sheet doesn't lift (KAV `height` inside Modal, edge-to-edge). Tasks sheet OK. Same latent issue in ChildSuggest + Timetable. Evidence `shots/a33_kbd.png` vs `a40_taskkbd.png`. | ✅ merged 10/17 (PR #512) |
| B-16 | P1 | Child app, Mint skin (default 6–11) | Child's name, "Quests"/"Shop"/"Menu" titles, active phase tab, "N to go", Focus Fuel counter, "Add my own" rendered in #E9D5FF on mint → ~1.2:1 contrast, near-invisible. Evidence `shots/a56b_hq.png`, `a58_child_shop.png`. | ✅ merged 10/17 (PR #513) |
| B-17 | P2 | Settings → Subscription | Free family whose 14-day Coach trial auto-started (on first kid completion) shows "✅ Family plan" — reads as paid. Should say trial + days left. | report |
| B-18 | P2 | Schedule paste-parse | Input in the documented example format `Sun: math 08:00, english 09:00` → English saved as 08:50 and marked "filled automatically" (explicit time ignored). | report |
| B-19 | P2 | Child HQ (real child login, EN) | "All my tasks ←" — arrow points back in LTR. | report |
| B-20 | P1 (launch risk) | Child invite link → installed app | `assetlinks.json` lists ONE SHA-256 (95:5A:BE…). If that is the EAS upload key and not the **Play app-signing** key, App Links won't verify for Play-installed users → link opens browser → Play Store "Open" → app opens WITHOUT the code. Needs Adi: Play Console → Setup → App integrity → App signing key SHA-256, and Play Console → Deep links status. | Adi check |
| B-21 | P2 | Parent dashboard | Onboarding first-task "done together" credits 0 BUFFs (child shows 0, then 20 after the 2nd task). Confirm intended. | check |
| B-22 | P2 | Web RoleSelection (RTL) | Language globe button overlaps the "BUFF works best as an app / Install" strip at top-left. | report |
| B-23 | P2 | Android, child signed in → Grown-up sign-in → change language | App restarts into mirrored RTL layout with English strings and re-asks "Restart to apply" on every launch (loop) until a parent signs in. Edge path. | report |
| B-24 | P2 | Hebrew onboarding copy | Step 2 subtitle "לחץ/י לבחירה — זה עיצוב הכל באפליקציה." is ungrammatical (→ "זה יעצב את הכול באפליקציה"). Step 3 "בחר/י את כולם שרלוונטיים" awkward. | report (copy → Adi) |
| B-25 | P2 | Hebrew parent, Latin-named child | Step 5 preview: tasks in English (child lang from name script), rewards in Hebrew — mixed. Known Latin-name trap. | report |
| B-26 | — | Android dev client | Icons (tab bar, gear, buddy ×) blank after Metro timeouts; back after reload. Dev-env artifact, not a product bug. Verify icons on Adi's Play install. | not a bug |
| B-27 | P2 (privacy) | Web onboarding URLs | Child's first name + age group + gender travel in the URL query (`/UStep2_Goal?childName=…&ageGroup=…&gender=…`) — ends up in browser history / any analytics page_view. Children's-app PII hygiene. | report |
| B-28 | P2 | Onboarding complete (home device) | Says `In BUFF, tap "I have a family code"` — RoleSelection button is "I'm a Child · I have a code from my parent". | report |
| B-29 | P2 | Web join link, parent signed in on a computer | Guard copy says "This link is for your kid's **phone** … switch this **phone**" on a desktop/home computer. | report |
| B-30 | P1 (activation, UX) | Child join via link | Link pre-fills the code but the kid still lands on "Enter your family code" and must tap Continue, then pick their name (2 taps). Could auto-advance to the name picker (autoFind exists for hand-back). | suggestion |
| B-31 | P2 | Web child join | Child's language is taken from the browser locale (navigator.language) on join and overwrites the app language the parent chose (EN family on a he-IL browser → kid UI flips to Hebrew + restart prompt; English task titles inside Hebrew UI). US browsers unaffected. | report |
| B-32 | P2 | Teen Gamer HQ (Android) | Onboarding step "Connect {name}'s phone →" shown for 6-8 year olds too. | report |
| B-33 | P2 | Test hygiene | `ConciergeCallCard.test.tsx` "re-checks the first win…" times out under full-suite load (passes alone). Flaky. | report |

## Web layout crawl (logged-in, 160 states: 360/390/768/1280 × EN/HE, real backend) — 0 overflow, 0 off-screen, 0 console/HTTP errors

| id | sev | surface | finding | status |
|---|---|---|---|---|
| W-01 | P2 (web HE) | Web Settings, Hebrew | Row label, value and chevron run together ("עבריתשפה", "גרסה1.8.6") — RTL styles in `ParentSettingsScreen.tsx` rows (`rowValue textAlign:'right', marginRight`). Android HE renders fine. | report |
| W-02 | P2 | Web tablet/desktop (≥768) | Bottom sheets (consent, Add Task, Add Reward, Invite a friend) stretch full window width instead of the ~480px app column; Add Task day chips scatter. | report |
| W-03 | P2 (web HE) | Web page headers, Hebrew | Tab titles + "בוקר טוב" greeting + child chip stay left-aligned while cards are right-aligned. | report |
| W-04 | P2 (a11y) | Web + Android | Small tap targets: Notifications back (26×28), Paywall ✕ (31×40), Paywall Privacy/Terms (~16px tall), "Book a call with Adi →" (23px), "+ Add Child" (28px), child "all my tasks" link (29px), switches 40×20. | report |
| W-05 | P2 | Dashboard child card ≤390 | "Send Sticker"/"View as Child" wrap to 2 lines next to 1-line "+ Bonus". | report |
| W-06 | P2 | Settings ≤390 | "BUFF Community" title wraps, subtitle truncated. | report |
| W-07 | P2 | Trial + upsell | Settings says "Parent · BUFF Coach" + "✓ Family plan" (trial) while Dashboard still shows "Get BUFF Coach ✨" upsell (see B-17). | report |
| (W-crawl #3) | — | Mint child headings invisible | same as B-16 → PR #513 | fixed |
| (W-crawl #4) | — | Child UI Hebrew in EN session | same as B-31 (browser locale he) | report |
