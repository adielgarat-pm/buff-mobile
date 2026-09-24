# First Win — Spec Sync

> Canonical docs this package changes, mapped to the chunk that touches each. Updated in the same commit as the chunk's code.

| Doc | Phase (plan v2, REVIEW.md §4) | Change |
|---|---|---|
| `docs/sessions/first-win/STATUS.md` | every phase | Phase row (state, date, commit, tests, learnings) |
| `docs/INTEGRATION_LEARNINGS.md` | P0 ✅ + every phase | IN-2026-09-24-01 (`last_seen_at` artifact), -02 (two `source` definitions), -03 (mocked web E2E pattern); F-2026-09-24-01 deferred-scope flag |
| `docs/research/VALUE_VALIDATION_2026-09.md` | P0 ✅ | §8 correction (done 2026-09-24) + pointer to pkg/first-win and its baseline |
| `docs/research/REWARD_LOOP_2026-09.md` | P0 ✅ | §2.2 correction (done 2026-09-24) |
| `scripts/first-win-funnel.sql` | P0 ✅ | New: the metric's source of truth (TESTS.md §A) |
| `docs/sessions/onboarding-redesign/SPEC.md` | P2 | UStep6 behavior contract: parent-tap seed replaced by a coached handoff (6–12), `onboarding_handoff` source |
| `supabase/migrations/05x_*` + 058 note | P2 | `start_trial_on_activation()` excludes `onboarding_handoff` (D2; diff shown to Adi before apply) |
| `docs/MASTER_TEST_PLAYBOOK.md` | P1, P2 | Scenarios: preview banner, handoff (6–12 / 13+), "they said no" |
| `docs/sessions/child-access-paths/STATUS.md` | — | Day-1 reminder stays deferred; now tracked in F-2026-09-24-01 |
| `docs/BUFF_DECISIONS_LOG.md` | — | **Adi's doc.** Proposed entry in REVIEW.md §3 |
| `docs/BUFF_GAP_ANALYSIS.md` | — | **Adi's doc.** Not proposed |

## Out of scope

- `docs/BUFF_VALUES.md`: no change to principles.
- `docs/BUFF_BUDDY_SYSTEM.md`: BUDDY celebration reused as-is.
- Email lifecycle docs: no email sender in this package.

## Verification

- [ ] Each chunk's PR includes its rows above
- [ ] TESTS.md "doc updated per SPEC_SYNC" checked per chunk
