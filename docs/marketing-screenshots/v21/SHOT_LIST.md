# Shot list — BUFF v1.1.0 Play Store (6-7 phone screenshots)

> **For Adi.** This is the runbook you follow on your phone. This session did NOT
> capture anything — it produced the plan. Image production + overlay drawing is a
> separate session (`screenshots-2-production.md`); the overlay strings live in
> [`OVERLAY_COPY.md`](OVERLAY_COPY.md).
>
> **Target build:** BUFF **v1.1.0 (versionCode 21)** — Internal Testing
> https://play.google.com/apps/internaltest/4701243578877467187
>
> **Created:** 2026-05-30

---

## ⚠ Read this first — the v17 contamination lesson

The previous screenshot batch (`docs/marketing-screenshots/v17/`) is **DEV-ARTIFACT
CONTAMINATED** and must NOT be used for the listing. Per
`docs/sessions/play-store-listing/EOD_2026-05-27.md`, even the `cleaned/` crops still
leaked **ZTest520**, a **dev toggle**, and the **"Preview" / "תצוגה"** marker.

This runbook exists so the v21 batch is clean. The single biggest contamination risk
this time is the **View-as-Child "Preview / תצוגה" banner** — see the watchlist on
every child-mode shot below. **Capture child screens from a real activated child
session (ChildJoin), not from parent View-as-Child**, so there is no banner to crop.

---

## Pre-flight — before you tap a single shutter

Tick all of these or the shots will be wrong:

- [ ] Phone has **v1.1.0 (vc21)** installed from the Internal Testing link (Play Store
      → BUFF → About this app → Version shows 1.1.0).
- [ ] It is the **Play build**, not a local dev build — no Metro/dev banner, no LogBox
      red box, no "Reload" dev menu.
- [ ] **Device system language = English (US)** at the TOP of Languages (so the UI is
      English, not Hebrew). Reboot or force-stop BUFF after switching.
- [ ] Signed in as **Adi** (`adi.elgarat@gmail.com`) — the account linked to the demo
      family.
- [ ] **Demo data still present** (it was prepped at v18; confirm it survived):
  - [ ] Parent **Adi** + children **Leia, Itay, Emi** all show in **English** (not עדי/אמי).
  - [ ] **Leia** has buddy **Sparky** + ~13 tasks + a BUFFs balance + 7 family rewards.
  - [ ] If any of this is missing → stop, tell CC, CC re-seeds before you continue.
- [ ] **Do Not Disturb ON** + clear the notification shade — so no personal
      notification (WhatsApp preview, email) leaks into the status bar of any shot.
- [ ] Dismiss the push-permission pre-prompt if it appears (we handle Hat-4 separately).
- [ ] No red **RevenueCat** error toast at the bottom — if you see one, **force-stop +
      relaunch** before capturing.

---

## The shots

Capture in the **Capture order** at the bottom (grouped to minimise phone churn). The
numbering below is the **listing order**, not the capture order.

---

### Shot 1 — Calmer family mornings

- **Screen**: Parent Dashboard (the screen you land on after sign-in), showing the 3
  child cards (Leia, Itay, Emi).
- **State to set up**:
  - account: **Adi** (parent)
  - mode: Parent Mode (default after sign-in)
  - theme: default Parent (light) — no toggle needed
  - locale: **English**
  - mid-state: top of the screen, nothing scrolled; all 3 child cards visible; Leia's
    card should show the Sparky buddy face.
- **Why this shot**: First impression — one calm place where a parent sees the whole
  family at a glance, instead of nagging each kid separately.
- **Overlay EN**: Mornings without the nagging
- **Overlay HE**: בקרים בלי נדנודים
- **Placement**: **top** (below the status bar, above the greeting band) — keep the
  child cards fully visible.
- **Dev-artifact watchlist**:
  - greeting must read **"Good morning, Adi"** — NOT "עדי" (Hebrew = stale cache → pull
    to refresh / force-stop).
  - no red error toast at the bottom.
  - no child named in **Latin transliteration of Hebrew** or any "ZTest"-style profile.

---

### Shot 2 — A kid who feels capable

- **Screen**: Child Dashboard — **Leia**, Mint (Pastel) theme, BUDDY "Sparky" hero +
  BUFFs balance visible.
- **State to set up**:
  - account: **Leia's own activated child session** (ChildJoin) — see watchlist.
  - mode: Pastel / Mint (Leia's default theme)
  - locale: **English**
  - mid-state: dashboard home, buddy visible, after dismissing the Vibe Check (tap
    **MAYBE LATER** on the Vibe Check overlay → lands here).
- **Why this shot**: The kid's own world — a friendly companion at their side makes the
  child feel accompanied and capable, not managed.
- **Overlay EN**: A kid who feels capable
- **Overlay HE**: ילד שמרגיש מסוגל
- **Placement**: **bottom** (below the buddy, above the bottom nav) — never cover the
  buddy's face.
- **Dev-artifact watchlist**:
  - **NO "Preview / תצוגה" banner** — this is why we use Leia's real ChildJoin session,
    not parent View-as-Child. If you must use View-as-Child, the preview ribbon MUST be
    cropped out top + bottom.
  - buddy name shows **Sparky** (English), not a Hebrew default.
  - BUFFs balance is a clean number, no "NaN"/"0"/placeholder.

---

### Shot 3 — Working toward what they want

- **Screen**: Child Rewards / Shop (Leia) — the real-world prizes (Pizza night, Family
  movie night, Be the coach for a day, Fun day out, etc.).
- **State to set up**:
  - account: **Leia's** child session (same as Shot 2)
  - mode: Pastel / Mint
  - locale: **English**
  - mid-state: Rewards/Shop tab open via bottom nav; scrolled to show 3-4 reward cards
    with their emoji + name (skip showing the raw price if it crowds the card).
- **Why this shot**: The motivation lives in the kid's real life — a pizza night, a day
  out — not coins on a screen. This is the core difference parents are looking for.
- **Overlay EN**: Working toward what they really want
- **Overlay HE**: מתקדמים למה שבאמת רוצים
- **Placement**: **top** — keep the reward cards (the visual payoff) unobstructed.
- **Dev-artifact watchlist**:
  - reward titles in **English** (Pizza night, Family movie night…), not Hebrew.
  - no half-loaded card / broken emoji glyph.
  - no "Preview / תצוגה" ribbon (real child session).

---

### Shot 4 — Starts with how they feel

- **Screen**: Vibe Check — the "How are you feeling right now?" check-in overlay (kid
  view).
- **State to set up**:
  - account: **Leia's** child session
  - mode: Pastel / Mint (emoji-face Vibe Check). *(If you'd rather show the dark
    energy-bars version, capture it during the Gamer-theme step in Shot 7 instead.)*
  - locale: **English**
  - mid-state: this overlay appears **on first entry** to the child view each day —
    capture it BEFORE tapping "MAYBE LATER". If it doesn't auto-appear, it can be
    re-triggered from the child home.
- **Why this shot**: BUFF meets the kid where they are emotionally first — a coaching
  check-in, not a checkup. Unique to BUFF; no competitor does this.
- **Overlay EN**: Starts with how they feel
- **Overlay HE**: מתחילים מאיך שמרגישים
- **Placement**: **bottom** — the question + faces sit in the upper/middle; keep that
  clear.
- **Dev-artifact watchlist**:
  - the prompt text is in **English** ("How are you feeling right now?").
  - no "Preview / תצוגה" ribbon behind the overlay.
  - overlay fully rendered (all 5 faces/bars present, not mid-animation).

---

### Shot 5 — The whole day, finally calm

- **Screen**: Parent Tasks — **Leia** selected, the full daily routine listed by time
  (morning → bedtime).
- **State to set up**:
  - account: **Adi** (parent) — *parent-side capture, no child session needed*
  - mode: Parent Mode
  - theme: default Parent (light)
  - locale: **English**
  - mid-state: **Tasks** tab in bottom nav → tap **Leia** chip → scrolled to a position
    that shows a good span of the day (e.g. morning block 07:00–08:00 plus one or two
    afternoon items, so the viewer reads "a whole structured day").
- **Why this shot**: The whole day has a calm structure the parent didn't have to fight
  for — morning, homework, bedtime, all held by the app.
- **Overlay EN**: The whole day, finally calm
- **Overlay HE**: כל היום, סוף סוף רגוע
- **Placement**: **top** — keep the task rows readable.
- **Dev-artifact watchlist**:
  - task titles in **English** (Get dressed + shoes, Check bag, Start homework…).
  - no "ZTest" task, no debug timestamps.
  - no red error toast.

---

### Shot 6 — Grows with every kid

- **Screen**: Manage Children — the multi-kid management card list (Leia, Itay, Emi).
- **State to set up**:
  - account: **Adi** (parent)
  - mode: Parent Mode
  - locale: **English**
  - mid-state: **Settings** → Family section → **Manage children** → 3 cards visible.
- **Why this shot**: One app stretches from a 9-year-old to a teen — it grows with the
  family across ages 6–18 (the gap Joon leaves at 12).
- **Overlay EN**: Grows with every kid, every age
- **Overlay HE**: גדל עם כל ילד, בכל גיל
- **Placement**: **bottom** — keep the 3 child cards visible above the overlay.
- **Dev-artifact watchlist**:
  - **NO email addresses / phone numbers** on these cards (no `adi.elgarat@gmail.com`
    or any real PII visible) — if a card shows an email, this shot is out.
  - all names **English**.
  - no "Add child" debug state / empty placeholder card.

---

### Shot 7 *(optional)* — Until they don't need us

- **Screen**: Child Dashboard in the **Gamer (dark) theme** — to show the
  dashboard-style / teen aesthetic. Easiest clean way: in **Leia's** child session,
  switch theme to **Gamer** in child Settings so her rich data populates the dark
  dashboard. (Revert to Mint afterwards — see capture order.)
- **State to set up**:
  - account: **Leia's** child session
  - mode: switch to **Gamer** theme in child Settings
  - locale: **English**
  - mid-state: dark dashboard home; if you want the energy-bars Vibe Check, trigger it
    here instead of in Shot 4.
- **Why this shot**: The endgame — the same system carries a kid into the
  dashboard-driven, autonomous teen experience, all the way to not needing the app.
  Carries the mission tagline.
- **Overlay EN**: Until they don't need us
- **Overlay HE**: עד שהם כבר לא יזדקקו לנו
- **Placement**: **bottom** — dark canvas reads well with bottom-anchored text.
- **Dev-artifact watchlist**:
  - canvas is **deep violet** (`#1a1636`), NOT pure black — if it's pure black it's a
    rendering bug.
  - no "Preview / תצוגה" ribbon (real child session).
  - **revert Leia back to Mint theme after this shot** so the demo DB stays in its
    documented state.

---

## Capture order

Grouped to minimise account/theme/locale switches. **Locale stays English the whole
time** — there are no Hebrew-UI captures (the overlays are bilingual, but the app UI is
English for both listings).

1. **Group A — Adi (parent), Parent Mode, light theme** — sign in once, capture:
   - Shot **1** Parent Dashboard
   - Shot **5** Parent Tasks (Leia)
   - Shot **6** Manage Children
2. **Group B — Leia's child session (ChildJoin), Mint theme** — switch into Leia once,
   capture in natural flow:
   - Shot **4** Vibe Check (appears on entry — capture before dismissing)
   - tap MAYBE LATER → Shot **2** Child Dashboard
   - Shot **3** Child Rewards
3. **Group C — Leia still in child session, switch theme to Gamer**:
   - Shot **7** Gamer Dashboard (optional)
   - **switch Leia back to Mint** to leave the demo data as documented.

---

## Time estimate

**30–45 minutes** total for Adi, assuming v21 is already installed and the demo data
pre-flight passes. Budget the larger end if you need to set up Leia's ChildJoin session
fresh or re-seed any missing demo data.

---

## Clean-capture sign-off — tick before this session ends

Confirm the v21 batch is clean (the thing the v17 batch failed):

- [ ] No **"Preview / תצוגה"** banner in any child-mode shot (1-of-1 reason v17 failed).
- [ ] No **ZTest** / test profile anywhere.
- [ ] No **dev toggle**, LogBox, Metro banner, or "Simulate Subscribed" control.
- [ ] No **RevenueCat** red error toast.
- [ ] No **Hebrew leakage** (all UI English; "Good morning, Adi" not "עדי").
- [ ] No **real PII** — no email/phone on Manage Children or Settings shots.
- [ ] No **personal notifications** in the status bar (DND was on).
- [ ] Gamer shot canvas is deep violet, not pure black; Leia reverted to Mint after.

Once all ticked, hand the raw captures to the production session
(`screenshots-2-production.md`) with [`OVERLAY_COPY.md`](OVERLAY_COPY.md).

---

**Lovable Publish reminder:** N/A — Play Console + repo docs only, no Lovable surface
touched.
