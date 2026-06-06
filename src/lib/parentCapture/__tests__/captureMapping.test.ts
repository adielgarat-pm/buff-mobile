import type { ParentItem } from '../../../types/parentCapture';
import {
  addDays,
  diffDays,
  eventTypeToCategory,
  groupByBucket,
  isPastDate,
  recencyPartition,
  timeBucketFor,
} from '../captureMapping';

function item(partial: Partial<ParentItem>): ParentItem {
  return {
    id: 'x',
    familyId: 'f',
    title: 't',
    type: 'task',
    owner: 'parent',
    childId: null,
    childName: null,
    dueDate: null,
    dueTime: null,
    recurrence: null,
    location: null,
    bring: [],
    eventType: 'other',
    status: 'active',
    reminderOptIn: false,
    confidence: 'high',
    createdAt: '2026-06-05T00:00:00Z',
    ...partial,
  };
}

describe('date helpers', () => {
  test('addDays', () => expect(addDays('2026-06-05', 3)).toBe('2026-06-08'));
  test('addDays across month', () => expect(addDays('2026-06-30', 2)).toBe('2026-07-02'));
  test('diffDays', () => {
    expect(diffDays('2026-06-08', '2026-06-05')).toBe(3);
    expect(diffDays('2026-06-04', '2026-06-05')).toBe(-1);
  });
});

describe('isPastDate', () => {
  const today = '2026-06-05';
  test('null is not past', () => expect(isPastDate(null, today)).toBe(false));
  test('yesterday is past', () => expect(isPastDate('2026-06-04', today)).toBe(true));
  test('today is not past', () => expect(isPastDate(today, today)).toBe(false));
});

describe('timeBucketFor', () => {
  const today = '2026-06-05';
  test('noDate', () => expect(timeBucketFor(null, today)).toBe('noDate'));
  test('today', () => expect(timeBucketFor(today, today)).toBe('today'));
  test('thisWeek', () => expect(timeBucketFor('2026-06-10', today)).toBe('thisWeek'));
  test('later', () => expect(timeBucketFor('2026-06-20', today)).toBe('later'));
});

describe('recencyPartition', () => {
  const today = '2026-06-05';
  test('past-dated and archived go to archived; rest active', () => {
    const items = [
      item({ id: 'a', dueDate: '2026-06-04' }),
      item({ id: 'b', dueDate: '2026-06-10' }),
      item({ id: 'c', status: 'archived' }),
    ];
    const { active, archived } = recencyPartition(items, today);
    expect(active.map((i) => i.id)).toEqual(['b']);
    expect(archived.map((i) => i.id).sort()).toEqual(['a', 'c']);
  });
});

describe('groupByBucket', () => {
  const today = '2026-06-05';
  test('preserves bucket order and drops empty buckets', () => {
    const items = [
      item({ id: 'l', dueDate: '2026-06-20' }),
      item({ id: 't', dueDate: today }),
      item({ id: 'n', dueDate: null }),
    ];
    const g = groupByBucket(items, today);
    expect(g.map((x) => x.bucket)).toEqual(['today', 'later', 'noDate']);
  });
});

describe('eventTypeToCategory', () => {
  test('homework -> learning', () => expect(eventTypeToCategory('homework')).toBe('learning'));
  test('errand -> organization', () => expect(eventTypeToCategory('errand')).toBe('organization'));
  test('performance -> movement', () => expect(eventTypeToCategory('performance')).toBe('movement'));
});
