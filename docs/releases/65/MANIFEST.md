# Release MANIFEST — 1.7.9 (versionCode 65)

> Prepared 2026-07-07 from branch `claude/noaa-behavior-spec-rlymvx`.
> Cut/build after merge to `main` (EAS production app-bundle, autoIncrement → vc65).
> Prior release: 1.7.8 (vc64, `b0e8cdb`).
> Theme: **unify the child's "what to pack" experience** — from Noa's 1.7.8 report.

## Content (branch `noaa-behavior-spec`, to merge onto vc64's base)

| Commit | Type | Change | User-facing? | Gate 2 evidence |
|---|---|---|---|---|
| `188cc8e` | feat | **Child-added packing posts directly** (D3-A) — no parent-approval gate; a child can add their own gear/one-off and it appears immediately; parent still sees it. Fixes Noa's "can't find where to approve". | yes | tsc 0 · jest 15/15 |
| `49713d6` | feat | **Camp/school gear from the timetable now shows on the child HQ card** (D1 bridge) — the "נארוז יחד?" card reads timetable equipment + activities together; gear entered in the schedule is no longer invisible on the home screen. | yes | tsc 0 · jest 34/34 (6 new bridge tests) |
| `158dff7` | feat | **Today + Tomorrow in one packing card** (D2) — the card shows "היום" and "מחר" sections, per-day check-off. | yes | tsc 0 · jest 34/34 |
| `a4afff7` | fix | **View-as-Child banner names the child** ("👁 {name}'s screen — tap to exit") — clarifies that the streak/badge is the child's view. | yes | tsc 0 · i18n parity 4/4 |
| `abdb901` | docs | Session diagnosis + STATUS + INTEGRATION_LEARNINGS (IN-2026-07-07-01). | no | — |

## Gates
- **Gate 1:** tsc 0 (repo-wide) · **jest 578 passed / 1 skipped (59 suites)** · i18n parity ✅ · Values re-checked 9/9.
- **Gate 2:** Web bundle compiles clean (`Web Bundled index.ts, 1749 modules`); interactive web/emulator drive not available in the cloud box → **Hat-4 (real device)** below.
- **Schema:** none in this build. (The `edge_function_config` migration + `parse-schedule` changes on this branch belong to the separate `import-extract-equipment` package — **not applied, not deployed, not in the app bundle**, so out of scope for vc65.)

## Hat-4 (Adi, real device, after install)
1. Parent enters camp/lesson gear in the timetable → child **HQ "נארוז יחד?"** card shows it under **היום/מחר** (not only the Gear tab).
2. Child taps **"+ הוסף לעצמי"** → item appears **immediately** (no "sent for approval"), on both a young child and a teen profile; parent sees it in Activities.
3. Per-day check-off persists and resets by day; no progress counter.
4. View-as-Child banner reads **"{child}'s screen — tap to exit"**; EN + Hebrew RTL both correct.

## Rollout
- [ ] Merge `noaa-behavior-spec` → `main`.
- [ ] EAS production build (autoIncrement → vc65) → Adi uploads AAB to Play Console.
- [ ] After promote + "verified, tag it": move these rows to **Shipped (65)** in RELEASE_QUEUE.md.
