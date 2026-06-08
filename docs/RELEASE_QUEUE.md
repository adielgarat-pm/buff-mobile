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

_Last released: **1.2.0 (versionCode 28)**, internal track (cut 2026-06-03). Next train: **next versionCode (TBD)**._

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
| 2026-06-08 | `fix/pause-calendar-day` | fix | Pause Mode now ends on a calendar boundary (local midnight), not a rolling N×24h from tap time: "Just today" → end of today, "3 days"/"1 week" → N full calendar days. Was: pausing at 10:49 set resume to tomorrow 10:49. Surfaced live during the 2026-06-08 escalation send | Train | yes | Parent Settings → Pause; child empty-state "back on <date>" |

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
