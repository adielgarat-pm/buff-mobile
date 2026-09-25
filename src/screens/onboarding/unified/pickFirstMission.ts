/**
 * pickFirstMission — choose the onboarding "first mission" task by time of day
 * (pkg/first-win P1c). Onboarding seeds tasks in buckets 08:00 / 12:00 / 16:00 /
 * 20:00 (starterTasks/timeOfDay.ts). The old rule took the earliest task by
 * `time`, so a parent signing up in the evening handed the child "morning
 * routine". This picks the task whose time is nearest to now, so the mission
 * fits the moment the family is actually in.
 *
 * Pure and deterministic: `nowMinutes` is injected. A task with no/blank/bad
 * `time` sorts last (it can't be "near now"), and ties keep the earlier task,
 * so the result is stable. Returns null only for an empty list.
 */
export interface MissionTask {
  id: string;
  title: string;
  time?: string | null;
}

/** Minutes-since-midnight for an "HH:MM" string, or null if unparseable. */
function toMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function pickFirstMission<T extends MissionTask>(
  tasks: readonly T[],
  nowMinutes: number,
): T | null {
  if (tasks.length === 0) return null;
  let best: T | null = null;
  let bestKey = Infinity;
  let bestTime = Infinity;
  tasks.forEach((task) => {
    const mins = toMinutes(task.time);
    // Distance to now; timeless tasks go last (Infinity). Tie-break on the
    // earlier clock time so the choice is stable and order-independent.
    const distance = mins == null ? Infinity : Math.abs(mins - nowMinutes);
    const time = mins == null ? Infinity : mins;
    if (best === null || distance < bestKey || (distance === bestKey && time < bestTime)) {
      best = task;
      bestKey = distance;
      bestTime = time;
    }
  });
  return best;
}
