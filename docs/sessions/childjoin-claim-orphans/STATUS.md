# childjoin-claim-orphans — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Adi עונה על Q1-Q4 | `_passed_` | 2026-05-16 | (Adi: "do them all") | N/A | — |
| 1 — RPC `claim_orphan_profile` + `preflight_claim_orphan` | `_passed_` | 2026-05-16 | TBD (after this commit) | 8/8 preflight asserts passed | one PG quirk caught + fixed: `max(uuid)` not defined → split count/id queries |
| 2 — Client integration (AuthContext + ChildJoinScreen + i18n) | `_pending_` | — | — | — | — |
| 3 — Closeout (docs + tag + PR) | `_pending_` | — | — | — | — |

**Scenario:** A (CC's recommended path) — Q1=drop / Q2=RPC / Q3=NFC+lower / Q4=blocking error.

**Live Supabase migrations applied (project `gfrongfnyigxsexuofrg`):**
- `20260516082239_childjoin_claim_orphan_profile` — initial RPC pair
- `20260516082341_childjoin_claim_orphan_profile_fix_max_uuid` — fix `max(uuid)` → split count/id queries

Both consolidated into [`../../../migrations/007_childjoin_claim_orphan_profile.sql`](../../../migrations/007_childjoin_claim_orphan_profile.sql) for repo version control.

## Legend

- `_pending_` — לא התחיל
- `_in_progress_` — CC באמצע פאזה, plan מאושר
- `_passed_` — פאזה הושלמה, tests עברו
- `_failed_` — tests נכשלו, צריך rework לפני להמשיך
- `_blocked_` — מחכה לחיצוני (סקירה של Adi, עיצוב, וכו')

## מצב נוכחי (2026-05-16)

**Phases 0 + 1 closed.** RPCs `preflight_claim_orphan` + `claim_orphan_profile` are live in production Supabase. 8/8 SQL test cases passed (no-orphan / exact match / trimmed / case-insensitive / ambiguous / cross-script / family-not-found / null-input / no-auth). One PG quirk caught during testing: `max(uuid)` is not defined; fixed by splitting `count + id` into two queries.

Branch: `claude/lucid-sinoussi-235144` (pushed ל-origin).

**Next:** Phase 2 — modify `AuthContext.signUp` to call `preflight_claim_orphan` BEFORE `auth.signUp` (avoids orphan auth users on blocking error) and `claim_orphan_profile` AFTER, then wire blocking-error UX in `ChildJoinScreen` + i18n Hebrew/English copy.

## Closeout

- [ ] כל הפאזות עברו
- [ ] INTEGRATION_LEARNINGS.md עודכן עבור הפתעות
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (`pkg/childjoin-claim-orphans/v1`)
- [ ] PR ל-main, fast-forward merge, branch נמחק (אחרי Verify-Before-Delete)
- [ ] הסשן מסומן closed (this checklist הושלם)
