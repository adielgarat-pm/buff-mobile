# Release MANIFEST — 1.8.2 (versionCode 68)

> Prepared 2026-07-12. Content = everything merged to `main` after vc67's base (`dbb5492`, 1.8.1): the 2026-07-12 UX-fix train (#353–#359, #361, #362) + **OTA activation (#350)** + **Play in-app-update prompt (#352)**.
> Cut/build: EAS production app-bundle via the `EAS Build (Android)` GitHub workflow (autoIncrement → vc68). Prior release: 1.8.1 (vc67, base `dbb5492`, published to Play 2026-07-12).
> Theme: **finish the UX-audit sweep (batch 2) + turn on the update pipeline** — this is the FIRST OTA-capable binary; from this binary onward JS-only fixes ship over-the-air without Play review, and users on stale binaries get a Play flexible-update nudge.
> QA: Gate 1 on the merged tree (see Gates). Per-row Jest coverage listed below; no full device sweep was run for this train — Hat-4 items called out at the end.

## ⚠️ Build-time notes (the two risks)

1. **Fingerprint runtime (#350):** `runtimeVersion: fingerprint` is active — confirm the fingerprint resolves and the build completes clean. After this binary is live: `npm run ota:preview` → verify → `npm run ota:prod` (playbook: `docs/OTA_PLAYBOOK.md`).
2. **New native module (#352):** `expo-in-app-updates@^0.12.0` (Adi-approved) — autolinked, Android-only behavior, lazy-required to avoid the launch-crash blind spot (IN-2026-06-17 class). This dep changes the fingerprint — expected.

## Content

| PR / Commit | Type | Change | User-facing? | Gate 2 evidence |
|---|---|---|---|---|
| #350 `6244b43` | feat | **OTA activated (EAS Update)** — `checkAutomatically:ON_LOAD` + fingerprint runtime. Config-only; makes THIS the first OTA-capable binary. | no (infra) | TESTS: `docs/sessions/eas-update-ota/TESTS.md`; Hat-3.3 post-ship |
| #352 `18d34a2` | feat | **Play flexible in-app-update prompt on launch** when a newer binary exists on the track (closes tester-Noa's "never learns an update exists" gap). Dismissible, Android-only, web no-op. | yes | Jest (module lazy-require + prompt gating); Hat-4 real-device |
| #353 `7d5f600` | fix | **Un-complete guard (Safe Harbour)** — 2s post-completion tap lock + friendly confirm before un-completing debits Buffs (Pastel cards). | yes | 11 Jest tests (fake timers, confirm paths) |
| #354 `ebb27dc` | fix | **Auth errors + ergonomics** — network failures no longer read "Invalid email or password"; reset-failure feedback; keyboard chaining + show/hide password (Login+Signup). | yes | 13 Jest tests (error mapping table) |
| #355 `edfad89` | feat | **Always-close-to-a-win in child rewards** — per-card progress + inline "עוד X!" (no blocking alert), Buffs price always shown to child (₪ tag parent-only), ≥44pt targets, unlocked-first (both skins). | yes | 2 Jest suites (progress/no-alert/cash-tag) |
| #356 `de4bfaf` | fix | **i18n sweep** — parent hardcoded strings → t() (subscription status, Insights ternaries, Buffs labels), PhaseView empty state in buddy voice, `category.other` added, dead `ignition.*` removed (18 keys). | yes | key-check ✅ + PhaseView Jest suite |
| #357 `1384d37` | fix | **Parent dashboard ergonomics** — dirty-guard on bonus/sticker/task-sheet backdrops, pull-to-refresh (4 refetches), time-aware greeting. | yes | 3 Jest suites (guard, greeting buckets) |
| #358 `4c4cb07` | fix | **Pet card honors the child's buddy rename** (was hardcoded 'Buddy'); refetch-on-focus so a rename shows on return to HQ. | yes | PetDisplay Jest suite |
| #359 `45453f8` | fix | **Gamer polish** — unparseable-time tasks visible under every filter, HQ completion pop + haptics (setting wired), gear→Settings / dead bell removed, chip a11y, credits label i18n. | yes | Extended Gamer Jest suites |
| #361 `0045ab1` | feat | **Parent dashboard success = count goal (D-2026-06-14)** — `done/goal ⚡` badge replaces `%`, neutral below goal / green at goal (amber gone), "~{{goal}} tasks = a successful day". | yes | 7 Jest tests (ChildDayBadge) |
| #362 `93b859a` | chore | Buddy default-name key unified (`pet.defaultName`); release-queue rows. | no | key-check ✅ |

**Docs-only (no build impact):** #348 guide→task-seeding proposal, #349 acquisition-tracking proposal, #351 queue row, #360 **BUFF_VALUES count-rule spec sync (Adi-approved)**.
**Landing-only (ships via Vercel, NOT this build):** #347 back-to-school guide + ASO title record.

## Gates
- **Gate 1 (on the merged tree `93b859a`, 2026-07-12):** tsc 0 · **jest 732/732, 82/82 suites, 0 skipped** · i18n key-check ✅.
- **Gate 2:** per-row Jest evidence above; batch-1 device sweep (2026-07-08) covers the surfaces these rows extend. No fresh full device sweep for this train — compensated by Hat-4 below.
- Schema changes: none. New dependencies: `expo-in-app-updates` (#352, Adi-approved). Edge functions: none.

## Hat-4 (Adi, real device, after install)
1. **OTA round-trip (the point of this release):** after vc68 is live, run `npm run ota:preview` on a JS-only change → verify it applies on 2nd cold start → `npm run ota:prod` (Hat 3.3 in `docs/sessions/eas-update-ota/TESTS.md`).
2. **In-app-update prompt (#352):** once vc69+ exists on the track, an installed vc68 should show the Play flexible-update sheet on launch; dismiss must work.
3. Quick spot-check of the batch-2 loop: complete→double-tap (guard), rewards "עוד X", parent dashboard `2/3 ⚡` badge.
