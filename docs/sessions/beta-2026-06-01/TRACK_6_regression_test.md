# Track 6 — Beta Regression Test Script

**Status:** `ready — use as the gate before Play Console upload`
**Owner:** Adi (lead tester) + Itay (teen role tester)
**Source spec:** `BUFF_GAP_ANALYSIS.md` §"קריטריון 'מוכן לפרודקשן'" — the 12-flow PRD-faithful test
**Used as:** Final gate for Track 1 Phase 4 (`hardcore-jones` does not upload AAB until this passes)
**Drafted:** 2026-05-16 by CC on `claude/busy-euclid-e43458`

---

## When this gets run

**Beta launch path (option b — all 12 flows working):**

1. All implementation packages merge to main:
   - `pkg/expo-health-and-eas-android` (`hardcore-jones`)
   - `pkg/sentry-integration` (separate session — being handled per Adi 2026-05-16)
   - `pkg/teen-ui-with-buddy-bundle` (new — blocks #5, #6, #8)
   - `pkg/daily-vibe-check` (new — blocks #9)
   - `pkg/childjoin-claim-orphans` *if `lucid-sinoussi` is unparked*
   - Daily Win Bonus branding hookup (new — blocks #7)
   - Stitch 08 + Teen Onboarding Choice impl (new — blocks #3)
2. EAS Build produces a fresh AAB
3. Adi installs the AAB on test device(s)
4. **This regression runs end-to-end** — 12 flows × pass/fail
5. If all pass → upload to Play Console Internal Testing
6. If any fail → fix, rebuild, re-run from step 3

**This is also re-runnable mid-development** — pick the flows whose implementations have landed and verify just those.

---

## Pre-flight

### Test devices

| Tester | Device | Role | Theme |
|---|---|---|---|
| Adi | Real Android phone (Pixel 7 or similar) | Parent + Child 6-12 + Cross-cutting | Pastel |
| Itay | Real Android phone (his own) | Teen | Gamer |
| Adi (secondary) | Pixel_7 AVD on dev machine | Edge-case repro | both |

**iOS:** out of scope — beta is Android-only. iOS users get the waitlist page (TRACK_4a).

### Test accounts

| Account | Family code | Purpose |
|---|---|---|
| Adi's test parent | (existing) | Parent flow + family overview |
| Itay (15) | (existing) | Teen Gamer flow — his real preference |
| Emi (9) | (or test child profile) | Child Pastel 6-12 flow |
| New fresh parent | new family code | Onboarding flow (#1) — must be a brand-new account, never seen onboarding |
| New child via family code | (same family) | ChildJoin flow + cross-cutting orphan claim |

**Lifetime access cohort accounts:** keep separate — do NOT use a cohort member's email for testing. Once Track 5 flips their flags, that's their account.

### Pre-conditions

- [ ] AAB installed from EAS Build artifact (not dev Metro — must be the production build path)
- [ ] Google OAuth still works on the installed build
- [ ] Hebrew + English both render correctly (system language toggle test before flow #1)
- [ ] Sentry DSN configured + a known test error fires to confirm capture (see §"Sentry verification" below)

---

## The 12 flows

Each flow follows the same shape: **Setup → Steps → Pass criteria → Known issues**. Mark each `✅ pass` / `❌ fail` / `⚠️ blocked` in the sign-off table at the bottom.

---

### Flow 1 — Parent onboarding → sensible tasks

**Setup:** Fresh install on a phone that's never seen BUFF. New Google account. No existing family.

**Steps:**
1. Launch app → splash → "Sign up" / "Get started"
2. Google OAuth → grant permissions
3. Family creation flow → family code generated and shown
4. UStep1 Child Profile — enter child name, tap birthday → **native date picker** opens (per F-2026-05-03-01 close)
5. Select date "19 Oct 1998" format displayed (per code at `UStep1_ChildProfile.tsx:24-27`)
6. UStep2 Goal — pick main goal/challenge
7. UStep3 Challenges — multi-select, content scrolls (per F-2026-05-03-01 ScrollView fix)
8. UStep4 (theme/preview), UStep5 Preview/Confirm
9. Lands in Parent Dashboard

**Pass criteria:**
- [ ] All 5 unified onboarding steps complete without crash
- [ ] Native date picker is the iOS-style inline spinner or Android-style modal — NOT a text input
- [ ] Date displays in "19 Oct 1998" format on the button
- [ ] Hebrew users see month names in the active language (note: F-2026-05-16-01 — month names hardcoded to en-GB; flag if user-visible regression)
- [ ] Child profile created in Supabase `profiles` table with `user_id IS NULL` (orphan, awaiting child to claim)
- [ ] Parent Dashboard renders within 2s (PRD §9.3 NFR)
- [ ] Tasks visible match the stage selected during onboarding

**Known limitations to note (not fail):**
- F-2026-05-16-01 Hebrew date format — log as known, don't fail beta on it
- Step 2/3 option dedup partial — log if visible

---

### Flow 2 — Child 6-12 opens → Buddy + tasks

**Setup:** Child profile exists (from Flow 1). Child needs to sign in via family code on a different device (or signed-out state).

**Steps:**
1. From a fresh sign-in screen → "I'm a child" / family code entry
2. Enter family code from Flow 1 + child name
3. **If `lucid-sinoussi` ships** → ChildJoin claims the orphan from Flow 1 instead of creating a duplicate (verify in Supabase: only ONE profile row for the child, with `user_id` now set)
4. Lands in Child Dashboard (Pastel theme — default for age 6-12)
5. BUDDY character visible (egg/hatchling/scout/guardian depending on stage)
6. Today's tasks visible — clear, one focus per row
7. Tap a task → completion flow → submit
8. Parent sees pending approval on their device

**Pass criteria:**
- [ ] No duplicate profile created (single `user_id IS NOT NULL` row matching name + family_id)
- [ ] BUDDY renders at the correct stage
- [ ] Tasks render in clear, ADHD-friendly format (one at a time, no overload)
- [ ] Task completion submits to backend, parent gets approval queue item
- [ ] BUFFs balance updates if task is auto-credit OR after parent approval

**Known limitations to note:**
- If `lucid-sinoussi` doesn't ship: duplicate profile gets created. Flag as known.

---

### Flow 3 — Teen onboarding asks "with or without Buddy?"

**Setup:** Fresh teen profile signing in via family code. Age in profile 13-18.

**Steps:**
1. Family code + teen name
2. **Onboarding Choice screen** (Stitch 08 design) appears: "Show me a Buddy character (Wolf STORMY)" vs "Just the dashboard, no character"
3. Teen picks one
4. Choice persists in `buddy_relationships.buddy_visible` (true = with, false = without)
5. Lands in correct variant

**Pass criteria:**
- [ ] Choice screen appears (NOT skipped for teens)
- [ ] Both options shown with visual preview (Wolf vs no-character)
- [ ] Selection persists to DB — verify in Supabase `buddy_relationships` row
- [ ] Correct variant loads (Flow 4 or Flow 5)
- [ ] Can be changed later via Settings (verified in Flow 6)

**Dependency:** Stitch 08 design + `pkg/teen-ui-with-buddy-bundle` (this is one of the new packages required for option (b))

---

### Flow 4 — Teen "without" → clean dashboard (5B)

**Setup:** Teen profile with `buddy_relationships.buddy_visible = false` (from Flow 3).

**Steps:**
1. App opens → lands in `GamerDashboardScreen` (PR #28)
2. Stat grid renders — BUFFs balance, successful days, current streak
3. No BUDDY character anywhere on screen
4. Today's tasks accessible via tab bar
5. Rewards shop accessible via tab bar (GamerRewardsScreen, PR #30)
6. MyStats screen — 3-stat grid only, no LEVEL/BOOSTERS (lite version per IN-2026-05-14-01)

**Pass criteria:**
- [ ] No buddy/character on dashboard
- [ ] Tab bar renders all 4 tabs (verifies fix-runtime-theme-switch — should NOT blank)
- [ ] Stats display correctly
- [ ] Theme is Gamer (deep violet canvas + lime accents per BUFF_BRAND.md §7.5)

---

### Flow 5 — Teen "with" → Wolf STORMY dashboard (5A)

**Setup:** Teen profile with `buddy_relationships.buddy_visible = true` (from Flow 3).

**Steps:**
1. App opens → lands in dashboard with Wolf STORMY character visible
2. Tap on buddy → navigates to 5A "Me & Buddy" screen
3. Me & Buddy screen shows: Wolf character, friendship LEVEL pill, "Progress to LEVEL N" bar, YOUR BOOSTERS carousel
4. Back to dashboard

**Pass criteria:**
- [ ] Wolf STORMY renders on dashboard
- [ ] Tap navigates to 5A
- [ ] LEVEL pill displays correct level from `buddy_relationships.friendship_level`
- [ ] Progress bar reflects accurate XP toward next level
- [ ] BOOSTERS carousel shows unlocked items (if any) or empty state
- [ ] Hero image / character art renders without blurring

**Dependency:** `pkg/teen-ui-with-buddy-bundle` (extends 5B-lite to full 5B/5A)

---

### Flow 6 — Settings toggle between teen variants

**Setup:** Teen in either variant (Flow 4 or Flow 5).

**Steps:**
1. Open Settings (Stitch 07 — currently undesigned, also new dep)
2. Find BUDDY toggle: "Show Buddy character"
3. Toggle from current state to opposite
4. App re-renders with new variant immediately
5. Toggle again — verify the round-trip works without crash or blank tab bar
6. Theme toggle Mint ↔ Gamer also tested here (per `pkg/fix-runtime-theme-switch` — PR #41)

**Pass criteria:**
- [ ] Toggle persists to DB
- [ ] UI switches variants without crash
- [ ] Tab bar does NOT blank (regression check for fix-runtime-theme-switch)
- [ ] Toggling back and forth 3 times in a row remains stable

**Dependency:** Stitch 07 (Settings) design + `pkg/teen-ui-with-buddy-bundle` Buddy Toggle Modal

---

### Flow 7 — Daily Win Bonus

**Setup:** Child has completed at least 1 task today. Parent has Daily Win Bonus available.

**Steps:**
1. Parent opens Family Overview
2. Sees child's progress card with "Award Daily Win Bonus +20 BUFFs" button
3. Tap the button
4. Confirmation modal: "Give Itay a +20 BUFFs Daily Win Bonus?"
5. Confirm
6. On child's device: BUFFs balance animates +20
7. Celebration modal appears in child UI with branded copy ("YOU JUST GOT A DAILY WIN! +20 BUFFs")

**Pass criteria:**
- [ ] Button appears in parent Family Overview
- [ ] BUFFs balance increments on child side within 5s (push or polling)
- [ ] Celebration modal displays
- [ ] Branding consistent with BUFF_BRAND.md (uses "BUFFs" not "points", lime-bolt accent)

**Dependency:** Daily Win Bonus branding hookup (new — currently 🟡 PARTIAL per GAP_ANALYSIS row P-07)

---

### Flow 8 — BUDDY proposes Theme Color after 3 successful days

**Setup:** Test child account. Manually backfill `buddy_daily_check` rows to simulate 3 days at 70%+ completion (or use the Supabase MCP to insert).

**Steps:**
1. End of day 3 → EOD pg_cron fires (per `pkg/buddy-v05-backend` — shipped 2026-05-15)
2. `buddy_relationships.friendship_level` advances from L1 → L2
3. Theme Color booster gets proposed
4. Child opens app next morning → toast/modal: "Your buddy has a gift! Theme Color unlocked."
5. Tap → theme color picker → choose → applied immediately to UI
6. Booster added to `buddy_gifts_history` table

**Pass criteria:**
- [ ] EOD trigger fires automatically (verify via Supabase log)
- [ ] friendship_level increment is correct
- [ ] Gift toast/modal appears on app open
- [ ] Theme color applies and persists across sessions
- [ ] History row created

**Dependency:** V0.5 UI consumers — toast component + theme color picker (part of `pkg/teen-ui-with-buddy-bundle` extension or separate package)

---

### Flow 9 — Vibe Check + Low Power Mode

**Setup:** First app open of a new day for a child.

**Steps:**
1. App detects new day → Vibe Check prompt fires before showing dashboard
2. Pastel mode: 5 emoji faces (😴 😔 😐 🙂 ⚡)
3. Gamer mode: 5 energy bars (1 to 5)
4. Child picks ≤2 (low energy)
5. **Low Power Mode activates:**
   - Task list reduced to 1-2 lightweight tasks
   - "SOS" button visible (sends notification to parent)
   - "Instant Buff" option visible (+5 BUFFs for self-care moment)
6. Child picks ≥3 (normal energy) — verify Low Power does NOT activate, full task list shown

**Pass criteria:**
- [ ] Vibe Check fires once per day, never twice
- [ ] Rating saved to `child_vibes` table with timestamp
- [ ] Low Power activates at threshold ≤2 only
- [ ] Reduced task list shows priority tasks only
- [ ] SOS sends notification to parent's device
- [ ] Instant Buff awards +5 BUFFs to child balance
- [ ] At ≥3, normal flow continues

**Dependency:** `pkg/daily-vibe-check` (new — per GAP_ANALYSIS row S-07)

---

### Flow 10 — Pause Mode

**Setup:** Family has active tasks. Parent has access to Pause toggle.

**Steps:**
1. Parent opens Family Settings → Pause Mode toggle
2. Toggle ON → confirmation: "Pause everything for the family?"
3. Confirm
4. Child opens app → sees Pause banner: "Family is on pause. No tasks today."
5. Tasks hidden, BUDDY shown in "resting" state (not sad — per BUFF_VALUES.md no-failure-framing)
6. Parent toggles OFF → resume confirmation
7. Child opens app → Welcome Back modal (per Flow 11 if 3+ days, or "Welcome back!" smaller modal if <3 days)

**Pass criteria:**
- [ ] Pause activates in <2s
- [ ] Banner displays in child UI immediately on next app open
- [ ] All task completion paths disabled (tap on task → "We're on pause" not an error)
- [ ] BUDDY visual = resting, NOT sad
- [ ] Resume restores tasks correctly

**Status:** ✅ Already shipped via PR #22-25 — regression check only.

---

### Flow 11 — Welcome Back after 3+ days away

**Setup:** Simulate "user hasn't opened the app for 3+ days" by setting `last_active_at` in DB to 4 days ago (Supabase MCP).

**Steps:**
1. Open app → Welcome Back modal appears before dashboard
2. Copy is warm: "Welcome back! Let's pick up where you left off."
3. No streak loss penalty (per D-2026-05-02-07 — streaks abolished, only Winning Streak)
4. Options: "Catch me up on missed days" / "Reset and start today"
5. Pick "Catch me up" — sees a summary of what they missed
6. Pick "Reset" — starts fresh, no shame language

**Pass criteria:**
- [ ] Modal fires at exactly 3+ days threshold
- [ ] Copy passes BUFF_VALUES Pillar 2 (Positive Coaching — no failure framing)
- [ ] Both options work without crash
- [ ] Streak data not decremented punitively

**Status:** ✅ Already shipped as part of pkg/pause-mode (PR #24) — regression check only.

---

### Flow 12 — Reward redemption celebration

**Setup:** Child has enough BUFFs balance to afford a reward in the shop.

**Steps:**
1. Child opens Rewards Shop (Pastel: ChildRewardsScreen; Gamer: GamerRewardsScreen PR #30)
2. Selects a reward they can afford
3. Tap "Cash in this reward" / "Redeem"
4. Confirmation: "Are you sure?"
5. Confirm → celebration animation/screen plays
6. BUFFs balance decrements correctly
7. Parent receives notification: "[Kid] redeemed [reward]"
8. Parent can mark fulfilled in their UI

**Pass criteria:**
- [ ] Reward shop renders (both Pastel and Gamer)
- [ ] Affordability check correct (can't redeem above balance)
- [ ] Celebration plays for ≥3s with brand-appropriate animation
- [ ] BUFFs deducted atomically (no race condition)
- [ ] Parent notification sent within 30s
- [ ] Reward marked as pending in parent UI until fulfillment

---

## Cross-cutting checks

Run these in parallel to the 12 flows — they affect every persona.

### CC-1: Theme switch doesn't blank tab bar
- In child Settings → toggle Mint ↔ Gamer theme rapidly 5 times
- Tab bar must remain visible after each switch
- Coverage: PR #41 (`pkg/fix-runtime-theme-switch`)

### CC-2: Children don't see paywall CTAs
- Sign in as child (any age)
- Navigate to: Buddy locked → Should show "Ask your parent to unlock", NOT "Subscribe"
- Navigate to: Rewards Shop locked → Should show "Ask your parent to unlock"
- Skin picker locked → Should show "Ask your parent to unlock"
- Coverage: PR #40 (`pkg/hide-paywall-from-child`)

### CC-3: Hebrew RTL renders correctly
- Switch system language to Hebrew → entire UI flips RTL
- Tab bar order reverses correctly
- Text wraps correctly in all screens

### CC-4: Lifetime access cohort doesn't see paywall
- Sign in as a cohort member account (Track 5 flagged with `is_lifetime_access = true`)
- Navigate to any feature behind paywall (rewards shop, full buddy skins, etc.)
- Should bypass paywall entirely — content renders as if subscribed

### CC-5: Google OAuth still works on production build
- Sign out → sign back in via Google
- Verify no "OAuth misconfiguration" error (D-2026-04-28)

### CC-6: i18n — all visible strings are localized
- Walk through onboarding in Hebrew → verify no fallback English strings appear
- Walk through Teen mode in Hebrew → verify Gamer-specific strings localize
- Check celebration modals, error states, paywall replacement text

### CC-7: Offline mode
- Airplane mode ON
- Open app — task list still visible (PRD §9.3 NFR: "Task list must be accessible without internet")
- Task completion queues for sync
- Airplane mode OFF → queued completions sync to backend

---

## Sentry verification

**Run after `pkg/sentry-integration` merges.**

1. **DSN configured:** confirm `sentry.io` project receives a hello event on app launch
2. **Force a JS error:** add a "Throw test error" button in dev menu, tap it → verify it shows up in Sentry within 60s
3. **Source maps work:** the stack trace in Sentry should show real function names (not minified `a.b.c` garbage)
4. **Network errors captured:** disable wifi during a task completion → verify the error gets logged with proper context (user_id, family_id, profile.role)
5. **Performance traces:** verify at least one transaction (e.g. `OnboardingScreen → Dashboard`) appears in Sentry's Performance tab
6. **PII discipline:** Sentry events do NOT include email addresses, child names, or task content as message bodies (only user_id hashes). Verify by inspecting one captured event.

**Pass criteria:**
- [ ] All 6 above ✅
- [ ] No PII leakage in event bodies

---

## Sign-off form

Fill in as you go. One row per flow + cross-cutting + sentry.

| ID | Item | Tester | Device | Result | Notes |
|---|---|---|---|---|---|
| #1 | Parent onboarding | Adi | Pixel 7 | ⬜ | |
| #2 | Child 6-12 opens | Adi | Pixel 7 | ⬜ | |
| #3 | Teen onboarding choice | Itay | his phone | ⬜ | |
| #4 | Teen no-Buddy dashboard | Itay | his phone | ⬜ | |
| #5 | Teen with-Buddy dashboard | Itay | his phone | ⬜ | |
| #6 | Settings variant toggle | Itay | his phone | ⬜ | |
| #7 | Daily Win Bonus | Adi + Emi | 2 phones | ⬜ | |
| #8 | BUDDY booster proposal | Adi | Pixel 7 + DB seed | ⬜ | |
| #9 | Vibe Check + Low Power | Itay + Emi | 2 phones | ⬜ | |
| #10 | Pause Mode | Adi + Emi | 2 phones | ⬜ | |
| #11 | Welcome Back 3+ days | Adi | Pixel 7 + DB seed | ⬜ | |
| #12 | Reward redemption | Adi + Emi | 2 phones | ⬜ | |
| CC-1 | Theme switch | Itay | his phone | ⬜ | |
| CC-2 | Child no-paywall | Adi | Pixel 7 | ⬜ | |
| CC-3 | Hebrew RTL | Adi | Pixel 7 | ⬜ | |
| CC-4 | Lifetime access bypass | Adi (cohort acct) | Pixel 7 | ⬜ | |
| CC-5 | Google OAuth | Adi | Pixel 7 | ⬜ | |
| CC-6 | i18n complete | Adi | Pixel 7 | ⬜ | |
| CC-7 | Offline mode | Adi | Pixel 7 | ⬜ | |
| S-1 | Sentry capture | Adi | Pixel 7 + dashboard | ⬜ | |

**Definition of pass (full sheet):** every row is ✅, OR a documented `⚠️` with explicit "deferred to next drop" note that you and Itay agree on.

---

## Values Check on the regression itself (per BUFF_VALUES.md)

| Pillar | Q | Answer |
|---|---|---|
| Intrinsic Motivation | All 3 | The regression verifies that *flows the child cares about* work — reward redemption, Buddy gift, autonomy in Teen mode. Not just engineering pass/fail. |
| Positive Coaching | All 3 | Several flow pass criteria explicitly check for "no failure framing" (e.g. Welcome Back copy, Pause Mode resting buddy, no streak penalty). |
| Independence-Building | All 3 | Teen flows (3-6) verify the with/without-Buddy choice — the kid's autonomy is in the gate, not just functionality. |

**All 9 pass.** Regression is values-aligned.

---

## What this regression does NOT cover

- **Long-running retention** (month-2 churn cliff per PRD §8.1) — only beta cohort use can reveal this
- **Cross-family edge cases** (siblings, divorced households) — out of MVP scope per PRD
- **iOS** — out of beta scope (waitlist only)
- **High-load performance** — small-cohort beta won't stress this
- **A/B variations of copy** — out of beta scope
- **RevenueCat real charge flow** — cohort gets lifetime access; payment path tested separately in `founding-100-payment` session

These are intentional gaps. If anything from this list becomes a beta blocker, it's a scope expansion → new SPEC, new package.

---

## Re-run schedule

| Trigger | What to re-run |
|---|---|
| Any merge to `main` between now and 2026-06-01 | Re-run the flows whose code paths were touched |
| AAB-rebuild after a fix | Full regression on at least 1 device |
| Cohort migration (Track 5 lifetime flags applied) | CC-4 only |
| Sentry DSN rotation | S-1 only |
| Post-launch in production | Smoke version: #1, #2, #4, #10, #12, CC-1, CC-2, S-1 |

---

## What you do when something fails

1. **Don't stop testing the other flows.** Mark the failed row, write the failure mode in Notes, continue.
2. After full pass, the failure list becomes the **fix-list**.
3. Each fix lands as its own small commit/PR — not a bundle. Same Plan Mode rules.
4. Re-test only the failed flow + adjacent ones.
5. When the list is empty, Track 1 Phase 4 (Play Console upload) is unblocked.

---

**This doc is the gate.** Until every row is ✅ (or explicitly `⚠️ deferred with note`), the AAB does not go to Play Console.
