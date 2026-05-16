# childjoin-claim-orphans — Status

> מתעדכן ע"י Claude Code בסוף כל פאזה כחלק מ-exit deliverable.
> **לא לערוך ידנית** אלא אם מתקנים drift.

## פאזות

| פאזה | מצב | תאריך | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| 0 — Adi עונה על Q1-Q4 | `_passed_` | 2026-05-16 | (Adi: "do them all") | N/A | — |
| 1 — RPC `claim_orphan_profile` + `preflight_claim_orphan` | `_passed_` | 2026-05-16 | TBD (after this commit) | 8/8 preflight asserts passed | one PG quirk caught + fixed: `max(uuid)` not defined → split count/id queries |
| 2 — Client integration (AuthContext + ChildJoinScreen + i18n) | `_pending-adi-verify_` | 2026-05-16 | TBD (after this commit) | typecheck ✅, JSON ✅, RPC SQL ✅; emulator test → Adi | Expo web couldn't boot — needs react-dom/react-native-web (separate improvement pkg) |
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

**Phase 2 client work landed, awaiting Adi's emulator verification.** Changes:
- [src/contexts/AuthContext.tsx](../../../src/contexts/AuthContext.tsx) `signUp` — preflight RPC before `auth.signUp` (avoids orphan auth user on block); claim RPC after success when `match_found`; fallback to INSERT on `no_orphan_match` or claim race.
- [src/screens/auth/ChildJoinScreen.tsx](../../../src/screens/auth/ChildJoinScreen.tsx) `handleJoin` — detects `auth.orphanambiguous` tag in error message, shows Hebrew/English blocking copy.
- [src/i18n/he.json](../../../src/i18n/he.json) + [src/i18n/en.json](../../../src/i18n/en.json) — added `auth.orphanAmbiguous` key.

**Smoke tests performed locally by CC:**
- ✅ `node -e "JSON.parse(...)"` on both i18n files
- ✅ `npx tsc --noEmit` — zero errors
- ❌ `npm run web` — can't run; project missing `react-dom` + `react-native-web` deps. CLAUDE.md forbids installs without approval. End-to-end web smoke deferred.

**Adi to verify on Android emulator** per [TESTS.md § Phase 2](./TESTS.md#פאזה-2--client-integration) — 5 manual cases (happy path A exact match, happy path B no orphan, cross-script blocking, ambiguous, invalid family code regression).

**Next:** Phase 3 — INTEGRATION_LEARNINGS closures (IN-2026-05-14-03 RESOLVED, F-2026-05-03-03 CONFIRMED-NOT-APPLICABLE) + STATUS closeout + CLAUDE.md FLAG diff proposed for Adi.

## Closeout

- [ ] כל הפאזות עברו
- [ ] INTEGRATION_LEARNINGS.md עודכן עבור הפתעות
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (`pkg/childjoin-claim-orphans/v1`)
- [ ] PR ל-main, fast-forward merge, branch נמחק (אחרי Verify-Before-Delete)
- [ ] הסשן מסומן closed (this checklist הושלם)
