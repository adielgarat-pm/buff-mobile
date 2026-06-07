import type { Task } from '../../types/task';
import { isTaskVisibleOn, toDateKey } from '../taskScheduling';

function task(partial: Partial<Task>): Task {
  return {
    id: 'x',
    title: 't',
    time: '08:00',
    category: 'learning',
    credits: 10,
    completed: false,
    ...partial,
  };
}

// 2026-06-08 is a Monday (weekday 1). 2026-06-13 is a Saturday (weekday 6).
const MON = '2026-06-08';
const TUE = '2026-06-09';
const SAT = '2026-06-13';

describe('toDateKey', () => {
  test('formats local date', () => {
    expect(toDateKey(new Date(2026, 5, 8))).toBe('2026-06-08');
  });
});

describe('isTaskVisibleOn — one-time (dueDate set)', () => {
  const ctx = { isWeekend: false };
  test('visible only on its date', () => {
    const t = task({ dueDate: MON, scheduleDays: [] });
    expect(isTaskVisibleOn(t, MON, ctx)).toBe(true);
    expect(isTaskVisibleOn(t, TUE, ctx)).toBe(false);
  });
  test('shows on its date even if that weekday is not in scheduleDays', () => {
    const t = task({ dueDate: MON, scheduleDays: [4] }); // Thu only
    expect(isTaskVisibleOn(t, MON, ctx)).toBe(true);
  });
  test('shows on its date even on a weekend with hideOnWeekend', () => {
    const t = task({ dueDate: SAT, hideOnWeekend: true });
    expect(isTaskVisibleOn(t, SAT, { isWeekend: true })).toBe(true);
  });
});

describe('isTaskVisibleOn — recurring (dueDate undefined) parity with old logic', () => {
  // old logic: scheduleDays.includes(weekday) && !(isWeekend && hideOnWeekend)
  function old(t: Task, dateKey: string, isWeekend: boolean): boolean {
    const weekday = new Date(dateKey + 'T00:00:00').getDay();
    const sd = t.scheduleDays ?? [0, 1, 2, 3, 4, 5];
    if (!sd.includes(weekday)) return false;
    if (isWeekend && t.hideOnWeekend) return false;
    return true;
  }
  const cases: Task[] = [
    task({}),
    task({ scheduleDays: [1, 4] }),
    task({ scheduleDays: [0, 1, 2, 3, 4, 5, 6], hideOnWeekend: true }),
    task({ scheduleDays: [6] }),
  ];
  for (const t of cases) {
    for (const [dateKey, isWeekend] of [[MON, false], [TUE, false], [SAT, true]] as const) {
      test(`parity sd=${JSON.stringify(t.scheduleDays)} hide=${t.hideOnWeekend} ${dateKey}`, () => {
        expect(isTaskVisibleOn(t, dateKey, { isWeekend })).toBe(old(t, dateKey, isWeekend));
      });
    }
  }
});
