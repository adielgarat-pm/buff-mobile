# Activities & Seasonal Packing — Status

| Phase | State | Date | Commit | Tests | Notes |
|---|---|---|---|---|---|
| 0 — Decisions + SPEC | ✅ done | 2026-06-13 | (branch) | — | D1 child-checks-off · D2 additive · D6 unified · D7 mode-aware child-add. Design-critique fixes folded in. |
| 1 — Data + persistence | ✅ done | 2026-06-13 | (branch) | tsc 0 · jest 12/12 | `activities` table (migration 026, applied+verified, RLS mirrors timetables) · `types/activities.ts` · `useActivities` · `lib/activities/packing.ts` (today-matching selector). |
| 2 — Template catalog | ✅ done | 2026-06-13 | (branch) | jest 9/9 · i18n parity ✅ | `lib/packingTemplates/` (pool_day/day_camp/overnight_camp seeds — **Adi to finalise content**) · `camp.*` + `activities.*` i18n. |
| 3 — Parent UI | ✅ code-complete | 2026-06-13 | (branch) | tsc 0 | `ActivitiesScreen` (list + 2-step template→form add/edit, date/weekday/time pickers, gear checklist) · Settings row · nav modal. **Hat-4 device check pending (auth-gated).** |
| 4 — Child surface | ✅ code-complete | 2026-06-13 | (branch) | tsc 0 | `PackingCard` (theme-aware, neutral copy, empty state, no counter, ≥44px rows, AsyncStorage check-off) mounted on Mint + Gamer dashboards (non-pause path). **Hat-4 pending.** |
| 4.5 — Child-authored (Feature C) | ✅ code-complete | 2026-06-13 | (branch) | tsc 0 · jest 4/4 | migration 027 (applied: `created_by_child`, `proposed` status, child INSERT/UPDATE RLS) · `ChildAddActivityScreen` (Teen direct / Children propose via `childMode`) · parent approval strip. **Hat-4 pending.** |
| 5 — Exit | ✅ done | 2026-06-13 | (branch) | — | SPEC_SYNC + STATUS written. RELEASE_QUEUE row deferred to merge. Values re-checked (9/9, both features). |

## Verification summary
- **Hat-1:** `tsc --noEmit` 0 errors (whole repo) · jest 25/25 (packing 12, catalog 9, childMode 4) · i18n key parity ✅ both locales.
- **DB:** migrations 026 + 027 applied to the mobile project (no prod users) and verified via list_tables — `activities` exists, RLS on, constraints + child policies in place.
- **Hat-3/Hat-4 (device):** PENDING — feature screens are auth-gated; Expo web reaches only the login screen. Needs Adi's emulator/device login. Checklist below.

## Hat-4 device checklist (Adi)
1. Parent → Settings → "חוגים ופעילויות" → add a recurring חוג (weekday + time + gear) and a one-off pool day (template).
2. Child (Mint + Gamer) dashboards on that activity's day → "נארוז יחד?" card shows today's gear → tap items → check-off persists on reload → resets next day.
3. No activity today → card shows "היום אין מה לארוז — תהנו!" (not an empty box).
4. Child taps "+ הוסף לעצמי": on a Teen (12+) profile → appears immediately; on a young child → "נשלח לאישור", and the parent sees it in the approval strip → Approve → it appears.
5. EN + Hebrew RTL both read correctly.

## Open follow-ups
- Packing-template content is seed-only — Adi supplies final lists (D5), a data edit in `lib/packingTemplates/catalog.ts`.
- Propose GAP_ANALYSIS row to Adi (SPEC_SYNC).
