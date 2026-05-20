---
name: buff-testing
description: Autonomous BUFF testing on Android emulator via adb. Use this skill whenever the user asks to "run tests", "verify a feature", "regression test", "test the X feature", "smoke test", or similar testing requests on BUFF. Covers Hat 3 (adb-driven device automation) + Hat 1 (Jest/typecheck/code review) + coordinates with Hat 4 (real-device-only items the user must do). References docs/MASTER_TEST_PLAYBOOK.md as the canonical scenario index.
---

# BUFF Testing Skill

> Operating manual for running BUFF tests autonomously. Activate at the start of any testing turn.

## When this skill applies

User asks one of:
- "run regression / smoke / full tests"
- "test the X feature" / "verify Y"
- "what's covered by automation"
- "did we test Z"
- "go through the playbook"
- "run the autonomous loop"

If none of those — **don't activate this skill, just answer the question.**

---

## Step 1 — Pre-flight (always)

Run these in order. Stop if any fails and report.

```bash
# 1. adb available?
export ADB="/c/Users/adiel/AppData/Local/Android/Sdk/platform-tools/adb.exe"
"$ADB" version | head -1   # must print "Android Debug Bridge..."

# 2. Emulator connected?
"$ADB" devices             # must show "emulator-NNNN device"

# 3. BUFF installed?
"$ADB" shell pm list packages | grep com.buffapp.mobile
                          # must print "package:com.buffapp.mobile"

# 4. Worktree state — pull latest before running tests
git fetch origin main
git log HEAD..origin/main --oneline
# if behind: git pull origin main --ff-only
```

If any check fails, **don't proceed silently**. Report what's missing.

**If emulator is NOT running:** ask user to start it. Don't try to start it yourself — depending on user's machine state, the AVD path varies.

**If app is NOT installed:** ask user to run `npx expo run:android` once OR install the AAB.

---

## Step 2 — Boot the app + connect to Metro

```bash
# Start Metro from this worktree (background it)
npx expo start --port 8083 --android &
# Wait ~12s for bundle + auto-deep-link to emulator

# If Metro can't auto-deep-link (e.g. you're not in the right cwd), use:
"$ADB" shell am start \
  -a android.intent.action.VIEW \
  -d "exp+buff-mobile://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8083" \
  -n com.buffapp.mobile/expo.modules.devlauncher.launcher.DevLauncherActivity
```

**Verify boot:** screenshot once after 10-15 seconds. Expect `RoleSelection` or a dashboard depending on auth state.

---

## Step 3 — Source the helpers

Source `.claude/skills/buff-testing/helpers.sh` (or paste the contents inline into the bash session):

```bash
source .claude/skills/buff-testing/helpers.sh
buff_check                 # sanity: should show "emulator-NNNN device"
```

Helper inventory:
- `buff_launch` / `buff_stop` / `buff_restart` — app lifecycle
- `buff_screenshot <name>` — saves to `.claude/tmp/<name>.png` (Windows-safe)
- `buff_tap <x> <y>` — coordinate tap (use 1080x2400 native, NOT screenshot pixels)
- `buff_tap_text "<needle>"` — finds element by text/content-desc and taps center of bounds
- `buff_type "<text>"` — types into focused field (alphanumeric only — Hebrew via `adb shell input text` is unreliable)
- `buff_dump` — uiautomator hierarchy → `.claude/tmp/_ui.xml`
- `buff_assert_text "<needle>"` — grep current UI for needle, returns 0/1
- `buff_assert_no_text "<needle>"` — opposite
- `buff_logs [N]` — last N lines of ReactNativeJS logcat
- `buff_logs_reset` — clear logcat before triggering an action
- `buff_focus` — current foreground activity
- `buff_scroll_down` / `buff_scroll_up` — swipe gestures

---

## Step 4 — Pick what to test

### Default: read the master playbook

`docs/MASTER_TEST_PLAYBOOK.md` is the canonical scenario index. 19 Flow Suites (F1-F19), each with happy + edge cases tagged by Hat:
- **Hat 1** — automated/static (jest, typecheck, expo-doctor, MCP queries) — runs without user input
- **Hat 2** — Expo web preview (npm run web + Claude_Preview MCP) — fast smoke on unauth screens
- **Hat 3** — adb-driven on emulator (this skill's bread-and-butter)
- **Hat 4** — real device only (Google OAuth, push, Sentry dashboard, real touch feel) — defer to user

### User asked to test a specific package?

1. Read `docs/sessions/<package-slug>/SPEC.md`
2. Extract Acceptance Criteria — every "Goal", "Behavior Contract", "Decisions Locked" row becomes 1+ ACs
3. Create `docs/sessions/<package-slug>/AC_MATRIX.md` (template below)
4. Cross-link to the Flow Suite in MASTER_TEST_PLAYBOOK (or add a new one if needed)

### Always know the scope

Before running, declare:
- Which scenarios are in scope this turn (be specific — "F10.H1 + H6 + H7" not "all of F10")
- What test account / family code is being used (from `docs/MANUAL_TEST_PLAYBOOK.md` § Test Accounts Inventory)
- Whether destructive (DB writes) — if yes, plan cleanup OR confirm user is OK with residual test data

---

## Step 5 — Execute a scenario

For each scenario, this is the loop:

```bash
# 1. Bring to known state
buff_logs_reset
buff_restart          # if needed

# 2. Take an "anchor" screenshot
buff_screenshot before_<flow_id>

# 3. Drive the steps (one tap/type at a time)
buff_tap_text "Some Button"   # or buff_tap X Y if text-find fails

# 4. Wait for the next state
sleep 3
buff_screenshot after_<flow_id>

# 5. Assert expected
buff_assert_text "Expected Outcome Text"     # → ✅ / ❌
buff_assert_no_text "Expected Absent Text"

# 6. Verify in logs (when scenario involves backend)
buff_logs 30 | grep -i "<keyword>"
```

### Tap coordinates: native vs screenshot

**Critical gotcha:** screenshots returned to Claude are scaled DOWN (e.g. 900x2000) but `adb shell input tap` uses NATIVE coordinates (e.g. 1080x2400).

**Always derive coordinates from `buff_dump` + bounds extraction**, not from screenshot pixel-counting:

```bash
buff_dump
grep -oE '<node[^>]*text="My Button"[^>]*bounds="[^"]*"' .claude/tmp/_ui.xml
# bounds="[X1,Y1][X2,Y2]" — tap center: ((X1+X2)/2, (Y1+Y2)/2)
```

`buff_tap_text` automates this — prefer it whenever the element has unique text or content-desc.

---

## Step 6 — Record verdicts

Per scenario, update the relevant doc:
- **MASTER_TEST_PLAYBOOK.md** sign-off table — high level pass/fail per suite
- **AC_MATRIX.md** (if exists for the package) — per-AC verdict with evidence column linking screenshot

Verdict codes:
- `✅` pass — assertion met, evidence captured
- `❌` fail — assertion failed, REQUIRES bug report (see Step 7)
- `⚠️` blocked — couldn't run (missing prereq, MCP down, etc.)
- `🤔` uncertain — passed but not 100% — note caveat
- `⏭️` skipped — deliberately not run (e.g. destructive without cleanup ready)

---

## Step 7 — Bug reports

When a verdict is `❌`, write a bug report:

```markdown
## 🐛 BUG-YYYY-MM-DD-NN — <Short Title>

**Severity:** Low / Medium / **High** / **Critical**

**Repro:**
1. ...
2. ...

**Actual:**
- What happened (with logcat snippet if relevant)

**Root cause hypothesis:**
- Where in code, what RLS policy, what missing trigger, etc.

**Suggested fix paths:**
1. ... (recommended)
2. ...

**Impact on beta launch:**
- Who's affected, how often, blocker or not

**Recommendation:** [hotfix on existing branch / new package `pkg/<slug>`]
```

Append to the AC_MATRIX of the relevant package. Reference from MASTER_TEST_PLAYBOOK § Open bugs table.

---

## Step 8 — Cleanup

Tests create residue. Plan cleanup before starting destructive runs.

- **Test child profiles:** name them with `ZTest` prefix + date suffix (e.g. `ZTest520`) so they're searchable. DELETE via Supabase MCP: `DELETE FROM profiles WHERE display_name LIKE 'ZTest%';` (+ cascades).
- **Test vibe rows:** `DELETE FROM child_vibes WHERE child_id IN (SELECT id FROM profiles WHERE display_name LIKE 'ZTest%');`
- **Test SOS notifications:** `DELETE FROM notifications WHERE entity_id IN (SELECT id FROM child_vibes WHERE child_id IN (SELECT id FROM profiles WHERE display_name LIKE 'ZTest%'));`
- **Test rewards/tasks:** dedupe by `name LIKE 'ZTest%'` or test-flag.

If MCP is down — record the test profiles created in the session summary so user can clean up later via Supabase Dashboard.

---

## Common scenarios — quick recipes

### "Smoke test the latest features"

1. `git pull origin main --ff-only`
2. Read `git log HEAD@{1day-ago}..HEAD --oneline` for what changed
3. Map each commit to its Flow Suite in MASTER_TEST_PLAYBOOK
4. Run the happy scenarios of those suites + 1-2 edge cases each
5. Report verdicts in chat + commit AC matrix updates

### "Run full regression"

This is multi-hour. Sequence:
1. Hat 1 — Jest + typecheck + expo-doctor (~2 min)
2. Hat 1 — Supabase MCP — `list_migrations` + `get_advisors` + key RLS audits (~5 min)
3. Hat 3 — Iterate F1-F19. ~10-30 min per suite. Some need teen profile, parent device, etc.
4. Hat 4 — Hand off the list to user with explicit "you must do these"

### "Test a new package CC just shipped"

1. Read the package's SPEC.md (esp. § Behavior Contract + § Decisions Locked)
2. Build AC_MATRIX.md (template):
   ```markdown
   # <package-slug> — Acceptance Criteria Matrix

   | # | AC | SPEC anchor | Hat | Verdict | Evidence |
   |---|---|---|---|---|---|
   | 1.1 | ... | § X | 3 | ⬜ | |
   ```
3. Run Hat 1 first (Jest + typecheck)
4. Run Hat 3 ACs in order (happy first, edge after)
5. Update verdicts + write bug reports
6. Commit AC_MATRIX with the test run summary in commit body

---

## What this skill DOES NOT do

- Doesn't write production code or schema migrations (that's `claude-code-guide` territory / a regular CC session)
- Doesn't modify CLAUDE.md or BUFF_VALUES.md (Adi-only docs per repo rules)
- Doesn't push to `main` (always work on a branch)
- Doesn't sign in via Google OAuth on emulator (unreliable — defer to user on real device)
- Doesn't decide product policy (e.g. "should this be allowed?" → ask Adi)
- Doesn't run if emulator is down (always pre-flight check first)

---

## Reference docs (read at session start)

- `docs/MASTER_TEST_PLAYBOOK.md` — canonical 19-suite playbook + bash helpers
- `docs/MANUAL_TEST_PLAYBOOK.md` — Hat-3-but-manual fallback playbook for Adi
- `docs/sessions/<slug>/SPEC.md` — package-level acceptance source
- `docs/sessions/<slug>/AC_MATRIX.md` — per-package verdict log
- `docs/BUFF_VALUES.md` — 3-pillar Values Check (every feature must pass)
- `CLAUDE.md` repo root — project rules (Plan Mode, no main push, etc.)

---

## Maintenance

When this skill needs to evolve:
- New flow types → add Flow Suite to MASTER_TEST_PLAYBOOK + update this skill if a new pattern emerges
- New helpers → add to `.claude/skills/buff-testing/helpers.sh` + reference here
- New gotcha discovered → add to "Common scenarios" or "Tap coordinates" section
- New bug pattern → add to "Bug reports" template

**Last updated:** 2026-05-20
**Built by:** CC during the autonomous Vibe Check verification run that found BUG-2026-05-20-01 + BUG-2026-05-20-02
