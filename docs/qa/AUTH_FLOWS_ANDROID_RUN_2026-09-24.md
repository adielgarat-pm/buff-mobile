# Android device checklist run — §5 of AUTH_FLOWS_E2E_2026-09 — 2026-09-24

**Result: 10 pass · 1 partial · 1 fail · 1 not run** (items 1–13 of
[AUTH_FLOWS_E2E_2026-09.md §5](AUTH_FLOWS_E2E_2026-09.md)).

Screenshots: `docs/qa/img/android-2026-09-24/` (file names are referenced per item below).

## Environment

| | |
|---|---|
| Device | `Pixel_7` / `emulator-5554`, Android 16 (API 36), 1080×2400 @420dpi (411×914dp) |
| Code under test | worktree `main` @ `03ccdd1` — contains #481–#483, #485–#488 (and #489) |
| Native shell | dev client `com.buffapp.mobile` 1.0.0(1), built **2026-07-02**; JS served by Metro :8083 |
| Backend | **production** (`buff-production`), real network |
| Acquired via | `buff-emulator` skill — `metro_acquire` / `metro_release` |

Two environment notes that shaped the run:

- `node_modules/` was empty, so Metro could not start until `npm ci` was run.
- The dev-client shell predates the `https://buffadhd.com/join` intent filter (`app.json` has it;
  `dumpsys package` shows only `buff://`, `exp+buff-mobile://`, and `pm get-app-links` is empty).
  This limits item 2 — see below.

**Test accounts were created for this run and deleted afterwards.** None of the §5 accounts existed
beforehand (`auth.users` had no `adi.elgarat+e2e%` rows, no "Test Signup" family, no TestKid).
Created and since removed: `+e2e-signup`, `+e2e-midflow`, `+e2e-small`, `+e2e-webA`, `+e2e-otherB`,
their five families and one child auth user. Post-cleanup verification: 0 leftover e2e users,
0 leftover families, 406 profiles / 254 families of real data untouched.

## Results

| # | item | verdict | evidence |
|---|------|:---:|---|
| 1 | Login (bug 1, native path) — EN + HE | ✅ | `i01_02_after_login.png`, `i01_04_he_after_login.png` |
| 2 | Join link cold start | ⚠️ partial | `i02_02_childjoin_prefilled.png`, `i02_05_relaunch_result.png` |
| 3 | Shared device | ✅ | `i03_01_childjoin.png` → `i03_03_childapp.png` |
| 4 | New parent signup | ✅ email · ⚠️ Google | `i04_03_after_signup.png` … `i04_15_dashboard.png` |
| 5 | Resume after process kill | ✅ | `i05_06_resume.png`, `i05_08_step3_resumed.png` |
| 6 | Snapshot owner (bug 3) — phone browser | ✅ | `i06_08_parentB_welcome_final.png` |
| 7 | Duplicate name (bug 2) | ✅ | `i07_02_dupdialog.png`, `i07_04_after_open.png` |
| 8 | Soft keyboard | ❌ | `i08_04_signup_scrolled.png`, `i08_07_childjoin_kbd2.png` |
| 9 | Wrong password | ✅ | `i09_01_wrongpw.png` |
| 10 | Logout → login | ✅ | `i10_01_after_signout.png` + item 1 |
| 11 | Grown-up sign-in (#486) | ✅ | `i11_02` … `i11_07b.png` |
| 12 | Google picker exits (#485) | — not run | — |
| 13 | Small phone (#487/#488) | ✅ | `i13_01`, `i13_02`, `i13_04`, `i13_06`, `i13_07` |

### 1 — Login (bug 1, native path) ✅

RoleSelection → "Already have an account? Log in" → returning account → **ParentApp dashboard**
(not Login, not Welcome). Repeated with the app switched to Hebrew (RTL) — same result.
#481 holds on native.

### 2 — Join link cold start ⚠️ partial

What passed, with the app force-stopped and signed out:

- launching `buff://join/6WPX9N` → **ChildJoin pre-filled** with the code
- Continue → card picker → TestKid → **ChildApp**
- **kill + relaunch → still ChildApp**, ChildJoin was *not* re-entered — the launch link is not
  re-applied after sign-in, which is the assertion the item exists for

What could not be tested: the literal `https://buffadhd.com/join/<CODE>` App Link. The installed
dev client has no intent filter for that host, so Android never offers the app. `linking.ts` maps
`buff://join/:code` and `https://buffadhd.com/join/:code` to the same `ChildJoin` route, so the
routing is shared — but the App Link *association* (intent filter + `assetlinks.json` verification)
needs a preview/release build to confirm. Also note the dev launcher inserts its bundle-picker
screen on a cold link launch; a release build will go straight through.

### 3 — Shared device ✅

Signed in as the parent, opened the join link → ChildJoin → TestKid → ChildApp. Verified in the
database that the parent profile was **not** re-linked: parent profile still bound to
`+e2e-signup@gmail.com`, child got its own `child_…@buff.app` auth user. (Same assertion as web
smoke C5.)

### 4 — New parent signup ✅ (email) / ⚠️ (Google)

Email path complete and clean: RoleSelection → "I'm a Parent" → Signup → Welcome → Steps 1–7 →
first task ("Not right now") → child access → Complete → **Dashboard**.

Google button: it works and returns to the app, but this emulator has exactly one Google account —
yours — and it is already linked to a BUFF profile, so the tap **signed straight into your real
production account** (no chooser shown). I signed out of it immediately and made no changes to that
account. The "new Google user" path therefore was not exercised.

### 5 — Resume after process kill ✅

New account stopped at Step 3 → force-stop → relaunch → Welcome offered
**"Pick up where you left off with TestKid 💜"** → "Continue setup ➔" → **Step 3/7**.

### 6 — Snapshot owner (bug 3), phone browser ✅

In Chrome on the device, against the live site: signed up parent A (`+e2e-webA`, child "WebKidA"),
stopped at Step 3; navigated to `buffadhd.com/RoleSelection`; "I'm a Parent" → signed up
`+e2e-otherB`. Parent B landed on `buffadhd.com/Welcome?**resumeSnapshot=null**` with **no**
"Pick up where you left off" and **no** mention of WebKidA. #483 holds on the deployed site.

### 7 — Duplicate name (bug 2) ✅

Mid-flow account whose child already existed → "Start over" → same child name "TestKid" → the
duplicate dialog fired at the step-5 create ("TestKid is already here" / OPEN TESTKID · ADD ANOTHER
· CANCEL) → **"OPEN TESTKID" closed the dialog and the wizard continued to Step 5/7**. Database
check: exactly **one** TestKid in that family, the existing profile reused. #482 holds.

Note: the dialog fires at step 5 (the create), not at step 1 where the name is typed — worth
correcting in the checklist wording.

### 8 — Soft keyboard ❌

Tested at 720×1280 @320dpi = **360×640dp**, the smallest realistic phone.

| screen | with keyboard open | verdict |
|---|---|---|
| Login | "Log In" starts hidden, **scrolls into view** | ✅ |
| Signup | "Create Account" sits behind the keyboard and **cannot be scrolled into view** — the ScrollView is already at its end (repeated swipes do not move it) | ❌ |
| ChildJoin | the code field **and** Continue are both behind the keyboard; you cannot see what you type, and swiping **dismisses the keyboard instead of scrolling** | ❌ |

Classic keyboard-inset bug: the scroll container's height does not account for the keyboard. The
user has to dismiss the keyboard manually to reach the primary button on Signup and ChildJoin.
ChildJoin is the worse of the two, since the input itself is invisible while typing.

### 9 — Wrong password ✅

"Invalid email or password" dialog; after OK the Log In button is `clickable=true enabled=true` and
the form is usable again.

### 10 — Logout → login ✅

Settings → Sign out → RoleSelection → log in → ParentApp.

### 11 — Grown-up sign-in (#486) ✅

All five legs: signed in as TestKid via family code → Menu → "🔒 Grown-up sign-in" → "Back to BUFF"
(still the child) → again → parent login → **ParentApp** → Settings → **"Hand back to TestKid"** →
card picker (code step skipped, as designed) → **child app**.

"Hand back to {name}" correctly appears only after a child has used Grown-up sign-in on the device
(`src/lib/handBack.ts`) — its absence on a fresh parent install is by design, not a gap.

### 12 — Google picker exits (#485) — not run

Requires signing in with a Google account that has **no** BUFF profile. The emulator has one Google
account and it already maps to an existing BUFF profile (see item 4), so the role picker with
"I'm a parent" / "I have a family code" / "Not you? Use a different account" never appears. Testing
this needs a spare Google account added to the device — an account-bound step.

### 13 — Small phone (#487/#488) ✅

| screen | 360×640dp | 360×560dp |
|---|---|---|
| RoleSelection "Already have an account? Log in" | fully visible, not clipped | starts below the fold, **scrolls fully into view** (not clipped) |
| Welcome "Let's start ➔" | on screen (pinned footer) | — |
| Complete "Go to Dashboard 🏠" | on screen (pinned) | on screen (pinned) |

The 360×560 below-fold behaviour matches what §1 already recorded as informational. #487 and #488
both hold on native.

## Findings outside the 13 items

1. **Signup is inert when reached from a child session** — *medium/high, new*.
   Child session → Menu → "Grown-up sign-in" → "Don't have an account? Sign Up" opens Signup, but
   **"Create Account" does nothing**: no navigation, no error dialog, no JS log, and **no user row is
   created** (confirmed against `auth.users`). "Already have an account? Log In" on that same screen
   is also a no-op. `Signup` *is* registered in the child branch of `RootNavigator` (lines 275–276)
   and `SignupScreen` has no role guard, so the cause is elsewhere. Same family as #479
   ("Signup no-op with a session"), newly reachable through #486's entry point.
   Repro screenshots: `i05_02_after_signup_tap.png`, `i05_04b.png`.

2. **The notifications banner covers the Welcome CTA** — *low/medium, new*.
   On Welcome, the "Notifications are off on this device" banner renders **on top of** the pinned
   "Continue setup ➔" / "Let's start ➔" button and swallows taps. It looks like a dead button until
   the banner is dismissed. This partly undoes #487 on any device where notifications are off —
   which is every fresh install. `i05_07_resumed_step3.png` shows it.

3. **Overlapping touch targets on the grown-up login screen** — *low, needs a human tap to confirm*.
   "Don't have an account? Sign Up" (bounds y 1850–1901) and "Back to BUFF" (y 1901–1952) are
   adjacent. Tapping the **visual centre** of the Sign Up line (540, 1875) reliably triggered
   *Back to BUFF* twice; tapping directly on the words "Sign Up" (731, 1860) opened Signup. Worth a
   thumb test before filing.

4. **Dev-only:** the RevenueCat `BILLING_UNAVAILABLE` LogBox toast overlays the bottom tab bar and
   intercepts taps on the emulator. Harmless in release builds, but it makes device automation on
   the dev client noticeably slower.

## Not covered

- The real `https://buffadhd.com/join` App Link (item 2) — needs a preview/release build.
- The Google "new user" role picker (items 4 and 12) — needs a Google account with no BUFF profile.
- RLS for a brand-new parent under a rolled-back transaction — still not run (§4 carried this over).
