# Release v1.3.0 (versionCode 29) — Manifest

**Cut date:** 2026-06-05
**Anchor:** 1.2.0 (28), internal track, cut 2026-06-03 (untagged; baseline ≈ #156 `c7a138f` versionName bump)
**Branch:** release/train-2026-06-05 (off `main` @ `23103c5`)
**Track:** internal
**versionName:** `1.3.0` (minor — 2 new features) · set in app.json @ `8309250`
**versionCode:** **29** (EAS auto-incremented 28→29 at build time)
**EAS build:** https://expo.dev/accounts/iamadi79/projects/buff-mobile/builds/4630e765-4849-4ba8-b786-f83fc1e590b4 (queued 2026-06-05)

> Source of truth: `docs/RELEASE_QUEUE.md` Queued rows (drained into this manifest at cut).

## What's in this release

| # | PR / Commit | Type | Feature / Bug | Flow Suite | Targeted test (happy + edge) | Verification status |
|---|---|---|---|---|---|---|
| 1 | #157 / `62e31bd` | fix | Parent notification bell sits clear of the screen title in Hebrew (RTL position) | F18 (i18n / RTL) | F18 happy + RTL render of parent dashboard | ✅ verified (merged 2026-06-04) |
| 2 | #159 / `878ea96` | feat | Child login resolves by pick-from-list keyed on the immutable profile id — no duplicate accounts / lost progress on a new device | F1 (child entry) | F1.H1 + edge: orphan-profile pick | ✅ Hat-3 verified live 2026-06-05 (orphan pick → +1 auth user, 0 dup profiles); ⏳ Hat-4 (real device) pending |
| 3 | #161 / `df0719b` | feat | Parent notification bell shows an unread-only "show-new" feed, INFO-recency ordering, no auto-mark-read on open | F8 (parent notification feed) | F8.H1 + edge: open feed does NOT mark read | ⚠️ NOT yet smoke-tested in a build — primary Gate-2 target |

## Schema changes in this release?
- [x] **migration 018** — `list_family_children` + `link_child_profile` RPCs (from #159). Applied to mobile project `gfrongfnyigxsexuofrg` (Hat-3 live run on 2026-06-05 exercised them → confirmed present). No prod users on mobile DB (per env-separation note F-2026-05-20-01).
- [ ] none

## Notable risk / watch-items
- **#161 is the unverified item** — merged 2026-06-05, never built. Gate 2 must smoke the parent notification feed: (a) unread items appear, (b) opening the feed does NOT auto-mark-read (the explicit design choice).
- **#159 Hat-4 open** — pick-from-list child entry verified on emulator only; real-device child-entry remains on the Hat-4 checklist.
- **15 parallel CC sessions + single shared emulator (emulator-5554)** at cut time — Gate 2 must confirm exclusive device use before driving adb, or defer Hat-3 to a quiet window.

## Static gate (Gate 1) — results 2026-06-05

| Check | Result |
|---|---|
| tsc --noEmit | ✅ 0 errors |
| jest | ✅ 314/314 (26 suites) — note: 1st cold-worktree run flaked 3 suites on 5000ms timeouts; clean on retry |
| expo-doctor | ✅ 18/18 |
| i18n parity (en↔he) | ✅ 0 missing either side |
| Values Check | ✅ (below) |

### Values Check (against implemented behavior)
- **#159 (child-login pick-from-list):** P1 ✅ no virtual-reward introduced / protects child's real earned progress · P2 ✅ neutral child entry, no failure-framing · P3 ✅ stable identity, no dependency mechanic. → PASS
- **#161 (parent notif show-new feed):** parent-facing tooling. P1 ✅ no child reward loop · P2 ✅ no shaming/comparison/sad-buddy surface · P3 ✅ no dependency mechanic. → PASS

## Gate 2 (functional) — status
- #157 (RTL fix): ✅ already verified at merge.
- #159 (child-login): ✅ Hat-3 verified live 2026-06-05 (in queue).
- #161 (notif feed): ⚠️ **OUTSTANDING** — needs a targeted Hat-3 smoke (feed shows unread; open does NOT auto-mark-read).
- **Not auto-run:** 15 parallel CC sessions share the single emulator-5554; a full Hat-3 suite risks corrupting a concurrent session's run. Run the #161-targeted smoke under exclusive device use before the build.
