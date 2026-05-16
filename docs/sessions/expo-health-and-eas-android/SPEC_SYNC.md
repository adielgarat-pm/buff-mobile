# Expo Health + EAS Android — Spec Sync

> Canonical docs this package modifies, mapped to the phase that touches each.
> CC must update every doc in this list as part of the named phase's exit deliverable.
> Verified at phase-exit diff review.

## Docs touched

| Doc | Phase(s) | Nature of change |
|---|---|---|
| `CLAUDE.md` | 4 | §Tech Stack line 226: replace "EAS Build / Submit decision pending DevEx session" with shipped-state note |
| `docs/INTEGRATION_LEARNINGS.md` | 1 (resolve F-2026-05-05-01), 3 (new IN entry if surprises) | Move F-2026-05-05-01 to "Resolved"; add IN-2026-05-16-XX if Phase 2/3 surfaces anything novel (e.g., `android/` handling) |
| `docs/BUFF_DECISIONS_LOG.md` | 3 | New entry `D-2026-05-16-XX` — "First production AAB built via EAS-managed credentials." Records signing approach, build ID, fingerprint hash. |
| `docs/sessions/expo-health-and-eas-android/SPEC.md` | 2 | Append captured SHA-1 + SHA-256 fingerprints to Capabilities & Bottlenecks section |
| `docs/sessions/expo-health-and-eas-android/STATUS.md` | all | One row per phase exit |

## Docs NOT changed (explicit Out of Scope)

- `docs/BUFF_PRD.md` — no product surface changed
- `docs/BUFF_VALUES.md` — Adi-owned; no values changes
- `docs/BUFF_GAP_ANALYSIS.md` — Adi-owned; CC will *propose* a new build/distribution row at closeout but not edit unilaterally per CLAUDE.md rule
- `docs/BUFF_BUDDY_SYSTEM.md` — unrelated
- `docs/BUFF_USER_STORIES.md` — unrelated
- `docs/BUFF_FEATURE_AUDIT.md` — unrelated
- `docs/BUFF_FEATURE_PRIORITIZATION.md` — unrelated
- `docs/WORKFLOW.md` — methodology unchanged
- `docs/teen-ui-design/` — unrelated
- `docs/CONVERSATION_STARTER.md` — unrelated
- `docs/ARCHITECTURE.md` (if exists) — unrelated

## Verification

- [ ] Every phase row in ROADMAP.md has its docs update in the same commit
- [ ] TESTS.md "Methodology" checklist on each phase confirms the doc update happened
- [ ] At closeout: no drift between this SPEC_SYNC list and what actually changed (verified by `git diff main..HEAD --stat`)
