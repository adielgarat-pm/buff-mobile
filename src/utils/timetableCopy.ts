/**
 * timetableCopy — pure day-duplication logic for the schedule editor.
 *
 * Feature: pkg/timetable-copy-day (real-user request, Noa 2026-07-06:
 * "לאפשר לשכפל שיעורים מיום אחד ליום אחר"). Real schedules repeat — a camp
 * day or school day is mostly identical across the week; retyping every
 * lesson + its gear list per day was the #1 entry-effort complaint.
 *
 * Pure function over the in-editor `Timetable` value
 * (`Record<WeekDay, PeriodInfo[]>`): no I/O, persisted only by the screen's
 * existing save flow.
 */
import type { Timetable, WeekDay, PeriodInfo } from '../types/timetable';

export type CopyDayMode = 'replace' | 'append';

/**
 * Copy `source` day's lessons into each of `targets`.
 *
 * - Rows are deep-copied (`PeriodInfo` is flat) — targets never share object
 *   references with the source or with each other, so editing Monday can
 *   never silently edit Tuesday.
 * - `mode === 'replace'`: target day becomes an exact copy.
 * - `mode === 'append'`: copies are appended and the day is re-sorted by
 *   startTime so the timeline stays coherent.
 * - `source` inside `targets` is ignored (no self-copy).
 */
export function copyTimetableDay(
  timetable: Timetable,
  source: WeekDay,
  targets: WeekDay[],
  mode: CopyDayMode,
): Timetable {
  const sourceRows = timetable[source] ?? [];
  const next: Timetable = { ...timetable };

  for (const day of targets) {
    if (day === source) continue;
    const copied: PeriodInfo[] = sourceRows.map(p => ({ ...p }));
    next[day] = mode === 'append'
      ? [...(next[day] ?? []).map(p => ({ ...p })), ...copied]
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
      : copied;
  }

  return next;
}

/** Does `day` already contain any real (named) lesson? Drives the
 *  replace/append confirmation — we never silently overwrite. */
export function dayHasLessons(timetable: Timetable, day: WeekDay): boolean {
  return (timetable[day] ?? []).some(p => p.subject.trim().length > 0);
}
