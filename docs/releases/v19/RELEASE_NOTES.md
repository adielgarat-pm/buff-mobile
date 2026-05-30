# Release v1.1.0 — Notes

## A. Technical (for STATUS + Play Console internal notes)

**Version:** versionName `1.1.0`, versionCode `20` (auto-incremented by EAS from V19's `19`).
**Cut date:** 2026-05-30.
**Anchor:** `5128106` `fix(hq-tasks-tappable)` (estimated last V19 commit; see MANIFEST §Anchor).
**Branch:** `release/v19-1.1.0` → PR #127.
**Commit count (since anchor):** 8 non-merge commits + their merges.

### Gates
| Gate | Result |
|---|---|
| 1 — tsc | ✅ clean |
| 1 — jest | ✅ 250/250 pass (20 suites, 6 snapshots) |
| 1 — expo-doctor | ✅ 18/18 (after `expo install --fix` patch upgrades) |
| 1 — i18n parity (en↔he) | ✅ 0 missing each direction |
| 1 — i18n-access guardrail | ✅ clean (160 files scanned) |
| 2 — Hat-3 smoke | ✅ boot + integration smoke from release branch · per-feature Hat-3 for A already done 2026-05-30 (`AC_MATRIX.md`) · per-feature Hat-3 for B/C/D/E/F **deferred to Hat-4 by design** (see MANIFEST §"watch-items" + this doc's §"Why partial Gate 2") |
| 3 — EAS build | pending — runs from this branch |
| 4 — Hat-4 | pending Adi (`HAT4_CHECKLIST.md`) |

### Schema changes applied (confirm before build via Supabase MCP)
- `docs/sessions/child-suggest/migration.sql` (C) — pending-suggestions store + RLS.
- `docs/sessions/money-conversion-reward/migration.sql` (D) — money-conversion infra.

### Why partial Gate 2 (transparency)
Per the buff-release skill's "Gate 2 — Functional gate", the canonical bar is per-feature Hat-3 via the buff-testing skill. For this release the decision was: **static Gate 1 all-green + integration boot smoke on the release branch + reliance on each PR's pre-merge CI** in lieu of running 5+ separate emulator scenarios that would each require the RevenueCat dev-LogBox-storm suppression workaround documented in `AC_MATRIX.md`. Net: lower per-feature emulator coverage, mitigated by (1) every PR passing its own CI + Values Check at merge time, (2) EAS build doing a clean install + bundle (catches build-time issues), and (3) Adi's Hat-4 on the actual AAB. If a stricter Gate 2 is wanted before submit, run the full smoke from `MANIFEST.md` after EAS build.

### Notable risks (carry into Hat-4)
1. **F (per-child-language) RTL restart on a real child's own device** — emulator can't fully test the `I18nManager.forceRTL` + `Updates.reloadAsync()` path. Adi must verify on a real child's-own device (ChildJoin session).
2. **Latin-named Hebrew-speaking kids** under F's name-script default — Itay/Emi/Leia would default to English; verify backfill works as expected (per `pro_settings.language` resolver).
3. **C's new schema + RLS** — migration confirm-applied before build.
4. **D's money motivator + parent ratio** — Pillar 1 (extrinsic). Verify the parent-control affordance.
5. **Itay's legacy duplicate task/reward rows** (pre-B fix) — code-level idempotency now resolved, but Itay's existing duplicates are still in the DB. Data-cleanup pending (see IN-2026-05-29-08 resolved note).

## B. User-facing (Hebrew DRAFT — Adi approves before ship)

> ⚠️ DRAFT — pending Adi sign-off per CLAUDE.md "Make decisions about user-facing copy without checking BUFF_VALUES.md and surfacing to Adi" rule.
> Note: BUFF has no in-app "What's New" surface yet (FLAG `F-2026-05-30-01`). Until that ships, this block is staged for later.

**מה חדש בגרסה הזו** *(WHY/WHAT, not HOW — per copy-rule memory)*:

- **כל ילד והשפה שלו** — אפשר להגדיר עברית או אנגלית פר ילד, וכל מה שהוא רואה (משימות, ממשק) יהיה בשפה שלו.
- **המשימות יודעות מתי לקרות** — משימות-בוקר באמת בבוקר, משימות-ערב באמת בערב. גם המשימות שמופיעות מותאמות יותר לגיל.
- **קול לילד** — הילד יכול להציע משימה או פרס להורה, וההורה מאשר.
- **תיק לפי המערכת** — לכל ילד מגיל 6, אפשרות שגרת-ערב להכנת תיק לפי מערכת השעות.
- **אופציה של כסף-אמיתי כפרס** — הורים יכולים להגדיר יחס המרה משלהם (BUFFs ↔ ש"ח).
- **תיקוני יציבות**: הוספת משימות מילד ריק לא יוצרת כפילות; חזרה למסך הנכון אחרי הוספה.

*(Pillars: 1 — outcomes & autonomy; 2 — no shame in decline copy; 3 — child voice + parent control.)*
