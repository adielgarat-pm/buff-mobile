# SPEC — Activities discoverability (dashboard entry: "פעילויות וציוד")

**Slug:** `activities-discoverability` · **Branch (proposed):** `pkg/activities-discoverability`
**Status:** SPEC (awaiting `approved, proceed`)
**Author:** CC · **Date:** 2026-07-31
**Origin:** Tester feedback (Noa, 2026-07-31): the Activities feature *"הולך לי לאיבוד … צריך לחשוב איך להבליט את האורגנייזר, הוא פיצ'ר פצצה."* Confirmed in code: the feature has **exactly one** entry — a row in Parent Settings ([ParentSettingsScreen.tsx:147](src/screens/parent/ParentSettingsScreen.tsx#L147)) — and **zero** presence on the parent dashboard.

---

## Goal

Give **פעילויות וציוד** (חוגים / camps / pool days + the gear each carries) a visible, self-explaining entry on the **parent dashboard**, so a parent who never digs into Settings still discovers it — without competing with the dashboard's primary job (the AI insight → conversion).

---

## Decisions already locked with Adi (2026-07-31)

- **D1 — Naming (no "organizer" collision).** The dashboard already shows **"מארגן חכם"** = the *capture* feature (`ParentCaptureEntry`, `FEATURE_PARENT_CAPTURE=true`, live). We do **not** add a second "organizer". The new entry is named by what it is: **"פעילויות וציוד"** ("Activities & gear"). Adi's rationale: *חוג is one type of activity* — "פעילויות" is the correct umbrella (covers חוג, קייטנה, יום בריכה). The word "אורגנייזר/מארגן" is **not** used for this feature.
- **D2 — Placement:** a quiet entry card **below the AI insight card**, never above it, never louder than it (activation discipline — the insight→conversion job stays primary).
- **D3 — Form:** a compact card mirroring `ParentCaptureEntry` (visual + telemetry consistency).
- **D5 — "Highlight" scope for v1:** a persistent entry card **only**. No one-time nudge, no "חדש" badge (measure first; add later if the funnel says it's needed).
- **D6 — Keep the Settings row** (`settings.rowActivities`) — fully additive.
- **D7 — Sequencing:** independent of `activities-multi-day`; **do not couple**. Single-day activities work today, so driving discovery now is net-positive regardless of multi-day.

**Still Adi's call (copy — surface, don't self-approve):**
- Final entry title/sub wording (draft below), verified against `BUFF_VALUES.md`.
- **Open consistency question (do NOT decide silently):** the feature *screen* is still titled **"חוגים ופעילויות"** and the Settings row likewise. Align them to **"פעילויות וציוד"** for one voice, or leave as-is? Flagged for Adi; not in scope until she says.

---

## Scope

**In:**
- New component `src/components/parent/ParentActivitiesEntry.tsx` — a dashboard entry card, mirroring `ParentCaptureEntry`, that `navigation.navigate('Activities')`.
- Mount it on `ParentDashboardScreen` **below the insight card block**.
- Funnel events `activities_entry_seen` (deduped per app session) + `activities_entry_tapped`, `source: 'dashboard'`, via the existing `logOnboardingEvent`.
- i18n `activities.entryTitle` / `activities.entrySub` (he + en).

**Out (non-goals):**
- Any change to `ParentCaptureEntry` / the capture feature — **do not reopen #411** (its copy + straight-to-capture routing were tuned on production data; leave it untouched).
- Multi-day weekdays — separate package (`activities-multi-day`).
- The `ActivitiesScreen` internals, the child packing card, one-time nudges, badges — out.
- Renaming the feature screen/Settings row — gated on the open consistency question above.

---

## Design

### Entry card (`ParentActivitiesEntry.tsx`) — mirror of `ParentCaptureEntry`

- Same card style (`styles.card` etc. from `ParentCaptureEntry`), same `PARENT_THEME as T`, theme-aware.
- Icon: 🎒 (gear/packing) — distinct from capture's 🗒️.
- **No beta pill** (the feature is not beta) and **no badge** (D5).
- Title = `t('activities.entryTitle')`, sub = `t('activities.entrySub')`, RTL-mirrored chevron.
- `accessibilityRole="button"`, `accessibilityLabel` = title + sub (mirror capture).
- **Unconditional render** — there is no feature flag; the feature is live in Settings already. (Unlike capture, which is flag-gated.)

### Placement (`ParentDashboardScreen.tsx`)

- Render `<ParentActivitiesEntry />` **directly below the AI insight card block** (the insight card renders ~L635–810; `ParentCaptureEntry` sits *above* it at L625 — the new card sits *below* it, above the Yesterday-recap / child section). Exact anchor is the builder's call; the binding rule is **below the insight, never above**.
- **Safe-zone:** it's mid-scroll (not pinned to the bottom edge), but confirm ≥20pt from any bottom-pinned element and that the ScrollView isn't clipped by insets.

### Funnel events + session dedup

Mirror the capture telemetry exactly, but **keyed separately** so capture and activities exposures don't cancel each other out:

- The capture dedup (`src/lib/parentCapture/entryTelemetry.ts`) keys a session Set by `familyId` alone. Reusing it verbatim would mark *both* cards "seen" after either one renders.
- **Recommended:** a small parallel module `src/lib/activities/entryTelemetry.ts` (`shouldLogActivitiesEntrySeen(familyId)`), copy of the capture one, its own Set — keeps #411's file untouched (discipline: don't touch the tuned capture path). Alternative: generalize the capture helper to `shouldLogEntrySeen(familyId, key)` — cleaner but reopens a live file; only if Adi prefers.
- Events: `activities_entry_seen` (on first session exposure) + `activities_entry_tapped` (on press), both `source: 'dashboard'`, via `logOnboardingEvent`. **No migration** — `onboarding_events.event_type` is free text, no CHECK (confirmed in #411).

### Copy (DRAFT — Adi + BUFF_VALUES sign-off)

Lead with WHY/WHAT (outcome), not HOW (mechanics); **no "morning" anchor** (memory) — lead with order/independence.

- `activities.entryTitle` — **he:** "פעילויות וציוד" · **en:** "Activities & gear"
- `activities.entrySub` — **he:** "כל החוגים, הקייטנות והציוד שהילדים צריכים — במקום אחד" · **en:** "Every class, camp and the gear your kids need — in one place"

(Sub is a draft; the point is concrete jobs, not "organize". Final wording is Adi's.)

---

## Platform parity (Android + Web)

Pure JS/RN + data — no native API. Identical on Android native and Expo Web PWA. Verify the card renders, is tappable, and routes to `Activities` on **both** surfaces; confirm RTL (he) + LTR (en).

---

## Values Check (parent EF-utility — P3 home; inherited pass)

Same posture as the parent package (`activities-and-camp-lists`): a Pillar-3 executive-function aid, not a child motivation mechanic. This package only makes an existing feature **findable** — no new child-facing surface, no failure framing, no currency. **No new P-violations; inherits the parent package's 9/9.** Re-verify against the built card + final copy at exit (esp. that the copy leads with capability, not app-mechanics).

---

## Chunked plan (each chunk: diff → approval → continue)

- **Phase 1 — Entry card + telemetry:** `ParentActivitiesEntry.tsx`, `activities/entryTelemetry.ts`, i18n keys (he + en), mount below the insight card. Hat-1: jest for the session-dedup helper (first call true, repeats false, null familyId false) + a render test (card shows, press → navigate('Activities') + `activities_entry_tapped`). Verify on Expo web + emulator.
- **Phase 2 — Exit:** STATUS row, SPEC_SYNC, RELEASE_QUEUE row, INTEGRATION_LEARNINGS if surprised, Values re-check against built copy. Baseline SQL note: the funnel (`activities_entry_seen` → `activities_entry_tapped` → the parent actually adds an activity) is the success measure — flag the "seen but never tapped" vs "never seen" split, same framing as #411.

## Verification

- **Hat-1:** `tsc` + jest — dedup helper; entry renders + routes + logs `_tapped`; `_seen` fires once per session.
- **Hat-3 (emulator):** dashboard shows "פעילויות וציוד" below the insight card → tap → lands on the Activities screen; pull-to-refresh ×3 → still one `activities_entry_seen`.
- **Hat-4:** RTL/LTR wording; real-device feel; confirms it reads quieter than the insight card (placement/visual weight).

## Open decisions for Adi

1. **Final copy** for `entryTitle` / `entrySub` (draft above) — verified vs BUFF_VALUES.
2. **Consistency:** rename the feature *screen* + Settings row from "חוגים ופעילויות" to "פעילויות וציוד" (one voice), or leave? (Small; recommend align, but your call.)
3. **Telemetry approach:** parallel module (recommended, leaves #411 untouched) vs generalizing the shared helper.

---

## Expected-impact honesty

This makes the feature **findable for parents who open the app**; it does not by itself fix the ~5% activation / low-return problem (memory) — a parent who never returns won't see the card either. It's a genuine, cheap, additive win for the engaged-parent segment and a prerequisite for a "killer feature" to earn its keep — sized and framed as exactly that, not as an activation fix.
