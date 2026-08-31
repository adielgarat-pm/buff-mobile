import type { Task } from '../../types/task';
import {
  isTaskVisibleOn, toDateKey, countVisibleTasks,
  scheduledDaysInWindow, completionRateOverWindow,
} from '../taskScheduling';

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

describe('isTaskVisibleOn — recurring (dueDate undefined) parity with reference logic', () => {
  // reference: scheduleDays.includes(weekday) && !(isWeekend && hideOnWeekend)
  // null default = all 7 days (aligned with utils/taskSchedule.ts, pkg
  // fix-pause-visibility-child; the previous [0..5] default hid legacy
  // null-days tasks on Saturday).
  function old(t: Task, dateKey: string, isWeekend: boolean): boolean {
    const weekday = new Date(dateKey + 'T00:00:00').getDay();
    const sd = t.scheduleDays ?? [0, 1, 2, 3, 4, 5, 6];
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

describe('isTaskVisibleOn — pause + defaults (fix-pause-visibility-child)', () => {
  test('paused task (explicit []) is hidden on every day', () => {
    const t = task({ scheduleDays: [] });
    expect(isTaskVisibleOn(t, MON, { isWeekend: false })).toBe(false);
    expect(isTaskVisibleOn(t, TUE, { isWeekend: false })).toBe(false);
    expect(isTaskVisibleOn(t, SAT, { isWeekend: true })).toBe(false);
  });

  test('legacy null scheduleDays shows every day — including Saturday', () => {
    const t = task({ scheduleDays: undefined });
    expect(isTaskVisibleOn(t, MON, { isWeekend: false })).toBe(true);
    expect(isTaskVisibleOn(t, SAT, { isWeekend: true })).toBe(true);
  });
});

describe('countVisibleTasks — parent dashboard day-filtered counts (H3)', () => {
  // A representative multi-schedule child: 2 daily, 1 Monday-only, 1 weekend-
  // hidden, 1 future-dated one-time, 1 past-dated one-time.
  const tasks = [
    { id: 'daily-a',   scheduleDays: undefined },              // every day
    { id: 'daily-b',   scheduleDays: [0, 1, 2, 3, 4, 5, 6] },  // every day
    { id: 'mon-only',  scheduleDays: [1] },                    // Monday only
    { id: 'no-wknd',   scheduleDays: undefined, hideOnWeekend: true },
    { id: 'future-1x', dueDate: '2026-06-20' },                // one-time, later
    { id: 'past-1x',   dueDate: '2026-06-01' },                // one-time, earlier
  ];

  test('Tuesday: only the recurring weekday tasks count (no Mon-only, no dated)', () => {
    // TUE is a weekday → hideOnWeekend task still shows; mon-only hidden;
    // dated tasks only show on their exact date.
    const { total, completed } = countVisibleTasks(tasks, new Set(), TUE, { isWeekend: false });
    expect(total).toBe(3); // daily-a, daily-b, no-wknd
  });

  test('past-dated one-time task never inflates the total', () => {
    const { total } = countVisibleTasks(tasks, new Set(), TUE, { isWeekend: false });
    // past-1x (2026-06-01) is not visible on TUE → excluded.
    expect(total).toBe(3);
  });

  test('all of today\'s visible tasks complete → completed === total ("all done" registers)', () => {
    const done = new Set(['daily-a', 'daily-b', 'no-wknd']);
    const { total, completed } = countVisibleTasks(tasks, done, TUE, { isWeekend: false });
    expect(completed).toBe(total);
    expect(total).toBe(3);
  });

  test('weekend hides hideOnWeekend tasks (Saturday)', () => {
    const { total } = countVisibleTasks(tasks, new Set(), SAT, { isWeekend: true });
    // daily-a + daily-b show Saturday (null/all-7); no-wknd hidden; mon-only no.
    expect(total).toBe(2);
  });

  test('one-time task counts only on its exact date', () => {
    // 2026-06-20 is a Saturday (weekend) → no-wknd hidden; daily-a, daily-b, and
    // future-1x (dated exactly today) show.
    const { total } = countVisibleTasks(tasks, new Set(), '2026-06-20', { isWeekend: true });
    expect(total).toBe(3);
  });

  // Anti-divergence guard: the count MUST equal the child's own visible set,
  // since both go through isTaskVisibleOn. If the parent aggregation ever drifts
  // from the child rule again, this fails.
  test('parent count === child visible count for the same list/day', () => {
    for (const [dateKey, isWeekend] of [[MON, false], [TUE, false], [SAT, true]] as const) {
      const childVisible = tasks.filter(t => isTaskVisibleOn(t as Task, dateKey, { isWeekend }));
      const { total } = countVisibleTasks(tasks, new Set(), dateKey, { isWeekend });
      expect(total).toBe(childVisible.length);
    }
  });
});

describe('completion rate over a window — parent insights denominator (M7)', () => {
  // A full local week: Mon 2026-06-08 … Sun 2026-06-14.
  const WEEK = [
    '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', // Mon–Thu
    '2026-06-12', '2026-06-13', '2026-06-14',               // Fri, Sat, Sun
  ];
  const daily      = { scheduleDays: undefined };            // every day
  const noWeekend  = { scheduleDays: undefined, hideOnWeekend: true };
  const monOnly    = { scheduleDays: [1] };
  const paused     = { scheduleDays: [] as number[] };

  test('scheduledDaysInWindow: a daily task is scheduled all 7 days', () => {
    expect(scheduledDaysInWindow(daily, WEEK, false)).toHaveLength(7);
  });

  test('a daily task completed EVERY day is 100%, never 140% (the old /5 bug)', () => {
    const done = new Set(WEEK);
    const r = completionRateOverWindow(daily, WEEK, false, done);
    expect(r).not.toBeNull();
    expect(r!.rate).toBe(100);
    expect(r!.scheduledDays).toBe(7);
  });

  test('hideOnWeekend drops Fri+Sat from the denominator (fridayEnabled=false)', () => {
    // Weekend = Fri(2026-06-12) + Sat(2026-06-13) → 5 scheduled days.
    const r = completionRateOverWindow(noWeekend, WEEK, false, new Set());
    expect(r!.scheduledDays).toBe(5);
    expect(r!.rate).toBe(0);
  });

  test('fridayEnabled makes Friday a school day → only Sat is weekend', () => {
    const r = completionRateOverWindow(noWeekend, WEEK, true, new Set());
    expect(r!.scheduledDays).toBe(6); // excludes only Saturday
  });

  test('a Monday-only task is rated on its ONE scheduled day, not as chronic failure', () => {
    const doneMon = new Set(['2026-06-08']);
    const r = completionRateOverWindow(monOnly, WEEK, false, doneMon);
    expect(r!.scheduledDays).toBe(1);
    expect(r!.completedDays).toBe(1);
    expect(r!.rate).toBe(100);
  });

  test('a task never scheduled in the window is excluded (null), not counted 0%', () => {
    expect(completionRateOverWindow(paused, WEEK, false, new Set())).toBeNull();
  });

  test('completions on non-scheduled days do not inflate the rate', () => {
    // Mon-only task, but a stray completion recorded on Tuesday → ignored.
    const done = new Set(['2026-06-09']); // Tue, not a scheduled day for monOnly
    const r = completionRateOverWindow(monOnly, WEEK, false, done);
    expect(r!.completedDays).toBe(0);
    expect(r!.rate).toBe(0);
  });
});
