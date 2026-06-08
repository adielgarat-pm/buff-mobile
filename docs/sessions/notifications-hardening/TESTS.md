# `pkg/notifications-hardening` — TESTS

`[ ] Values check passed for this phase` — required at every phase close.

## Phase 1 — Edge: child_suggestion + push taxonomy
- [ ] Insert a `child_suggestion` row → dispatcher resolves parent recipient (not `unknown_type`); `notification_pushes.suppressed_reason` is null or `no_tokens`, never `unknown_type`.
- [ ] Push copy renders `{name} רוצה להציע משהו 💡` + suggestion title in body.
- [ ] Insert `parent_engagement` / `family_joined` → recorded SILENT (no push attempt).
- [ ] `parent_sos` / `reward_redemption_requested` still PUSH.

## Phase 2 — Crons
- [ ] `anchor_recovery` does NOT fire for a kid with zero `daily_progress` ever (never-activated excluded).
- [ ] Established kid (≥N completions) needs 5 idle days; barely-established needs 3 (graduated).
- [ ] Shani-like case (12 completions, 3-day gap) does NOT fire at 3 days.
- [ ] `activation_nudge` fires for Jonathan D / judith Galili (onboarded, 0 activity, 2-14d window); NOT for Maya (too new today); NOT for Shelly (engaged).
- [ ] Duplicate child profiles produce ONE activation nudge per family (dedup).
- [ ] Pause Mode skip + 7-day re-fire guard + stop-after-N still hold.

## Phase 3-4 — Preferences + client
- [ ] Deny OS dialog → no auto re-ask; banner + deep-link to system settings appears in Settings.
- [ ] One-time two-toggle prompt shows once; choices persist; Settings screen reflects + edits them.
- [ ] "Reminders for my child" OFF → no kid push even with token + permission.

## Phase 5 — Age gate + shared device
- [ ] 6-12 own-device kid: default OFF; parent toggle governs.
- [ ] 13-18 own-device kid: kid's own opt-in governs; parent toggle does not override.
- [ ] Shared device (parent + kid profiles): parent-targeted push reaches the parent; View-as-Child switch does not misroute parent alerts. **(Hat-4, real device.)**

## Phase 6
- [ ] Banned-string grep gate passes on all new user-facing copy.
- [ ] Values Check re-verified against implemented behavior (not just SPEC text).
