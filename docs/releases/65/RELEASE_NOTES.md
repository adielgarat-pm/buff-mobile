# Release v1.7.9 (versionCode 65)

## A. Technical
- versionName **1.7.9**, versionCode **65** (EAS remote autoIncrement).
- Content in `main` via PR #325 (`95da550`) + PR #326 (`1e20c52`). Anchor: `1.7.8 (vc64)` (`b0e8cdb`).
- Change set: remove child-packing approval gate · bridge timetable gear → child HQ card · today + tomorrow packing sections · name child in View-as-Child banner · **import extracts equipment + daily gear** (client + live backend).
- Gates: Gate 1 ✅ (tsc 0 · jest 583/584, 1 skipped · i18n parity · Values 9/9). Gate 2: web bundle clean; device flows → Hat-4.
- Schema: no app-DB schema in the bundle. Server-side: `edge_function_config` table + `parse-schedule` v9 already deployed & verified live.

## B. User-facing — Play Store "What's new" (English)

Everything your child needs to pack, in one place.

- Your child's home screen now gathers **everything to pack** — school and camp gear from the timetable, plus their activities — into one "Let's pack" card, showing **today and tomorrow**.
- Kids can **add their own items** to pack, right away — no approval step.
- **Importing a schedule now also picks up the gear it lists** — including "bring every day" notes — so it shows up automatically.
- Clearer parent preview: the banner now shows **whose screen** you're viewing.

### Shorter variant (Play Store limit-friendly)
> One "Let's pack" card now shows your child everything to bring — school/camp gear and activities — for today and tomorrow, and imports pick up the gear from your schedule automatically. Kids can add their own items instantly. Parent preview now shows whose screen you're viewing.

## C. Notes
- No in-app "What's New" surface yet (FLAG F-2026-05-30-01) — these notes are for the Play Console listing.
- Server-side parse-schedule prompt/model are tunable via `edge_function_config` (DB edit, no redeploy).
