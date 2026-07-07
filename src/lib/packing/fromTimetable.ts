/**
 * Bridge: school-timetable equipment → the unified child packing surface.
 *
 * The HQ dashboard PackingCard was activities-only, so camp/lesson gear a parent
 * typed into the school timetable (TimetableScreen) was invisible there — it only
 * showed on the separate ChildBagPrepScreen. This module reshapes timetable
 * equipment into the same `PackingGroup[]` the card already renders, so both
 * sources appear in one place (noaa-behavior-spec D1).
 *
 * This is the one module allowed to import BOTH domains (activities + timetable);
 * lib/activities/packing.ts stays activities-only.
 */
import type { PackingGroup } from '../../types/activities';
import type { Timetable, WeekDay } from '../../types/timetable';
import { weekdayOf } from '../activities/packing';

/** Split a comma-separated (Latin or Arabic comma) equipment string into items. */
export function splitEquipment(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[,،]/).map((s) => s.trim()).filter(Boolean);
}

/** The date's school weekday, or null on Saturday (the timetable has no Saturday). */
function toSchoolWeekday(dateStr: string): WeekDay | null {
  const wd = weekdayOf(dateStr); // ActivityWeekday | null, includes 'saturday'
  return wd && wd !== 'saturday' ? (wd as WeekDay) : null;
}

/**
 * Timetable equipment for `dateStr`, shaped as PackingGroup[] for the child card.
 * One group per subject — periods sharing a subject are merged and items are
 * de-duplicated (order-preserving). A subject with no equipment is dropped
 * (nothing to pack). The group's time is the earliest period start for that
 * subject. Returns [] on Saturday or an empty/absent day.
 */
export function buildTimetableGroups(timetable: Timetable, dateStr: string): PackingGroup[] {
  const wd = toSchoolWeekday(dateStr);
  if (!wd) return [];
  const periods = timetable[wd] ?? [];

  const bySubject = new Map<string, { time: string | null; items: string[]; seen: Set<string> }>();
  for (const p of periods) {
    const items = splitEquipment(p.equipment);
    if (items.length === 0) continue;
    const key = p.subject ?? '';
    let g = bySubject.get(key);
    if (!g) {
      g = { time: p.startTime || null, items: [], seen: new Set() };
      bySubject.set(key, g);
    } else if (p.startTime && (!g.time || p.startTime < g.time)) {
      g.time = p.startTime;
    }
    for (const it of items) {
      if (!g.seen.has(it)) { g.seen.add(it); g.items.push(it); }
    }
  }

  return [...bySubject.entries()]
    .filter(([, g]) => g.items.length > 0)
    .map(([subject, g]) => ({
      source: 'school' as const,
      templateId: null,
      title: subject,
      time: g.time,
      items: g.items,
    }));
}
