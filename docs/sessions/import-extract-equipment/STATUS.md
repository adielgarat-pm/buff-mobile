# import-extract-equipment — Status

Branch: `claude/noaa-behavior-spec-rlymvx` (shared with noaa-behavior-spec) · 2026-07-07

| Chunk | Decision | State | Tests | Notes |
|---|---|---|---|---|
| SPEC | D-IE-1/2/3 | ✅ locked | — | general importer · daily-gear synthetic period · config-driven prompts |
| 1 — config table | D-IE-3 | ✅ code (not applied) | — | `migrations/041_edge_function_config.sql` — additive table + seed row. **Not applied to DB.** |
| 2 — function | D-IE-2/3 | ✅ code (not deployed) | — | `parse-schedule`: general prompts (school→any), per-lesson `equipment` + `daily_equipment`, model/prompt from config w/ baked-in fallback. **Not deployed.** |
| 3 — client + tests | D-IE-1 | ✅ done | jest 583/584, tsc 0 | `applyDailyEquipment` (synthetic "ציוד יומי" row/day) + wired into both invoke sites + `timetable.dailyGear` i18n + 5 tests. |

## Open gates (explicit approval, one-time each)
1. **Apply migration 041** to the Supabase project.
2. **Deploy `parse-schedule`** function.
After both: flip nothing else — the client already consumes `equipment` + `daily_equipment`. Tuning thereafter = `UPDATE edge_function_config` (no redeploy).

## Verify after deploy
- Invoke `parse-schedule` on Noa's camp sheet + a school sheet + Excel → `equipment` + `daily_equipment` populate; review screen shows a "ציוד יומי" row per day; save → child HQ card shows it under היום/מחר.

## Not in release 1.7.9 (vc65)
Backend is gated/undeployed; only `noaa-behavior-spec` (P1–P5) ships in vc65.
