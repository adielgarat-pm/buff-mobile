# Session Progress / Handoff — stuck-registrations

_Last updated: 2026-08-31. Branch: `claude/stuck-registrations-analysis-nro55c`._

Durable status of the whole line of work, so any session can pick it up. Detail lives in the sibling files.

## Timeline (done)
1. **Analysis** — where recent registrations get stuck. → `ANALYSIS.md`.
   Headline funnel (auth-linked parents, 60d): 27 signed up → 25 profile (93%) → **20 child (80%)** → 9 active (45%).
   Biggest leak: **"family created, no child" ~20%**, structural (child persists only at Step 5).
   Also found: `onboarding_step`/`is_activated` are **dead columns** (unwritten anywhere in repo).
2. **Cleanup** — deleted 5 explicit test accounts from buff-production (approved). → `CLEANUP_DRYRUN.md`. Post-verify: 0 orphans.
3. **Package SPEC + architect review** — draft + telemetry, OQs resolved. → `SPEC.md`.
4. **Phase 1 (funnel telemetry) — ✅ MERGED** (`4c68d99`, PR #454).
   `onboarding_step_reached` event + `useStepReachedLog` hook wired into UStep1–UStep5 + `scripts/onboarding-funnel.sql`.
   Verified: typecheck, build:web, 6 unit + 3 wiring + 107 onboarding/hooks tests. Zero schema changes.
5. **Attribution SPEC** — `docs/sessions/acquisition-attribution-activation/SPEC.md`. Key finding: capture code already exists; the gap is untagged outbound links + no buffadhd.com pass-through (activation, not code).

## Phase 2 — Resume onboarding (Shape A) — ✅ code done (this branch)
Adi chose **Shape A** (minimal, no DB/schema). Implemented:
- `onboardingPersistence.ts` unified into ONE real impl (AsyncStorage) — now persists on **native too** (was a no-op); deleted `onboardingPersistence.web.ts`. `ONBOARDING_PERSISTENCE_ENABLED = true`.
- `RootNavigator`: dropped the silent auto-jump (initialState); now always lands the not-yet-onboarded parent on **Welcome**, passing the snapshot via `initialParams={{ resumeSnapshot }}`.
- `WelcomeScreen`: if a fresh mid-wizard snapshot exists (route ≠ UStep1) → "Continue setup" (re-enters the step with its params) + "Start over" (clears snapshot → UStep1). Encouraging copy (Pillar 2). testIDs: welcome-cta / welcome-resume / welcome-start-fresh.
- `types.ts`: `Welcome` param carries `resumeSnapshot`.
- i18n: `welcome.resume.*` in en + he (parity check ✓).
- e2e: reload test updated to the prompt behavior; `completeStep1` now dismisses Welcome first (`startFromWelcome`).
- Tests: `WelcomeScreen.resume.test.tsx` (4). Verified: tsc, build:web exit 0, 119 tests, i18n parity.
- Solves: native app-kill mid-wizard + gives an explicit resume choice on both platforms. (Web ≤6h reload was already handled; native was a no-op before.)

### Not verified here (Adi / CI, per Test Plan)
- 🚩 Live: kill the native app mid-wizard → reopen → Welcome offers resume → continue lands on the same step. And web reload → same.

## Original Phase 2 plan (SUPERSEDED by the correction above — kept for reference)
- **Phase 2 — Resumable draft (A).** Branch reset from merged `main`. Implementing:
  - `src/lib/onboardingDraft.ts` (save = read-modify-write `profiles.onboarding_data.wizard_draft`; load = own read, NOT via useAuth().profile; clear only on `child_created`).
  - draft write in UStep1–UStep4 `onNext`; prefill in UStep1; clear in UStep5 success branch.
  - `ResumeOnboardingBanner` on ParentDashboardScreen, gated `childrenCount === 0 && draftFresh` (14d TTL).
  - Architect decisions (in SPEC "Decisions"): draft not RPC-move; v1 shallow resume (UStep1 prefilled); module-Set dedup; DB-only.
  - ⚠️ Verify during impl: an EXISTING web reload-resume test suggests RootNavigator may already persist nav state on web — check overlap with the draft before duplicating.

## Topology resolved (2026-08-31) — IN-2026-08-31-01
Two BUFF apps on two Supabase projects existed: buff-mobile (RN, LIVE, `gfrongfnyigxsexuofrg`) and the Lovable `adielgarat-pm/buff` (buff.lovable.app, `iyejaxnugjgjeceqdcky`, stale since Jun 20). **Adi: Lovable is retired; buff-mobile is live; buffadhd.com = buff-mobile web.** ⇒ analysis is on the correct/complete DB; attribution needs NO Lovable-repo work.

## Attribution — activated (docs + tiny code, on this branch)
- `docs/sessions/acquisition-attribution-activation/` — SPEC (OQ1 resolved), **UTM_PLAYBOOK.md** (the marketing action: tag every outbound buffadhd.com link with `?utm_source=`).
- `normalizeSource` extended: `reddit`, `whatsapp` (utm + referrer host) → first-class instead of `unknown`. +3 tests (13 pass).
- `scripts/acquisition-by-source.sql` — source split + the ≥80%-attributed success metric.
- Remaining = **marketing action only** (tag the links); Play install-referrer stays deferred.

## PR watching
- **PR #457 (Phase 2) — subscribed** (auto-handle CI/reviews).

## Test coverage added
- `MASTER_TEST_PLAYBOOK` F3.E6 — native app-kill → Welcome resume (Hat 3); web reload covered by `onboarding.web.spec.ts` (Hat 1).

## Explicitly deferred / separate packages
- Real signup→wizard E2E on a dev machine / CI (sandbox can't reach live host; wizard auth-gated; writes prod). Test Plan in `SPEC.md`.
- Dead columns `onboarding_step` / `is_activated` cleanup.
- 189 parent profiles with dead `user_id`; 3 orphan children (`childjoin-claim-orphans`); 4 empty families.
- Google Play Install-Referrer (native) — deferred in `acquisition-tracking`.
- Engagement leak "child created but never used" (55%) — beyond onboarding.
