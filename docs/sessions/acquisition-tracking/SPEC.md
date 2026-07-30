# SPEC — Acquisition Tracking (where did signups come from?)

**Slug:** `acquisition-tracking`
**Status:** 🟢 IN BUILD (2026-07-30, branch `pkg/acquisition-attribution`) — approved after a data-backed review. Schema applied (migration 052/053). See "Review corrections (2026-07-30)" below for what changed vs the original 2026-07-10 proposal.

---

## Review corrections (2026-07-30) — read this first

A code + live-DB review (plan `zesty-dreaming-whisper`) found the original proposal rested on a foundation that was not actually running, and was missing the dimension that triggered the work. Corrections now folded in:

1. **The "#345 capture is live" claim was FALSE.** Live DB: 0 `family_created` events, 0 rows with `acquisition` (of 87). The column + `logOnboardingEvent({acquisition})` param existed but no caller ever fired the event. **This package builds the capture from zero** — emitting `family_created` + populating `acquisition` in BOTH creation paths (`src/contexts/AuthContext.tsx` signUp, `src/screens/auth/AuthCallbackScreen.tsx` createProfile).
2. **Country added.** The whole trigger was "which country was our first US user?" `profiles.last_country` is ~95% NULL (writes only on foreground). New `families.acquisition_country` captured AT signup from `deviceRegion()` (device-locale, not IP).
3. **Native scope made explicit on data.** Platform mix of tracked signups is ~53% web / 44% android — web-only would be blind to ~half. But native splits into **native-organic** (covered free by platform + country + null-utm — the Dida case) and **native-tagged** (needs the Play Install Referrer + a new dependency, #301). MVP covers native-organic; native-tagged is a deferred FLAG (see INTEGRATION_LEARNINGS).
4. **Attribution ladder defined:** `tagged utm` → `referrer` → `referral code` (existing) → `organic-inferred` (platform+country) → `unknown`. Normalized label in `acquisition_source`, raw in `acquisition` jsonb.
5. **Success metric:** % of new families with non-null `acquisition_source` (target ≥80% within 2 weeks). Exactly the signal whose absence hid the dead capture for weeks.
6. **Schema delta shrank:** `profiles.last_platform/last_country` already landed (web-to-native CTA) and `onboarding_events.acquisition` exists, so the only new columns are on `families`.

---

## Problem

There is **no durable "source" on a signup**, so we can't answer *"which channel drove this week's signups?"* without hand cross-referencing. We felt this exact pain this hour: computing win-back conversion meant manually matching 32 recipient emails against `auth.users`. This is the **measurement backbone for the whole growth push** (win-back, guides, FB, SEO, Play) — without it we're flying blind on what works.

## What exists vs missing
- **Exists** (`#345`): `onboarding_events.acquisition` (jsonb) — event-level utm/landing capture on `family_created`; live on web, Android with 1.8.1.
- **Missing:** (1) a durable source on the **signup unit** (the family); (2) **tagged outbound links** to capture; (3) **admin visibility**.

---

## Design

### Schema — additive, nullable (migration **052 APPLIED 2026-07-30**)
```sql
-- channel + raw signal + signup-time country, set once at family_created
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS acquisition_source  text;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS acquisition         jsonb;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS acquisition_country text;
-- (profiles.last_platform / last_country already exist — web-to-native CTA. No new profiles ALTER.)
```
Grains: `families.acquisition_source` = normalized **channel** (once, at creation); `families.acquisition_country` = **signup-time region** (fixed); `profiles.last_country`/`last_platform` = mutable per-session. Existing rows `NULL` → no impact (authenticated INSERT privilege on the new columns verified). Admin RPC exposure = migration **053 APPLIED**.

### Capture
- **Web (works now):** utm params on the landing/download URL → stored (session/localStorage) → written to `families.acquisition_source` + `acquisition` on `family_created`. Reuses `#345`'s capture — we just **persist it to the family**.
- **Native install (rides #301):** utm via Google Play **Install Referrer** (`smart-join-link` channel) → same write on first launch.
- **last_platform:** set from `Platform.OS` on session start.

### Link-tagging contract (**prerequisite — do first**, else nothing to capture)
Every outbound link carries `utm_source`:
- win-back emails → `?utm_source=winback&utm_campaign=<date>`
- guide CTAs → `?utm_source=guide&utm_medium=<slug>`
- FB post → `?utm_source=fb`
- untagged / Play-organic → `NULL` / `'organic'`
Normalize `utm_source` → a small `acquisition_source` enum; keep the raw utm in the jsonb.

### Surface
- **Admin Tester Board** ([[project_admin_tester_board]], auto-deploys `main`): add **source** + **platform** columns to funnel-as-people; count signups by source.

## Dependencies
- **`#345` (merged ✅)** — acquisition capture exists; this persists it to `families`.
- **`#301` / [[project_smart_join_link]]** — required **only for native install attribution**. **Web attribution works now.**
- **Unifies** the `profiles.last_platform` field already queued in [[project_web_to_native_cta]] (its "NEXT" item) — fold into this package.

## Values Check (light — measurement infra)
- **Pillar 2 (data / privacy):** only **channel / utm tags + device** — **no new child PII**; utm must never carry child identifiers (hard rule). ✅
- **Pillars 1 & 3:** neutral (measurement only). ✅

## Open questions for Adi
1. **Channel taxonomy** — fixed enum (`winback / guide / fb / organic / play`) or free utm passthrough + normalize? I lean **normalize to a small enum, raw in jsonb**.
2. **Backfill** — leave existing families `NULL`, or best-effort tag known cohorts (e.g. the 3 win-back returnees)? I lean **NULL, start clean**.
3. **Merge with `last_platform`** into one "acquisition tracking" package? I lean **yes**.

## Scope cut-line (MVP)
- **In:** `families.acquisition_source` + `acquisition` · web utm capture · link-tagging (winback + guides + fb) · admin source column.
- **Out (fast-follow):** native install attribution (`#301`) · per-source dashboards/charts · retro-attribution.

## Honest note
Attribution is only as good as the tagged links + traffic volume. It pays off the moment we run any deliberate channel (the FB push, more guides) — it turns "did it work?" from an hour of manual matching into one query.
