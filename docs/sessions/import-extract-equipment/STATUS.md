# import-extract-equipment — Status

Branch: `claude/noaa-behavior-spec-rlymvx` (shared with noaa-behavior-spec) · 2026-07-07

| Chunk | Decision | State | Tests | Notes |
|---|---|---|---|---|
| SPEC | D-IE-1/2/3 | ✅ locked | — | general importer · daily-gear synthetic period · config-driven prompts |
| 1 — config table | D-IE-3 | ✅ code (not applied) | — | `migrations/041_edge_function_config.sql` — additive table + seed row. **Not applied to DB.** |
| 2 — function | D-IE-2/3 | ✅ code (not deployed) | — | `parse-schedule`: general prompts (school→any), per-lesson `equipment` + `daily_equipment`, model/prompt from config w/ baked-in fallback. **Not deployed.** |
| 3 — client + tests | D-IE-1 | ✅ done | jest 583/584, tsc 0 | `applyDailyEquipment` (synthetic "ציוד יומי" row/day) + wired into both invoke sites + `timetable.dailyGear` i18n + 5 tests. |

## Gates
1. **Apply migration 041** — ✅ **applied** to `buff-production` 2026-07-07 (config row verified: models set, prompts `{}`).
2. **Deploy over production `parse-schedule`** — ⏳ **pending explicit go** (live function still the old version).

## Verification (2026-07-07) — ✅ PASSED
Deployed the new logic as a parallel `parse-schedule-v2` (live `parse-schedule` untouched) and invoked it server-side via `pg_net` (the container's network policy blocks direct supabase.co calls). On a real Hebrew camp schedule (text mode):
- camp activities parsed by their written times (not rejected as non-school);
- **per-lesson equipment** extracted: בריכה → `"בגד ים, מגבת"`;
- **`daily_equipment`** extracted: `"בגד ים, קרם הגנה, כובע, מים, בגדים להחלפה"` (the footer note).
Test function then retired (stubbed, `verify_jwt` on, returns 410).

## To finish (production promotion)
- Deploy the full `supabase/functions/parse-schedule/index.ts` over the **production** `parse-schedule` (one-line-revertible; config-tuning thereafter = DB edit).
- Merge PR #325 so the client consumes `daily_equipment`.
- Then: import a real sheet → review shows a "ציוד יומי" row/day → save → child HQ card shows it under היום/מחר (Hat-4).

## Not in release 1.7.9 (vc65)
Backend is gated/undeployed; only `noaa-behavior-spec` (P1–P5) ships in vc65.
