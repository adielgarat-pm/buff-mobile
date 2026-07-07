# Release v1.7.9 (versionCode 65)

## A. Technical
- versionName **1.7.9**, versionCode **65** (EAS remote autoIncrement).
- Prepared from branch `claude/noaa-behavior-spec-rlymvx`; cut after merge to `main`.
- Anchor: `1.7.8 (vc64)` (`b0e8cdb`).
- Change set: `188cc8e` remove child-packing approval gate · `49713d6` bridge timetable gear → child HQ card · `158dff7` today + tomorrow packing sections · `a4afff7` name child in View-as-Child banner.
- Gates: Gate 1 ✅ (tsc 0 · jest 578/579, 1 skipped · i18n parity · Values 9/9). Gate 2: web bundle clean; device flows → Hat-4.
- Schema: none in this build.

## B. User-facing — Play Store "What's new" (English)

Everything your child needs to pack, in one place.

- Your child's home screen now gathers **everything to pack** — school and camp gear from the timetable, plus their activities — into one "Let's pack" card, showing **today and tomorrow**.
- Kids can **add their own items** to pack, right away — no approval step.
- Clearer parent preview: the banner now shows **whose screen** you're viewing.

### Shorter variant (Play Store limit-friendly)
> One "Let's pack" card now shows your child everything to bring — school/camp gear and activities — for today and tomorrow. Kids can add their own items instantly. Parent preview now shows whose screen you're viewing.

## C. Notes
- No in-app "What's New" surface yet (FLAG F-2026-05-30-01) — these notes are for the Play Console listing.
- Separate work in progress (not in this build): importing a schedule file will also pull its equipment list (`import-extract-equipment`, backend gated).
