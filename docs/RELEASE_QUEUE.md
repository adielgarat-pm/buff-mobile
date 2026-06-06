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

_Last released: **1.2.0 (28)**, internal track. Next train: next versionCode (EAS auto-increments)._

> **Naming convention (D-2026-06-04):** identify releases by the Google Play numbers — `versionName (versionCode)`, e.g. `1.2.0 (28)`. No separate "V<N>" team codename. See `.claude/skills/buff-release/SKILL.md` § "Versioning & naming convention".

| Date merged | PR / Commit | Type | Change (one-liner) | Lane | User-facing? | Flow Suite |
|---|---|---|---|---|---|---|
| 2026-06-06 | `9eff36a` (PR pending) | fix | Cash-reward currency symbol now follows app language: Hebrew → ₪ always (was showing £ in Hebrew UI on phones whose device language is English-UK; reported by Tamar) | Train | yes | Rewards / cash-conversion modal |

### Departure check (update when proposing a cut)
- Days since last release: _N_  (trigger: ~14)
- User-facing fixes queued: _N_  (trigger: ~5, or ≥1 notable feature)
- **Recommendation:** _hold / cut next versionCode_ — _reason_

---

## ✅ Shipped — drained into past releases

Newest first. Each block = one release the queue fed.

### 1.1.1 (25) — internal, ~2026-05-31
_Pre-protocol baseline. Future releases list their drained queue rows here._
- (historical — see `STATUS` / `docs/releases/` once per-release folders exist)

<!--
Template for a new shipped block:

### <versionName> (<versionCode>) — <track>, <date>
Lane mix: <X Train, Y Hotfix> · Manifest: docs/releases/<versionCode>/MANIFEST.md
| PR/Commit | Type | Change | User-facing? | Gate2 verdict |
|---|---|---|---|---|
| #NNN | fix | ... | yes | ✅ F7.H2 |
-->

---

**Maintained by:** CC (rows at merge time) · Adi (cut approval).
**Last updated:** 2026-06-04
