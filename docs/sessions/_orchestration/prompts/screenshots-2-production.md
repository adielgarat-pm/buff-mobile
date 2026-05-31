# Session — Screenshots Production (raw → branded final assets)

> Open a fresh CC session and paste the block below. **Run this AFTER Adi has
> captured the raw screenshots to `docs/marketing-screenshots/v21/raw/` per the
> shot list.**
> Output: final Play-Store-ready images with text overlays, EN + HE, in
> `docs/marketing-screenshots/v21/final/EN/` and `.../final/HE/`.

```
Package: pkg/play-store-screenshots-production. Start in Plan Mode.

Goal: turn Adi's raw phone screenshots into final Play Store assets — branded
text overlay, correct dimensions, EN + HE variants — for v1.1.0 (versionCode 21).

Read FIRST:
- docs/marketing-screenshots/v21/SHOT_LIST.md (the runbook the strategy session
  produced — single source of truth for which raw maps to which final, and
  what overlay text goes where)
- docs/marketing-screenshots/v21/OVERLAY_COPY.md (table of EN + HE overlay
  strings, paired)
- docs/BUFF_BRAND.md (palette, typography, tone — must match the feature graphic
  that's already in the listing)
- docs/sessions/play-store-listing/EOD_2026-05-27.md §"Feature graphic" — the
  feature graphic was generated with PowerShell + System.Drawing (purple
  gradient + lime green callout + Segoe UI Bold). Match that style.

Inputs:
- `docs/marketing-screenshots/v21/raw/` — Adi's PNG captures. Filenames per
  SHOT_LIST.md's "Shot N" numbering.

Outputs:
- `docs/marketing-screenshots/v21/final/EN/01-<slug>.png` ... `0N-<slug>.png`
- `docs/marketing-screenshots/v21/final/HE/01-<slug>.png` ... `0N-<slug>.png`

Specs (hard):
1. **Dimensions**: 9:16 portrait, 1080×1920 px (Play Store recommended for
   phone screenshots). If a raw is taller — crop top/bottom; if wider — letterbox
   with the brand purple, never stretch.
2. **Overlay**: solid band, ~15% of frame height, placed per SHOT_LIST.md's
   "Placement" field. Background: brand purple (per BUFF_BRAND.md). Text: white,
   Segoe UI Bold, sized to fit on ONE line. Lime green dot/accent if the strategy
   session marks the shot as a "key feature" shot.
3. **RTL for Hebrew**: text-align right, RTL writing direction. Verify no
   character orientation bugs (especially for `:`/`/` mixed with Hebrew). Use
   the same band placement as the EN version (don't mirror; keep visual
   consistency across the listing).
4. **No image stretching, no JPEG re-compression** — PNG in, PNG out, lossless.
5. **Status bar + nav bar**: leave them as captured (real phone makes the
   shots feel authentic). Do NOT crop the time/battery icons.

Tooling: prefer PowerShell + System.Drawing (proven from `BUFF_FEATURE_GRAPHIC`).
If a raw needs a tighter crop than a simple top/bottom band can offer, use
ImageMagick (`magick convert`) — it's already on the system per
`PHONE_CAPTURE_PLAYBOOK.md`.

Per-shot checklist run during production (write it to STATUS.md as you go):
- raw filename → final EN filename → final HE filename
- overlay text used (EN + HE, exact characters)
- dimensions of final
- any deviation from the spec + why

Out of scope: validation (separate prompt). This session ends when the
EN + HE folders are populated and STATUS.md confirms each shot's
production trace.

If you find a raw screenshot that contains a dev artifact the strategy
session's watchlist flagged (ZTest name, RevenueCat toast, "תצוגה" preview
banner, LogBox overlay, test family data) — STOP that shot, write a bug row
to STATUS.md, and ask Adi to re-capture. Do NOT mask the artifact —
recapture is the only path.

Branch + PR (docs + assets). No production code changes.
```
