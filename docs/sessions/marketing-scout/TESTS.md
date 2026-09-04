# TESTS — marketing-scout

## Phase 1 (skill)
- [x] `--fixtures` dry-run (fixture shape validated; live run used instead as primary evidence) produces `reports/<date>.md` ≤ 250 lines with every template section present (🛡 printed even when empty).
- [x] Live dry-run (WebSearch) completes within `time_budget_min` and ≤ `max_searches`; header shows counts and `Fetch: snippet-only`.
- [x] Seeded bad fixture (mentions Emi, quotes "$9/mo", says "clinically proven", names Founding 100) → all four `[BLOCKED]/[VERIFY]` in ⚠ Flags; none reach Act-today.
- [x] Every draft naming BUFF carries a disclosure line; no help-venue draft contains a URL.
- [x] No Reddit prose: any Reddit item appears only as talking points / phone checklist.
- [ ] `git diff --name-only` after a (non-dry) run ⊆ `docs/marketing-scout/**`.
- [x] Values check passed for this phase (SPEC § Values Check re-read against the sample report).

## Phase 2 (routines)
- [ ] Day 1–3: `state/heartbeat.log` has START then END for each date; report file exists; push notification received.
- [x] **Real failure found instead of simulated (2026-09-04):** watchdog first fire silent — unattended session stalled on a permission prompt. Fixed (one-command discipline) and verified by control session `b854976`. FAIL-path notification still to be observed live.
- [ ] Simulated failure (rename TARGETS in a test branch) → FAIL line + failure notification; watchdog does *not* double-alert when FAIL is present.
- [ ] Simulated silence (disable Routine A for a day) → watchdog pushes "scout silent".
- [ ] Double fire same day → second run exits with `SKIP already-ran`, no second report.
- [ ] Adi edits TARGETS on main → next run's report reflects it (merge path works).

## Phase 3
- [ ] Adi: "read in 5 min, acted in 20" for 5 consecutive weekdays.
- [ ] Saturday scorecard renders from repo state alone; Supabase fields say "needs SQL", not numbers.
