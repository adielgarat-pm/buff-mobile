# Sentry Crash Monitoring — Spec Sync

> Canonical docs touched by this package, mapped to the phase that touches each.

## Docs touched

| Doc | Phase(s) | Nature of change |
|---|---|---|
| `CLAUDE.md` | 5 | §Tech Stack: add Sentry to the live observability stack; replace the "Sentry/Crashlytics (observability), pending" future-list entry with current state |
| `docs/BUFF_DECISIONS_LOG.md` | 2 (Sentry adoption), 4 (v9 + Sentry live) | Two new D-entries dated 2026-05-16 (or whenever Phase 2/4 land) |
| `docs/INTEGRATION_LEARNINGS.md` | 4 (only if surprised) | Optional IN-entry if EAS/Sentry integration surfaces anything novel |
| `docs/sessions/sentry-crash-monitoring/SPEC.md` | 2, 4 | Append DSN-env-var-name (not DSN value) to Capabilities; append v9 build details at Phase 4 close |
| `docs/sessions/sentry-crash-monitoring/STATUS.md` | all | One row per phase exit |

## Docs NOT changed (explicit Out of Scope)

- `docs/BUFF_PRD.md` — no product surface change
- `docs/BUFF_VALUES.md` — Adi-owned; no values change
- `docs/BUFF_GAP_ANALYSIS.md` — Adi-owned; CC will propose adding an "Observability" row at closeout but won't edit unilaterally
- `docs/BUFF_BUDDY_SYSTEM.md`, `BUFF_USER_STORIES.md`, `BUFF_FEATURE_AUDIT.md`, `BUFF_FEATURE_PRIORITIZATION.md` — all unrelated
- `docs/WORKFLOW.md` — methodology unchanged
- `docs/teen-ui-design/` — unrelated
- `docs/sessions/expo-health-and-eas-android/` — prior package is being closed in parallel; Sentry doesn't reopen anything there

## Verification

- [ ] Every phase row in ROADMAP.md has its docs update in the same commit
- [ ] TESTS.md "Methodology" checklist on each phase confirms the doc update happened
- [ ] At closeout: `git diff main..HEAD --stat` shows no surprises

## Secrets handling

- DSN: stored in `eas.json` per-profile env vars; non-secret per Sentry docs (safe to expose client-side)
- Auth token: stored ONLY as EAS project secret `SENTRY_AUTH_TOKEN`; never committed to repo
- Verify before each commit: `git diff --staged | grep -iE "sentry.*token|EXPO_PUBLIC_SENTRY_DSN.*://"` should show DSN going INTO eas.json only, and token going NOWHERE
