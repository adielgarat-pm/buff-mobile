# teen-ui-with-buddy-character — Status

> Updated by CC at each phase exit. Do not edit manually except to fix drift.

## Phases

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 0 — Session folder | _passed_ | 2026-05-16 | `48e54c8` | n/a (docs only) | — |
| 1 — Buddy assets (Wolf + Fox + Capybara) | _in_progress_ — silhouettes complete; PNG delivery deferred | 2026-05-16 | `6890177` (registry + Wolf+Capybara silhouettes), follow-up (FoxSilhouette + per-buddy color identity) | typecheck ✅ | IN-2026-05-16-01 |
| 2 — No-buddy path (5B full + Settings + naming modal) | _passed_ | 2026-05-20 | `ed42125` (2a) + `dd2df88` (2b) + `ce815e5` (2b tests) + `90bc83c` (2c-a i18n) + `2271a79` (2c-b 5B full) + `f2524d3` (2d Settings) | jest 70/70 ✅, typecheck ✅, i18n parity 1496=1496 ✅ | IN-2026-05-20-01 |
| 3 — With-buddy path (dashboard + 5A) | _passed_ | 2026-05-20 | `0151f8a` (3-A BuddyHero + helpers) + `ff8d6ac` (3-B 5A screen + nav) + (3-C dashboard wiring — this commit) | jest 86/86 ✅, typecheck ✅, i18n parity 1502=1502 ✅ | Story stubs (3d) pending Adi redline |
| 4 — Regression + closeout | _pending_ | — | — | — | — |

## Legend

- `_pending_` — not started
- `_in_progress_` — plan approved, mid-execution
- `_passed_` — phase done, tests passed
- `_failed_` — tests failed, rework before continuing
- `_blocked_` — waiting on external input (Adi review, asset delivery, etc.)

## Open carryover from upstream

- **`pkg/teen-ui-my-stats-full` branch supersedes** — that branch's last commit was `9b1580f plan(teen-ui-my-stats-full): SPEC only — extends 5B lite to full + Hide Buddy toggle`. No implementation ever shipped. This package absorbs the work; the my-stats-full branch will be closed without a PR after this package merges (Phase 4 exit deliverable).
- **Wolf STORMY + Fox ECHO + Capybara LUNA asset path** — 3 buddies, llama dropped from lineup 2026-05-16. Silhouettes in place per buddy with their unique color identity (wolf=lime, fox=lavender, capybara=amber). **2026-05-21:** Wolf STORMY L1/L2/L5 PNGs landed; `BUDDY_ASSETS_READY` flipped to `true`; `getBuddyAssetForLevelWithFallback` resolves wolf L3/L4 to the nearest available level (no silhouette gap mid-progression). Still outstanding: wolf L3/L4 native PNGs, all 5 capybara LUNA PNGs (silhouette fallback intact). Asset delivery continues async — when remaining PNGs land, replace matching `null` slots in `src/components/buddy/buddyAssets.ts`.
- **Naming feature added to Phase 2 scope** — `BuddyNameModal` lets the child rename their buddy at first launch and from Settings. Pillar 3 win (child voice from day 0). Schema already supports it (`buddy_relationships.buddy_name`).
- **Egg-drop queued** — `pkg/drop-egg-evolution-stage` follows this package, per D-2026-05-16-?? (Adi to formalize in DECISIONS_LOG). See IN-2026-05-16-01.

## Phase 2 closeout — what shipped (2026-05-20)

**No-buddy variant of Teen UI is now complete end-to-end.** The full 5B MY STATS reads V0.5 data; Settings can hide/show and rename the buddy.

- **2c-a (commit `90bc83c`):** 18 i18n keys × 2 langs — friendship-level gender-aware labels (`buddy.friendshipLevel.L{1..5}.{boy,girl,other}`) per SPEC Decision 9, plus `gamerMyStats.statDaysTogether`, `.statTasksCompleted`, `.progressToNextLevel`.
- **2c-b (commit `2271a79`):** Full Stitch 5B rewrite of `GamerMyStatsScreen` — `LevelPill` + 3-stat grid (Days Together / Successful Days / Tasks Completed) + progress-to-next-level bar (hidden at L5) + `BoostersCarousel`. New hook `useChildBuddyGifts` for the carousel feed. Pause Mode short-circuit preserved. Fresh-child fallback: null relationship renders L1 + zeros without crash.
- **2d (commit `f2524d3`):** Two new Settings entries — "Buddy on dashboard" opens `BuddyToggleModal`, "Rename Buddy" opens `BuddyNameModal`. Wired `useBuddyRelationship` mutators into the screen. 4 new i18n keys × 2 langs.

## Phase 3 closeout — what shipped (2026-05-20)

**With-buddy variant of Teen UI is now complete end-to-end.** Wolf STORMY (silhouette) sits on the dashboard top region; tapping the avatar pushes the new 5A "Me & Buddy" screen; the × on the avatar opens the same hide-confirmation modal used in Settings.

- **3-A (commit `0151f8a`):** `BuddyHero` shared component (size='dashboard'|'screen', renders PNG-or-silhouette per skin, optional ×, optional press wrapper). `friendshipLevelI18nKey` helper resolving L{1..5}.{boy,girl,other} per SPEC Decision 9 (currently all → 'other' per IN-2026-05-20-01). `buddy.story.L{1..5}` + `meAndBuddy.title` i18n stubs (6 keys × 2 langs).
- **3-B (commit `ff8d6ac`):** `GamerMeAndBuddyScreen` (5A) — hero + name + friendship chip with 5 hearts + LevelPill + Buddy Story + 3-stat grid + progress bar + carousel. Registered as a root-stack route `GamerMeAndBuddy` in both child-flow branches of RootNavigator. 6 test cases.
- **3-C (this commit):** Dashboard wiring — `GamerDashboardScreen` renders `BuddyHero` above the stats row when `buddy_visible !== false`. Tapping the hero pushes `GamerMeAndBuddy`; the × opens `BuddyToggleModal` in 'hide' mode. Hides cleanly when the kid has toggled off; reappears on `Show Buddy` from Settings.

**Out of Phase 3 (will land in Phase 4 or future packages):**
- Phase 3d Buddy Story copy — strings are placeholder stubs that read as serviceable English/Hebrew but Adi to redline before merging the PR. See "Adi-pending content" below.
- First-launch BuddyNameModal auto-trigger (originally listed under Phase 3b) — deferred. The modal already opens manually from Settings; the auto-trigger on first dashboard render adds a coupling risk that's better landed alongside post-onboarding work.

## Adi-pending content review

| Item | Why it needs Adi |
|---|---|
| `buddy.story.L{1..5}` stubs (en.json + he.json) | Voice/tone — must match BUFF kid-microcopy register (body-doubling, no metrics talk). Current drafts: "{{buddyName}} is settling in" / "starting to trust you" / "sticks close by" / "has your back" / "is your wingmate now". HE: "{{buddyName}} מתאקלם / מתחיל לסמוך עליך / תמיד לידך / שומר על הגב שלך / כבר חבר לחיים". |

## Adi-pending docs edits (CC does not touch unilaterally)

| File | Edit | Reference |
|---|---|---|
| `docs/BUFF_GAP_ANALYSIS.md` | Flip "5B MY STATS full" row → ✅ and "Hide Buddy in Settings" row → ✅ | SPEC_SYNC Phase 2 |
| `docs/BUFF_GAP_ANALYSIS.md` | Optionally add + flip "Rename Buddy in Settings" → ✅ | Phase 2 added scope |
| `docs/BUFF_GAP_ANALYSIS.md` | Flip "Dashboard with-Buddy variant" → ✅, "5A Me & Buddy" → ✅, "03 Buddy Toggle Modal" → ✅ | SPEC_SYNC Phase 3 |
| `docs/BUFF_DECISIONS_LOG.md` | New D-2026-05-?? entry: "DRIFT-1 resolution — absorb pkg/teen-ui-my-stats-full into pkg/teen-ui-with-buddy-character (P2)" | SPEC_SYNC Adi-owned row |
| `docs/BUFF_DECISIONS_LOG.md` | New D-2026-05-?? entry: "Buddy rename = optimistic Supabase mutation, day-0 child voice (Pillar 3)" | New, surfaced by Phase 2 |
| `docs/BUFF_DECISIONS_LOG.md` | New D-2026-05-?? entry: "First-launch BuddyNameModal auto-trigger deferred — not in MVP" | New, scope decision in Phase 3 |

## Closeout checklist (to fill at Phase 4 exit)

- [ ] All phases reached `_passed_`
- [ ] INTEGRATION_LEARNINGS.md updated for any surprises
- [ ] Canonical docs synced per SPEC_SYNC.md
- [ ] `pkg/teen-ui-my-stats-full` branch closed + GAP_ANALYSIS notes updated
- [ ] PR opened to main
- [ ] PR merged, branch deletion per Verify-Before-Delete protocol
- [ ] Session marked closed
