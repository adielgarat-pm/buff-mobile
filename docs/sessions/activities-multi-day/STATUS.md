# STATUS — activities-multi-day

One recurring activity can now meet on several weekdays (Noa tester feedback, 2026-07-31). `ActivitySchedule.recurring`: single `weekday` → non-empty `weekdays[]`.

| Phase | State | Date | Commit | Tests | Learnings |
|---|---|---|---|---|---|
| 0. SPEC + three-lens review (architect/PM/UX) | ✅ done | 2026-07-31 | `docs/spec-activities-multi-day` | all GO-WITH-CHANGES | — |
| 1. Data + migration 054 (weekdays jsonb + backfill) | ✅ done | 2026-07-31 | `81f41c7` | tsc clean; jest 25 (multi-day match/fail-safe, coerceWeekdays) | IN-2026-07-31 |
| 2. Parent multi-select UI + i18n (he+en) | ✅ done | 2026-07-31 | `1439586` | tsc clean; jest 67 (multi-day payload deduped/ordered, min-1 no-op) | — |
| 3. Exit (docs, RELEASE_QUEUE, learnings, Values re-check) | ✅ done | 2026-07-31 | _(this branch)_ | — | IN-2026-07-31 |

## Verified (Hat-1)
- `tsc --noEmit` clean.
- jest green: `activeOnDate` multi-day across all 7 days + empty-array fail-safe; `coerceWeekdays`/`normalizeWeekdays` (untrusted-jsonb boundary); parent multi-select payload (deduped, Sun→Sat); min-1 guard no-op.
- Migration 054 applied to mobile Supabase + backfill verified: 6 recurring rows → `weekdays = [weekday]`, 0 mismatch; 3 one-off rows `weekdays` NULL.

## NOT yet verified (Hat-3 / Hat-4 — parent screen is auth-gated)
- 🚩 **Hat-3 (emulator + Expo web):** create a Sun+Tue+Thu חוג → child packing card shows it on each of those days and not others → edit removes a day → that day stops showing → archive hides all.
- 🚩 **Hat-4:** RTL (he) + EN label wording ("כל ראשון, שלישי, חמישי" / "Every Sun, Tue, Thu"; all-7 "כל יום"/"Every day"), real-device pill feel + hint line.

## Delivery (per surface, once merged to `main`)
- **DB:** migration 054 already live on mobile Supabase (applied 2026-07-31).
- **Web:** client-only → live from `main` on next deploy.
- **Android:** client-only → needs an **OTA** (no native change).

## Follow-up (separate package, later)
Cleanup: drop legacy `weekday` column + the dual-write + add the strict `recurring ⇒ non-empty weekdays` CHECK, after old app builds age out. Also separate: `activities-discoverability` (surfacing the organizer — explicitly out of scope here).
