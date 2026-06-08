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

_Last released: **1.2.0 (versionCode 28)**, internal track (cut 2026-06-03)._

> 🚧 **BUILT — v1.3.1 (versionCode 36):** the rows below **through #191** are in EAS build `bfa9e4be` (FINISHED 2026-06-08, AAB ready: `pEHhnvgyQ1nSmm2zmw7cCS.aab`). Gate 1 ✅ · Gate 2 ✅. They move to **Shipped** once Adi promotes 36 to the internal track. (versionCode drift: 33 errored on Gradle + 35 canceled to add #194; 36 is the shipped build.)
>
> ⏭️ **NEXT TRAIN (post-36):** rows tagged `next train` below were NOT in build 36 — they ride the following versionCode.

| Date merged | PR / Commit | Type | Change (one-liner) | Lane | User-facing? | Flow Suite |
|---|---|---|---|---|---|---|
| 2026-06-04 | #157 / `62e31bd` | fix | Parent notification bell now sits clear of the screen title in Hebrew (RTL position) | Train | yes | F18 (i18n + Hebrew RTL) |
| 2026-06-05 | #159 / `878ea96` | feat | Child login resolves by pick-from-list keyed on the immutable profile id — no more duplicate accounts / lost progress on a new device (migration 018: list_family_children + link_child_profile) | Train | yes | F1 (child entry) — Hat-3 verified live 2026-06-05: orphan pick → +1 auth user, 0 dup profiles |
| 2026-06-05 | #161 / `df0719b` | feat | Parent notification bell shows an unread-only "show-new" feed with INFO-recency ordering; no auto-mark-read on open | Train | yes | F8 (parent notification feed) — not yet smoke-tested in a build |
| 2026-06-05 | #165 / `ab6f3f2` | feat | Kids redeem rewards with parent approval; BUFFs deducted atomically on approval (previously a no-op — redemption never deducted) | Train | yes | Rewards/Redemption — Hat-3 verified ⚠️ no F-suite yet |
| 2026-06-06 | PR #170 / `bcdb8cb` | fix | Cash-reward currency symbol now follows app language: Hebrew → ₪ always (was showing £ in Hebrew UI on phones whose device language is English-UK; reported by Tamar) | Train | yes | Rewards / cash-conversion modal |
| 2026-06-06 | PR #173 / `4a1f99e` | fix | Notification bell is now an inline header element with a compact circular "+" action beside it — no longer floats over the Add/Update button on Tasks/Rewards/Timetable; works in EN + Hebrew RTL (Hat-4 pending) | Train | yes | F18 (i18n + Hebrew RTL) + parent Tasks/Rewards/Timetable headers |
| 2026-06-06 | #174 / `5c7ce63` | fix | English parent claiming a child via family code now sees the link-child sheet in English (6 strings were hardcoded Hebrew); AuthContext signup errors routed through i18n. Found during first-English-user regression | Train | yes | F18 (i18n + locale) |
| 2026-06-06 | PR #177 / `pkg/child-vault-write-rls` | fix | Own-device kids' BUFFs now persist: surface (not swallow) credit_vault write errors. **Server-side fix already live** (RLS policy `Children can manage own vault` + Alon backfill) — no build needed for users to recover; this row is the code-side regression guard only. Reported by Tamar (Alon showed 0 BUFFs) | Train | no (guard) | Rewards / BUFFs balance — Hat-3 own-device child completion → reload persists |
| 2026-06-06 | PR #178 / `c662836` | fix | Parent Send-Sticker / Send-Bonus bottom sheet no longer scatters (confirm button flew to top of screen) when the optional note field is focused — `KeyboardAvoidingView behavior` "height"→"padding" so the whole sheet lifts cleanly above the keyboard. Reported by Shani during V26 sticker testing | Train | yes | Parent dashboard sticker/bonus modals — Hat-3 verified on emulator-5554; Hat-4 device check open (bug is device-dependent on `adjustResize`) |
| _pending merge_ | PR #179 | feat | Second parent (partner) joins an existing family via the family code in Settings — full equal co-parent; premium becomes family-wide (migration 020 `switch_user_family`); requested by Tamar | Train | yes | Auth + Settings "Join Family" — Hat-4: real 2nd Google account, two devices |
| _pending merge_ | `fix/duplicate-child-guard` | fix | Adding a child with a name that already exists in the family now shows a friendly "Open [name] / Add another / Cancel" dialog instead of silently creating a duplicate (atomic `create_child_profile` RPC, migration 021). Duplicates also broke child login (pick-from-list by name → empty twin → 0 BUFFs). Also fixes the broken `delete_child_profile` RPC and hides soft-deleted kids from parent lists. Migration 021 + the live "פלד" data fix already applied — client ships with build | Train | yes | F1 (child entry) + ManageChildren / Add-child — Hat-3: add same child twice → dialog; delete child works |
| 2026-06-08 | PR #189 / `pkg/fix-owndevice-child-edit` | fix | Parents can now edit own-device kids (name/avatar/birthday/age/language) — the `profiles` UPDATE RLS required `user_id IS NULL`, so a child who owns a device silently saved nothing (migration 022 drops that condition). EditChild now errors on a 0-row save instead of faking success. Child menu shows the real buddy from `pet_state` instead of a hardcoded 🐉 (skin grid is now theme-filtered). **RLS + per-child-language data fix already live** — no build needed for language to stick; buddy/menu fix ships with the build. Found on Adi's daughter's device | Train | yes | F1 / EditChild + child menu (Settings) — Hat-3 own-device child edit persists; Hat-4 Adi relaunch → English sticks + real buddy shows |
| 2026-06-08 | PR #191 / `fix/preview-name-mint-dashboard` | fix | View-as-Child on the **mint** dashboard showed the literal "Preview"/"תצוגה" instead of the child's name. The Gamer dashboard already used the real `previewChildName`; mint hardcoded `t('previewName')`. Now mirrors Gamer (name plumbed through to the pet card too). Found on Adi's daughter's device | Train | yes | P-08 View-as-Child — mint dashboard header + pet card show the child's name |
| _pending merge_ ⏭️ next train | PR #199 / `pkg/off-routine-day` | feat | **Off-Routine Day** — per-child third day-state (Routine / Off-routine / Pause). Parent toggles a free/disruption day for a child (Off / Today / 3 days) → the child sees a **light age-banded default task set** (anchors + bounded autonomy + AI-curiosity) instead of the weekday plan; app stays **active** (unlike Pause); BUFFs still earned (migration 024). From Tamar + Noa community co-design. **NOT in build 36** — rides the next versionCode | Train | yes | New: Off-routine — toggle for a child → light bank shows (not weekday plan) → complete one → BUFFs credit → toggle off → routine returns → Pause supersedes. **Hat-3 ✅ on emulator 2026-06-08** |

### 📣 Post-ship notifications — tell the user when it lands
- **Tamar** — co-parent join (PR #179): she asked whether her partner can join with his own Google + the family code. **When the build carrying #179 ships to Play, message her** that it's live + the how (partner signs in with Google → Settings → "Join Family" → enter family code). Draft ready (2026-06-06). Until then she can't do it on her installed mobile build.

### Departure check (proposed cut — 2026-06-05)
- Days since last release: **2** (1.2.0(28) cut 2026-06-03) — below the ~14d trigger
- User-facing items queued: **3** — 1 fix (#157) + 2 features (#159 child-login, #161 notif feed)
- **Recommendation:** _content-ready (≥1 notable feature trigger met, ×2), verification-gated._ Cut the next versionCode once Gate-2 functional smoke is green on #157/#159/#161; #159 Hat-4 (real device) remains the only open device check.

---

## ✅ Shipped — drained into past releases

Newest first. Each block = one release the queue fed.

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
**Last updated:** 2026-06-06
