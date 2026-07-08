# BUFF — Master Test Playbook (autonomous)

> **המעגל העצמאי.** CC מבצע. כל flow + happy + edge cases. מעוגן ל-SPECs קיימים.
> מטרה: סנכרון מלא בין מה ש-CC יכול לאמת לבד (adb + MCP) לבין מה שאך ורק את יכולה (real device sensors, Google OAuth, push, dashboard access).

**גרסה:** 1.0
**נוצר:** 2026-05-20
**מתחזק:** CC. כל סגירת חבילה שמשנה התנהגות נצפית = עדכון של ה-Flow Suite הרלוונטי.

---

## 📑 Index

- [How to run](#how-to-run)
- [Reusable bash helpers](#reusable-bash-helpers)
- [Test Accounts Inventory](#test-accounts)
- [Flow Suites](#flow-suites)
  - F1: ChildJoin (sign-in via family code) + orphan claim
  - F2: Parent signup + family creation
  - F3: Parent onboarding (child profile setup)
  - F4: Task creation (parent)
  - F5: Task completion (child)
  - F6: Task approval (parent)
  - F7: Reward creation (parent)
  - F8: Reward redemption (child)
  - F9: Reward fulfillment (parent)
  - F10: Daily Vibe Check + Low Power Mode
  - F11: SOS notifications (parent side)
  - F12: Pause Mode
  - F13: Theme switching (Pastel/Gamer)
  - F14: BUDDY V0.5 friendship + gifts
  - F15: Teen onboarding (Buddy with/without choice)
  - F16: Schedule/timetable
  - F17: Multi-child family flows
  - F18: i18n + Hebrew RTL
  - F19: Paywall + lifetime cohort bypass
- [Cross-cutting tests](#cross-cutting)
- [Sign-off](#sign-off)

---

<a name="how-to-run"></a>
## 🔧 How to run this playbook

### Prerequisites

1. **Emulator** running. Verify: `adb devices` shows `emulator-XXXX device`
2. **Metro** on canonical port 8083 — `source .claude/skills/buff-testing/helpers.sh && metro_acquire` (reuses a healthy Metro for this worktree, else starts one detached + waits healthy). See `docs/DEV_SERVER_LIFECYCLE.md`.
3. **BUFF dev-client** installed (`com.buffapp.mobile`)
4. **Supabase MCP** available (for DB-side assertions). If down — mark DB-dependent assertions as 🤔.

### Execution model

Each scenario in this playbook is structured as:
```
F-N.X: <title>
  Setup → Steps → Expected → AC anchors → Verdict
```

CC runs scenarios via the bash helpers below. Verdict logging goes back into this file under "Last verdict" per scenario.

### Reset between scenarios

Most scenarios need a clean slate. The cleanup paths:
- **Sign-out:** `[Hat 3] Menu → Sign out` OR via SDK: clear AsyncStorage + Supabase session
- **DB reset of a child:** Supabase MCP `DELETE FROM profiles WHERE display_name='ZTest520'` (+ cascades). Only via MCP.
- **Vibe re-prompt:** `DELETE FROM child_vibes WHERE child_id=... AND date=today` via MCP.

---

<a name="reusable-bash-helpers"></a>
## 🛠 Reusable bash helpers

Paste at the top of any test bash session:

```bash
# === BUFF test runner helpers ===
export ADB="/c/Users/adiel/AppData/Local/Android/Sdk/platform-tools/adb.exe"
export PKG="com.buffapp.mobile"
export METRO_URL="http://10.0.2.2:8083"
export TMP_DIR="C:/Users/adiel/buff-mobile/.claude/tmp"
mkdir -p "$TMP_DIR"

# Quick verify emulator is connected
buff_check() { "$ADB" devices; }

# Force-stop the app
buff_stop() { "$ADB" shell am force-stop "$PKG"; }

# Launch app via dev-client deep link → connects to Metro
buff_launch() {
  "$ADB" shell am start \
    -a android.intent.action.VIEW \
    -d "exp+buff-mobile://expo-development-client/?url=$(printf %s "$METRO_URL" | sed 's/:/%3A/g; s|/|%2F|g')" \
    -n "$PKG/expo.modules.devlauncher.launcher.DevLauncherActivity"
}

# Hard-restart the app (stop + launch + wait for bundle)
buff_restart() { buff_stop; sleep 2; buff_launch; sleep 12; }

# Take a screenshot to $TMP_DIR/<name>.png
buff_screenshot() {
  local name="${1:-$(date +%s)}"
  MSYS_NO_PATHCONV=1 "$ADB" shell "screencap -p /sdcard/_s.png"
  MSYS_NO_PATHCONV=1 "$ADB" pull /sdcard/_s.png "$TMP_DIR/$name.png" > /dev/null
  echo "$TMP_DIR/$name.png"
}

# Tap at x,y (in 1080x2400 native coordinates)
buff_tap() { "$ADB" shell input tap "$1" "$2"; }

# Tap by text (uses uiautomator dump). Returns 0 if found+tapped, 1 if not found.
buff_tap_text() {
  local text="$1"
  buff_dump > /dev/null
  local bounds=$(grep -oE "<node[^>]*(text|content-desc)=\"[^\"]*$text[^\"]*\"[^>]*bounds=\"[^\"]*\"" "$TMP_DIR/_ui.xml" | grep -oE 'bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' | head -1)
  if [ -z "$bounds" ]; then echo "NOT FOUND: $text"; return 1; fi
  local nums=$(echo "$bounds" | grep -oE '[0-9]+')
  local x1=$(echo "$nums" | sed -n '1p')
  local y1=$(echo "$nums" | sed -n '2p')
  local x2=$(echo "$nums" | sed -n '3p')
  local y2=$(echo "$nums" | sed -n '4p')
  local cx=$(( (x1+x2)/2 ))
  local cy=$(( (y1+y2)/2 ))
  "$ADB" shell input tap "$cx" "$cy"
  echo "TAPPED: $text @ ($cx,$cy)"
}

# Type text into focused field
buff_type() { "$ADB" shell input text "$1"; }

# Send keyevent (BACK, ENTER, TAB, HOME)
buff_key() { "$ADB" shell input keyevent "KEYCODE_$1"; }

# Dump UI hierarchy to $TMP_DIR/_ui.xml
buff_dump() {
  MSYS_NO_PATHCONV=1 "$ADB" shell "uiautomator dump /sdcard/_ui.xml" > /dev/null
  MSYS_NO_PATHCONV=1 "$ADB" pull /sdcard/_ui.xml "$TMP_DIR/_ui.xml" > /dev/null
}

# Assert text present in UI. Returns 0 (pass) or 1 (fail).
buff_assert_text() {
  local needle="$1"
  buff_dump
  if grep -q "$needle" "$TMP_DIR/_ui.xml"; then echo "✅ present: $needle"; return 0
  else echo "❌ missing: $needle"; return 1
  fi
}

# Assert text NOT present
buff_assert_no_text() {
  local needle="$1"
  buff_dump
  if grep -q "$needle" "$TMP_DIR/_ui.xml"; then echo "❌ unexpectedly present: $needle"; return 1
  else echo "✅ absent: $needle"; return 0
  fi
}

# Read recent RN logs
buff_logs() { "$ADB" logcat -d ReactNativeJS:V "*:S" | tail -"${1:-20}"; }

# Clear logcat (call before triggering an action you want to grep for)
buff_logs_reset() { "$ADB" logcat -c; }

# Swipe down to scroll
buff_scroll_down() { "$ADB" shell input swipe 540 1800 540 800 500; }
buff_scroll_up() { "$ADB" shell input swipe 540 800 540 1800 500; }

# Check current foreground activity
buff_focus() { "$ADB" shell dumpsys window | grep mCurrentFocus | head -1; }
```

---

<a name="test-accounts"></a>
## 👤 Test Accounts Inventory

| Label | Role | Family code | Theme | Lifetime | Purpose |
|---|---|---|---|---|---|
| `parent-main` | Parent (Adi's primary) | KWYEL5 (real) | Pastel | N | Most parent flows |
| `parent-fresh-N` | Parent (burner Gmail) | new | Pastel | N | F2 fresh signup. NEW per run. |
| `parent-cohort-test` | Parent | cohort | Pastel | Y | F19 lifetime bypass |
| `teen-itay` | Teen 15 | KWYEL5 | Gamer | N | F15 Teen flows |
| `child-emi` | Child 9 (or substitute) | KWYEL5 | Pastel | N | F1, F5, F8, F10 |
| `child-ZTest520` | Child test (created via F1) | KWYEL5 | Pastel | N | Active test profile (used 2026-05-20) |
| `child-stale` | DB-seeded last_active=4d | KWYEL5 | Pastel | N | F10 Welcome Back trigger |
| `child-buddy-l2` | DB-seeded 3-successful-days | KWYEL5 | Pastel | N | F14 Theme Color gift trigger |

**Convention:** never reuse `parent-fresh-N` — onboarding scenarios require a never-seen account.

---

<a name="flow-suites"></a>
## 📋 Flow Suites

> Verdict codes per scenario: ✅ pass · ❌ fail · ⚠️ blocked · 🤔 uncertain · ⬜ never run
> Hat codes: **1**=automated/static · **2**=web-preview-manual · **3**=adb-driven · **4**=truly-only-Adi

---

### F1 — ChildJoin (sign-in via family code) + orphan claim

**Source SPEC:** `docs/sessions/childjoin-claim-orphans/SPEC.md` + migrations 007, 008
**Files:** `src/screens/auth/ChildJoinScreen.tsx`, `src/contexts/AuthContext.signUp`, RPCs `preflight_claim_orphan` + `claim_orphan_profile`
**Persona:** Child

#### Happy

**F1.H1 — Brand-new child, no orphan in family** *(Hat 3, autonomous)*
- **Setup:** Fresh app, family KWYEL5, name not in family.
- **Steps:** `buff_launch`; tap "I'm a Child"; type name; type "KWYEL5"; tap "Join my family"
- **Expected:** logcat `[signUp] family lookup result: {"family":{"id":"..."}}`; role flips to `child`; lands in dashboard or VibeCheck modal.
- **AC:** Issue #50 P-1.
- **Verdict:** ✅ Verified 2026-05-20 with ZTest520

**F1.H2 — Returning child, profile exists** *(Hat 3)*
- **Setup:** Profile for "ZTest520" already exists in KWYEL5 (from H1).
- **Steps:** `buff_stop`; sign out; rerun ChildJoin same name+code.
- **Expected:** Preflight detects returning user (post-hotfix `e0025d7`); same profile reattaches, no duplicate.
- **AC:** migration 008 contract.
- **Verdict:** ⬜

**F1.H3 — Child claims orphan profile** *(Hat 3 + MCP)*
- **Setup:** Parent created orphan profile via onboarding (user_id IS NULL) for name "EmiTest" in family. Child not yet signed in.
- **Steps:** ChildJoin with EmiTest + family code.
- **Expected:** Preflight detects single orphan match → `claim_orphan_profile` RPC fires → orphan's `user_id` becomes the new auth.uid; tasks + rewards from parent's onboarding visible.
- **AC:** Issue #50 IN-2026-05-14-03.
- **Verdict:** ⬜

#### Edge

**F1.E1 — Invalid family code** *(Hat 3, autonomous)*
- **Setup:** Fresh app.
- **Steps:** ChildJoin with name "X" + code "XXX999".
- **Expected:** logcat `family lookup result: {"family":null, "lookupError": ...}`; UI shows friendly error.
- **Verdict:** ⬜

**F1.E2 — Empty name** *(Hat 3)*
- **Steps:** ChildJoin with empty name + valid code.
- **Expected:** Form validation blocks submit OR backend rejects gracefully.
- **Verdict:** ⬜

**F1.E3 — Duplicate name in family** *(Hat 3 + MCP)*
- **Setup:** Profile "ZTest520" already exists. Sign in as different account, try ChildJoin with same name + code.
- **Expected:** Should NOT create duplicate. Either claims or shows ambiguity UX (per SPEC Q4).
- **Verdict:** ⬜

**F1.E4 — Multiple orphans with same name** *(Hat 3 + MCP)*
- **Setup:** DB seed 2 orphan profiles with display_name "Twins" in same family.
- **Expected:** Preflight returns ambiguous; UI shows picker OR blocks with parent banner (per SPEC Q4).
- **Verdict:** ⬜

**F1.E5 — Network offline during join** *(Hat 3)*
- **Setup:** `adb shell svc data disable && adb shell svc wifi disable`.
- **Steps:** Try ChildJoin.
- **Expected:** Friendly error toast, no crash, retry works after re-enable.
- **Verdict:** ⬜

---

### F2 — Parent signup + family creation

**Source:** PRD §3.1 (auth), `src/screens/auth/SignupScreen.tsx`, `useAuth.signUp`
**Persona:** Parent
**Hat note:** Google OAuth requires real Google Play Services on emulator — often fails. Best on real device (Hat 4).

#### Happy

**F2.H1 — Signup via email/password (parent role)** *(Hat 3 + MCP)*
- **Setup:** Fresh app, fresh email.
- **Steps:** RoleSelection → "I'm a Parent" → fill email/password → submit.
- **Expected:** Profile created with role='parent'; family auto-created with 6-char code; lands in onboarding (UStep1).
- **Verdict:** ⬜

**F2.H2 — Signup via Google OAuth** *(Hat 4 — emulator unreliable)*
- **Steps:** RoleSelection → "I'm a Parent" → Continue with Google → OAuth.
- **Expected:** Same outcome as H1 but with `auth.users.app_metadata.provider='google'`.
- **Verdict:** ⬜ (manual on real device)

**F2.H3 — Signup as Teen (self-signup)** *(Hat 3)*
- **Steps:** Signup → pick "Teen" role → email/pass.
- **Expected:** Profile with role='child' (or 'teen'? verify); no family code yet; lands in Teen onboarding (or special teen flow).
- **Verdict:** ⬜

#### Edge

**F2.E1 — Duplicate email** *(Hat 3)*
- **Setup:** Account exists for email X.
- **Steps:** Try signup with same email.
- **Expected:** Friendly error "Account exists, log in instead".
- **Verdict:** ⬜

**F2.E2 — Weak password** *(Hat 3)*
- **Steps:** Signup with password "123".
- **Expected:** Validation error; no profile created.
- **Verdict:** ⬜

**F2.E3 — Marketing-consent checkbox state persists to DB** *(Hat 3 + MCP)*
- **Steps:** Toggle "I want occasional tips" checkbox.
- **Expected:** `profiles.marketing_consent` matches checkbox state on row insert.
- **Verdict:** ⬜

---

### F3 — Parent onboarding (child profile setup, 5+ steps)

**Source:** PRD §6, `src/screens/onboarding/unified/UStep1_*.tsx` through `UStep8_Complete.tsx`, F-2026-05-03-01 (native date picker)
**Persona:** Parent
**Hat note:** Native date picker = Android native modal. adb can interact but the picker is a system dialog; need to verify visually.

#### Happy

**F3.H1 — Full happy path through 5 onboarding steps** *(Hat 3)*
- **Setup:** Fresh parent profile post-signup.
- **Steps:**
  1. UStep1: type child name; tap birthday → **native date picker opens** (Hat 3 verify modal type)
  2. Select date → confirm
  3. UStep2: pick main goal
  4. UStep3: pick 1+ challenges (scroll if needed; per F-2026-05-03-01 ScrollView fix)
  5. UStep4: pick motivator
  6. UStep5: preview → confirm
  7. UStep7 phone (skippable)
  8. UStep8 complete → lands in ParentDashboard
- **Expected:** child profile in `profiles` with `user_id=NULL` (orphan, awaiting child to claim); tasks pre-seeded based on goal+challenges; rewards pre-seeded.
- **AC:** F-2026-05-03-01 close + Issue #47.
- **Verdict:** ⬜

**F3.H2 — Date picker shows native UI, not text input** *(Hat 3)*
- **Steps:** UStep1 → tap birthday button.
- **Expected:** Native Android date spinner modal opens. NOT a text field.
- **AC:** F-2026-05-03-01.
- **Verdict:** ⬜

**F3.H3 — Hebrew locale displays Hebrew month names** *(Hat 3)*
- **Setup:** System language=Hebrew before launch.
- **Steps:** Run H1.
- **Expected:** All UI Hebrew; date display in Hebrew format.
- **Known limitation:** F-2026-05-16-01 — month names may still hardcode en-GB. Log as known, don't fail beta.
- **Verdict:** ⬜

#### Edge

**F3.E1 — Skip UStep7 phone** *(Hat 3)*
- **Expected:** Phone field is optional; UStep8 completes without phone.
- **Verdict:** ⬜

**F3.E2 — Back navigation preserves state** *(Hat 3)*
- **Steps:** Fill UStep1 fully → tap back → return to UStep1.
- **Expected:** Form state preserved (name + date still filled).
- **Verdict:** ⬜

**F3.E3 — Empty required fields block forward** *(Hat 3)*
- **Steps:** UStep1 → tap forward without name.
- **Expected:** Validation error, no advance.
- **Verdict:** ⬜

**F3.E4 — Duplicate options across UStep2 and UStep3** *(Hat 3)*
- **Setup:** Pick same value in UStep2 and UStep3 (if possible).
- **Expected:** Per FLAG in CLAUDE.md — "duplicate options between Steps 2-3" is known partial. Surface visible.
- **Verdict:** ⬜

**F3.E5 — UStep3 ScrollView content not clipped** *(Hat 3)*
- **Steps:** Open UStep3 → scroll down through all challenges.
- **Expected:** All options visible without clipping (post-fix F-2026-05-03-01).
- **Verdict:** ⬜

---

### F4 — Task creation (parent)

**Source:** `src/screens/parent/ParentTasksScreen.tsx`, `useChildrenDashboard`
**Persona:** Parent

#### Happy

**F4.H1 — Create task assigned to existing child** *(Hat 3 + MCP)*
- **Setup:** Parent + child in same family.
- **Steps:** ParentTasksScreen → "+ Add task" → fill title + value (BUFFs reward) + child selector → save.
- **Expected:** Task row in `tasks` table with correct child_id, parent-set BUFFs reward.
- **Verdict:** ⬜

**F4.H2 — Task appears on child's dashboard within 5s** *(Hat 3 + MCP)*
- **Setup:** F4.H1 done; child signed in on second device or after sign-out/sign-in.
- **Expected:** Task visible in ChildTasksScreen (Pastel) or GamerTasksScreen (Gamer).
- **Verdict:** ⬜

#### Edge

**F4.E1 — Task with empty title** *(Hat 3)*
- **Expected:** Validation blocks save.
- **Verdict:** ⬜

**F4.E2 — Task with 0 BUFFs reward** *(Hat 3)*
- **Expected:** Either allowed (zero is OK) or validation error — verify SPEC intent. SPEC silent → SPEC sync needed.
- **Verdict:** ⬜

**F4.E3 — Edit task while child is mid-completion** *(Hat 3)*
- **Setup:** Child tapped task → mid-completion screen open. Parent edits the same task.
- **Expected:** No crash; child's UI updates next refresh OR keeps stale data with reconcile.
- **Verdict:** ⬜

**F4.E4 — Delete task that's been completed** *(Hat 3 + MCP)*
- **Expected:** Soft-delete OR archive — completion history preserved. Verify in DB.
- **Verdict:** ⬜

---

### F5 — Task completion (child)

**Source:** `src/screens/child/ChildTasksScreen.tsx` / `GamerTasksScreen.tsx`, completion submission flow
**Persona:** Child

#### Happy

**F5.H1 — Tap task → submit completion → BUFFs added** *(Hat 3 + MCP)*
- **Setup:** Child signed in, has at least one open task.
- **Steps:** Tap task → tap "Done" / "Submit"
- **Expected:** Task moves to "Done" tab; `credit_vault.total_balance` increments by task's BUFFs (assuming auto-credit) OR moves to "pending parent approval" queue.
- **Verdict:** ⬜

**F5.H2 — "Done" count + "Buffs" count update on dashboard** *(Hat 3)*
- **Steps:** Complete 2 tasks.
- **Expected:** Done stat = 2; Buffs stat = sum of tasks' BUFFs.
- **Verdict:** ⬜

#### Edge

**F5.E1 — Network offline during completion** *(Hat 3)*
- **Setup:** `adb shell svc wifi disable`
- **Steps:** Tap Done.
- **Expected:** Queued locally; sync on reconnect. PRD §9.3 NFR.
- **Verdict:** ⬜

**F5.E2 — Double-tap Done (race)** *(Hat 3)*
- **Steps:** Rapid-tap Done twice.
- **Expected:** Idempotent — only 1 completion record. No double-credit.
- **Verdict:** ⬜

**F5.E3 — Complete already-completed task** *(Hat 3)*
- **Expected:** UI blocks via disabled state OR backend rejects gracefully.
- **Verdict:** ⬜

**F5.E4 — Complete task during Low Power Mode (trimmed list)** *(Hat 3)*
- **Setup:** Low Power active (F10.H1 → score=2).
- **Steps:** Complete the 1-2 trimmed tasks.
- **Expected:** Completion works as normal; Done+Buffs update.
- **Verdict:** ⬜

---

### F6 — Task approval (parent)

**Source:** Parent dashboard approval queue
**Persona:** Parent

#### Happy

**F6.H1 — Parent sees pending approval and approves** *(Hat 3 + MCP)*
- **Setup:** Child completed task that requires parent approval.
- **Steps:** Parent dashboard → approval queue → "Approve".
- **Expected:** Task marked approved; BUFFs released to child's vault.
- **Verdict:** ⬜

#### Edge

**F6.E1 — Reject completion** *(Hat 3)*
- **Steps:** Approve queue → "Reject".
- **Expected:** Task returns to open state for child; BUFFs not awarded.
- **Verdict:** ⬜

**F6.E2 — Old pending completions (>30d)** *(Hat 3 + MCP)*
- **Expected:** Behavior per SPEC — auto-archive? Re-prompt? SPEC sync needed.
- **Verdict:** ⬜

---

### F7 — Reward creation (parent)

**Source:** `src/screens/parent/ParentRewardsScreen.tsx`
**Persona:** Parent

#### Happy

**F7.H1 — Create new reward with title + BUFFs cost** *(Hat 3 + MCP)*
- **Steps:** ParentRewardsScreen → "+ Add reward" → title + cost + (optional) image → save.
- **Expected:** `rewards` table row; visible on child rewards shop.
- **Verdict:** ⬜

**F7.H2 — Child-proposed rewards (PRD §6.3 Phase 1.1)** *(Hat 3 + MCP)*
- **Steps:** Child proposes a reward → parent approves with cost.
- **Expected:** Reward enters shop with `proposed_by=child_id`. PRD Pillar 1 — child voice.
- **Verdict:** ⬜ (if shipped — verify)

#### Edge

**F7.E1 — Reward with 0 cost** *(Hat 3)*
- **Expected:** Allowed (free reward) OR validation. SPEC needs clarity.
- **Verdict:** ⬜

**F7.E2 — Reward with very high cost (e.g. 99999)** *(Hat 3)*
- **Expected:** No cap; UI renders large number OK.
- **Verdict:** ⬜

**F7.E3 — Edit reward while it's pending redemption** *(Hat 3)*
- **Expected:** Defensive — pending redemptions use snapshot of cost at redemption time, not live cost.
- **Verdict:** ⬜

---

### F8 — Reward redemption (child)

**Source:** `src/screens/child/ChildRewardsScreen.tsx` / `GamerRewardsScreen.tsx` (PR #30)
**Persona:** Child

#### Happy

**F8.H1 — Child redeems affordable reward** *(Hat 3 + MCP)*
- **Setup:** Child has BUFFs ≥ reward cost.
- **Steps:** Shop → tap reward → "Cash in" → confirm.
- **Expected:** Celebration animation ≥3s; BUFFs deducted atomically; pending row in `reward_redemptions` table.
- **Verdict:** ⬜

**F8.H2 — Parent notification arrives within 30s** *(Hat 3 + MCP)*
- **Expected:** Parent's notification feed has a `reward_redeemed` row.
- **Verdict:** ⬜

#### Edge

**F8.E1 — Reward unaffordable (insufficient BUFFs)** *(Hat 3)*
- **Steps:** Tap reward when balance < cost.
- **Expected:** UI shows "Need X more BUFFs" or grays out CTA.
- **Verdict:** ⬜

**F8.E2 — Double-tap redeem (race)** *(Hat 3)*
- **Expected:** Only one redemption row; balance deducted once.
- **Verdict:** ⬜

**F8.E3 — Child sees no paywall CTAs in shop** *(Hat 3)*
- **AC:** PR #40 `pkg/hide-paywall-from-child`.
- **Expected:** No "Subscribe" anywhere; locked rewards say "Ask your parent".
- **Verdict:** ⬜

---

### F9 — Reward fulfillment (parent)

**Source:** ParentRewardsScreen approval queue
**Persona:** Parent

#### Happy

**F9.H1 — Parent marks redemption as fulfilled** *(Hat 3)*
- **Steps:** Notification "Itay redeemed Movie Night" → tap → mark fulfilled.
- **Expected:** `reward_redemptions.fulfilled_at` set; child sees "Movie Night confirmed by parent".
- **Verdict:** ⬜

#### Edge

**F9.E1 — Parent denies fulfillment** *(Hat 3)*
- **Expected:** BUFFs refund to child? Per SPEC — verify policy. (Likely yes for trust.)
- **Verdict:** ⬜

---

### F10 — Daily Vibe Check + Low Power Mode

**Source SPEC:** `docs/sessions/daily-vibe-check/SPEC.md` (16 locked decisions)
**Files:** VibeCheckScreen, vibeUtils, LowPowerContext, LowPowerBanner, SosButton, InstantBuffCard
**See also:** `docs/sessions/daily-vibe-check/AC_MATRIX.md` (38 ACs)

#### Happy

**F10.H1 — Modal fires on first open of day → score=2 → Low Power activates** *(Hat 3, autonomous)*
- **Already verified 2026-05-20** — full evidence in AC_MATRIX.md.
- **Verdict:** ✅

**F10.H2 — Score=3 → normal flow (no Low Power)** *(Hat 3 + MCP cleanup)*
- **Setup:** DB-delete today's child_vibes row (or use fresh profile).
- **Steps:** Re-trigger modal → tap emoji 3 (😐).
- **Expected:** Dashboard renders normal — no banner, no SOS in header, no InstantBuffCard.
- **AC:** AC-2.6, AC-3.11.
- **Verdict:** ⬜

**F10.H3 — Pause Mode active → no modal** *(Hat 3 + MCP)*
- **Setup:** `useAppSettings.pauseEnabled = true` (parent toggle).
- **Steps:** Child opens app.
- **Expected:** No Vibe Check fires. Pause UI takes precedence.
- **AC:** AC-2.9 / Scenario C.
- **Verdict:** ⬜

**F10.H4 — Dismiss "Maybe later" → no row, no re-prompt today** *(Hat 3 + MCP)*
- **AC:** AC-2.10 / OQ3 / Scenario D.
- **Expected:** No `child_vibes` row created. Reload → no re-prompt.
- **Verdict:** ⬜

**F10.H5 — Gamer Vibe Check shows 5 bars (not faces)** *(Hat 3)*
- **Setup:** Teen profile or age 13-18 in family.
- **Expected:** OQ7 — 5 horizontal lime-fill bars.
- **AC:** AC-2.3.
- **Verdict:** ⬜

**F10.H6 — SOS confirm + flip + "Sent" persists across restart** *(Hat 3 autonomous)*
- **Already verified 2026-05-20** — AC-3.3, AC-3.4, AC-3.5.
- **Verdict:** ✅

**F10.H7 — InstantBuff award +5 BUFFs (existing credit_vault)** *(Hat 3 + MCP)*
- **Setup:** Child with existing credit_vault row.
- **Expected:** Tap "Done! +5 BUFFs" → balance +5.
- **AC:** AC-3.7.
- **Verdict:** ❌ **BUG-2026-05-20-01** for new ChildJoin profiles with no credit_vault. See AC_MATRIX.

**F10.H8 — Once-per-day gate survives app restart** *(Hat 3 autonomous)*
- **Already verified 2026-05-20** — AC-2.8.
- **Verdict:** ✅

#### Edge

**F10.E1 — UTC midnight rollover** *(Hat 3 + MCP)*
- **Setup:** DB seed today's vibe; advance system clock past midnight UTC (or use date-faking).
- **Expected:** Vibe modal fires again on new UTC date.
- **AC:** OQ1 decision (UTC date).
- **Verdict:** ⬜

**F10.E2 — Vibe insert fails (network)** *(Hat 3)*
- **Setup:** Disable network → tap emoji.
- **Expected:** Friendly error; retry available; no double-row.
- **Verdict:** ⬜

**F10.E3 — InstantBuff card returns after restart if award failed** *(Hat 3)*
- **Already verified 2026-05-20** — BUG-2026-05-20-01 path: card visible again post-restart because no DB row was created.
- **Verdict:** ✅ (defensive behavior works)

**F10.E4 — SOS button DOES NOT show for score=3+** *(Hat 3)*
- **Expected:** SosButton renders null when `!isLowPower`. Code verified ✅; UI-verify if score=3 profile exists.
- **Verdict:** ⬜

**F10.E5 — Multiple SOS taps same row** *(Hat 3 + MCP)*
- **Setup:** SOS sent. Confirm dialog still has YES? It shouldn't — button disabled.
- **Expected:** Idempotent — no second notification.
- **AC:** Migration 011 `NOT EXISTS` guard.
- **Verdict:** ⬜

**F10.E6 — BUDDY doesn't go sad on low score** *(Hat 3 autonomous)*
- **Already verified 2026-05-20** — VC-4.
- **Verdict:** ✅

---

### F11 — SOS notifications (parent side)

**Source:** Phase 4 of daily-vibe-check, migration 011, useParentNotifications hook
**Persona:** Parent

#### Happy

**F11.H1 — Parent sees SOS badge on child card** *(Hat 3 + MCP)*
- **Setup:** Child sent SOS (F10.H6 done).
- **Steps:** Parent signs in → dashboard.
- **Expected:** Child card shows badge/dot + italic muted-text row "wanted to share — low energy today" (per OQ4 EX-1 refined copy).
- **AC:** AC-4.9.
- **Verdict:** ⬜

**F11.H2 — Realtime push: SOS appears without manual refresh** *(Hat 3)*
- **Setup:** Parent dashboard open. Child (other device) sends SOS.
- **Expected:** Within seconds, badge appears on parent screen (Supabase realtime).
- **AC:** useParentNotifications subscription.
- **Verdict:** ⬜

**F11.H3 — No global banner (per EX-2)** *(Hat 3)*
- **Expected:** SOS only on child card, NOT a screen-wide banner.
- **AC:** EX-2.
- **Verdict:** ⬜

**F11.H4 — Auto-clears at UTC midnight** *(Hat 3 + MCP / clock-mock)*
- **Expected:** Badge gone next day even without parent action.
- **AC:** EX-3.
- **Verdict:** ⬜

#### Edge

**F11.E1 — No mark-as-read action in v1** *(Hat 3)*
- **Steps:** Tap badge / row.
- **Expected:** Per EX-3 — no action available, info-only.
- **Verdict:** ⬜

**F11.E2 — Multiple SOS from same kid in one day** *(Hat 3 + MCP)*
- **Expected:** Trigger idempotent. Only one notification visible.
- **Verdict:** ⬜

**F11.E3 — Two kids both send SOS** *(Hat 3 + MCP)*
- **Expected:** Both child cards show badges independently.
- **Verdict:** ⬜

**F11.E4 — Migration 011 applied to live project** *(Hat 1 + MCP)*
- **AC:** AC-4.1.
- **Verdict:** 🤔 — comment in file says applied 2026-05-17 to gfrongfnyigxsexuofrg. Awaits MCP `list_migrations` confirm.

---

### F12 — Pause Mode

**Source SPEC:** `docs/sessions/pause-mode/SPEC.md`, PRs #22-25
**Persona:** Parent (toggle), Child (sees effect)

#### Happy

**F12.H1 — Parent toggles ON → child sees Pause banner** *(Hat 3 + MCP)*
- **Steps:** Parent settings → Pause Mode toggle → confirm.
- **Expected:** `useAppSettings.pauseEnabled=true`; child UI shows banner "Family is on pause"; tasks hidden; BUDDY in resting state.
- **AC:** PR #24 + Values Pillar 2 (resting ≠ sad).
- **Verdict:** ⬜

**F12.H2 — Pause persists across child app restart** *(Hat 3)*
- **Verdict:** ⬜

**F12.H3 — Parent toggles OFF → child sees Welcome Back** *(Hat 3)*
- **Expected:** If <3 days: small "Welcome back" toast. If 3+ days: full Welcome Back modal (PRD).
- **Verdict:** ⬜

#### Edge

**F12.E1 — Vibe Check skipped during Pause** *(Hat 3)*
- **Expected:** Per AC-2.9 — Pause overrides Vibe Check entirely.
- **Verdict:** ⬜

**F12.E2 — Task tap during Pause** *(Hat 3)*
- **Expected:** Tap is no-op / friendly "We're on pause" — NOT an error.
- **AC:** AC-Pause.E2.
- **Verdict:** ⬜

**F12.E3 — BUDDY visual = resting, NOT sad** *(Hat 3)*
- **AC:** PR #24 Values.
- **Verdict:** ⬜

---

### F13 — Theme switching (Pastel ↔ Gamer)

**Source SPEC:** `docs/sessions/fix-runtime-theme-switch/SPEC.md` PR #41, BUFF_BRAND §7.5
**Persona:** Child / Teen
**Hat note:** Pre-existing FLAG — code verified only; pending real-device verify.

#### Happy

**F13.H1 — Toggle Mint ↔ Gamer in Settings without blanking tab bar** *(Hat 3 autonomous)*
- **Steps:** Child Settings → Theme toggle → switch 5 times fast.
- **Expected:** Tab bar visible throughout. No flicker > 300ms.
- **AC:** PR #41 fix.
- **Verdict:** ⬜

**F13.H2 — Theme persists across restart** *(Hat 3)*
- **Verdict:** ⬜

**F13.H3 — Pastel: mint background + warm tones** *(Hat 3 autonomous)*
- **Verdict:** ⬜

**F13.H4 — Gamer: deep violet + lime accents** *(Hat 3)*
- **Verdict:** ⬜

#### Edge

**F13.E1 — Theme changed by parent triggers child re-render** *(Hat 3 + MCP)*
- **Setup:** Parent overrides child's theme.
- **Expected:** Child app live-updates without restart.
- **Verdict:** ⬜

**F13.E2 — Switch during VibeCheck modal active** *(Hat 3)*
- **Expected:** Modal re-themes (Pastel emojis ↔ Gamer bars).
- **Verdict:** ⬜

---

### F14 — BUDDY V0.5 friendship + gifts

**Source SPEC:** `docs/sessions/buddy-v05-backend/SPEC.md`, `docs/BUFF_BUDDY_SYSTEM.md`
**Persona:** Child (sees BUDDY), automation pg_cron (EOD trigger)

#### Happy

**F14.H1 — EOD cron flips friendship level after 3 successful days** *(Hat 1 + MCP)*
- **Setup:** DB seed 3 daily_check rows @ ≥70% for child.
- **Expected:** Next EOD cron run: `buddy_relationships.friendship_level: 1 → 2`.
- **AC:** buddy-v05-backend Phase 1.
- **Verdict:** 🤔 (needs MCP `SELECT * FROM cron.job_run_details WHERE jobname='buddy_eod'`)

**F14.H2 — On level-up, gift toast appears next day on child open** *(Hat 3)*
- **Expected:** "Your buddy has a gift!" toast / modal; tap → theme color picker.
- **Verdict:** ⬜

**F14.H3 — Theme color applied + persisted across sessions** *(Hat 3 + MCP)*
- **Expected:** `buddy_gifts_history` row created.
- **Verdict:** ⬜

**F14.H4 — BUDDY initial state = "egg, sleeping"** *(Hat 3 autonomous)*
- **Already verified 2026-05-20** — ZTest520 saw "Your buddy is sleeping / Ask your parent to wake it up".
- **Verdict:** ✅

#### Edge

**F14.E1 — Successful day below 70%** *(Hat 1 + MCP)*
- **Expected:** No level-up.
- **Verdict:** ⬜

**F14.E2 — Streak broken mid-week** *(Hat 1 + MCP)*
- **Expected:** No retroactive level-down (per PRD — no punishment).
- **AC:** Values Pillar 2.
- **Verdict:** ⬜

**F14.E3 — BUDDY V0.5 backend row created on profile create** *(Hat 1 + MCP)*
- **Expected:** Every new child profile gets a `buddy_relationships` row. Verify ZTest520 has one.
- **Verdict:** 🤔 — needs MCP

---

### F15 — Teen onboarding (Buddy with/without choice)

**Source SPEC:** `docs/sessions/teen-ui-with-buddy-character/SPEC.md`, Stitch 08 design
**Persona:** Teen
**Hat note:** Requires age 13-18 profile.

#### Happy

**F15.H1 — Teen at signup sees Buddy choice screen** *(Hat 3)*
- **Steps:** Signup → role=Teen → onboarding → "Show me a Buddy character" vs "Just the dashboard".
- **Expected:** Choice screen mid-onboarding; selection persists to `buddy_relationships.buddy_visible`.
- **AC:** Stitch 08 + T-1.
- **Verdict:** ⬜

**F15.H2 — "Without Buddy" → clean 5B dashboard, no character** *(Hat 3)*
- **AC:** T-2 + PR #28.
- **Verdict:** ⬜

**F15.H3 — "With Buddy" → Wolf STORMY on dashboard, 5A on tap** *(Hat 3)*
- **AC:** T-3.
- **Verdict:** ⬜

**F15.H4 — Toggle in Settings flips variant** *(Hat 3)*
- **Steps:** Stitch 07 settings → BUDDY toggle.
- **Expected:** UI re-renders; persists; round-trip stable.
- **AC:** T-4.
- **Verdict:** ⬜

#### Edge

**F15.E1 — Toggle 3 times rapid** *(Hat 3)*
- **Expected:** No crash, no blank tab bar (regression CC-1).
- **Verdict:** ⬜

**F15.E2 — Age 13 boundary** *(Hat 3 + MCP)*
- **Expected:** 13 → Teen (not Child).
- **Verdict:** ⬜

**F15.E3 — Age 17 boundary** *(Hat 3 + MCP)*
- **Note:** Per CLAUDE.md FLAG, code may still use 13-15 for Teen detection. Verify against current code; if 13-17 → ✅, if 13-15 → confirm pending fix.
- **Verdict:** ⬜

---

### F16 — Schedule/timetable

**Source:** `src/screens/parent/TimetableScreen.tsx`, `useTimetable`, migration 001
**Persona:** Parent

#### Happy

**F16.H1 — Add weekly timetable entry** *(Hat 3 + MCP)*
- **Steps:** TimetableScreen → "+" → pick day + time + activity.
- **Expected:** Row in `timetable_entries`; appears on calendar.
- **Verdict:** ⬜

**F16.H2 — Bulk-load schedule from preset** *(Hat 3)*
- **Expected:** "Standard school week" preset adds 5 rows. Verify if shipped.
- **Verdict:** ⬜

**F16.H3 — Edit existing entry** *(Hat 3 + MCP)*
- **Verdict:** ⬜

**F16.H4 — Delete entry** *(Hat 3 + MCP)*
- **Verdict:** ⬜

#### Edge

**F16.E1 — Overlapping time slots same day** *(Hat 3)*
- **Expected:** Allowed (kids have multiple things at once sometimes) OR validation warns. SPEC silent → SPEC sync.
- **Verdict:** ⬜

**F16.E2 — Past-date entry** *(Hat 3)*
- **Expected:** Allowed for retrospective logging.
- **Verdict:** ⬜

**F16.E3 — Child sees schedule on dashboard** *(Hat 3)*
- **Expected:** Today's timetable items appear in child task list / dedicated section.
- **Verdict:** ⬜

---

### F17 — Multi-child family flows

**Persona:** Family with 2+ kids

#### Happy

**F17.H1 — Parent dashboard shows multiple child cards** *(Hat 3 + MCP)*
- **Setup:** Family with kid A + kid B.
- **Expected:** ParentDashboard renders both cards; switch between them.
- **Verdict:** ⬜

**F17.H2 — Each kid's tasks/rewards isolated** *(Hat 3 + MCP)*
- **Expected:** Kid A doesn't see Kid B's tasks. RLS check.
- **Verdict:** ⬜

**F17.H3 — Each kid's vibe + SOS independent** *(Hat 3 + MCP)*
- **Expected:** Two kids can independently rate vibe; SOS badges show per-kid.
- **AC:** F11.E3.
- **Verdict:** ⬜

#### Edge

**F17.E1 — Same name two kids** *(Hat 3 + MCP)*
- **Expected:** UX handles disambiguation. ChildJoin must not silently merge.
- **Verdict:** ⬜

**F17.E2 — One kid Teen, one kid Child** *(Hat 3)*
- **Expected:** Parent dashboard mixes Pastel + Gamer themes per card OR theme is per-parent. SPEC sync needed.
- **Verdict:** ⬜

---

### F18 — i18n + Hebrew RTL

**Source:** `src/i18n/he.json` + `en.json`, RTL-related code in LanguageContext

#### Happy

**F18.H1 — All visible strings localized** *(Hat 2 + Hat 3)*
- **Steps:** System lang=Hebrew → walk every flow F1-F17.
- **Expected:** No English fallback strings (except intentional brand terms like "BUFFs").
- **Verdict:** ⬜

**F18.H2 — RTL flips entire UI** *(Hat 3)*
- **Expected:** Tab bar reverses, text right-aligned, icons mirrored where appropriate.
- **Verdict:** ⬜

#### Edge

**F18.E1 — Numbers stay LTR inside RTL** *(Hat 3)*
- **Expected:** "5 BUFFs" reads correctly even within RTL flow.
- **Verdict:** ⬜

**F18.E2 — Hebrew month names in date picker** *(Hat 3)*
- **Known:** F-2026-05-16-01 — hardcoded en-GB. Document, don't fail beta.
- **Verdict:** 🚩

**F18.E3 — Mid-session language switch** *(Hat 3)*
- **Expected:** App reloads or strings update live. Pre-existing FLAG — RN sometimes caches direction.
- **Verdict:** ⬜

---

### F19 — Paywall + lifetime cohort bypass

**Source SPEC:** `docs/sessions/hide-paywall-from-child/SPEC.md` PR #40, `docs/sessions/founding-100-payment/SPEC.md`, beta-2026-06-01/TRACK_5
**Persona:** Parent (paywall), Child (must NOT see)

#### Happy

**F19.H1 — Non-cohort parent sees paywall for premium features** *(Hat 3 + MCP)*
- **Steps:** Parent (no lifetime flag) → tap premium reward/buddy skin.
- **Expected:** PaywallScreen renders with subscription CTA.
- **Verdict:** ⬜

**F19.H2 — Cohort parent (is_lifetime_access=true) bypasses paywall** *(Hat 3 + MCP)*
- **Setup:** `UPDATE profiles SET is_lifetime_access=true WHERE id=...`
- **Steps:** Same as H1.
- **Expected:** Direct access; no PaywallScreen; premium content unlocked.
- **AC:** TRACK_5.
- **Verdict:** ⬜

**F19.H3 — Child user NEVER sees paywall CTAs** *(Hat 3 autonomous)*
- **Setup:** Sign in as child.
- **Steps:** Navigate every locked feature (buddy skins, rewards shop, etc.).
- **Expected:** "Ask your parent to unlock" instead of "Subscribe" anywhere.
- **AC:** PR #40.
- **Verdict:** ⬜

#### Edge

**F19.E1 — Pending lifetime grant exists** *(Hat 3 + MCP)*
- **Setup:** Row in `pending_lifetime_grants` for parent's email; parent hasn't signed up yet.
- **Steps:** Parent signs up.
- **Expected:** Grant applies on first auth (RPC); paywall bypassed thereafter.
- **AC:** TRACK_5 cohort flow.
- **Verdict:** ⬜

---

<a name="cross-cutting"></a>
## 🔀 Cross-cutting tests

### CC1 — Google OAuth on installed AAB *(Hat 4 — Adi only)*
- AAB Path C install required. Emulator unreliable.
- **Verdict:** ⬜

### CC2 — Push notifications appearing in system tray *(Hat 4)*
- Requires `pkg/fcm-push-notifications` (separate package per EX-5).
- **Verdict:** ⏭️ deferred

### CC3 — Performance: cold start < 2s *(Hat 3)*
- `time ( buff_launch ; while ! buff_assert_text 'Hey,' ; do sleep 0.1 ; done )` — gross estimate.
- **Verdict:** ⬜

### CC4 — Sentry capture + PII discipline *(Hat 4 — needs dashboard access)*
- Force a test error → verify shows in Sentry within 60s, no PII in body.
- **Verdict:** ⬜

### CC5 — Offline mode (PRD §9.3 NFR) *(Hat 3 autonomous)*
- `adb shell svc wifi disable` → tasks accessible, completions queue.
- **Verdict:** ⬜

### CC6 — Animation smoothness *(Hat 4 — eyes-on)*
- **Verdict:** ⬜

### CC7 — Real device touch feel *(Hat 4)*
- **Verdict:** ⬜

---

<a name="sign-off"></a>
## ✍️ Sign-off — Run 2026-07-08 (post-merge impeccable sweep)

**Run started:** 2026-07-08
**Build:** Dev-client + Metro 8083 (main @ ec440dd merged) — Android emulator + Expo Web :19006
**Tester:** CC (Hat 1 + Hat 2 + Hat 3 autonomous)
**Scope:** the 9 UX-fix merges of 2026-07-08 (#332-#339 + packing #325/#326)

| Check | Verdict | Notes |
|---|---|---|
| Hat 1 tsc + Jest | ✅ | 663→666 tests green; fixed ThemeContext suite (websocket env crash) + un-quarantined View-as-Child theme test (IN-2026-06-29-01 was a missing mock, not a product bug) |
| #332 parent → Signup | ✅ web | "אני הורה" lands on Signup, not Login |
| #333 no late-shame | ✅ android | Morning task completed 15:10 → neutral done row, no warning badge |
| #334 rewards error state | ✅ | healthy path on device; error path via new Jest suites |
| #335 gamer daily loop | ✅ android | successful-days = DB value (6); 0-streak hidden ("Start one today"); full-row tap toggles + Buffs 140↔175; banner-tap exits preview |
| #336 count goal | ✅ both | child fuel 0/3 + "משלימים 3 = הצתה"; **found+fixed**: parent card still said "70% = a successful day" — now `successDay.ts`-anchored (see run findings) |
| #337 paywall child gate | ✅ | parent deep-link opens FoundingHundred (correct); child-stack removal covered by PaywallChildGate.test (7 tests) |
| #338 share invite | ✅ both | Android: system share sheet w/ install URL; Web: clipboard fallback + "הועתק" toast |
| #339 web pickers | ✅ web | ParentTasks `input[type=time]` live, 08:00→08:30 saved+persisted; UStep1 date input works; Activities/MedReminder via Jest |
| Packing (#325/#326) | ✅ android | "נארוז יחד?" renders daily gear (07:30 activity) + child "הוסף לעצמי" |
| Web signup→onboarding E2E | ✅ | fresh family, 7 steps, plan preview personalized to motivator, family code issued; 0 console errors |

**Run findings (fixed in `pkg/qa-impeccable-sweep`):**
1. Parent dashboard child card contradicted D-2026-06-14 (70% copy + `pct>=70` goal logic) → now uses `isActiveDay`/`successGoal`/`fuelProgressPct` + `weeklyGoal.goalCount` key (EN+HE).
2. Philosophy screen `smartGoal` pillar still taught the 70% rule → copy re-anchored to ~3-missions/active-day (EN+HE, flagged for Adi redline).
3. Dead i18n key `ignition.aboveGoal` ("Above the 70% success threshold!") removed.
4. `ThemeContext.test.tsx` failed at import (realtime-js demands WebSocket in Node 20) → supabase client mocked; quarantined preview-theme test re-enabled and green.

**Known items observed, NOT in scope (already tracked):** 13-vs-14 task count divergence (day-filtering, has HANDOFF), Latin-name → English task titles for Hebrew family (language trap memory), RevenueCat BILLING_UNAVAILABLE LogBox on emulator (dev-only).

---

## ✍️ Sign-off — Run 2026-05-20 (previous)

**Run started:** 2026-05-20
**Build:** Dev-client + Metro 8083 from worktree `elastic-cannon-6d759f`
**Tester:** CC (Hat 3 autonomous via adb) + pending Adi (Hat 4)
**Active session:** ZTest520 in family KWYEL5

### Verdicts so far

| Suite | Verdict | Notes |
|---|---|---|
| F1 (ChildJoin) | partial: H1 ✅; H2-H3, E1-E5 ⬜ | base case proven 2026-05-20 |
| F2 (Parent signup) | ⬜ — blocked on test email | |
| F3 (Onboarding) | ⬜ — needs fresh parent | |
| F4 (Task creation) | ⬜ — needs parent session | |
| F5 (Task completion) | ⬜ — needs tasks in family | |
| F6 (Task approval) | ⬜ | |
| F7 (Reward creation) | ⬜ | |
| F8 (Reward redemption) | ⬜ | |
| F9 (Reward fulfillment) | ⬜ | |
| **F10 (Vibe Check + Low Power)** | **mostly ✅** — H1, H6, H8, E3, E6 ✅; H7 ❌ (BUG-2026-05-20-01); rest ⬜ | full AC matrix in `docs/sessions/daily-vibe-check/AC_MATRIX.md` |
| F11 (SOS notifications) | ⬜ — needs parent session | |
| F12 (Pause Mode) | ⬜ | |
| F13 (Theme switch) | mostly ✅ — H1, H4 ✅; round-trip ⬜ | Mint↔Gamer no blanking; state persists; bonus Stats tab Gamer-exclusive |
| F14 (BUDDY V0.5) | H4 ✅; rest 🤔 (needs MCP) | |
| F15 (Teen onboarding) | ⬜ | |
| F16 (Schedule/timetable) | ⬜ | |
| F17 (Multi-child) | ⬜ | |
| F18 (i18n + RTL) | ⬜ | |
| F19 (Paywall + cohort) | ⬜ | |

### Open bugs

| ID | Severity | Status |
|---|---|---|
| **BUG-2026-05-20-01** | Medium | InstantBuff RLS on new ChildJoin profiles. Full details in `AC_MATRIX.md`. |
| **BUG-2026-05-20-02** | **High** | ChildSettingsScreen displays MOCK_MY_CHILD hardcoded data (1,240 Buffs, dragon avatar) instead of real user data. Beta blocker. Full details in `AC_MATRIX.md`. |

---

## 🔧 Maintenance

- **I (CC) update this doc** when a session closes that touches a Flow Suite.
- **Verdict columns** updated after each run (autonomous or manual).
- **New suites added** when a new package introduces a flow not yet covered.
- **Old bugs link** to GAP_ANALYSIS or INTEGRATION_LEARNINGS as they resolve.

---

**Last full sweep by CC:** 2026-05-20 (F1 + F10 active; rest pending session setup)
