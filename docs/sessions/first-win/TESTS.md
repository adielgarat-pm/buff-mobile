# First Win — TESTS: how CC checks its own work, and what "success" means

> Applies to plan v2 (`REVIEW.md` §4). Pass/fail per phase. A phase does not merge without every box, or an explicit Adi waiver.

## A. Success metrics (pre-registered before any product change ships)

### Primary
**`first_win_48h_child`**: among **stranger** families (not on Adi's friend list, not internal/test) that created a child profile, the share whose **first `child_device` completion** happens ≤48h after `families.created_at`.
- Timestamp source: the once-only `first_task_complete` event (P0), not the upsertable `daily_progress` row.
- Baseline (DB, 2026-09-24, NULL-safe, stranger = no lifetime-access parent as a proxy until Adi's list exists): **2 / 19 stranger families with a child** (~11%, 95% CI ≈1–33%); by month July 2/9, Aug 0/9, Sep 0/1. All stranger families (with or without child): 2/27.

### Secondary (reported, not decisive)
- `first_win_48h_any`: counts `view_as_child` too, reported separately.
- `child_first_open_48h`: the child app opened by the child (login or handoff).
- UStep6 answer mix: together / not now / said no.
- Hours from signup to first win (median).
- **Child D7:** `child_device` completions on ≥2 distinct days in days 0–7.

### Guardrails (must not get worse; any breach = stop and review)
- Parent D7 return (`parent_tab_viewed` on day 2–7).
- Notification / activation-nudge opt-outs within 7 days.
- "They said no" rate. Not a failure, but if >50% the handoff design is wrong for the audience.
- First wins revoked by the parent (`revoked_at`).
- Trial start → paid conversion, if D2 changes the trial clock.
- **Zero** pricing/paywall surfaces reachable from the child screens (automated test, §B).

### Counter-metrics (anti-gaming)
- Share of day 0–14 completions that are `view_as_child`.
- Families whose only win is `view_as_child` and who never have a later `child_device` completion.
- Wins <10 min after the wizard ends, and bursts of ≥2 completions within 60 s.

### Pre-registered decision rule
- Prior Beta(3, 18) (the stranger baseline 2/19). Read at **n = 20 stranger families with a child** after P2 ships, **or on 2026-12-31**, whichever comes first.
- **Keep:** ≥6 / 20 `child_device` wins (30% vs ~11% baseline) **and** no guardrail breached. Exact posterior probabilities recomputed and frozen in P0, before P2 ships.
- **Revert / rethink:** ≤1 / 20.
- **In between:** inconclusive. Extend the sample; do not claim a win.
- **Stop early only for harm:** ≥2 nudge/notification opt-outs attributable to the flow, or any parent complaint about pressure.
- **Qualitative weight is equal:** a per-family timeline (signup → UStep6 answer → child open → first win → D7) is reviewed with Adi for every family. At this N the timelines matter as much as the number.
- **Honest limit:** at n=20 only an effect of about +20 pp is detectable. A "no significant change" result does not mean "no effect".

## B. How CC checks itself, per phase

### Every phase (gate before opening a PR)
- [ ] Rebased on the latest `origin/main`; `git diff` shows no edits to files touched by the parallel E2E audit since my last rebase, or conflicts are resolved and noted.
- [ ] `npx tsc --noEmit` = 0 errors; lint; `check:i18n-access` + i18n key check; `no-raw-alert`.
- [ ] Jest: new tests for the phase (listed below) plus the existing onboarding/child suites green.
- [ ] **Independent red-team:** a fresh reviewer agent reads the diff against this TESTS.md and BUFF_VALUES. Findings are fixed or listed in the PR.
- [ ] Values Check re-answered against the **implemented** behavior, not the SPEC text.
- [ ] Every new string (EN + HE) was approved by Adi **before** the PR.
- [ ] STATUS.md row, SPEC_SYNC rows, INTEGRATION_LEARNINGS entries; deferred scope recorded as 🚩 flags.

### P0 — measurement
- [ ] Jest: each new event fires exactly once (`first_task_complete` only on the child's first ever; the presence answer for each of 3 buttons; step_reached for steps 6/7/8).
- [ ] **SQL self-validation:** `first-win-funnel.sql` reproduces the baseline exactly (51 families / 5 wins; strangers 2-of-19 with child), and returns non-zero rows for `source IS NULL` legacy completions (the NULL trap, F15).
- [ ] **Instrumentation health (after deploy):** ≥90% of new families that reach UStep5 have a UStep6 `step_reached` event. Checked at the first 5 signups; below that = bug, not signal.
- [ ] Web: Playwright on the local web export, Supabase mocked via `context.route`, asserts the POST bodies to `onboarding_events` for the UStep6 → UStep8 path.

### P1 — path fixes
- [ ] Jest: the banner renders the **child's** name; exiting preview asks for confirmation; the UStep8 CTA order puts the shared-device CTA above the code card; the mission selector returns an evening task at 20:00 and a morning task at 07:30 (clock mocked), and falls back to the first visible task.
- [ ] Playwright (web, mocked): after the UStep8 CTA, View-as-Child opens with the child's name in the banner.

### P2 — coached handoff (6–12)
- [ ] Jest: age ≥13 never sees the handoff; "They said no" logs `presence_answered{said_no}` and writes **no** progress; no `onboarding_first_task` write remains; handoff-session completions carry the D2 tag.
- [ ] **Reachability E2E (web, mocked):** starting from the signup entry → wizard → UStep6 "together" → script card → child screen → Vibe Check → complete the mission → confetti/BUFFs → `first_task_complete` logged → BUFFs visible. No direct screen navigation or injected session.
- [ ] If D2 = no-trial: a SQL test on a Supabase **branch** (not prod) shows a handoff-tagged completion does not set `trial_started_at`, and a later `child_device` completion does.
- [ ] Child-safety test: from the handoff child screen, no route to the paywall/pricing within 2 taps, excluding the confirm-gated exit.

### P3 — first reward within a day
- [ ] Jest: the seed-reward calculator gives the cheapest reward ≤ one day of default earning; the child line shows "{n} BUFFs to {reward}", with no `cash_value` ever selected.

## C. Android device checklist (Adi, no emulator here)
1. Fresh signup, child aged 8. At UStep6 tap "together": the script card shows, then the child screen shows the **child's** name on the banner.
2. Complete the mission: confetti + BUFFs + BUDDY. Exiting asks "Hand back to parent?".
3. Repeat and tap "They said no": you land on the handoff options, nothing is marked done, and the tone is fine.
4. Child aged 14: no handoff step appears.
5. Hebrew + girl: gendered strings are correct, and RTL is correct.
6. Check that the trial did **or did not** start (Settings → plan), per D2.

## D. When the numbers are read
- **Weekly:** Adi + CC review per-family timelines (5 minutes).
- **Day +14 after P0:** go / no-go for P2, based on where UStep6 actually loses families.
- **Decision read** per §A.
