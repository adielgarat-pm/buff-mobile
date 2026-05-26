# pkg/beta-launch-readiness-2026-06-01

> Pre-flight package for the WhatsApp beta APK launch to the Lovable-migrant cohort on 2026-05-30 / 06-01.

**Status:** in progress (CC working through phases)
**Branch:** `pkg/beta-launch-readiness-2026-06-01`
**Base:** `main` @ `3d1f20a`
**Worktree:** `.claude/worktrees/beta-launch-readiness/`

## What this package is

A verification + docs package whose purpose is to:
1. Build a clean APK from current main + minimal egg-stage retirement workaround
2. Verify the `pending_lifetime_grants` backend mechanism is healthy end-to-end
3. Hand Adi a smoke test checklist that gates the WhatsApp distribution
4. Produce a distribution-ready APK + share message

It is **not** a feature package — no new product behavior is introduced beyond the egg-stage workaround that closes a known Pillar-1/2/3 violation queued since 2026-05-16 (IN-2026-05-16-01).

## Files

| File | Purpose |
|---|---|
| [SPEC.md](SPEC.md) | Scope + Capability Check + Values Check |
| [ROADMAP.md](ROADMAP.md) | 4 phases + their gates |
| [STATUS.md](STATUS.md) | Per-phase progress, owned by CC |
| [TESTS.md](TESTS.md) | Pass criteria per phase |
| [SPEC_SYNC.md](SPEC_SYNC.md) | Which canonical docs to update at exit |
| [SMOKE_TEST_CHECKLIST.md](SMOKE_TEST_CHECKLIST.md) | **The main deliverable Adi runs.** |
| [APK_DISTRIBUTION.md](APK_DISTRIBUTION.md) | APK link + sha256 + WhatsApp share message (filled after Phase 1) |

## Quick links

- EAS build for this package: see [STATUS.md](STATUS.md) Phase 1 row
- Production AAB v16 (separate, currently in Adi's hands): commit `3d1f20a`
- Source of cohort: 16 emails seeded in migration 015 (mailing_list_49)
- Beta window per D1: 2026-05-30 → 2026-06-30 (Asia/Jerusalem)

## Out of scope (explicitly)

- `pkg/lovable-migration-self-serve` (V1.1 — Lovable→mobile data import, separate package)
- `pkg/drop-egg-evolution-stage` (full retirement of EvolutionStage type — this package only does the visual workaround)
- Fix for BUG-2026-05-20-02 (ChildSettings MOCK data) — Adi accepted ship-as-is
- Sentry config changes (already stable post pkg/sentry-eas-resumption)
- Opening the unopened `pkg/pending-lifetime-grants` PR (Adi-task)
- Production v17 AAB rebuild (decided at PR merge)
