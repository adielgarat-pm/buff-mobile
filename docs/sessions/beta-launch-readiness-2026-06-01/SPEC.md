# SPEC — pkg/beta-launch-readiness-2026-06-01

## Goal

Produce a tested, documented APK + smoke-test checklist that gates the WhatsApp beta distribution to the Lovable-migrant cohort on 2026-05-30 / 06-01.

## Scope

### IN
1. Build a preview-profile APK from current main + a minimal egg-stage workaround
2. Backend MCP verification of `pending_lifetime_grants` mechanism (migration 015 + trigger + functions + seed)
3. Authored SMOKE_TEST_CHECKLIST.md covering install/onboarding, ChildJoin regression, recent UI/UX (PRs #41/#72/#75/#88/#89/#90/#91/#92/#93), and core no-regression flows
4. APK distribution artifact (download URL + sha256 + Hebrew WhatsApp share template)
5. Session-folder docs (this SPEC, ROADMAP, STATUS, TESTS, SPEC_SYNC, README, SMOKE_TEST_CHECKLIST, APK_DISTRIBUTION)
6. PR against main

### OUT
- New product features
- Schema changes (DB is verify-only)
- Sentry/EAS config edits (already stable)
- pkg/lovable-migration-self-serve work (V1.1, separate package)
- Full retirement of EvolutionStage type (queued as pkg/drop-egg-evolution-stage)
- Hotfix for BUG-2026-05-20-02 (Adi accepted ship-as-is)
- Opening pkg/pending-lifetime-grants PR (Adi-task)
- Production v17 AAB build (decided at PR merge)

## Capability Check

| # | What | Who |
|---|---|---|
| 1 | typecheck, jest, expo-doctor, EAS Cloud build, MCP SQL, write docs, gh PR open | CC |
| 2 | Emulator/device smoke tests (Hat-3 / Hat-4 walkthrough) | Adi |
| 3 | Sentry dashboard check after crash test, Google OAuth verify | Adi (Hat-4) |
| 4 | Upload APK to Google Drive (CC cannot auth as Adi to Drive) | Adi |
| 5 | Decide v17 AAB rebuild vs ship v16 with egg | Adi (at PR merge) |
| 6 | Bottleneck: ~45min wall-clock EAS Cloud build queue | EAS infra |

## Values Check

This is a verification + docs package with **one in-scope code change** — the egg-stage retirement workaround per IN-2026-05-16-01. The workaround was chosen explicitly because the existing code violates all three pillars. The Values Check therefore applies to the workaround:

### Pillar 1 — Intrinsic Motivation

1. **Would a child want this feature even without virtual reward?** N/A (removing, not adding). The removal eliminates the egg-hatch dopamine-trigger anti-pattern.
2. **Does the feature bring the child closer to a self-chosen reward?** Removing the egg-stage gates does *not* introduce any new gating mechanism — the child's chosen skin emoji appears from day 0.
3. **Is success felt as "I want to" or "I have to"?** N/A (no behavior gated).

**Verdict: PASS.** The change *removes* an extrinsic mechanic.

### Pillar 2 — Positive Coaching

1. **Does any wording shame, compare, or frame failure?** No — the workaround changes default state and a single ternary; no copy touched.
2. **If the child fails, is the response empathy or pressure?** N/A.
3. **Any "suffering/loss/anger" mechanic in the BUDDY?** No — the workaround eliminates the egg-shell-broken framing where a child who used BUFF for 1 day then stopped never met their buddy.

**Verdict: PASS.**

### Pillar 3 — Independence-Building

1. **Does the feature make the child more capable *without* the app?** Neutral.
2. **Does the child have a voice in the feature?** Yes — the child sees their chosen skin from day 0 (not forced through an app-decided incubation).
3. **In 6 months, is the feature still necessary?** N/A.

**Verdict: PASS.**

### Overall Values Check verdict

✅ All 9 questions pass. The change closes a documented violation; it does not introduce a new one.

## Hard constraints

1. APK must build green from clean checkout — no broken types/tests/expo-doctor.
2. SMOKE_TEST_CHECKLIST must include explicit Pillar gates (P1 no-egg / P2 no-paywall-for-kid / P3 session-persists).
3. No DB schema changes; backend phase is verify-only.
4. PR ships at the end of Phase 4; CC opens it via gh CLI.
5. APK_DISTRIBUTION.md must include sha256 for tamper-verification.

## Acceptance criteria

| AC | Description |
|---|---|
| AC-1 | typecheck + jest + expo-doctor all green on branch HEAD |
| AC-2 | EAS preview APK build succeeds; download URL recorded with sha256 |
| AC-3 | Migration 015 confirmed in DB; trigger registered; 16 seed emails present; 3 SECDEF functions exist; idempotency probe passes |
| AC-4 | SMOKE_TEST_CHECKLIST.md exists with sections A/B/C/D + pillar gates |
| AC-5 | APK_DISTRIBUTION.md exists with link + sha256 + Hebrew share message |
| AC-6 | PR opened against main with handoff notes |
| AC-7 | Egg-workaround Values Check passes (this doc) |
