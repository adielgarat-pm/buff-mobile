# STATUS — v1.6.2 Play Store screenshot production

**Date:** 2026-06-17
**Producer:** Claude Code (autonomous capture session)
**App version on emulator:** versionName 1.6.2 (dev build / Expo dev client)
**Pipeline:** reused from `v21` — `render-overlay.ps1` (GDI+, PNG→PNG, 1080×1920, brand-purple band + Segoe UI Bold, Hebrew RTL).

---

## State

| Date | State | Notes |
|---|---|---|
| 2026-06-17 | **GO — 12 finals produced (6 EN + 6 HE)** | Captured from the Android emulator (Adi's choice), rendered, validated. Shot 7 (Gamer dashboard) deferred — see Deviations. |

**Output:** `final/EN/` + `final/HE/`, 6 shots each, 1080×1920 PNG. Quick review: `CONTACT_SHEET_EN.png`.

---

## The 6 shots (listing order)

| # | Screen | Overlay EN | Overlay HE | Band | Lime dot |
|---|---|---|---|---|---|
| 1 | Parent Dashboard (3 kids) | Mornings without the nagging | בקרים בלי נדנודים | top | no |
| 2 | Child Dashboard + BUDDY | A kid who feels capable | ילד שמרגיש מסוגל | bottom | no |
| 3 | Child Rewards (real-world) | Working toward what they really want | מתקדמים למה שבאמת רוצים | top | **yes** |
| 4 | Vibe Check | Starts with how they feel | מתחילים מאיך שמרגישים | bottom | **yes** |
| 5 | Parent Tasks (full day) | The whole day, finally calm | כל היום, סוף סוף רגוע | top | no |
| 6 | Manage Children (ages 9–15) | Grows with every kid, every age | גדל עם כל ילד, בכל גיל | bottom | no |

Overlay strings are verbatim from the approved `v21/OVERLAY_COPY.md`. App UI is **English** on both EN and HE listings (per `v21/SHOT_LIST.md`); only the band is bilingual.

---

## How the captures were made (recipe)

- **Source:** one shared Android emulator (Pixel_7, 1080×2400) via the buff-emulator skill — **not** a real phone, and **not** the Play build. The app *UI renders identically* to production; only build-type chrome differs, and none was captured.
- **Status bar:** Android SysUI demo mode → clean 9:00, full battery, full wifi, **no notification icons**.
- **Demo data:** seeded directly in Supabase (see Demo data below).
- **Child-side shots (2,3,4):** captured via **Parent → View as Child** (a real ChildJoin session was not used — would have required logging the parent out).
  - The View-as-Child **"Viewing as parent / Parent Preview"** banner was removed two ways: shot 2 by **pre-cropping the top 210 px** (`render-all.ps1`); shot 3 because the **top band covers it**; shot 4 had no banner (it sits behind the Vibe-Check overlay).
- **RevenueCat error toast** ("Billing unavailable on device" — emulator-only, never on a Play device): it floats at the bottom (y≈2146). The pipeline's default **top-anchor crop (2400→1920) removes the bottom 480 px**, so the toast is gone from every final.

To re-render after swapping any raw: `powershell -File render-all.ps1` (reads `overlay-strings.json`, UTF-8, for the Hebrew).

---

## Demo data (seeded 2026-06-17)

Repurposed the existing **`ReminderTest`** test family (family `2d1d1dbb…`, the only account signed in on the emulator) into a clean demo family — there is **no way to switch the Google account on the emulator non-interactively**, so the signed-in account was reshaped rather than replaced:

- Parent `ReminderTest` → **Adi**
- Child `Maya` → **Leia** (🦄, age 11) — buddy puppy, 6 tasks (3 done today), 35 Buffs, 7 real-world rewards
- + **Itay** (🎮, age 15, teen), **Emi** (🐬, age 9)

This is now a usable, persistent demo family. **Flag for Adi:** if `ReminderTest` was needed as-is by the nightly automation, tell CC and it can be reverted/renamed.

---

## Deviations from `v21/SHOT_LIST.md` (logged per docs discipline)

1. **Emulator + dev build** instead of a real-device Play build. Visual output is equivalent; no dev chrome captured. Adi can re-shoot on a real phone later if she wants pixel-exact Play-build provenance.
2. **View-as-Child** instead of a real ChildJoin child session for the child shots. Preview banner removed (above). No "תצוגה/Preview" ribbon survives in any final.
3. **Shot 7 (Gamer/dark dashboard) deferred.** It is marked *optional* in the plan. In View-as-Child, Itay's **Gamer theme did not apply** (his dashboard rendered in the default Mint theme), so the shot would not have delivered the intended dark/teen aesthetic. Worth a dedicated pass on a real Gamer-themed child session if Adi wants 7.

---

## Open flags for Adi (content judgment — not auto-fixable)

- ⚠️ **"70% = a successful day" / "70% = Ignition!"** appears as genuine in-app copy on the parent cards (shots 1) and the child dashboard (shot 2). This contradicts the standing *avoid "70%" in marketing* guidance (`project_marketing_vapor_features`). I did **not** fake-edit the UI. Options: (a) ship as-is, (b) change the in-app string first, then re-shoot.
- ⚠️ Shot 3 (Shop) header pill shows **"0 Buffs"** (View-as-Child reads a 0 spendable balance even though Leia has 35). Small, top-right, partly under the band. Arguably on-message ("saving up"). Leave or re-shoot from a real child session.
- ℹ️ Finals carry an (opaque) alpha channel, same as the v21/v24 pipeline. No transparent pixels → safe for Play, but can be flattened to 24-bit on request.

---

## Lovable Publish reminder
N/A — Play Console + repo docs only; no Lovable surface touched.

---

## ⚠ Pending re-render — shot 1 overlay (added 2026-07-25)

The 6 finals above are the record of what was produced on 2026-06-17 and are left
as-is. One string is now **retired**: shot 1's `Mornings without the nagging`.

**Why:** `BUFF_COMPETITORS.md` L71 documents an iron rule — Joon owns the word
"nagging" (their line: *"No more nagging, we do the reminding"*). Leading our own
listing with it echoes them. Retired across the forward-looking copy specs on
2026-07-25.

**New string:** EN `Mornings that run themselves` · HE `בקרים שמתנהלים לבד`

**Action (Adi, Windows — needs Segoe UI Bold, so it can't be re-rendered on Linux):**

```powershell
cd docs/marketing-screenshots/v1.6.2
./render-overlay.ps1 -In raw/01-parent-dashboard.png -Out final/EN/01-parent-dashboard.png -Text "Mornings that run themselves" -Placement top
./render-overlay.ps1 -In raw/01-parent-dashboard.png -Out final/HE/01-parent-dashboard.png -Text "בקרים שמתנהלים לבד" -Placement top -Rtl
```

Shots 2–6 are unaffected. After re-rendering, re-upload shot 1 to the Play Console listing.
