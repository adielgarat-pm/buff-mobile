# BUFF Nightly Test Runbook

> Read by a **headless** Claude Code agent launched by `run-nightly.ps1` via Windows Task Scheduler (~05:00 daily, report ready before 06:00).
> You are running unattended. **Nobody is watching.** Never wait for approval. Never hang. If a step can't run, record it and move on.
>
> Hard boundaries (also enforced by a deny-list): **do NOT `git push`, do NOT build (`eas`), do NOT run schema DDL (`apply_migration`), do NOT publish anything.** Your only output is a report file. Local file writes and local git reads are fine; do not `git commit` either — leave the report as an untracked file for Adi to review in the morning.

---

## Mission

Every night, verify that what landed on `main` that day still works, and surface anything Adi needs to look at. Produce one report at:

```
C:\Users\adiel\buff-mobile\docs\nightly\<YYYY-MM-DD>.md
```

(The date is passed to you in the launch prompt. Use it verbatim for the filename.)

You run from a worktree already checked out to `origin/main`, so the working tree IS the integrated state. Write the report into the **main** repo path above (absolute), not into the worktree.

---

## Step 0 — Scope: what changed today

```bash
# Commits merged in the last 24h
git log --since="24 hours ago" --oneline --no-merges
git log --since="24 hours ago" --oneline --merges
```

If **zero** non-merge commits in 24h: still run Hat 1 (cheap regression) but skip Hat 3 deep-dives — note "no new code today" in the report and keep it short.

For each changed area, map it to a Flow Suite in `docs/MASTER_TEST_PLAYBOOK.md`. Those suites are your Hat-3 scope tonight.

---

## Step 1 — Hat 1 (static + unit) — ALWAYS run

Run these and capture pass/fail + key output lines. None of these need a device.

```bash
# 1. Typecheck
npm run typecheck    # tsc --noEmit

# 2. Unit tests
npm test -- --ci --silent    # jest

# 3. i18n JSON validity (both locales must parse)
node -e "JSON.parse(require('fs').readFileSync('src/i18n/he.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf8')); console.log('i18n OK')"
```

### Write missing unit tests for today's code

For each **non-trivial** source file changed today (logic in `src/hooks`, `src/lib`, `src/utils`, reducers, pure functions — NOT pure JSX/style changes):
- Check if a `*.test.ts(x)` exists and covers the new behavior.
- If a meaningful gap exists, **write a focused Jest unit test** next to the file. Keep it small and deterministic (no network; mock Supabase). Run it; only keep it if green.
- If you cannot write a sound test (e.g. it needs the device or live DB), note it under "Test debt" in the report instead — do not write a flaky test.

Re-run `npm test` after adding tests.

### Hat 1 — Supabase (best-effort, may be unavailable headless)

If the `mcp__supabase__*` tools are reachable:
- `list_migrations` — note the latest migration.
- `get_advisors` (security + performance) — list any **new** advisories.
- **Read-only only.** Do NOT write, DELETE, or `apply_migration`.

If the MCP server is not connected (common in headless runs), note "Supabase MCP unavailable" and move on. Do not block.

---

## Step 2 — Hat 3 (emulator) — run if device + app are ready

Activate the **buff-testing** skill and follow its pre-flight. Quick gate:

```bash
export ADB="/c/Users/adiel/AppData/Local/Android/Sdk/platform-tools/adb.exe"
"$ADB" devices                                   # need "emulator-NNNN device"
"$ADB" shell pm list packages | grep com.buffapp.mobile   # need the package
```

- **No device** → skip Hat 3 entirely, note it, finish with Hat 1 only.
- **App not installed** → skip Hat 3, note "app not installed on emulator — Hat 3 skipped", finish with Hat 1 only.

If both pass:
1. Ensure Metro up: `source .claude/skills/buff-testing/helpers.sh && metro_acquire` (reuses a healthy Metro for this worktree, else starts one detached on canonical port 8083 and waits until healthy). See `docs/DEV_SERVER_LIFECYCLE.md`.
2. Use the buff-testing helpers (already sourced above) and the `buff_*` functions.
3. Run the **happy path** of each in-scope Flow Suite (from Step 0) + 1–2 edge cases each. Be specific about which scenarios you ran.
4. Capture a screenshot per scenario via `buff_screenshot` (lands in `.claude/tmp/`). Reference paths in the report.
5. Use `ZTest`-prefixed names for any test data you create, and clean it up per the skill's Step 8 — **but only read/DELETE rows matching `ZTest%`**, nothing else.

If Hat 3 wedges (Metro won't bundle, emulator unresponsive), **time-box it**: abandon after a reasonable attempt, note "Hat 3 blocked: <reason>", and still deliver the Hat 1 report. Never hang the whole run on Hat 3.

---

## Step 3 — Write the report

Write to `C:\Users\adiel\buff-mobile\docs\nightly\<date>.md` using this template:

```markdown
# BUFF Nightly Report — <YYYY-MM-DD>

**Run started:** <time>  **Branch tested:** main @ <short-sha>
**Emulator:** <up / booted-by-script / unavailable>  **Supabase MCP:** <available / unavailable>

## TL;DR
- <1-3 lines: overall green/red, biggest thing Adi should look at, or "all clear">

## What changed today
| Commit | Area | Flow Suite | Tested? |
|--------|------|-----------|---------|
| <sha>  | ...  | F<N>      | ✅/⏭️/❌ |

## Hat 1 — static + unit
- typecheck: ✅/❌ <first error line if any>
- jest: ✅/❌ (<N passed, M failed>)
- i18n JSON: ✅/❌
- Tests added tonight: <list files, or "none — see Test debt">
- Supabase advisors (new): <list or "none / unavailable">

## Hat 3 — emulator
- <Flow Suite>: <scenario> → ✅/❌/⚠️  (evidence: .claude/tmp/<name>.png)
- ...
(or "Skipped — <reason>")

## 🐛 Bugs found
<Full bug report per the buff-testing skill Step-7 template, or "none">

## Test debt / couldn't cover
- <what needs a real device (Hat 4) or live DB, and why>

## Needs Adi (Hat 4)
- <Google OAuth / push / real-device / publish decisions>
```

Keep it skimmable — Adi reads this with coffee. Lead with the TL;DR.

---

## Step 4 — Finish

- Do **not** commit or push. Leave `docs/nightly/<date>.md` as an untracked file.
- Print the report path as your final line so the launcher log captures it.
- Exit.

---

**Last updated:** 2026-06-05 · Built by CC for the nightly-automation setup.
