# ROADMAP — marketing-scout

| Phase | Scope | Stop condition |
|---|---|---|
| **0 — Housekeeping (this package, same PR)** | Fix "70% = success" claims drift in `BUFF_MESSAGING.md` + `BUFF_COMPETITORS.md` (product uses the count rule since release 66). Draft `docs/BUFF_CRISIS_COMMS.md` (holding statement for "AI + kids — is it safe?", not-a-medical-device line, Play-review reply template) **marked DRAFT for Adi's review**. Append cloud variant to `docs/automation/HEARTBEAT.md`. `ci.yml` paths-ignore for `docs/marketing-scout/**`. | Adi reviews the copy changes in the PR. |
| **0b — October pitch sprint (approved 2026-09-04, scoped separately)** | Listicle factsheet + 3 pitches (ADDitude/Understood/Verywell bylines) + Qwoted/Featured/PodMatch profiles. Window closes ~Sep 15. | Own session folder `pkg/adhd-awareness-month-2026`; media-kit gate n/8 must be ≥ 5 first. |
| **1 — Skill** | `SKILL.md`, `REPORT_TEMPLATE.md`, `TARGETS.md`, state files, fixtures, `PHONE_CHECKLIST.md`, session folder. Dry-run with fixtures + one live dry-run (WebSearch) producing a sample report. | Sample report reads as one screen; Compliance Gate demonstrably blocks a seeded bad draft. |
| **2 — Routines** | Create branch `automation/marketing-scout` from this branch. Routine A daily 04:30 UTC (07:30 IDT) fresh session → skill. Routine B watchdog 09:00 UTC. Model: Sonnet. 3 live days, notifications to Adi only. | 3 consecutive days with START+END and a report file; watchdog silent. |
| **3 — Tune** | Budgets, query rotation, register markers from real output; decide `fetch_enabled` (Adi widens env allowlist); optional 14:00 IDT Reddit-lite run; raise `weekly_product_mention_budget` after month 2. | Adi reports the brief is "read in 5 minutes, acted in 20". |
