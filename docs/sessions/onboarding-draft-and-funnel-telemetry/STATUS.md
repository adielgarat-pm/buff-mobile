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

## Verified (autonomous, in-sandbox)
- `npm run typecheck` clean.
- **Web build compiles clean with the change**: `npm run build:web` (expo export --platform web) exit 0, 1768 modules — proves the new hook/imports are valid in the web bundle (platform parity, code side).
- `npx jest src/hooks/__tests__/useStepReachedLog.test.ts` → 6/6 (hook dedup/scope rules).
- `npx jest src/screens/onboarding/unified/__tests__/stepReachedWiring.test.tsx` → 3/3 — **render-level proof the wiring is live**: mounting the real UStep2_Goal / UStep4_Motivator fires `onboarding_step_reached` with the right variant; no fire when familyId is null.
- `npx jest onboarding hooks` → 107/107 (no regression on the 5 touched screens).

## Verification boundary (why the full browser E2E is NOT run in-sandbox)
Attempted a real-browser run of the built app in this cloud session; **blocked by environment, not by the change**:
- the built web app **redirects to the live `https://buffadhd.com` host**, which is unreachable from the sandbox (`#root` stays empty);
- the wizard is auth-gated and the signup screens carry **no testIDs**, so a UI-driven signup would be fragile/language-dependent;
- every real run writes accounts to **buff-production**.
This matches `e2e/README.md` ("the web suite is authored to run in CI / on a dev machine, not in-sandbox").

## Remaining — real signup→wizard E2E (Adi's machine / CI, per Test Plan)
- 🚩 Android (Hat-3) + Web (with a captured fresh-parent storageState): fresh email+password signup → walk Steps 1→5 → assert `onboarding_step_reached` rows land (one per step) via `scripts/onboarding-funnel.sql`. Use `e2e+<slug>@bufftest.dev`, clean up after.

## Success metric (post-merge)
Once real traffic flows: `scripts/onboarding-funnel.sql` §3 shows a non-empty drop-step distribution → the ~20% "family, no child" leak becomes attributable to a specific step, which then sizes Phase 2 (resume depth).
