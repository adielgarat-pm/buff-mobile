# Beta Launch Smoke Test Checklist — 2026-06-01

> **Pass-gate before WhatsApp distribution.** Adi runs each section on the installed APK (Hat-3 emulator or Hat-4 real device). Any ❌ stops the launch.

**APK source of truth:** `pkg/beta-launch-readiness-2026-06-01` HEAD `91e3f498` (main `3d1f20a` + egg-stage workaround per IN-2026-05-16-01).
**EAS build ID:** `be870057-359b-4ce8-85bb-dca708c11405` (preview profile, internal distribution APK).
**Backend:** `gfrongfnyigxsexuofrg` Supabase (mobile DB). Migration 015 + 16 cohort emails seeded.

---

## How to use this file

For each item:
- **Setup** — the precondition (clean install, account state, etc.)
- **Steps** — what Adi does
- **Expected** — what should happen
- **Verdict** — fill in ✅ / ❌ / ⚠️ / 🤔 with notes after running
- **Hat** — 1=automated/CC; 2=web-preview; 3=adb-driven; 4=real device only

Skip any check marked ⏭️ if scope changes mid-run.

---

## Section A — Install + onboarding

> The first 60 seconds the cohort sees. Most important for trust.

### A1 — Clean APK install *(Hat 4)*
- **Setup:** Uninstall any prior BUFF on the device.
- **Steps:** Sideload the new APK (WhatsApp link → Downloads → tap → "Install from unknown sources" → install).
- **Expected:**
  - Splash shows BUFF logo on `#1a1636` background
  - Launcher icon = Lovable PWA asset (NOT generic Android robot — F-2026-05-26-01 was real-device-only)
  - Launcher label = "BUFF" (not "buff-mobile")
- **Verdict:** ⬜

### A2 — Parent Google signup (non-cohort email) *(Hat 4)*
- **Setup:** Fresh install, Google account NOT in `pending_lifetime_grants` and outside beta window (or use email that's known-non-cohort).
- **Steps:** Splash → Role select → Parent → Continue with Google.
- **Expected:**
  - **In window (2026-05-30 → 2026-06-30):** auto-grant lifetime (D1 — beta window covers ALL parent signups). Verify `is_lifetime_access=true` via Supabase MCP after onboarding completes.
  - **Pre-window (today, 2026-05-26):** paywall renders normally on premium features.
- **Verdict:** ⬜
- **Note:** Today's date is 5/26 — pre-window. So expect normal paywall behavior. In-window verification only possible 5/30+.

### A3 — Adi's existing lifetime account (regression check) *(Hat 4)*
- **Setup:** Sign out → sign back in as `adi.elgarat@gmail.com` (pre-existing lifetime, set manually).
- **Expected:** No paywall anywhere; all premium features unlocked.
- **Verdict:** ⬜

### A4 — Cohort email auto-grant (the actual launch test) *(Hat 4 + MCP)*
- **Setup options:**
  - **(i) Real cohort member:** ask one of the 16 to install + sign up + report. Adi confirms via MCP: `SELECT is_lifetime_access FROM profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = '...');` expects `true`.
  - **(ii) Burner email test (Adi alone):** add a burner Gmail Adi controls to `pending_lifetime_grants` via MCP (`INSERT INTO pending_lifetime_grants (email, source) VALUES ('adi-burner@gmail.com', 'mailing_list_49');`) → install → sign up as that email → verify flag flipped → cleanup.
- **Steps (option ii):**
  1. CC (via MCP): seed burner email
  2. Adi: fresh install, sign up via Google with that email
  3. CC (via MCP): verify `pending_lifetime_grants` row gone + `profiles.is_lifetime_access=true`
- **Expected:** Trigger `tg_profiles_after_insert_grants` fires → cohort email matched → flag set → paywall bypassed.
- **Verdict:** ⬜

### A5 — Pillar 3 gate — kid never sees login screen *(Hat 3)*
- **Setup:** Parent signed up, family created.
- **Steps:** Parent shares ChildJoin invite → kid sees ChildJoinScreen prefilled with family code → kid signs in → completes onboarding → app restart → kid still signed in (no login prompt).
- **Expected:** Per `feedback_kids_never_login` — session persists. If kid sees any "sign in" CTA after first ChildJoin, this is a Pillar-3 fail.
- **Verdict:** ⬜

---

## Section B — ChildJoin regression

> All the 5/14–5/26 ChildJoin work (#88 install link + claim orphans + preflight returning user). Must not regress.

### B1 — Parent generates invite link *(Hat 4)*
- **Setup:** Parent signed in, child profile pre-created via onboarding (orphan: `user_id=NULL`).
- **Steps:** Parent dashboard → Share child → invite button.
- **Expected:** WhatsApp/share sheet opens with text matching PR #88 body-double tone. Link format = `buff://join/:code`. Play Store URL included as fallback.
- **Verdict:** ⬜

### B2 — Child taps invite link *(Hat 4)*
- **Setup:** Kid's device receives the WhatsApp link.
- **Steps:** Kid taps the `buff://join/CODE` link.
- **Expected:** BUFF opens → ChildJoinScreen → family code field **prefilled** with `CODE`. Kid types name → join.
- **Verdict:** ⬜

### B3 — Orphan claim *(Hat 3 + MCP)*
- **Setup:** Orphan profile (e.g., "EmiTest") exists in family with `user_id=NULL`, parent-created tasks/rewards.
- **Steps:** Child signs up via ChildJoin with display_name "EmiTest" + family code.
- **Expected:**
  - Preflight RPC `preflight_claim_orphan` detects single orphan match
  - `claim_orphan_profile` RPC fires → orphan's `user_id` now equals new auth.uid
  - No duplicate profile created
  - Parent's pre-seeded tasks visible on kid's dashboard
- **AC:** Issue #50 IN-2026-05-14-03. Verify in MCP: `SELECT count(*) FROM profiles WHERE family_id=... AND display_name='EmiTest';` expects 1.
- **Verdict:** ⬜

### B4 — Returning child re-signs in *(Hat 3)*
- **Setup:** Profile "ZTest520" already in family (from a prior session).
- **Steps:** Sign out → ChildJoin with same name + code.
- **Expected:** Preflight detects returning user → same profile reattaches. No duplicate.
- **Verdict:** ⬜

---

## Section C — Recent UI/UX changes since v8 AAB

> Each item maps to a PR merged since 5/16. Don't skip; these are the things that could have regressed.

### C1 — PR #75 Today/Yesterday toggle on Parent Dashboard *(Hat 4)*
- **Steps:** Parent dashboard → see two pills "היום" / "אתמול" with dates as subtext.
- **Expected:**
  - Full-width row, equal pill widths
  - Active pill: accent purple `#6D28D9` fill + white text
  - Inactive pill: card-white fill + cardBorder + accent text
  - "+ Add Child" row appears only in Today view (NOT Yesterday)
- **Verdict:** ⬜

### C2 — PR #72 Buddy cross-screen sync *(Hat 4)*
- **Setup:** Kid signed in, Buddy visible on dashboard.
- **Steps:** Navigate Settings → toggle Buddy visibility OFF → return to Dashboard.
- **Expected:** Buddy hero/modal reflects the new state **without re-opening the app** (focus-refetch wires it up).
- **Verdict:** ⬜

### C3 — PR #41 Runtime theme switch *(Hat 4)*
- **Setup:** Kid signed in.
- **Steps:** Settings → Theme toggle → switch Mint↔Gamer 5 times in 10s.
- **Expected:** Tab bar **visible throughout**. No flicker > 300ms. State persists across restart. (Pre-existing FLAG — verify in Adi's hands.)
- **Verdict:** ⬜

### C4 — PR #92 i18n polish (HE) *(Hat 4)*
- **Setup:** Device language = Hebrew.
- **Steps:** Walk through:
  - Birthday picker — Hebrew locale (month names: F-2026-05-16-01 may still be en-GB — note, don't fail beta)
  - Parent paywall — Hebrew copy renders correctly
  - Streak placeholder — no `{{streak}}` literal showing
- **Verdict:** ⬜

### C5 — PR #93 Auth race flash *(Hat 4)*
- **Steps:** Sign in fresh (after a sign-out) and observe the transition.
- **Expected:** **No flash** of RoleSelectionScreen between sign-in success and profile fetch landing. Smooth transition.
- **Verdict:** ⬜

### C6 — PR #89 launcher label / PR #90 launcher icon *(Hat 4)*
- **Steps:** Long-press app icon on home screen → check label. Look at launcher / app drawer icon.
- **Expected:** Label = "BUFF". Icon = Lovable PWA asset (purple-bg adaptive icon), NOT generic Android robot.
- **AC:** F-2026-05-26-01 noted that Play Store install dialog still shows generic icon — confirm the *installed* icon is correct (the install dialog is a known limitation).
- **Verdict:** ⬜

### C7 — Egg-stage retired on Pastel dashboard *(Hat 4)* — **NEW THIS BUILD**
- **Setup:** Fresh ChildJoin (clean AsyncStorage → DEFAULT_PET_STATE.evolution_stage='hatchling').
- **Steps:** Kid lands on `ChildDashboardScreen` (Pastel theme).
- **Expected:**
  - **No 🥚 emoji** rendered as the pet body
  - Pet emoji = `skin.emoji` (🐶 puppy default for Mint, or chosen skin)
  - No egg-crack overlay (`crackOverlay` doesn't render — sparkles ✨💫🌟)
  - No "egg crack" message toast
  - Stage badge shows 🐣 Hatchling (i18n) — this is the workaround; full retirement in `pkg/drop-egg-evolution-stage`
- **Compared to pre-fix:** Previous build showed 🥚 + egg-crack mechanic until day 3, against IN-2026-05-16-01 Pillar 1/2/3 decision.
- **Verdict:** ⬜

---

## Section D — Core flows no-regression

> Things shipped earlier that the cohort has used. Confirm nothing broke.

### D1 — Daily Vibe Check fires once per day *(Hat 3)*
- **Steps:** First open of day for kid → Vibe modal fires → pick emoji.
- **Expected:** `child_vibes` row created (UTC date). Reload → no re-prompt today. Verified path from F10.H1/H8 in MASTER_TEST_PLAYBOOK.
- **Verdict:** ⬜

### D2 — Low Power Mode triggers on score≤2 *(Hat 3)*
- **Steps:** Vibe pick → score=2 (😞 face on Pastel) → submit.
- **Expected:** LowPowerBanner visible, SosButton in header, InstantBuffCard renders.
- **Known bug (Medium):** BUG-2026-05-20-01 — InstantBuff +5 BUFFs may fail for fresh ChildJoin profiles missing `credit_vault` row. Document if reproduced.
- **Verdict:** ⬜

### D3 — Anchor Recovery prompt (Phase 1-2) *(Hat 3)*
- **Setup:** Score=2; kid hasn't done vibe/meds in 24h.
- **Expected:** AnchorRecoveryPromptModal renders with vibe / meds shortcuts. Tap creates anchor row. Per `project_buff_anchor_theory`.
- **Verdict:** ⬜

### D4 — BUDDY V0.5 displays *(Hat 3 + MCP)*
- **Setup:** Fresh ChildJoin → `buddy_relationships` row auto-created at friendship_level 1.
- **Steps:** Kid taps Buddy on dashboard.
- **Expected:** BuddyHero renders character (Wolf STORMY Gamer / Capybara LUNA Mint? or per `buddy_visible` default). NOT egg, NOT sleeping. Per BuddyHero day-0 behavior.
- **Verdict:** ⬜

### D5 — Timetable import (3 paste modes) *(Hat 4)*
- **Steps:** Parent → Timetable → Import → paste sample in each format:
  - (i) Simple day/time/activity rows
  - (ii) Hebrew weekday names
  - (iii) Comma-separated condensed
- **Expected:** All 3 parse successfully → entries shown on calendar. Per `ca07c25` "timetable parser fixes" recent merge.
- **Verdict:** ⬜

### D6 — Sentry crash test + PII check *(Hat 4)*
- **Setup:** Kid signed in.
- **Steps:**
  1. Force a crash via a dev path (or wait for an organic one; if no dev path, this becomes "monitor for first organic crash").
  2. Wait 60s.
  3. Open Sentry dashboard → buffadhd/react-native project.
- **Expected:**
  - Event captured within 60s
  - Stack trace symbolicated (NOT minified bytecode)
  - **No PII:** no email, no username, no IP — per `beforeSend` scrubbing in App.tsx
  - Email-like patterns redacted to `[email]` in breadcrumbs
- **AC:** CC4 in MASTER_TEST_PLAYBOOK + Pillar 2.
- **Verdict:** ⬜

---

## Pillar gates (must be all green to ship)

| Pillar | Check | Verdict |
|---|---|---|
| **Pillar 1 — Intrinsic motivation** | No egg-hatch mechanic showing on Pastel dashboard (C7) | ⬜ |
| **Pillar 2 — Positive coaching** | No paywall CTA on any kid screen — sign in as kid, walk every locked content surface, confirm "Ask your parent" copy only. AC: PR #40 hide-paywall-from-child | ⬜ |
| **Pillar 2 — Positive coaching** | Sentry payloads PII-free (D6) | ⬜ |
| **Pillar 3 — Independence-building** | Kid session persists across restart, no kid-side login UX (A5) | ⬜ |

---

## Known limitations / non-blockers

These are accepted for this beta. Document, do not gate launch.

| # | Issue | Workaround |
|---|---|---|
| 1 | **BUG-2026-05-20-02** — `ChildSettingsScreen` displays MOCK_MY_CHILD hardcoded data (1,240 Buffs, dragon avatar) | Document in APK_DISTRIBUTION.md "settings screen shows placeholder, real data coming v1.0.2"; Adi accepted (b) ship-as-is on 2026-05-26 |
| 2 | **F-2026-05-16-01** — Hebrew month names in date picker may be en-GB | Cosmetic, not a launch blocker; F-2026-05-26-… (future package) |
| 3 | **BUG-2026-05-20-01** — InstantBuff RLS for fresh ChildJoin profiles without `credit_vault` row | Document if reproduced in D2; medium severity; future hotfix |
| 4 | **Play Store install dialog icon (F-2026-05-26-01)** — generic Android-robot icon | Real-device-only; Lovable PWA icon shows correctly after install (C6) |
| 5 | **65 pre-existing Supabase advisor WARNs** — anon/authenticated SECURITY DEFINER executability + RLS-always-true on families/email_logs/pwa_events | Project-wide hygiene; future security-cleanup package |
| 6 | **`create_default_tasks_for_child_trigger` disabled in DB** — likely intentional (app code creates tasks) but unverified | Verify during D5 (timetable) — if no tasks seed, this is the cause |
| 7 | **Production AAB v16 ≠ this APK** — v16 AAB Adi built earlier today is from `3d1f20a` (without egg-workaround). Decision: rebuild v17 AAB after this PR merges, or accept Play Store ships egg-version | Adi decides at PR merge time |

---

## Sign-off

| Section | Result | Notes |
|---|---|---|
| A — Install + onboarding | ⬜ | |
| B — ChildJoin regression | ⬜ | |
| C — Recent UI/UX | ⬜ | |
| D — Core flows | ⬜ | |
| Pillar gates | ⬜ | |

**Ship to WhatsApp:** ⬜ (only when all sections + pillar gates are ✅/non-blocking)

**Tester:** Adi
**Date run:** ____________
**APK installed from:** ____________
**Decision:** ⬜ Ship · ⬜ Hold (block) · ⬜ Hold (hotfix needed)
