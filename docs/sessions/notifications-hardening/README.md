# `pkg/notifications-hardening`

Notification **architecture + UX** hardening (beyond bugs), from the 2026-06-08 review with Adi.

**Scope:** parent-owned permission model · push=action-required taxonomy · `child_suggestion` fix · split `anchor_recovery` (churned) from new `activation_nudge` (never-activated) · graduated inactivity threshold · age-gated kid notifications · cron cohort scoping + per-tz prep.

**Owns:** push *policy + scheduling*.
**Does NOT own:** bell-feed rendering → `pkg/parent-notification-feed`.

Read [SPEC.md](./SPEC.md) first. Decisions L1-L8 locked in-session; OQ1-5 open for Adi.

Files: SPEC.md · SPEC_SYNC.md · STATUS.md · TESTS.md · ROADMAP.md
