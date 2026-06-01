# Release v1.1.0 — V19 follow-up bundle — Manifest

**Cut date:** 2026-05-30
**versionName:** `1.1.0` (bump from `1.0.0` — 6 new features warrant a minor bump)
**versionCode:** auto-incremented by EAS at build time (was 19; expect 20)
**Anchor:** `5128106` `fix(hq-tasks-tappable)` — estimated last commit on `origin/main` before the V19-followup wave began at 2026-05-29 16:36. **Assumption** (no git tag for v19 exists): V19 was promoted 2026-05-29 morning per memory `reference_play_internal_test`. If wrong by a commit or two, the manifest may include rows already shipped — non-blocking. Adi to confirm and tag retroactively.
**Branch:** `release/v19-1.1.0` (renamed from `pkg/money-conversion-reward` after D was found already merged)
**Track:** Google Play internal testing

## What's in this release (`git log 5128106..HEAD --no-merges` — 8 commits)

| # | Commit | Type | Feature / Bug | Flow Suite (working name) | Targeted test (Gate 2) |
|---|---|---|---|---|---|
| 1 | `65f4511` | feat | **school-free-day-parity (Chunk 1)** — Israel weekend logic + per-day task filtering | F-schedule | smoke: tasks render correctly Fri+Sat (no Mon-Thu tasks); regression: Sun-Thu unchanged |
| 2 | `e2e18ed` | feat | **school-free-day-parity (Chunk 2)** — Friday-is-a-school-day toggle in parent settings | F-parent-settings | smoke: toggle on/off, verify Friday tasks appear/hide accordingly |
| 3 | `53ab1cb` | feat | **A — onboarding-starter-tasks** — age-aware starter tasks + `timeOfDay` clock + `detectLangFromName` | F-onboarding | **already Hat-3 verified 2026-05-30** (ZTestDup529 12-14 `time_management`: 3 English tasks at 08:00/16:00/20:00). See `docs/sessions/onboarding-starter-tasks/AC_MATRIX.md`. Re-smoke: one fresh onboarding any-age. |
| 4 | `8dca8cc` | fix | **B — empty-state-duplicate-tasks (IN-08)** — UStep5 idempotency + existing-child `goNext`→ParentTasks | F-onboarding (empty-state re-entry) | re-test the IN-08 bug: parent → Tasks tab → child with 0 tasks → "Set up tasks" → finish → confirm 1 set inserted (not 2) + lands on Tasks tab |
| 5 | `16d3871` | feat | **C — child-suggest** — child proposes tasks/rewards; parent "Yes / Let's talk" | F-child-suggest (new) | child submits a task suggestion; parent sees it on a parent surface; approves → task created; declines / "let's talk" → no shame |
| 6 | `755100b` | feat | **F — per-child-language** — `pro_settings.language` + `resolveChildLang` + EditChild toggle | F-language | child's own device hydrates from per-child language (one-time restart if RTL flip needed); View-as-Child strings-only switch on parent device; EditChild toggle |
| 7 | `e7da908` | feat | **D — money-conversion-reward** — money motivator + parent-confirmed BUFFs→cash for any age | F-rewards | onboarding offers `money` motivator; resulting reward set includes a money-conversion reward; redemption flow |
| 8 | `21952ba` | fix | **E — gamer-parent-polish (IN-07 + IN-09)** — Parent Tasks status glyph (no false checkbox); View-as-Child shows real previewed-child name + smaller greeting font | F-parent-tasks + F-view-as-child | parent Tasks tab — no clickable-looking checkbox circle; View-as-Child — greeting reads real name, not "תצוגה" |

## Schema changes in this release

Per `git ls-tree -r origin/main`:
- ✅ `docs/sessions/child-suggest/migration.sql` (C) — confirm applied to `gfrongfnyigxsexuofrg` (mobile DB, no prod users per memory).
- ✅ `docs/sessions/money-conversion-reward/migration.sql` (D) — confirm applied.

CC should verify via Supabase MCP `list_migrations` before EAS build.

## Notable risk / watch-items

1. **F (per-child-language) touches core contexts** (`LanguageContext`, `ModeContext`). RTL restart on a real child's own device is **Hat-4-only** (emulator unreliable). See `docs/sessions/per-child-language/SPEC.md` §11.
2. **Latin-named Hebrew-speaking kids** (Itay/Emi/Leia) — F's default per-child language is `detectLangFromName`, so existing kids inherit per the backfill rule (resolved via `pro_settings.language`). Verify after upgrade.
3. **C has a new schema + new flow** — confirm migration applied + RLS correct before build.
4. **D adds a money motivator** — Pillar 1 (extrinsic reward) most-sensitive. Adi's Values Check at design said parent-controlled is the safeguard; verify the implemented flow keeps parent in control.
5. **Itay's existing duplicate task/reward rows** (legacy from pre-B): B fixes new-onboarding, but Itay's existing duplicates remain in DB. Data-cleanup task pending (per IN-2026-05-29-08, marked resolved for the code fix).

## Values Check (release-level confirmation)

Each `feat`/`fix` row above had its own Values Check at PR-merge time per the workflow. Release-level summary against the integrated state:

- **Pillar 1 (Intrinsic motivation):** D (money) is the most extrinsic addition; mitigated by parent-set ratio. F (language) is neutral. C (child suggest) is Pillar-3 win. Net: ✅.
- **Pillar 2 (Positive coaching):** C's parent-decline copy was Adi-reviewed pre-merge. E removes a false-affordance — neutral. ✅
- **Pillar 3 (Independence-building):** A's table is age-scoped; C gives child voice; F gives parent per-child control. ✅

If any user-facing copy in the integrated state requires re-review, surface in Gate 2 verdicts.
