/**
 * Pure logic for "what is on today, and what gets packed" — no React, no I/O,
 * fully unit-testable. The hook (useActivities) does the fetching; this file
 * decides which activities match a given day and shapes them for the child.
 *
 * See docs/sessions/activities-and-camp-lists/SPEC.md.
 */
import {
  ACTIVITY_WEEKDAYS,
  type Activity,
  type ActivityWeekday,
  type PackingGroup,
} from '../../types/activities';

/** ISO date "YYYY-MM-DD" matcher (shape only, not calendar validity). */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The weekday of a "YYYY-MM-DD" string, parsed locally (no timezone shift).
 * Returns null for a malformed string rather than throwing.
 */
export function weekdayOf(dateStr: string): ActivityWeekday | null {
  if (!ISO_DATE.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  // Construct at local noon so DST / TZ never tips the day over a boundary.
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return ACTIVITY_WEEKDAYS[dt.getDay()] ?? null;
}

/**
 * Is this activity scheduled on `dateStr`?
 * - recurring → the date's weekday equals the activity's weekday
 * - oneoff    → the date equals the activity's date
 * Archived activities never match.
 */
export function activeOnDate(activity: Activity, dateStr: string): boolean {
  if (activity.status !== 'active') return false;
  const { schedule } = activity;
  if (schedule.kind === 'recurring') {
    return weekdayOf(dateStr) === schedule.weekday;
  }
  return schedule.date === dateStr;
}

/**
 * Does this activity apply to `childId`?
 * A null childId on the activity means "whole family" → applies to everyone.
 */
export function appliesToChild(activity: Activity, childId: string): boolean {
  return activity.childId === null || activity.childId === childId;
}

/**
 * Build the child-facing packing groups for one child on one day.
 * Activities with no equipment are dropped (nothing to pack). Recurring
 * activities sort before/after one-offs only by time, then title, so the
 * order is stable and deterministic for tests.
 */
export function buildPackingGroups(
  activities: Activity[],
  childId: string,
  dateStr: string,
): PackingGroup[] {
  return activities
    .filter((a) => appliesToChild(a, childId) && activeOnDate(a, dateStr))
    .filter((a) => a.equipment.length > 0)
    .sort(sortForDisplay)
    .map((a) => ({
      source: 'activity' as const,
      templateId: a.templateId,
      title: a.title,
      time: a.time,
      items: a.equipment,
    }));
}

/** Timed activities first (earliest → latest), then untimed, then by title. */
function sortForDisplay(a: Activity, b: Activity): number {
  if (a.time && b.time) return a.time < b.time ? -1 : a.time > b.time ? 1 : a.title.localeCompare(b.title);
  if (a.time && !b.time) return -1;
  if (!a.time && b.time) return 1;
  return a.title.localeCompare(b.title);
}
