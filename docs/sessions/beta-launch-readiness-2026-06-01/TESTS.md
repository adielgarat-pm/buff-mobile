# TESTS — pkg/beta-launch-readiness-2026-06-01

## Per-phase gates

### Phase 0 — Green state
- [x] `git status` on worktree → clean
- [x] `npm run typecheck` → 0 errors
- [x] `npm test -- --watchAll=false` → 220/220 pass, 6 snapshots
- [x] `npx expo-doctor` → 18/18 checks pass
- [x] **R5 egg workaround:** `getEvolutionStage(0)` returns `'hatchling'` (not `'egg'`); `DEFAULT_PET_STATE.evolution_stage === 'hatchling'`; `EmojiPet` shows `skin.emoji`, not `🥚`
- [x] Re-run typecheck + jest after workaround → still green
- [x] Values Check passes for egg workaround (see SPEC.md)

### Phase 1 — APK build
- [ ] EAS build started with `--profile preview --platform android`
- [ ] Build completes with status `FINISHED` (not `ERRORED` or `CANCELED`)
- [ ] Artifact URL accessible (`https://expo.dev/artifacts/eas/...apk`)
- [ ] APK downloaded locally to `.claude/tmp/`
- [ ] sha256 computed and recorded
- [ ] APK is the **preview profile** (APK file, not AAB)

### Phase 2 — Backend MCP verification (verify-only)
- [x] Migration `pending_lifetime_grants` (version 20260525042406) present in `supabase_migrations.schema_migrations`
- [x] Trigger `tg_profiles_after_insert_grants` registered on `public.profiles`, enabled (`tgenabled='O'`)
- [x] Functions exist with `prosecdef=true`:
  - `grant_lifetime_if_in_window`
  - `grant_lifetime_if_pending`
  - `tg_profiles_after_insert_grant_lifetime`
- [x] `pending_lifetime_grants` table: 16 rows, source='mailing_list_49'
- [x] RLS enabled on `pending_lifetime_grants` (intentional deny-all; 0 policies)
- [x] Idempotency: `SELECT * FROM pending_lifetime_grants WHERE email='never-existed-test@example.com'` → 0 rows
- [x] Backfill spot-check: 16 emails unclaimed (`auth_email=null` for all) — expected pre-beta
- [x] Advisors: 0 ERROR; 65 pre-existing WARN (unchanged from before migration 015)

### Phase 3 — SMOKE_TEST_CHECKLIST authored
- [x] File exists at `docs/sessions/beta-launch-readiness-2026-06-01/SMOKE_TEST_CHECKLIST.md`
- [x] Section A — Install + onboarding (5 items including A4 cohort auto-grant + A5 Pillar 3 gate)
- [x] Section B — ChildJoin regression (4 items)
- [x] Section C — Recent UI/UX (7 items including C7 egg-workaround)
- [x] Section D — Core flows no-regression (6 items)
- [x] Pillar gates explicit (P1 / P2 / P3)
- [x] Known limitations listed (7 items including BUG-2026-05-20-02 + advisor WARNs)
- [x] Sign-off section with decision slot

### Phase 4 — Deliverables + PR
- [ ] All 8 session-folder files exist and are committed
- [ ] APK_DISTRIBUTION.md filled with link + sha256 + Hebrew share message template
- [ ] INTEGRATION_LEARNINGS.md updated with surprises (egg drift confirmation, v16 AAB divergence)
- [ ] PR opened via `gh pr create` against main
- [ ] PR body includes Adi's run-the-smoke-test handoff

## Adi's emulator/device tests

See [SMOKE_TEST_CHECKLIST.md](SMOKE_TEST_CHECKLIST.md). The pillar gates there are the launch decision.
