/**
 * School-day / weekend logic — Israel week.
 *
 * Mirrors the Lovable web app (src/hooks/useSyncedTaskStore.ts `isWeekend`):
 *   - Saturday (6) is always weekend.
 *   - Friday (5) is weekend UNLESS the family enabled Friday school
 *     (`app_settings.friday_enabled`).
 *   - Sunday–Thursday (0–4) are always school days.
 *
 * This replaces the previous Western `isWeekday()` (Mon–Fri) heuristic that
 * was hardcoded in the task screens — which wrongly treated Sunday as a free
 * day and Friday as a school day. See pkg/school-free-day-parity SPEC.
 */

/** True if `day` (0=Sun … 6=Sat) is a weekend for this family. */
export function isWeekendDay(day: number, fridayEnabled: boolean): boolean {
  if (day === 5) return !fridayEnabled; // Friday: weekend unless family studies Friday
  return day === 6;                     // Saturday: always weekend
}

/** True if today is a weekend for this family. */
export function isWeekendToday(fridayEnabled: boolean): boolean {
  return isWeekendDay(new Date().getDay(), fridayEnabled);
}

/**
 * True if today is a school day for this child: a non-weekend day AND the
 * child's school quest is enabled. Used to gate the "School" phase.
 */
export function isSchoolDayToday(fridayEnabled: boolean, schoolQuestEnabled: boolean): boolean {
  return schoolQuestEnabled && !isWeekendToday(fridayEnabled);
}
