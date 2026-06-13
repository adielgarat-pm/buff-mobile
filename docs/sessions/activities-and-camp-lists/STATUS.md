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
- **DB:** migrations 026 + 027 + 028 applied to the mobile project (no prod users) and verified — `activities` exists, RLS on, constraints + child policies + table grants in place.
- **Hat-3 (emulator, adb-driven, 2026-06-13):** ✅ PASSED — ran the worktree bundle on emulator-5554 (junction node_modules + fresh Metro from worktree). Verdicts below.

### Hat-3 verdicts (emulator)
| Scenario | Verdict | Evidence |
|---|---|---|
| 1 — Settings → Activities, empty state | ✅ | Row opens ActivitiesScreen; "No activities yet" + dashed add (not a broken box). |
| 2 — Add recurring activity (UI write path) | ✅ | Saved row persisted: recurring + saturday + active (DB-confirmed). Title/gear were Gboard IME artifacts, not app bugs. |
| 3 — Pool day template (pre-fill + icon) | ✅ | Card shows template water-icon + Swimsuit/Towel/Sunscreen/Water bottle; catalog logic unit-tested. |
| 4 — Child PackingCard + check-off + persist | ✅ | Gamer dark theme (theme-aware), body-double header, grouped w/ time anchors, child checked Swimsuit → green ✓, **persisted across remount** (AsyncStorage). No counter. |
| 5 — No-activity empty state | 🤔 code-verified | Today had activities; ActivitiesScreen empty state seen live; PackingCard empty path is a simple conditional (not exercised live). |
| 6 — Child-add (Teen direct / parent approve) | ✅ | Parent approval strip → Approve flipped proposed→active (DB-confirmed). Child "+ Add my own" opens; teen sees direct-add (no propose note) after the preview-mode fix. Full teen-save tap blocked by IME (title typing) — Hat-4 quick confirm. |

### 🐛 Bugs found + fixed during Hat-3
- **BUG-2026-06-13-01 (High, FIXED):** `permission denied for table activities` — tables made via MCP `apply_migration` don't inherit Supabase default role grants. Fix: migration 028 (+ folded into 026) `GRANT … TO anon, authenticated`. Verified: fetch clean after fix.
- **BUG-2026-06-13-02 (Medium, FIXED):** `ChildAddActivityScreen` used `useAuth().profile` for childId + teen-detection → wrong in View-as-Child (auth profile is the parent). Fix: derive `childId` from `previewChildId` and fetch the previewed child's `age_group`. Verified: teen propose-note correctly disappears for Itay.

- **Hat-4 (real device):** remaining — full teen-direct save via real keyboard, EN/Hebrew RTL, no-activity empty card. Checklist below.

## Hat-4 device checklist (Adi)
1. Parent → Settings → "חוגים ופעילויות" → add a recurring חוג (weekday + time + gear) and a one-off pool day (template).
2. Child (Mint + Gamer) dashboards on that activity's day → "נארוז יחד?" card shows today's gear → tap items → check-off persists on reload → resets next day.
3. No activity today → card shows "היום אין מה לארוז — תהנו!" (not an empty box).
4. Child taps "+ הוסף לעצמי": on a Teen (12+) profile → appears immediately; on a young child → "נשלח לאישור", and the parent sees it in the approval strip → Approve → it appears.
5. EN + Hebrew RTL both read correctly.

## Open follow-ups
- Packing-template content is seed-only — Adi supplies final lists (D5), a data edit in `lib/packingTemplates/catalog.ts`.
- Propose GAP_ANALYSIS row to Adi (SPEC_SYNC).
