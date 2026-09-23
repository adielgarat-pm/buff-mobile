# Freemium v2 — Status

> Updated by Claude Code at the end of each chunk.

| Chunk | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 1 — SPEC / SPEC_SYNC / Values Check | _passed_ | 2026-09-23 | (this commit) | docs only | — |
| 2 — Remove task cap + 2nd-child wall | _passed_ | 2026-09-23 | (this commit) | tsc clean; ParentTasks (pickers/dirtyGuard/noCap), useSubscription, freemiumV2 guards green | — |
| 3 — Paywall "BUFF Coach" copy (AI only) + renames + capture CTA | _passed_ | 2026-09-23 | (this commit) | tsc clean; PaywallChildGate (+3 v2 tests), parent screens, guards green; i18n-key-check clean | — |
| 4 — Migration 058: trial at first real completion + reset of backfilled clocks | _passed_ | 2026-09-23 | (this commit) | Local PG16 logic test `trial_migration_test.sql` ALL PASSED (reset guards, seed rows, first completion, once-ever, referral stacking, fail-safe, client guard, rollback); mutation-checked. **Applied to prod** via MCP 2026-09-23: 192 clocks reset, 29 lifetime kept, 3 real trials kept, trigger enabled | IN (trial trigger existed) |
| 5 — Weekly free AI insight (server + client) | _passed_ | 2026-09-23 | (this commit) | tsc clean; insightTasteGate (6), useAutoCoachInsight (+1), hooks + parent screens green; edge fn typechecked against stubs. **Deployed** generate-child-insights **v19** (was v18) via MCP; deployed source verified identical | — |
| 6 — Trial moments card (started / ending / ended) | _passed_ | 2026-09-23 | (this commit) | tsc clean; coachTrial (12, incl. approved-Hebrew verbatim + no-loss-words), CoachTrialNote (7, incl. child role, iOS no-buy, web), useFamilyTrial (4), parent screens green; i18n-key-check clean | — |
| 7 — refactor: extract buildSeedRewards (onboarding unchanged) | _passed_ | 2026-09-23 | (this commit) | tsc clean; parity test vs verbatim pre-extraction builder across 4 ages × all motivator combos; onboarding suites green; check-bilingual-access clean | — |
| 8 — Edit focus (Edit Child → Focus & rewards) | _passed_ | 2026-09-23 | (this commit) | tsc clean; EditFocusScreen (7: prefill, merge, unchecked default, Skip no-write, Add only picked, never update/delete, age override, no-age), focusSuggestions (7), EditChild (+1), guards (+2); i18n / bilingual / raw-alert checks clean | — |
| 9 — (skipped per Q1: AI timetable import stays free) | _n/a_ | 2026-09-23 | — | — | — |
| 10 — Docs: PRD §5.1/§11, monetization SPEC superseded note, INTEGRATION_LEARNINGS IN-2026-09-23-01, draft DECISIONS_LOG entry, exit Values Check | _passed_ | 2026-09-23 | (this commit) | Full suite **126 suites / 1078 passed, 1 skipped**; tsc clean; i18n-key-check, check-bilingual-access, check-no-raw-alert clean; `expo export --platform web` builds | IN-2026-09-23-01 |

## Applied to production (Supabase `gfrongfnyigxsexuofrg`)

| What | When | Result |
|---|---|---|
| Migration `058_trial_on_first_real_completion` (via MCP `apply_migration`) | 2026-09-23 | Function body replaced (old 2-date bar gone, seed rows excluded); 192 backfilled clocks reset → `no_clock` 30 → 222; 29 lifetime + 3 real trials untouched; trigger enabled |
| Edge function `generate-child-insights` v18 → **v19** (via MCP `deploy_edge_function`, verify_jwt on) | 2026-09-23 | Deployed source re-read and identical to repo (index.ts + tasteGate.ts). Live call not possible from the sandbox (egress blocked) |

## Exit Values Check (against implemented behaviour)

| Pillar | Q | Verified by |
|---|---|---|
| 1 | Want it without a virtual reward? | Child screens untouched; CoachTrialNote renders null for role=child (test); Paywall child gate unchanged (PaywallChildGate tests) |
| 1 | Child-chosen reward vs app-made? | Edit focus seeds from motivators via the same `buildSeedRewards` as onboarding (parity test); money never auto-seeded |
| 1 | "I want" vs "I must"? | No new child-facing pressure; task/child walls removed (noCap + guards tests) |
| 2 | Shaming / failure framing? | Trial copy approved verbatim + forbidden-words test (en/he) |
| 2 | Empathy vs pressure? | Downgrade only affects AI generation beyond 1/child/week and capture beyond free runs; nothing else gated (guards + Paywall FEATURES test) |
| 2 | Suffering / loss mechanic? | None; trial end copy says everything stays free |
| 3 | More capable without the app? | Coach unchanged (weekly, parent-facing) |
| 3 | Child has a voice? | Edit focus lets the parent correct a wrong onboarding guess; suggestions optional and unchecked (test) |
| 3 | Still necessary in 6 months? | Occasional settings flow; time-boxed trial |

All 9 pass.
