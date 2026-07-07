# SPEC — Extract equipment from imported schedules

**Slug:** `import-extract-equipment` · **Proposed branch:** `pkg/import-extract-equipment`
**Status:** SPEC — **awaiting `approved, proceed`** (deployment of the Edge Function gated separately)
**Author:** CC · **Date:** 2026-07-07
**Origin:** Adi — after Noa's camp file: a camp/school file already contains the gear list ("swimsuit/sunscreen/hat/water/change — in the bag every day"), so gear should come **from what you import**, not only from fixed templates.

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

## Goal

When a parent imports a schedule (photo / paste / Excel), BUFF extracts the gear the file already lists — both **per-lesson** equipment and a **daily "always in the bag"** note — and surfaces it on the child's packing card, with **no retyping**. Templates stay as the no-file fallback (they compose, neither replaces the other).

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
4. **Note (not school-only):** loosen the prompts from "SCHOOL schedule" to "school **or camp/activity** schedule" so camp activities (בריכה, סרט, הפנינג) and non-Sun–Fri dated grids aren't fought by the model. Small wording change; keeps the Israeli-week guidance as a hint, not a filter.

### B. Client `TimetableScreen.tsx` + `timetableParser.ts` (small)

- `processApiResponse` already maps `t.equipment` → **nothing to change per-lesson**.
- **Daily gear:** `TimetableScreen` reads `data.tasks` today; also read `data.daily_equipment`. Represent it as **one synthetic period per day** titled from a new i18n `timetable.dailyGear` ("ציוד יומי" / "Daily gear") with `equipment = daily_equipment`, so it renders as its own clearly-labelled group in BagPrep and the HQ PackingCard (grouping is by subject). **No timetable model change** — it's just a `PeriodInfo`. (Alternative — a day-level equipment field on `Timetable` — is cleaner but touches the type + every consumer; deferred unless Adi prefers it.)
- The review screen already shows/edits per-lesson equipment; the daily-gear pseudo-rows are editable/removable like any period.
- i18n: `timetable.dailyGear` (he + en).

### C. Tests

- `parse-schedule` has no unit tests today (Edge/Deno). Add **client** coverage: `processApiResponse` carries `equipment` (extend existing suite); daily-gear → synthetic-period expansion in the TimetableScreen mapping helper. Hat-1.

---

## Decisions for Adi

- **D-IE-1 — daily-gear representation:** (A, recommended) synthetic "ציוד יומי" period per day (no model change) · (B) new day-level equipment field on `Timetable` (cleaner, heavier).
- **D-IE-2 — templates vs import:** keep templates as the no-file fallback (recommended), import-extraction is authoritative when a file exists. Confirm we are **adding**, not replacing.
- **D-IE-3 — deploy:** the Function change is inert until deployed to the Supabase project. Deploy is a **separate explicit approval** (production surface).

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
- Multi-week dated camp grids still collapse to weekdays (timetable is weekly) — out of scope; the gear is what matters here.

## Values Check

- **P1** ✅ gear serves a thing the child already does (camp); no reward loop. **P2** ✅ calm list, no counter (inherits packing-surface constraints). **P3** ✅ removes retyping friction; the child still owns the check-off. Passes 9/9 (re-verify at exit).
