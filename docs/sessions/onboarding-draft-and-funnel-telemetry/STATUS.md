# STATUS — onboarding-draft-and-funnel-telemetry

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| Analysis + SPEC + architect review | ✅ done | 2026-08-31 | this branch | data-backed vs live DB | ANALYSIS.md; Plan-agent review |
| Cleanup dry-run + Category-A deletion | ✅ done | 2026-08-31 | `ef02b8d` | post-verify 0 orphans | CLEANUP_DRYRUN.md |
| **1. Funnel telemetry (B)** | ✅ code done | 2026-08-31 | this branch | tsc clean · 6 new + 107 onboarding/hooks pass | — |
| 2. Resumable draft (A) | ⏳ pending | — | — | — | — |

## Phase 1 — what shipped
- `onboarding_step_reached` added to `OnboardingEventType` (`src/lib/onboardingFunnel.ts`).
- New hook `src/hooks/useStepReachedLog.ts` — once per (family, step) per JS session; module-level Set (mirrors `useInsightViewLog` / `entryTelemetry`); fire-and-forget; child_id null (Pillar 2).
- Wired into the 5 data-entry screens only: `UStep1_ChildProfile`, `UStep2_Goal`, `UStep3_Challenges`, `UStep4_Motivator`, `UStep5_Preview` (`variant` = `1_child_profile`..`5_preview`).
- `scripts/onboarding-funnel.sql` — step reach counts, entered-vs-created, drop-step for abandoners, platform split.

## Verified (autonomous)
- `npm run typecheck` clean.
- `npx jest src/hooks/__tests__/useStepReachedLog.test.ts` → 6/6.
- `npx jest onboarding hooks` → 14 suites, 107/107 (no regression on the 5 touched screens).

## NOT yet verified (needs emulator/web run — Phase 1 exit)
- 🚩 Live E2E on Android + web: run a fresh email+password signup through the wizard and assert `onboarding_step_reached` rows land (per Test Plan; uses `e2e+<slug>@bufftest.dev`, cleaned after).
- 🚩 Zero rows written when familyId not yet loaded (guard holds in practice).

## Success metric (post-merge)
Once real traffic flows: `scripts/onboarding-funnel.sql` §3 shows a non-empty drop-step distribution → the ~20% "family, no child" leak becomes attributable to a specific step, which then sizes Phase 2 (resume depth).
