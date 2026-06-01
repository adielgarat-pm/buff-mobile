/**
 * timeOfDay → concrete HH:MM, and domain → default TaskCategory.
 *
 * This replaces UStep5's positional `TASK_TIMES[index]` assignment (the bug
 * where "screens off before bed" got 16:00 because it was 2nd in the list).
 * Now the *meaning* of the task fixes its time.
 */
import type { TaskCategory } from '../../../../types/task';
import type { Domain, TimeOfDay } from './types';

/** Buckets: morning ~07–09 · school 09–14 · afternoon ~14–18 · evening ~19–21. */
export const TIME_OF_DAY_TO_HHMM: Record<TimeOfDay, string> = {
  morning: '08:00',
  school: '12:00',
  afternoon: '16:00',
  evening: '20:00',
};

export function hhmmFor(timeOfDay: TimeOfDay): string {
  return TIME_OF_DAY_TO_HHMM[timeOfDay];
}

/** Default category per domain (a task may override via `category`). */
export const DOMAIN_TO_CATEGORY: Record<Domain, TaskCategory> = {
  1: 'self-care',      // morning routine
  2: 'learning',       // homework
  3: 'organization',   // organisation
  4: 'responsibility', // screens
  5: 'self-care',      // confidence / social-emotional
  6: 'responsibility', // time management
  7: 'responsibility', // independence
};

export function categoryFor(domain: Domain, override?: TaskCategory): TaskCategory {
  return override ?? DOMAIN_TO_CATEGORY[domain];
}
