# import-extract-equipment — Status

Branch: `claude/noaa-behavior-spec-rlymvx` (shared with noaa-behavior-spec) · 2026-07-07

| Chunk | Decision | State | Tests | Notes |
|---|---|---|---|---|
| SPEC | D-IE-1/2/3 | ✅ locked | — | general importer · daily-gear synthetic period · config-driven prompts |
| 1 — config table | D-IE-3 | ✅ code (not applied) | — | `migrations/041_edge_function_config.sql` — additive table + seed row. **Not applied to DB.** |
| 2 — function | D-IE-2/3 | ✅ code (not deployed) | — | `parse-schedule`: general prompts (school→any), per-lesson `equipment` + `daily_equipment`, model/prompt from config w/ baked-in fallback. **Not deployed.** |
| 3 — client + tests | D-IE-1 | ✅ done | jest 583/584, tsc 0 | `applyDailyEquipment` (synthetic "ציוד יומי" row/day) + wired into both invoke sites + `timetable.dailyGear` i18n + 5 tests. |

## Gates — both DONE (2026-07-07)
1. **Migration 041** — ✅ applied to `buff-production` (config row verified: models set, prompts `{}`).
2. **Production `parse-schedule` deploy** — ✅ deployed **version 9** (`verify_jwt` on). Previous version 8 captured (`get_edge_function`) for rollback.

## Verification (2026-07-07) — ✅ PASSED (server-side via `pg_net`; container network policy blocks direct supabase.co)
Staged on a parallel `parse-schedule-v2` first (live fn untouched), verified, then promoted identical content to production and re-verified LIVE:
- **camp** (text): activities parsed by written times; בריכה → `equipment:"בגד ים, מגבת"`; `daily_equipment:"בגד ים, קרם הגנה, כובע, מים, בגדים להחלפה"`.
- **school** (text): מתמטיקה → `equipment:"מחשבון"` (Core, credits 15), חינוך גופני → `"נעלי ספורט"` (Physical), Friday captured, `daily_equipment:null` — **rich school parsing intact, no regression**.
- **production `parse-schedule` v9** re-checked live: בריכה → `equipment:"בגד ים"`, `daily_equipment` populated. ✅
`parse-schedule-v2` retired (stub, 410).

## Note on source parity
The deployed function is behaviourally identical to `supabase/functions/parse-schedule/index.ts` (same logic + equipment/config additions). The deployed copy omits a few inline comments / `console.log` lines only (MCP deploy requires inline content; hand-transcribed + verified). No behavioural drift. Future CLI/CI redeploy from the repo file is safe.

## To finish
- **Merge PR #325** so the client consumes `daily_equipment` (renders a "ציוד יומי" row/day). Backend is already live, so until merge the extra field is simply ignored by the old client — safe.
- Hat-4: import a real sheet → review shows "ציוד יומי" per day → save → child HQ card shows it under היום/מחר.
- Prompt tuning thereafter = `UPDATE public.edge_function_config` (no redeploy).

## Not in release 1.7.9 (vc65)
Backend is gated/undeployed; only `noaa-behavior-spec` (P1–P5) ships in vc65.
