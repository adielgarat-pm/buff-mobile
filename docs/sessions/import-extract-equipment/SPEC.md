# SPEC — Extract equipment from imported schedules

**Slug:** `import-extract-equipment` · **Proposed branch:** `pkg/import-extract-equipment`
**Status:** SPEC — **awaiting `approved, proceed`** (deploy done safely via a parallel function; see D-IE-3)
**Author:** CC · **Date:** 2026-07-07
**Origin:** Adi — after Noa's camp file. **Adi's framing (D-IE-2, 2026-07-07):** the importer should handle **ANY kind of schedule file** and load it by **the hours / lessons written in it** — not assume a school template. Gear comes from what you import. Templates are at most a no-file convenience, not the point.

### Decisions locked (2026-07-07)
- **D-IE-1 = A** — daily gear as a synthetic "ציוד יומי" period per day (no timetable model change).
- **D-IE-2 = general importer** — parse ANY file by its own times/lessons; do **not** center on templates. See revised Goal/Scope.
- **D-IE-3 = config-driven** (Adi 2026-07-07): deploy the function **once** with prompts/model read from a DB config table; thereafter fix/tune via a DB edit, **no redeploy**. See §Deploy & tuning.

> Companion to `noaa-behavior-spec` (which unified the packing *surface*). This is the *import* layer. No code changes until approved; **the Edge Function deploy touches production and needs its own explicit go-ahead.**

---

## 0. One-line insight

The client pipeline **already carries per-lesson equipment end-to-end** — the AI Edge Function is the only step that never emits it. We are paying for the OCR pass and throwing the gear away.

Anchors:
- `timetableParser.ts:499` — `ParsedPeriod.equipment?` exists.
- `timetableParser.ts:536` — `processApiResponse` already reads `equipment: t.equipment ?? ''` from each task.
- `timetableParser.ts:567` — `periodsToTimetable` already writes `equipment` onto `PeriodInfo`.
- Excel path already extracts an equipment column (`timetableParser.ts:42,462,475`).
- `TimetableScreen` already has an editable per-lesson equipment field; BagPrep renders it; and (post `noaa-behavior-spec` P2) the HQ PackingCard renders it too.
- **Gap:** `supabase/functions/parse-schedule/index.ts` — `ParsedLesson`/`ParsedTask` have **no** equipment field; the image/text/excel prompts never ask for it. So `t.equipment` is always undefined.

---

## Goal (revised per D-IE-2)

Make the importer **format- and layout-agnostic**: a parent uploads **any** schedule file — school timetable, camp grid, a חוג sheet, photo / paste / Excel — and BUFF loads it **by the times and lessons actually written in it**, not by a school template. As part of the same pass it extracts the gear the file lists (per-lesson **and** a daily "always in the bag" note) and surfaces it on the child's packing card, with **no retyping**.

**Honest boundary (not a non-goal, a model fact):** the importer can *parse* any layout, but storage is a **weekly Sun–Fri grid** (`Timetable`). A dated camp week (Wed 8.7, Thu 9.7, Sun–Tue 12–14.7) is loaded by **weekday** (dates drop). True dated/multi-week schedules are a separate model question, flagged, not solved here. The review screen is the safety net — the parent confirms/fixes whatever OCR read before it saves.

Templates (`packingTemplates`) remain only as a **no-file** convenience for a parent who has nothing to upload; they are not the mechanism here.

---

## Changes

### A. Edge Function `parse-schedule/index.ts` (the core; ~1 file)

1. **Types:** add `equipment?: string` to `ParsedLesson` and `ParsedTask`.
2. **Prompts (image / text / excel):** extend the OUTPUT schema + one instruction line so the model returns per-lesson gear and a daily note. E.g. image OUTPUT becomes:
   ```
   {"lessons":[{"day":"יום ב'","row_index":1,"start_time":"08:00","lesson_name":"מתמטיקה","equipment":"מחשבון, סרגל"}, …],
    "daily_equipment":"בגד ים, קרם הגנה, כובע, מים, בגדים להחלפה"}
   ```
   Instruction: *"If a lesson lists gear to bring, put it in `equipment` (comma-separated). If the sheet has a general/daily 'bring every day' note (often a footer), return it once in top-level `daily_equipment`."* Keep ZERO-DATA-LOSS framing. Cost: same OCR pass, a few dozen more output tokens — negligible.
3. **Threading:** carry `equipment` through `lessonsToTasks` → `ParsedTask.equipment`; return `daily_equipment` alongside `tasks`:
   `return { tasks: parsedTasks, daily_equipment }` (all three modes).
3b. **Config-read (D-IE-3):** load `edge_function_config.parse_schedule` via a service-role client and use `value.prompts[mode]` / `value.models[mode]`; fall back to the baked-in defaults if missing/unreadable so a DB issue never breaks parsing. This is what lets prompt/model tuning be a DB edit, not a redeploy (see §Deploy & tuning).
4. **Generalise the parser (D-IE-2) — the headline change:** rewrite the prompts from "Hebrew **SCHOOL** schedule, Sunday–Friday subjects" to **"any weekly schedule — school, camp, or activities — parsed by the times and labels written in it."** Camp activities (בריכה, סרט, הפנינג, חוג מקצועי) are valid `lesson_name`s, not rejects; dated column headers ("רביעי 8.7") map to their weekday; the Israeli-week text becomes a *hint*, not a filter that drops rows. Keep ZERO-DATA-LOSS. This is what lets "any kind of file" load, per Adi's framing.

### B. Client `TimetableScreen.tsx` + `timetableParser.ts` (small)

- `processApiResponse` already maps `t.equipment` → **nothing to change per-lesson**.
- **Daily gear:** `TimetableScreen` reads `data.tasks` today; also read `data.daily_equipment`. Represent it as **one synthetic period per day** titled from a new i18n `timetable.dailyGear` ("ציוד יומי" / "Daily gear") with `equipment = daily_equipment`, so it renders as its own clearly-labelled group in BagPrep and the HQ PackingCard (grouping is by subject). **No timetable model change** — it's just a `PeriodInfo`. (Alternative — a day-level equipment field on `Timetable` — is cleaner but touches the type + every consumer; deferred unless Adi prefers it.)
- The review screen already shows/edits per-lesson equipment; the daily-gear pseudo-rows are editable/removable like any period.
- i18n: `timetable.dailyGear` (he + en).

### C. Tests

- `parse-schedule` has no unit tests today (Edge/Deno). Add **client** coverage: `processApiResponse` carries `equipment` (extend existing suite); daily-gear → synthetic-period expansion in the TimetableScreen mapping helper. Hat-1.

---

## Deploy & tuning — config-driven (D-IE-3, per Adi 2026-07-07)

**Adi's preference:** be able to fix/tune the function **via DB config, without a new deploy** when there are problems.

**Why a deploy is needed at all (once):** the parser is **server-side** — a Supabase Edge Function that holds `ANTHROPIC_API_KEY` and calls Claude. The app only *invokes* it (`TimetableScreen.tsx:241` `supabase.functions.invoke('parse-schedule')`). So the equipment-threading + config-reading **code** has to be deployed once.

**After that one deploy, the volatile parts live in the DB — no more deploys to fix problems:**

### New config table (migration — additive, low-risk)
```
edge_function_config ( key text primary key, value jsonb not null, updated_at timestamptz default now() )
-- seed row: key='parse_schedule', value = { prompts:{image,text,excel}, models:{image,text,excel} }
-- RLS: no public access; the function reads it with the service-role key (bypasses RLS). Config holds
--      prompts only (no secrets), never exposed to clients.
```

### Function reads config at runtime, with baked-in fallback
On each invoke the function loads the `parse_schedule` row (service-role client) and uses `value.prompts[mode]` / `value.models[mode]`. **If the row is missing or the DB read fails, it falls back to hardcoded defaults** — a DB problem can never break parsing.

### Tuning = a DB edit, instant + revertible
Prompt not extracting a camp footer well? Model too slow? → `UPDATE edge_function_config SET value = … WHERE key='parse_schedule'` (via Supabase MCP `execute_sql`). Takes effect on the next import — **no deploy, no version.** Rollback = restore the previous JSON (keep a copy before each edit).

### What stays in code vs config
- **Config (DB, tune freely):** the prompt wording, model per mode, and any keyword lists we choose to externalise.
- **Code (needs the one deploy):** output-schema handling + equipment/`daily_equipment` threading (structural, stable).

**Gates (both one-time, explicit approval):** (1) the additive migration for `edge_function_config`; (2) the single function deploy. After those, iteration is config-only. CC will not run either without Adi's go.

---

## Efficiency / cost

Near-zero marginal cost: the OCR/text/excel model call already runs and already "sees" the gear; we only enlarge the requested JSON. Real change is concentrated in one Function file + a small client addition for the daily note; the per-lesson path is already wired.

---

## Verification

- **Hat-1:** tsc + jest (client mapping).
- **Function:** invoke `parse-schedule` on a few real files (incl. Noa's camp sheet) via a staging/manual call **after** Adi approves deploy; confirm `equipment` + `daily_equipment` populate and land in the review screen.
- **Hat-3/Hat-4:** import → review shows gear → save → child HQ PackingCard shows it under "היום/מחר".

## Non-goals

- No change to the packing *surfaces* (owned by `noaa-behavior-spec`).
- No OCR engine swap; no new dependency.
- **True dated / multi-week schedules** (storing actual calendar dates instead of weekdays) — a `Timetable`-model question, flagged for a later package, not this one.
- Not deleting or replacing the packing templates (they stay as the no-file path).

## Values Check

- **P1** ✅ gear serves a thing the child already does (camp); no reward loop. **P2** ✅ calm list, no counter (inherits packing-surface constraints). **P3** ✅ removes retyping friction; the child still owns the check-off. Passes 9/9 (re-verify at exit).
