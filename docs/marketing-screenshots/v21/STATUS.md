# STATUS — v21 Play Store screenshot production

**Package:** `pkg/play-store-screenshots-production`
**Branch base:** `pkg/play-store-screenshots-strategy` (so `SHOT_LIST.md` + `OVERLAY_COPY.md` travel with this branch; strategy is not yet merged to `main`).
**Target build:** BUFF v1.1.0 (versionCode 21), Internal Testing.

---

## State

| Date | State | Notes |
|---|---|---|
| 2026-05-30 | **Pipeline ready · BLOCKED on raw captures** | Render script built + self-tested on a v17 stand-in. EN/HE finals **not produced** — no raw captures exist yet (`raw/` is empty). |

**Blocker:** `docs/marketing-screenshots/v21/raw/` is empty. The 6-7 shots must be captured by Adi on a real phone per `SHOT_LIST.md` (Hat-4, real-device only). The strategy session explicitly produced the plan, not the captures (`SHOT_LIST.md` L3-4); `EOD_2026-05-27.md` L22 lists phone screenshots as "❌ pending Adi on real phone." Once raws land in `raw/`, this session batches EN+HE in one pass and fills the trace table below.

---

## Tooling

- **Renderer:** `render-overlay.ps1` (PowerShell + System.Drawing/GDI+). PNG in → PNG out, lossless, no stretch.
- **ImageMagick:** NOT installed on this machine (the package prompt's claim was inaccurate; `PHONE_CAPTURE_PLAYBOOK.md` does not reference it). **Not needed** — GDI+ renders Hebrew RTL correctly on its own (validated below).
- **Font:** Segoe UI Bold (`C:\Windows\Fonts\segoeuib.ttf`, confirmed present).

### Render parameters
`-In <raw> -Out <final> -Text "<overlay>" -Placement top|bottom [-TopInset <px>] [-CropAnchor top|center|bottom] [-Rtl] [-KeyFeature]`

- 1080×1920 (9:16). Taller raws scale-to-width then crop (anchor configurable, default `top` to preserve the status bar). Wider raws letterbox top/bottom in brand purple `#8b5cf6`.
- Band: solid brand purple `#8b5cf6`, ~15% frame height (288px). White Segoe UI Bold, auto-fit to ONE line.
- `-TopInset` drops a TOP band below the status bar (per `SHOT_LIST.md` "below the status bar"). Tune to the captured status-bar height once raws exist (~96px worked on the 1080×2400 v17 stand-in).
- `-KeyFeature` draws a lime `#A8E63E` accent dot on the text's leading edge (right for RTL, left for LTR).

---

## Self-test findings (against v17 stand-in `05_child_dashboard.png`, 1080×2400)

- ✅ Output is exactly **1080×1920 PNG, lossless**.
- ✅ **Hebrew RTL renders correctly** — right reading edge, correct glyph order/shaping, lime dot on the right. No ImageMagick fallback required.
- ✅ Brand purple band + white bold text + lime accent all correct; status bar preserved with `-TopInset`.
- 🐛 **Fixed:** auto-fit initially clipped long EN text ("…capab") because a bounded `MeasureString` clamps the returned width to the layout rect and falsely reports a fit. Now measures unconstrained and shrinks until the true single-line width fits. Re-tested with the longest string ("Working toward what they really want") — fits on one line.
- 📝 The v17 stand-in itself shows the **"Viewing as parent — עדי" / "Parent Preview"** banner — exactly the contamination `SHOT_LIST.md` warns about. Confirms real child-mode raws must come from Leia's real ChildJoin session, not parent View-as-Child.

---

## Decisions (Adi delegated to CC, 2026-05-30 — "תמליץ לי")

- **Lime key-feature dot → Shots 3 (Rewards) and 4 (Vibe Check) only.** These are the strategy docs' explicit differentiators ("the core difference parents are looking for" / "Unique to BUFF; no competitor does this"). All other shots: band, no dot. (`-KeyFeature` set on Shots 3 + 4 in the production run.)
- **Overlay copy / colors / font → no changes.** Strings are the approved `OVERLAY_COPY.md`; band/text/accent match `BUFF_BRAND.md`. Upcoming fixes are assumed app-side; the pipeline ingests whatever raws land.

---

## Per-shot production trace (to fill when raws land)

Overlay strings are verbatim from `OVERLAY_COPY.md`. Placement from `SHOT_LIST.md`.

| Shot | raw → | final EN | final HE | Overlay EN | Overlay HE | Placement | Key (lime) | Dims | Deviation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | _pending_ | `final/EN/01-parent-dashboard.png` | `final/HE/01-parent-dashboard.png` | Mornings without the nagging | בקרים בלי נדנודים | top | no | — | — |
| 2 | _pending_ | `final/EN/02-child-dashboard-buddy.png` | `final/HE/02-child-dashboard-buddy.png` | A kid who feels capable | ילד שמרגיש מסוגל | bottom | no | — | — |
| 3 | _pending_ | `final/EN/03-child-rewards.png` | `final/HE/03-child-rewards.png` | Working toward what they really want | מתקדמים למה שבאמת רוצים | top | yes | — | — |
| 4 | _pending_ | `final/EN/04-vibe-check.png` | `final/HE/04-vibe-check.png` | Starts with how they feel | מתחילים מאיך שמרגישים | bottom | yes | — | — |
| 5 | _pending_ | `final/EN/05-parent-tasks.png` | `final/HE/05-parent-tasks.png` | The whole day, finally calm | כל היום, סוף סוף רגוע | top | no | — | — |
| 6 | _pending_ | `final/EN/06-manage-children.png` | `final/HE/06-manage-children.png` | Grows with every kid, every age | גדל עם כל ילד, בכל גיל | bottom | no | — | — |
| 7 *(opt)* | _pending_ | `final/EN/07-gamer-dashboard.png` | `final/HE/07-gamer-dashboard.png` | Until they don't need us | עד שהם כבר לא יזדקקו לנו | bottom | no | — | — |

---

## Dev-artifact bug rows (re-capture required — do NOT mask)

_None yet — no raws received. Any raw flagged by the `SHOT_LIST.md` watchlist (ZTest, RevenueCat toast, "תצוגה"/Preview banner, LogBox, test family data) gets a row here and is sent back to Adi for re-capture._

| Shot | raw filename | artifact found | action |
|---|---|---|---|
| — | — | — | — |
