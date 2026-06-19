/**
 * Tests for the yesterday-recap filter sieve.
 *
 * Pillar 2 stake: a false-positive "task wasn't done" display can trigger
 * parent anxiety / pressure on the kid. These tests enforce the F-2026-05-21-01
 * sieve rules that prevent that.
 */

import {
  getYesterdayDateKey,
  getYesterdayWeekday,
  getYesterdayEndIso,
  isTaskEligibleForChild,
  buildChildYesterdayRecap,
  shouldHideRecap,
  type TaskRow,
  type DailyProgressRow,
  type ChildProfileRow,
} from '../yesterdayRecapUtils';
import type { PauseSnapshot } from '../pauseUtils';

// ─── Fixtures ─────────────────────────────────────────────────────────────

// Wednesday 2026-05-20 12:00:00 UTC
// → yesterday in UTC = Tuesday 2026-05-19 (weekday 2)
const NOW             = new Date('2026-05-20T12:00:00Z');
const YESTERDAY_DATE  = '2026-05-19';
const YESTERDAY_DOW   = 2;  // Tuesday
const YESTERDAY_END   = '2026-05-20T00:00:00.000Z';  // start of today (exclusive bound)

const CHILD_A: ChildProfileRow = { id: 'child-a', created_at: '2026-05-01T08:00:00Z', off_routine_until: null };
const CHILD_B: ChildProfileRow = { id: 'child-b', created_at: '2026-05-01T08:00:00Z', off_routine_until: null };

function makeTask(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id:             'task-1',
    family_id:      'fam-1',
    assigned_to:    CHILD_A.id,
    title:          'Brush teeth',
    time:           '07:00',
    category:       'self-care',
    icon:           null,
    schedule_days:  [0, 1, 2, 3, 4, 5, 6],
    created_at:     '2026-05-01T08:00:00Z',
    is_off_routine: false,
    ...overrides,
  };
}

function makeProgress(overrides: Partial<DailyProgressRow> = {}): DailyProgressRow {
  return {
    task_id:   'task-1',
    child_id:  CHILD_A.id,
    date:      YESTERDAY_DATE,
    completed: true,
    ...overrides,
  };
}

// ─── Date helpers ─────────────────────────────────────────────────────────

describe('date helpers', () => {
  test('getYesterdayDateKey — UTC yesterday', () => {
    expect(getYesterdayDateKey(NOW)).toBe(YESTERDAY_DATE);
  });

  test('getYesterdayDateKey — boundary at UTC midnight', () => {
    // 2026-05-20T00:00:00Z — first moment of "today" → yesterday = 2026-05-19
    expect(getYesterdayDateKey(new Date('2026-05-20T00:00:00Z'))).toBe('2026-05-19');
  });

  test('getYesterdayDateKey — crossing month boundary', () => {
    expect(getYesterdayDateKey(new Date('2026-06-01T05:00:00Z'))).toBe('2026-05-31');
  });

  test('getYesterdayWeekday — Tuesday from Wednesday', () => {
    expect(getYesterdayWeekday(NOW)).toBe(YESTERDAY_DOW);
  });

  test('getYesterdayWeekday — Saturday from Sunday', () => {
    // 2026-05-17 is Sunday, so yesterday = Saturday (6)
    expect(getYesterdayWeekday(new Date('2026-05-17T10:00:00Z'))).toBe(6);
  });

  test('getYesterdayEndIso — start of today UTC', () => {
    expect(getYesterdayEndIso(NOW)).toBe(YESTERDAY_END);
  });
});

// ─── isTaskEligibleForChild ───────────────────────────────────────────────

describe('isTaskEligibleForChild', () => {
  test('positive case — all conditions met', () => {
    const t = makeTask();
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(true);
  });

  test('assigned_to mismatch → excluded', () => {
    const t = makeTask({ assigned_to: CHILD_B.id });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(false);
  });

  test('assigned_to null → excluded (no family-wide tasks in recap)', () => {
    const t = makeTask({ assigned_to: null });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(false);
  });

  test('created_at after yesterday end → excluded', () => {
    // Task created today
    const t = makeTask({ created_at: '2026-05-20T09:00:00Z' });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(false);
  });

  test('created_at exactly at yesterday end → included (inclusive bound)', () => {
    // String comparison: '2026-05-20T00:00:00.000Z' is NOT > '2026-05-20T00:00:00.000Z'
    const t = makeTask({ created_at: YESTERDAY_END });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(true);
  });

  test('schedule_days does not include yesterday weekday → excluded', () => {
    // Yesterday is Tuesday (2). Task scheduled for Sat/Sun only.
    const t = makeTask({ schedule_days: [0, 6] });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(false);
  });

  test('schedule_days includes yesterday weekday → included', () => {
    const t = makeTask({ schedule_days: [1, 2, 3, 4, 5] });  // Mon-Fri, includes Tue
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(true);
  });

  test('schedule_days null → defaults to all 7 days, included', () => {
    const t = makeTask({ schedule_days: null });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(true);
  });

  test('schedule_days empty array → paused, excluded', () => {
    const t = makeTask({ schedule_days: [] });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(false);
  });

  test('off-routine task → excluded (would otherwise show as a phantom ○)', () => {
    // Same row that would pass every other rule, but flagged off-routine.
    const t = makeTask({ is_off_routine: true });
    expect(isTaskEligibleForChild(t, CHILD_A.id, YESTERDAY_DOW, YESTERDAY_END)).toBe(false);
  });
});

// ─── buildChildYesterdayRecap ─────────────────────────────────────────────

describe('buildChildYesterdayRecap', () => {
  const baseParams = {
    yesterdayDow:    YESTERDAY_DOW,
    yesterdayDate:   YESTERDAY_DATE,
    yesterdayEndIso: YESTERDAY_END,
  };

  test('completed task → completed=true', () => {
    const tasks    = [makeTask({ id: 't1' })];
    const progress = [makeProgress({ task_id: 't1' })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: progress });

    expect(recap).not.toBeNull();
    expect(recap!.tasks).toHaveLength(1);
    expect(recap!.tasks[0].completed).toBe(true);
    expect(recap!.totalScheduled).toBe(1);
    expect(recap!.totalCompleted).toBe(1);
  });

  test('no progress row → completed=false', () => {
    const tasks = [makeTask({ id: 't1' })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: [] });

    expect(recap!.tasks[0].completed).toBe(false);
    expect(recap!.totalScheduled).toBe(1);
    expect(recap!.totalCompleted).toBe(0);
  });

  test('progress row with completed=false → completed=false', () => {
    const tasks    = [makeTask({ id: 't1' })];
    const progress = [makeProgress({ task_id: 't1', completed: false })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: progress });

    expect(recap!.tasks[0].completed).toBe(false);
    expect(recap!.totalCompleted).toBe(0);
  });

  test('mixed completion across multiple tasks', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Brush teeth' }),
      makeTask({ id: 't2', title: 'Backpack' }),
      makeTask({ id: 't3', title: 'Homework' }),
    ];
    const progress = [
      makeProgress({ task_id: 't1', completed: true }),
      makeProgress({ task_id: 't3', completed: true }),
      // t2 has no progress row
    ];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: progress });

    expect(recap!.totalScheduled).toBe(3);
    expect(recap!.totalCompleted).toBe(2);
    expect(recap!.tasks.find(t => t.taskId === 't2')!.completed).toBe(false);
  });

  test('child created after yesterday end → null', () => {
    const newborn: ChildProfileRow = { id: 'newborn', created_at: '2026-05-20T08:00:00Z' };
    const tasks   = [makeTask({ assigned_to: newborn.id })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: newborn, tasks, dailyProgress: [] });

    expect(recap).toBeNull();
  });

  test('child created exactly at yesterday end → recap returned (inclusive)', () => {
    const child: ChildProfileRow = { id: 'edge', created_at: YESTERDAY_END };
    const tasks  = [makeTask({ assigned_to: child.id })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child, tasks, dailyProgress: [] });

    expect(recap).not.toBeNull();
  });

  test('child with null created_at → recap returned', () => {
    const child: ChildProfileRow = { id: 'nullable', created_at: null };
    const tasks  = [makeTask({ assigned_to: child.id })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child, tasks, dailyProgress: [] });

    expect(recap).not.toBeNull();
  });

  test('progress for a different child is ignored', () => {
    const tasks    = [makeTask({ id: 't1', assigned_to: CHILD_A.id })];
    const progress = [makeProgress({ task_id: 't1', child_id: CHILD_B.id, completed: true })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: progress });

    expect(recap!.tasks[0].completed).toBe(false);
  });

  test('progress for a different date is ignored', () => {
    const tasks    = [makeTask({ id: 't1' })];
    const progress = [makeProgress({ task_id: 't1', date: '2026-05-18', completed: true })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: progress });

    expect(recap!.tasks[0].completed).toBe(false);
  });

  test('zero eligible tasks → empty recap (not null)', () => {
    // All tasks excluded by sieve (wrong child)
    const tasks = [makeTask({ assigned_to: CHILD_B.id })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: [] });

    expect(recap).not.toBeNull();
    expect(recap!.totalScheduled).toBe(0);
    expect(recap!.tasks).toEqual([]);
  });

  test('off-routine tasks never appear in the recap', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Brush teeth' }),
      makeTask({ id: 'off1', title: 'Off-routine chill', is_off_routine: true }),
    ];

    const recap = buildChildYesterdayRecap({ ...baseParams, child: CHILD_A, tasks, dailyProgress: [] });

    expect(recap!.totalScheduled).toBe(1);
    expect(recap!.tasks.map(t => t.taskId)).toEqual(['t1']);
  });

  test('child CURRENTLY on an off-routine day → null (suppressed, no false signal)', () => {
    // off_routine_until in the future relative to NOW → active window.
    const child: ChildProfileRow = { ...CHILD_A, off_routine_until: '2026-05-21T00:00:00Z' };
    const tasks  = [makeTask({ assigned_to: child.id })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child, tasks, dailyProgress: [], now: NOW });

    expect(recap).toBeNull();
  });

  test('child with a STALE off-routine window (past) → recap shown normally', () => {
    const child: ChildProfileRow = { ...CHILD_A, off_routine_until: '2026-05-01T00:00:00Z' };
    const tasks  = [makeTask({ assigned_to: child.id })];

    const recap = buildChildYesterdayRecap({ ...baseParams, child, tasks, dailyProgress: [], now: NOW });

    expect(recap).not.toBeNull();
    expect(recap!.totalScheduled).toBe(1);
  });
});

// ─── shouldHideRecap ──────────────────────────────────────────────────────

describe('shouldHideRecap', () => {
  const NON_EMPTY_RECAP = {
    childId:        CHILD_A.id,
    tasks:          [{ taskId: 't1', title: 'X', time: '07:00', category: 'self-care', icon: null, completed: false }],
    totalScheduled: 1,
    totalCompleted: 0,
  };
  const EMPTY_RECAP = { ...NON_EMPTY_RECAP, tasks: [], totalScheduled: 0, totalCompleted: 0 };

  test('pause currently active → hide', () => {
    const snap: PauseSnapshot = { pause_mode_active: true, pause_until: null };
    expect(shouldHideRecap({ pauseSnapshot: snap, recaps: [NON_EMPTY_RECAP], now: NOW })).toBe(true);
  });

  test('pause stale (past pause_until) → do not hide', () => {
    const snap: PauseSnapshot = { pause_mode_active: true, pause_until: '2026-05-01T00:00:00Z' };
    expect(shouldHideRecap({ pauseSnapshot: snap, recaps: [NON_EMPTY_RECAP], now: NOW })).toBe(false);
  });

  test('no children (empty recaps) → hide', () => {
    expect(shouldHideRecap({ pauseSnapshot: null, recaps: [], now: NOW })).toBe(true);
  });

  test('all children have 0 scheduled → hide', () => {
    expect(shouldHideRecap({ pauseSnapshot: null, recaps: [EMPTY_RECAP], now: NOW })).toBe(true);
  });

  test('at least one child has scheduled tasks → show', () => {
    expect(shouldHideRecap({ pauseSnapshot: null, recaps: [EMPTY_RECAP, NON_EMPTY_RECAP], now: NOW })).toBe(false);
  });

  test('null pause snapshot + non-empty recap → show', () => {
    expect(shouldHideRecap({ pauseSnapshot: null, recaps: [NON_EMPTY_RECAP], now: NOW })).toBe(false);
  });
});
