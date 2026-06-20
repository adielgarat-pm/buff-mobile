# pwa-install-nudge — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 1 — Nudge Manager | _passed_ | 2026-06-20 | af85810 | jest 8/8, tsc 0 | nudgeStorage.web.ts split omitted (see deviation note) |
| 2 — Install detection hook | _passed_ | 2026-06-20 | 350d6b3 | jest 10/10, tsc 0 | @jest-environment jsdom directive required for UA/window tests |
| 3 — InstallNudge UI + Settings + i18n | _passed_ | 2026-06-20 | 756b9d4 | tsc 0, 18 new tests pass | platform-split component (InstallNudge.ts / .web.tsx); dismiss via onDismiss callback closure |
| 4 — Manifest screenshots | _passed_ | 2026-06-20 | 2c52e4c | tsc 0 | 6 EN screenshots 1080×1920, form_factor narrow |
| 5 — Exit deliverables | _passed_ | 2026-06-20 | (this commit) | — | — |

## Deviation from SPEC

- **nudgeStorage.web.ts split omitted (Phase 1):** SPEC §3.4 described a web/native split for nudge persistence. AsyncStorage is already transparently localStorage on web (same pattern as useVibeDismiss / useAnchorRecoveryDismiss). No split needed.
- **render() onDismiss closure (Phase 3):** SPEC shows `render: () => ReactNode` with no args. `useInstallNudgeRegistration(onDismiss)` closes over a ref to the dismiss callback so the dashboard can pass `suppressed=true` after dismiss. The `render()` signature is unchanged from the spec; the callback is plumbed via the registration hook, not the nudge contract.

## Closeout

- [x] כל הפאזות עברו
- [x] INTEGRATION_LEARNINGS.md עודכן (deviation note + jest-environment lesson)
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md (no canonical doc updates required for this package)
- [ ] PR ל-main, fast-forward merge, branch נמחק
- [ ] הסשן מסומן closed (this checklist הושלם)
