import { isScheduledOnDay, isTaskVisibleToday } from '../taskSchedule';

// Minimal task shape — the helpers only read scheduleDays + hideOnWeekend.
const task = (scheduleDays?: number[] | null, hideOnWeekend = false) =>
  ({ scheduleDays: scheduleDays ?? undefined, hideOnWeekend }) as any;

describe('isScheduledOnDay', () => {
  test('day in scheduleDays → true', () => {
    expect(isScheduledOnDay(task([1, 2, 3, 4, 5]), 2)).toBe(true); // Tue
  });
  test('day not in scheduleDays → false', () => {
    expect(isScheduledOnDay(task([1, 2, 3, 4, 5]), 0)).toBe(false); // Sun
    expect(isScheduledOnDay(task([1, 2, 3, 4, 5]), 6)).toBe(false); // Sat
  });
  test('null scheduleDays → every day', () => {
    for (let d = 0; d <= 6; d++) expect(isScheduledOnDay(task(null), d)).toBe(true);
  });
  test('empty scheduleDays → no day (paused/hidden)', () => {
    for (let d = 0; d <= 6; d++) expect(isScheduledOnDay(task([]), d)).toBe(false);
  });
  test('subset scheduleDays → only those days', () => {
    expect(isScheduledOnDay(task([1, 3]), 1)).toBe(true);
    expect(isScheduledOnDay(task([1, 3]), 2)).toBe(false);
  });
});

describe('isTaskVisibleToday', () => {
  test('scheduled + not weekend → visible', () => {
    expect(isTaskVisibleToday(task([0, 1, 2, 3, 4, 5, 6]), false, 1)).toBe(true);
  });
  test('not scheduled today → hidden regardless of weekend', () => {
    expect(isTaskVisibleToday(task([1, 2, 3, 4, 5]), false, 0)).toBe(false);
    expect(isTaskVisibleToday(task([1, 2, 3, 4, 5]), true, 6)).toBe(false);
  });
  test('hideOnWeekend drops out on a weekend day', () => {
    expect(isTaskVisibleToday(task([0, 1, 2, 3, 4, 5, 6], true), true, 6)).toBe(false);
  });
  test('hideOnWeekend still shows on a non-weekend day', () => {
    expect(isTaskVisibleToday(task([0, 1, 2, 3, 4, 5, 6], true), false, 1)).toBe(true);
  });
  test('null scheduleDays defaults to every day → visible today', () => {
    expect(isTaskVisibleToday(task(null), false, 3)).toBe(true);
  });
  test('empty scheduleDays → hidden today (parent paused the task)', () => {
    for (let d = 0; d <= 6; d++) expect(isTaskVisibleToday(task([]), false, d)).toBe(false);
  });
});
