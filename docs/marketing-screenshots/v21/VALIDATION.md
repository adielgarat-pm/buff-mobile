# VALIDATION — v21 Play Store screenshots (EN + HE)

| Field | Value |
|---|---|
| **Date** | 2026-05-30 |
| **Validator** | CC (`pkg/play-store-screenshots-validation`) |
| **Target build** | BUFF v1.1.0 (versionCode 21) — Internal Testing |
| **Finals present** | **0 EN + 0 HE** (expected 6–7 each; 12–14 total) |
| **Verdict** | **NO-GO** |

> **Why NO-GO:** the assets this gate validates do not exist yet. `final/EN/` and
> `final/HE/` contain only `.gitkeep`. Per the production session's own
> `STATUS.md` (§State, L13–15): *"Pipeline ready · BLOCKED on raw captures …
> EN/HE finals **not produced** — no raw captures exist yet (`raw/` is empty)."*
> This is an **upstream block** (Adi's phone captures → production render), not a
> validation failure of any specific image. The harness below is pre-wired; it
> flips to a real GO/NO-GO pass the moment finals land.

---

## Dependency chain (where the block is)

```
strategy session  →  SHOT_LIST.md + OVERLAY_COPY.md          ✅ done
        ↓
Adi (Hat-4)       →  capture 6–7 raws on real phone           ❌ NOT done (raw/ empty)
        ↓
production session→  render EN+HE finals into final/EN, final/HE   ⛔ blocked on raws
        ↓
THIS validation   →  per-image gate → GO / NO-GO              ⛔ 0 inputs to check
```

Source of truth for this gate (read 2026-05-30 from the production + strategy worktrees):
- `SHOT_LIST.md` — screen mapping, setup, dev-artifact watchlist (13 KB, 7 shots).
- `OVERLAY_COPY.md` — the approved overlay strings (1 table, 7 rows × EN/HE).

---

## Check that does NOT need finals — overlay-copy banned-word gate → ✅ PASS

The package requires the overlay strings to be outcome-led and free of the banned
words **BUFF / BUFFs / BUDDY / "tasks count" / `%` / mission**. This is checkable
against `OVERLAY_COPY.md` now, with no images. All 14 strings (7 shots × EN/HE)
were checked verbatim:

| # | Overlay EN | Overlay HE | Banned word? |
|---|---|---|---|
| 1 | Mornings without the nagging | בקרים בלי נדנודים | none ✅ |
| 2 | A kid who feels capable | ילד שמרגיש מסוגל | none ✅ |
| 3 | Working toward what they really want | מתקדמים למה שבאמת רוצים | none ✅ |
| 4 | Starts with how they feel | מתחילים מאיך שמרגישים | none ✅ |
| 5 | The whole day, finally calm | כל היום, סוף סוף רגוע | none ✅ |
| 6 | Grows with every kid, every age | גדל עם כל ילד, בכל גיל | none ✅ |
| 7 *(opt)* | Until they don't need us | עד שהם כבר לא יזדקקו לנו | none ✅ |

**Result: PASS.** Every string is outcome-led; zero banned words; no
strategy-session bug to escalate.

> Note: `SHOT_LIST.md` prose mentions "BUDDY" and "mission tagline," but those are
> screen-mapping / rationale notes, **not** overlay text. The gate is the overlay
> strings in `OVERLAY_COPY.md`, which are clean.

---

## Per-shot / per-pair gate (to fill when finals land)

Columns map 1:1 to the package's 8 checks. One row per EN+HE pair. `⏳` = pending
(no final to inspect). Each row's expected filenames come from the production
`STATUS.md` trace table.

Legend: ✅ pass · ❌ fail · ⏳ pending (no asset) · n/a not applicable

| Shot | 1 Dims (1080×1920 PNG) | 2 Pairing EN↔HE | 3 No dev artifacts | 4 No PII | 5 Overlay matches copy | 6 HE RTL correct | 7 DFF child-safety | 8 No status-bar leak | Evidence (EN / HE) |
|---|---|---|---|---|---|---|---|---|---|
| 1 Parent Dashboard | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/01-parent-dashboard.png` / `final/HE/01-parent-dashboard.png` |
| 2 Child Dashboard + buddy | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/02-child-dashboard-buddy.png` / `final/HE/02-child-dashboard-buddy.png` |
| 3 Child Rewards | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/03-child-rewards.png` / `final/HE/03-child-rewards.png` |
| 4 Vibe Check | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/04-vibe-check.png` / `final/HE/04-vibe-check.png` |
| 5 Parent Tasks | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/05-parent-tasks.png` / `final/HE/05-parent-tasks.png` |
| 6 Manage Children | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/06-manage-children.png` / `final/HE/06-manage-children.png` |
| 7 *(opt)* Gamer Dashboard | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | `final/EN/07-gamer-dashboard.png` / `final/HE/07-gamer-dashboard.png` |

**Per-check expectations (the bar each cell must clear):**

1. **Dims** — width 1080 px, height 1920 px, true 9:16 portrait; PNG (not JPEG);
   no alpha that renders black on a dark store background. (Auto-checkable —
   `check-finals.ps1`.)
2. **Pairing** — every EN shot N has a HE shot N and vice versa; no orphans.
   (Auto-checkable.)
3. **No dev artifacts** — none of: `ZTest`, `תצוגה`/Preview banner, RevenueCat red
   badge/LogBox, Metro "Bundling N%" overlay, `DEV`/"Development Build" text,
   Expo dev-client target logo. (Human visual pass — production already flags
   these per the `SHOT_LIST.md` watchlist.)
4. **No PII** — no real email, phone, surname, or address. Demo first names
   (Leia, Itay, Emi) are fine. Shot 6 (Manage Children) is the highest PII risk —
   `SHOT_LIST.md` L195–196 says a card showing an email = shot is out.
5. **Overlay matches copy** — overlay text equals `OVERLAY_COPY.md`
   character-for-character AND contains zero banned words. (Strategy-level
   banned-word check already PASS above; the per-image part — that the rendered
   string matches and is legible — needs the image.)
6. **HE RTL** — Hebrew reads right-to-left, punctuation at the correct end, no
   flipped/reordered glyphs. (Production `STATUS.md` L38 reports GDI+ renders RTL
   correctly on a stand-in; must still be confirmed on the real finals.)
7. **DFF child-safety** — no solicitation of a child's personal info; kid-
   appropriate content; no ads / no IAP prompt shown at child age / no adult
   themes. (Human judgment per Google "Designed for Families.")
8. **No status-bar leak** — time/battery/wifi OK; no notification icon carrying
   private content. `SHOT_LIST.md` L46 requires DND on + cleared shade at capture.

---

## Fix paths (every ❌ / ⏳ needs one)

| Item | State | Fix path |
|---|---|---|
| All 14 per-image cells | ⏳ blocked | **Adi captures the 6–7 raws** per `SHOT_LIST.md` (real-device, Hat-4) → **production session renders** EN+HE finals into `final/EN` + `final/HE` → **re-run this validation** (`check-finals.ps1` + human passes for checks 3/4/6/7/8). |
| Finals source for re-run | undecided | Decide when finals exist: validate after the production branch merges to `main`, **or** point `check-finals.ps1 -Root` at the production worktree's `final/` pre-merge. Moot until raws land. |

---

## How to re-run (when finals exist)

```powershell
# from this worktree
pwsh docs/marketing-screenshots/v21/check-finals.ps1 `
  -Root docs/marketing-screenshots/v21/final
```

`check-finals.ps1` auto-covers the machine-checkable gates — **check 1 (dims/format/alpha)**,
**check 2 (EN↔HE pairing)**, and the **filename/locale sanity**. It is **read-only**
(never modifies an image). Checks 3, 4, 6, 7, 8 still require a human visual pass and
get marked in the table above. Update the verdict line below once all cells are ✅.

---

## VERDICT

**NO-GO — see ⏳/❌ rows above.** 0 of the expected 12–14 finals exist; the gate
cannot certify assets that have not been produced. Overlay-copy strategy gate is
the only completed check and it **passes**. Flip to **GO — ready to upload to Play
Console listing** only after every per-shot cell is ✅.
