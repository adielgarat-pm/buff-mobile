import type { ParentItem, ParsedItem } from '../../../types/parentCapture';
import {
  addDays,
  childTaskFieldsFromParsed,
  diffDays,
  eventTypeToCategory,
  groupByBucket,
  isPastDate,
  recencyPartition,
  recurrenceToScheduleDays,
  stripChildNamePrefix,
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

function parsed(partial: Partial<ParsedItem>): ParsedItem {
  return {
    id: 'p',
    title: 'X',
    type: 'task',
    owner: 'child',
    childName: null,
    relevance: 'matched',
    dueDate: null,
    dueTime: null,
    recurrence: null,
    dates: [],
    dateSource: '',
    location: null,
    bring: [],
    eventType: 'homework',
    forChildToRemember: true,
    linkedEvent: null,
    confidence: 'high',
    missing: null,
    ...partial,
  };
}

describe('recurrenceToScheduleDays', () => {
  test('null -> null', () => expect(recurrenceToScheduleDays(null)).toBeNull());
  test('no day name -> null', () => expect(recurrenceToScheduleDays('sometimes')).toBeNull());
  test('Hebrew days', () => expect(recurrenceToScheduleDays('כל ראשון וחמישי')).toEqual([0, 4]));
  test('English days', () => expect(recurrenceToScheduleDays('every Monday and Thursday')).toEqual([1, 4]));
});

describe('childTaskFieldsFromParsed', () => {
  test('recurrence wins → recurring, no dueDate', () => {
    const f = childTaskFieldsFromParsed(parsed({ recurrence: 'כל ראשון וחמישי', dueDate: '2026-06-08' }));
    expect(f.scheduleDays).toEqual([0, 4]);
    expect(f.dueDate).toBeNull();
  });
  test('one-time (dueDate, no recurrence) → empty scheduleDays + dueDate', () => {
    const f = childTaskFieldsFromParsed(parsed({ dueDate: '2026-06-08', eventType: 'performance' }));
    expect(f.scheduleDays).toEqual([]);
    expect(f.dueDate).toBe('2026-06-08');
    expect(f.category).toBe('movement');
  });
  test('no date, no recurrence → every day', () => {
    const f = childTaskFieldsFromParsed(parsed({}));
    expect(f.scheduleDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(f.dueDate).toBeNull();
  });
  test('time defaults to 14:00 when no dueTime (recurring)', () => {
    expect(childTaskFieldsFromParsed(parsed({})).time).toBe('14:00');
  });

  test('dated one-timer without dueTime defaults to the MORNING (08:00)', () => {
    expect(childTaskFieldsFromParsed(parsed({ dueDate: '2026-07-27' })).time).toBe('08:00');
  });

  test('explicit dueTime always wins', () => {
    expect(childTaskFieldsFromParsed(parsed({ dueDate: '2026-07-27', dueTime: '19:00' })).time).toBe('19:00');
  });
});

describe('stripChildNamePrefix', () => {
  const names = ['לייא', 'Emmy'];

  test('strips "<name>: " prefix', () => {
    expect(stripChildNamePrefix('לייא: לארוז בגד ים ומגבת', names)).toBe('לארוז בגד ים ומגבת');
    expect(stripChildNamePrefix('Emmy - pack swim bag', names)).toBe('pack swim bag');
  });

  test('leaves clean titles untouched', () => {
    expect(stripChildNamePrefix('לארוז בגד ים ומגבת', names)).toBe('לארוז בגד ים ומגבת');
  });

  test('does not strip a name that merely appears mid-title', () => {
    expect(stripChildNamePrefix('לקנות מתנה ללייא: עפרונות', ['אמא'])).toBe('לקנות מתנה ללייא: עפרונות');
  });

  test('ignores empty/undefined names and never empties the title', () => {
    expect(stripChildNamePrefix('לייא:', names)).toBe('לייא:');
    expect(stripChildNamePrefix('שיעורי בית', ['', undefined as unknown as string])).toBe('שיעורי בית');
  });
});
