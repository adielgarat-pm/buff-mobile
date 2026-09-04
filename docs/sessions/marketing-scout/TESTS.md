# TESTS — marketing-scout

## Phase 1 (skill)
- [ ] `--fixtures` dry-run produces `reports/<date>.md` ≤ 250 lines with every template section present (🛡 printed even when empty).
- [ ] Live dry-run (WebSearch) completes within `time_budget_min` and ≤ `max_searches`; header shows counts and `Fetch: snippet-only`.
- [ ] Seeded bad fixture (mentions Emi, quotes "$9/mo", says "clinically proven", names Founding 100) → all four `[BLOCKED]/[VERIFY]` in ⚠ Flags; none reach Act-today.
- [ ] Every draft naming BUFF carries a disclosure line; no help-venue draft contains a URL.
- [ ] No Reddit prose: any Reddit item appears only as talking points / phone checklist.
- [ ] `git diff --name-only` after a (non-dry) run ⊆ `docs/marketing-scout/**`.
- [ ] Values check passed for this phase (SPEC § Values Check re-read against the sample report).

## Phase 2 (routines)
- [ ] Day 1–3: `state/heartbeat.log` has START then END for each date; report file exists; push notification received.
- [ ] Simulated failure (rename TARGETS in a test branch) → FAIL line + failure notification; watchdog does *not* double-alert when FAIL is present.
- [ ] Simulated silence (disable Routine A for a day) → watchdog pushes "scout silent".
- [ ] Double fire same day → second run exits with `SKIP already-ran`, no second report.
- [ ] Adi edits TARGETS on main → next run's report reflects it (merge path works).

## Phase 3
- [ ] Adi: "read in 5 min, acted in 20" for 5 consecutive weekdays.
- [ ] Saturday scorecard renders from repo state alone; Supabase fields say "needs SQL", not numbers.
