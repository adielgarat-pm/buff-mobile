# Release MANIFEST — 1.7.9 (versionCode 65)

> Prepared 2026-07-07. Content merged to `main` via **PR #325** (`95da550`) + **PR #326** (`1e20c52`).
> Cut/build: EAS production app-bundle, autoIncrement → vc65. Prior release: 1.7.8 (vc64, `b0e8cdb`).
> Theme: **unify the child's "what to pack" experience** — from Noa's 1.7.8 report — plus schedule-import equipment extraction.

## Content

| PR / Commit | Type | Change | User-facing? | Gate 2 evidence |
|---|---|---|---|---|
| #325 `188cc8e` | feat | **Child-added packing posts directly** (D3-A) — no parent-approval gate; a child adds their own gear/one-off and it appears immediately; parent still sees it. Fixes Noa's "can't find where to approve". | yes | tsc 0 · jest 15/15 |
| #325 `49713d6` | feat | **Camp/school gear from the timetable now shows on the child HQ card** (D1 bridge) — "נארוז יחד?" reads timetable equipment + activities together; schedule gear is no longer invisible on the home screen. | yes | tsc 0 · jest 34/34 (6 new) |
| #325 `158dff7` | feat | **Today + Tomorrow in one packing card** (D2) — "היום"/"מחר" sections, per-day check-off. | yes | tsc 0 · jest 34/34 |
| #325 `a4afff7` | fix | **View-as-Child banner names the child** ("👁 {name}'s screen — tap to exit"). | yes | tsc 0 · i18n 4/4 |
| #326 | feat | **Imported schedules pull their equipment** — `parse-schedule` now extracts per-lesson gear + a daily "bring every day" note; the client renders a **"ציוד יומי"** row per day (`applyDailyEquipment`), feeding the same packing card. | yes | tsc 0 · jest 89/89; backend verified live (below) |
| #325/#326 | docs | Session diagnosis, STATUS, INTEGRATION_LEARNINGS (IN-2026-07-07-01), release docs. | no | — |

## Gates
- **Gate 1:** tsc 0 (repo-wide) · **jest 583 passed / 1 skipped (59 suites)** · i18n parity ✅ · Values 9/9.
- **Gate 2:** Web bundle compiles clean (`Web Bundled index.ts, 1749 modules`); interactive drive → Hat-4.
- **Backend (already LIVE, 2026-07-07):** migration `041_edge_function_config` applied to `buff-production`; `parse-schedule` deployed **v9** (verify_jwt on; v8 captured for rollback). Verified live via `pg_net`: camp → per-lesson `equipment` + `daily_equipment`; school → rich parsing intact (no regression). Prompt tuning thereafter = `UPDATE edge_function_config` (no redeploy). **Backend-first is safe: the old client ignores the extra field; vc65's client renders it.**

## Hat-4 (Adi, real device, after install)
1. Parent enters camp/lesson gear in the timetable → child **HQ "נארוז יחד?"** shows it under **היום/מחר** (not only the Gear tab).
2. Child taps **"+ הוסף לעצמי"** → appears **immediately** (no approval), young child + teen; parent sees it in Activities.
3. Per-day check-off persists + resets by day; no counter.
4. View-as-Child banner reads **"{child}'s screen — tap to exit"**; EN + Hebrew RTL correct.
5. **Import** a real schedule with a "bring every day" note (paste or photo) → review screen shows a **"ציוד יומי"** row per day → save → it appears on the HQ card.

## Rollout
- [x] Merge to `main` (#325, #326).
- [x] Backend live (migration 041 + parse-schedule v9, verified).
- [ ] EAS production build (autoIncrement → vc65) → Adi uploads AAB to Play Console.
- [ ] Send Noa the message in `NOA_MESSAGE.md` once the build reaches her.
- [ ] After promote + "verified, tag it": move #325/#326 rows to **Shipped (65)** in RELEASE_QUEUE.md.
