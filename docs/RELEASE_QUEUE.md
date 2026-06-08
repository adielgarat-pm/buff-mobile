# BUFF Release Queue

> **The living accumulation surface between releases.** Every fix/feature merged to `main` gets one row here the moment it lands, classified Train or Hotfix. When the train departs, the `buff-release` skill reads the **Queued** rows to seed the release MANIFEST, then they move to **Shipped**.
>
> Policy lives in `docs/RELEASE_PROTOCOL.md`. This file is the data.

**How to use this file**
- **On merge:** add a row to *Queued* with date, PR/commit, type, one-liner, lane, user-facing? and the Flow Suite scenario it maps to (for Gate 2).
- **On cut:** the skill turns every Queued row into a MANIFEST row; after the build is confirmed, move those rows to *Shipped* with the versionCode.
- **Hotfix:** add the row already marked `Hotfix`, cut immediately, then move to *Shipped (hotfix)*.

**Lane** = `Train` (default, batched) or `Hotfix` (bypass — must meet a trigger in RELEASE_PROTOCOL.md).
**Type** = feat / fix / refactor / chore.
**Flow Suite** = the `MASTER_TEST_PLAYBOOK.md` scenario(s) Gate 2 runs for this change. A `feat`/`fix` with no scenario = coverage gap, flag it.

---

## 🚉 Queued — riding the next train

_Last released: **1.4.0 (versionCode 34)** — promoted to the **Alpha closed-testing** track 2026-06-08. Drained into `docs/releases/34/MANIFEST.md`. Prior internal release: **1.3.1 (versionCode 31)**, 2026-06-06 (`docs/releases/31/`)._

> ✅ **Cut closed — 1.4.0 (versionCode 34), promoted to Alpha 2026-06-08.** The rows that were riding the train shipped (the fixes via 1.3.1(31); the features stacked on top via 1.4.0(34)) and have moved to **Shipped** below. versionCode **32 and 33 were burned** during the 2026-06-08 cut — 32 consumed remotely, 33 a parallel/superseded build that was never promoted; **34 is the successful, promoted build**. **Next train starts clean: the next production build will be versionCode 35** (EAS `appVersionSource: remote` + `autoIncrement: true` tracks the last code server-side); bump `versionName` at cut time (e.g. 1.4.1 / 1.5.0) to avoid a Play collision with the already-uploaded 1.4.0.

> 🚧 **CUT IN PROGRESS — 1.4.1 (versionCode 39):** all rows below are draining into `docs/releases/39/MANIFEST.md`. EAS build `37f1c9ee` building 2026-06-08 from `main @ 90956ed` (Gate 1 ✅). They move to **Shipped** once Adi promotes 39 to Alpha + says "verified, tag it". (Build 38 was cut then **canceled** — superseded by 39, which adds the notifications UI; codes 35/36/37 burned by parallel builds.) ⚠️ Deploy the `push-notification-fanout` Edge Function only when 39 is promoted.

**Riding the next train → versionCode 39:** these merged to `main` *after* the 34 cut point (`4139d2e`, 2026-06-08 10:48) and are therefore **NOT in the live Alpha build 34** — they ship in 39.

| Date merged | PR / Commit | Type | Change (one-liner) | Lane | User-facing? | Flow Suite |
|---|---|---|---|---|---|---|
| 2026-06-08 | #198 / `ba5ca8a` | fix | **Pause Mode ends at local midnight (calendar day)** instead of rolling N×24h from tap time. The exact bug רחל + Adi hit live on war-day 2026-06-08 (only their 2 DB rows were hand-fixed; everyone else on build 34 still has the +24h behavior). Code-only, merge-verified, Hat-3 logic verified; Hat-4 device pending | Train | yes | Parent Settings → Pause |
| 2026-06-08 | #199 / `d449997` | feat | **Off-Routine Day** ("hard-day mode") — per-child third day-state; swaps the weekday plan for a light age-banded anchor bank, app stays active, still earns BUFFs. Pause supersedes off-routine. Hat-3 robustness done; Hat-4 pending | Train | yes | EditChild → Off-Routine card |
| 2026-06-08 | #201 / `efd5569` | fix | Off-Routine "3 days" ends at local end-of-day (today+2), consistent with the Pause calendar-day fix | Train | yes | EditChild → Off-Routine "3 days" |
| 2026-06-08 | #194 / `35d4c9d` | fix | Remove the Dev-Simulate-Subscribed toggle from parent settings (was a dev-only control visible in prod) | Train | yes | Parent Settings |
| 2026-06-08 | `pkg/notifications-client` | feat | **Notifications UI (Phase 4) + Edge enforcement (3b)** — the permission model that finally makes the live server nudges reach testers (was: 0 device tokens registered). Two-toggle Settings screen ("Alerts to me" / "Reminders for my child"), denial-recovery banner (deep-link to system settings — fixes "denied → dark forever"), Edge Function suppresses per family pref (`pref_off`). ⚠️ **Deploy the Edge Function only when this build is promoted** (kid reminders default off). | Train | yes | Parent Settings → Notifications; NotificationGate denial banner |

**Note on the version numbers:** EAS auto-incremented past 35/36/37 (parallel builds); build **38** (1.4.1) was cut then canceled; the live build **39** (1.4.1) carries all rows above. The versionCode is just a monotonic counter — content is what matters.

### 📣 Post-ship notifications — tell the user when it lands
- **Tamar** — co-parent join (PR #179): she asked whether her partner can join with his own Google + the family code. **When the build carrying #179 ships to Play, message her** that it's live + the how (partner signs in with Google → Settings → "Join Family" → enter family code). Draft ready (2026-06-06). Until then she can't do it on her installed mobile build.

### Departure check (proposed cut — 2026-06-05)
- Days since last release: **2** (1.2.0(28) cut 2026-06-03) — below the ~14d trigger
- User-facing items queued: **3** — 1 fix (#157) + 2 features (#159 child-login, #161 notif feed)
- **Recommendation:** _content-ready (≥1 notable feature trigger met, ×2), verification-gated._ Cut the next versionCode once Gate-2 functional smoke is green on #157/#159/#161; #159 Hat-4 (real device) remains the only open device check.

---

## ✅ Shipped — drained into past releases

Newest first. Each block = one release the queue fed.

### 1.4.0 (versionCode 34) — Alpha closed-testing, promoted 2026-06-08
Lane mix: all Train · Manifests: `docs/releases/34/MANIFEST.md` (features cut from `main`) + `docs/releases/31/MANIFEST.md` (the 1.3.1 fixes train, released internal 2026-06-06).
Build: EAS `a266ea2f` (1.4.0, versionCode 34). versionCode 32 + 33 burned/superseded en route. The 11 PRs in the 34 manifest stacked on the 1.3.1(31) content; the fix rows below shipped first via 31, the rest landed in 34.

| PR / Commit | Type | Change | User-facing? |
|---|---|---|---|
| #157 / `62e31bd` | fix | Parent notification bell clears the screen title in Hebrew RTL | yes |
| #159 / `878ea96` | feat | Child login by pick-from-list keyed on immutable profile id (no dup accounts) | yes |
| #161 / `df0719b` | feat | Parent notification bell unread-only "show-new" feed | yes |
| #165 / `ab6f3f2` | feat | Kids redeem rewards with parent approval; atomic BUFF deduct | yes |
| #170 / `bcdb8cb` | fix | Cash-reward currency symbol follows app language (Hebrew → ₪) | yes |
| #173 / `4a1f99e` | fix | Notification bell inline header element + compact "+" action | yes |
| #174 / `5c7ce63` | fix | English parent link-child sheet in English (6 hardcoded HE strings) | yes |
| #177 / `pkg/child-vault-write-rls` | fix | Own-device kids' BUFFs persist (surface credit_vault write errors) | no (guard) |
| #178 / `c662836` | fix | Sticker/Bonus bottom sheet lifts cleanly above keyboard | yes |
| #179 | feat | Second parent joins existing family via family code; family-wide premium | yes |
| `fix/duplicate-child-guard` | fix | Atomic create_child_profile + friendly duplicate dialog; delete RPC fix | yes |
| #189 / `530bc39` | fix | Parents can edit own-device kids (migration 022); real buddy in menu | yes |
| #191 / `e2e8590` | fix | Show child's real name (not "Preview") in View-as-Child on mint dashboard | yes |
| #192 / `85f6ca6` | feat | Capture `families.platform` at signup (funnel segmentation) | no (instrumentation) |
| #190 / `6163e6b` | feat | iOS Phase-1: hide paywall + skip RevenueCat init; enable iOS EAS builds | yes (iOS) |
| #186/#184 / `e6bb935` | feat | Admin Tester Board (internal tool) | no (admin) |
| #188 / `f991c11` | feat | Admin: parent email as mailto link | no (admin) |
| #185 / `356791a` | fix | credit-vault atomic balance adjustment (kill read-modify-write race) | yes |
| #182 / `a311b72` | fix | Child HQ screens day-filter like the Quests tab | yes |
| #187 / `864f771` | fix | Admin funnel per-stage label "at this stage" | no (admin) |
| #183 / `46938db` | chore | buff-emulator skill — shared emulator/Metro lease lock (devex) | no |

### V25 — versionName 1.1.1 (internal, ~2026-05-31)
_Pre-protocol baseline. Future releases list their drained queue rows here._
- (historical — see `STATUS` / `docs/releases/` once per-release folders exist)

<!--
Template for a new shipped block:

### V<N> — versionName <x.y.z> (<track>, <date>)
Lane mix: <X Train, Y Hotfix> · Manifest: docs/releases/v<N>/MANIFEST.md
| PR/Commit | Type | Change | User-facing? | Gate2 verdict |
|---|---|---|---|---|
| #NNN | fix | ... | yes | ✅ F7.H2 |
-->

---

**Maintained by:** CC (rows at merge time) · Adi (cut approval).
**Last updated:** 2026-06-08
