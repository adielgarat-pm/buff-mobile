# SPEC — Acquisition Tracking (where did signups come from?)

**Slug:** `acquisition-tracking`
**Status:** 🟡 PROPOSAL (2026-07-10) — for Adi's reaction. **Not approved to build.** Schema change → CC shows the exact `ALTER` and waits for `approved, proceed`.

---

## Problem

There is **no durable "source" on a signup**, so we can't answer *"which channel drove this week's signups?"* without hand cross-referencing. We felt this exact pain this hour: computing win-back conversion meant manually matching 32 recipient emails against `auth.users`. This is the **measurement backbone for the whole growth push** (win-back, guides, FB, SEO, Play) — without it we're flying blind on what works.

## What exists vs missing
- **Exists** (`#345`): `onboarding_events.acquisition` (jsonb) — event-level utm/landing capture on `family_created`; live on web, Android with 1.8.1.
- **Missing:** (1) a durable source on the **signup unit** (the family); (2) **tagged outbound links** to capture; (3) **admin visibility**.

---

## Design

### Schema — additive, nullable (proposed `ALTER`, **NOT run** — for Adi's approval)
```sql
-- channel a family arrived from (set once at family_created)
ALTER TABLE public.families  ADD COLUMN IF NOT EXISTS acquisition_source text;
ALTER TABLE public.families  ADD COLUMN IF NOT EXISTS acquisition        jsonb;
-- device a profile last opened on (updated per session) — unifies web-to-native's queued field
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS last_platform      text;  -- 'web' | 'android' | 'ios'
```
Grains differ (both are "where from" dimensions): `families.acquisition_source` = the **channel** (once, at creation); `profiles.last_platform` = the **device** (mutable, per session). Existing rows = `NULL` → no impact on live users.

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
