# ROADMAP — pkg/beta-launch-readiness-2026-06-01

Four phases. Each phase has a stop-condition; nothing in the next phase starts until the prior phase passes.

## Phase 0 — Green-state verification

- Confirm clean worktree on `pkg/beta-launch-readiness-2026-06-01`
- `npm run typecheck` → 0 errors
- `npm test` → all green
- `npx expo-doctor` → 18/18 pass
- **R5 — egg investigation** (new finding during this phase):
  - Search BUDDY-related docs for the "ditch the egg" decision
  - Confirm IN-2026-05-16-01 documented + `pkg/drop-egg-evolution-stage` never ran
  - Apply (b) workaround: 4 lines in `src/types/pet.ts` + `src/components/EmojiPet.tsx`
  - Re-run typecheck + jest; commit
- **Stop:** all green + egg workaround committed.

## Phase 1 — APK build

- Push branch to origin
- `npx eas-cli build --profile preview --platform android --non-interactive` (background)
- Build runs in EAS Cloud (~30-45 min wall-clock)
- On completion: extract artifact URL + commit hash + versionCode
- Download APK to `.claude/tmp/` (gitignored)
- Compute sha256 via PowerShell `Get-FileHash`
- **Stop:** APK downloaded + sha256 captured + APK_DISTRIBUTION.md drafted

## Phase 2 — Backend MCP verification

- `list_migrations` → 015 present
- Trigger registered (`tg_profiles_after_insert_grants` enabled)
- 3 SECURITY DEFINER functions exist
- 16 seed emails (`source='mailing_list_49'`)
- Idempotency probe → non-existent email returns 0 rows
- Backfill spot-check → no false matches
- Advisors → no NEW warnings from migration 015 (pre-existing ones noted)
- **Stop:** all checks pass; anomalies surfaced as flags (not gates)

## Phase 3 — Author SMOKE_TEST_CHECKLIST.md

- Section A — Install + onboarding (incl. cohort auto-grant test)
- Section B — ChildJoin regression (#88 + claim orphans + preflight)
- Section C — Recent UI/UX (#41/#72/#75/#88/#89/#90/#91/#92/#93 + egg-workaround C7)
- Section D — Core flows no-regression (Vibe / Anchor / BUDDY / Timetable / Sentry crash)
- Pillar gates (P1 no-egg / P2 no-paywall / P3 session-persists)
- Known limitations (BUG-2026-05-20-02, F-2026-05-16-01, advisor WARNs, disabled trigger)
- **Stop:** file committed

## Phase 4 — Deliverables + PR

- README + SPEC + ROADMAP + STATUS + TESTS + SPEC_SYNC committed
- APK_DISTRIBUTION.md filled with link + sha256 + Hebrew share message
- INTEGRATION_LEARNINGS.md note added if anything surprised us (egg drift, divergence v16 AAB / preview APK)
- `gh pr create` against main
- **Stop:** PR open and linked in STATUS.md
