# STATUS — pkg/money-conversion-reward

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 1 — Motivator + cost anchor + template (onboardingData, config, i18n) | Complete | 2026-05-30 | `pkg/money-conversion-reward` (hash at PR) | typecheck ✓ · i18n:check ✓ | IN-2026-05-29-03 (resolved) |
| 2 — Schema (`store_rewards.cash_value`) | Complete | 2026-05-30 | `pkg/money-conversion-reward` | migration applied (mobile DB) | — |
| 3 — Parent suggestion + cash-mode modal | Complete | 2026-05-30 | `pkg/money-conversion-reward` | typecheck ✓ | — |
| 4 — Child reward screens (Mint + Gamer) | Complete | 2026-05-30 | `pkg/money-conversion-reward` | typecheck ✓ · jest ✓ (271) | — |
| 5 — Values + docs + PR | Code complete; awaiting Hat-4 + PR merge | 2026-05-30 | `pkg/money-conversion-reward` | — | — |

## Notes
- Migration `add_cash_value_to_store_rewards` applied to mobile DB (gfrongfnyigxsexuofrg; no prod users per CLAUDE.md memory).
- jest: 271/271 pass. The 2 first-run failures (`EditChildScreen`, `ManageChildrenScreen`) are the known flaky full-suite timeouts — green on isolated re-run.
- No new dependency (`expo-localization` already present).
- Runtime UI is auth-gated (parent + child sessions) → Adi Hat-4 device test.
- Branch off `main` @ `5e9ba20`.
