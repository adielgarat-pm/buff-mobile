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

## Now (in progress)
- **Phase 2 — Resumable draft (A).** Branch reset from merged `main`. Implementing:
  - `src/lib/onboardingDraft.ts` (save = read-modify-write `profiles.onboarding_data.wizard_draft`; load = own read, NOT via useAuth().profile; clear only on `child_created`).
  - draft write in UStep1–UStep4 `onNext`; prefill in UStep1; clear in UStep5 success branch.
  - `ResumeOnboardingBanner` on ParentDashboardScreen, gated `childrenCount === 0 && draftFresh` (14d TTL).
  - Architect decisions (in SPEC "Decisions"): draft not RPC-move; v1 shallow resume (UStep1 prefilled); module-Set dedup; DB-only.
  - ⚠️ Verify during impl: an EXISTING web reload-resume test suggests RootNavigator may already persist nav state on web — check overlap with the draft before duplicating.

## Open decisions (waiting on Adi)
- **Attribution buffadhd.com pass-through:** needs `adielgarat-pm/buff` added to the session (likely the marketing site). Else it's a manual link-tagging playbook. GitHub access this session = buff-mobile only.
- **Watch PR / CI:** not currently subscribed.

## Explicitly deferred / separate packages
- Real signup→wizard E2E on a dev machine / CI (sandbox can't reach live host; wizard auth-gated; writes prod). Test Plan in `SPEC.md`.
- Dead columns `onboarding_step` / `is_activated` cleanup.
- 189 parent profiles with dead `user_id`; 3 orphan children (`childjoin-claim-orphans`); 4 empty families.
- Google Play Install-Referrer (native) — deferred in `acquisition-tracking`.
- Engagement leak "child created but never used" (55%) — beyond onboarding.
