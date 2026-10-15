# Launch QA — bugs & findings (2026-10-15)

P0 = breaks or badly misleads a NEW family in the first session (fix before launch).
P1 = degrades / loses activation; fix if cheap. P2 = polish / later.

| id | sev | surface | finding | status |
|---|---|---|---|---|
| B-01 | P0 | Parent dashboard hero (both platforms) | **Day-0 false "struggling" insight.** Right after onboarding (1 task done together) the hero card reads "14% · Morning Routine Challenge — Morning tasks have been challenging lately". Cause: `useParentInsights` rates each task over the last 7 calendar days including days BEFORE the task existed, and counts today as a miss before the task's time has come. Evidence: `shots/a23_insight.png`. Violates Pillar 2 (positive coaching) on the first screen every new parent sees. | PR #511 |
| B-02 | P1 | Backend cron | `scan_disengaged_users_daily` failed every day since 2026-08-01 (75×): 3 child profiles with `family_id IS NULL` → notifications insert NOT NULL violation rolls back the whole scan. No disengaged nudges for 2.5 months. | report |
| B-03 | P1 | Backend cron | `refresh-basic-insights-friday` never succeeded (16×): `compute_basic_insight` reads `credit_vault.balance`, real column is `total_balance`. | report |
| B-04 | P1 | Child BUDDY stats | `src/hooks/useChildBuddyStats.ts:50-53` filters `daily_progress.child_profile_id` (column is `child_id`) → 400 in Postgres logs; BUDDY task count always fails. | report |
| B-05 | P1 | Child device (branch 3) | PackingCard "Add mine" → `navigate('ChildAddActivity')` not registered for a real child login → silent no-op (works only in View-as-Child).  **Reproduced on real child login (logcat: NAVIGATE ChildAddActivity not handled).** | PR (in progress) |
| B-06 | P1 | Push | Tapping a push notification goes nowhere — no `addNotificationResponseReceivedListener`; `notificationRouter` never wired. | report |
| B-07 | P2 | Security advisors | ~49 SECURITY DEFINER fns executable by anon; cron/scan fns unguarded (scan_*, run_buddy_eod_for_all…). Revoke anon EXECUTE. Leaked-password protection off. | report |
| B-08 | P1 (activation) | Parent dashboard first fold | New parent's first fold = founder-call card + Smart Organizer + Coach upsell; the child card and "Invite a child" (the ignition step) start below the fold, under the notifications toast. | report |
| B-09 | P2 | Onboarding step 1 | Birthday picker opens on Jan 2010 regardless of chosen age group; no mismatch check (age group 9-11 + 2010 birthday accepted). | report |
| B-10 | P2 | Welcome | "Setting up on a shared computer?" shown on a phone. | report |
| B-11 | P2 | Step 5 → 6 | Button says "Connect {name}'s phone →" but next screen is "Is {name} with you right now?" (first mission), not connecting. | report |
| B-12 | P2 | Dashboard child card | Task done together in onboarding → "1/4 Missions · ⚡ 0 Buffs" (no BUFFs credited for it). Confirm intended. | check |
| B-13 | P2 | Mint teen | Stats tab shown by age band but screen redirects to HQ on Mint skin. | report |
| B-14 | P2 | Code hygiene | ChildTasksScreen + RootNavigator console.log every render (raw tasks JSON) in prod. | report |
| B-15 | P1 | Parent Rewards sheet (Android) | Soft keyboard hides the reward **Title** field while typing — sheet doesn't lift (KAV `height` inside Modal, edge-to-edge). Tasks sheet OK. Same latent issue in ChildSuggest + Timetable. Evidence `shots/a33_kbd.png` vs `a40_taskkbd.png`. | PR #512 |
| B-16 | P1 | Child app, Mint skin (default 6–11) | Child's name, "Quests"/"Shop"/"Menu" titles, active phase tab, "N to go", Focus Fuel counter, "Add my own" rendered in #E9D5FF on mint → ~1.2:1 contrast, near-invisible. Evidence `shots/a56b_hq.png`, `a58_child_shop.png`. | PR #513 |
| B-17 | P2 | Settings → Subscription | Free family whose 14-day Coach trial auto-started (on first kid completion) shows "✅ Family plan" — reads as paid. Should say trial + days left. | report |
| B-18 | P2 | Schedule paste-parse | Input in the documented example format `Sun: math 08:00, english 09:00` → English saved as 08:50 and marked "filled automatically" (explicit time ignored). | report |
| B-19 | P2 | Child HQ (real child login, EN) | "All my tasks ←" — arrow points back in LTR. | report |
| B-20 | P1 (launch risk) | Child invite link → installed app | `assetlinks.json` lists ONE SHA-256 (95:5A:BE…). If that is the EAS upload key and not the **Play app-signing** key, App Links won't verify for Play-installed users → link opens browser → Play Store "Open" → app opens WITHOUT the code. Needs Adi: Play Console → Setup → App integrity → App signing key SHA-256, and Play Console → Deep links status. | Adi check |
| B-21 | P2 | Parent dashboard | Onboarding first-task "done together" credits 0 BUFFs (child shows 0, then 20 after the 2nd task). Confirm intended. | check |
