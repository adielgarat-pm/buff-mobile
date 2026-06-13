import {
  weekdayOf,
  activeOnDate,
  appliesToChild,
  buildPackingGroups,
} from '../packing';
import type { Activity } from '../../../types/activities';

// A known reference: 2026-06-16 is a Tuesday. 2026-06-14 is a Sunday.
const TUESDAY = '2026-06-16';
const SUNDAY = '2026-06-14';

function make(partial: Partial<Activity>): Activity {
  return {
    id: partial.id ?? 'a1',
    familyId: 'fam1',
    childId: partial.childId !== undefined ? partial.childId : 'kid1',
    title: partial.title ?? 'Activity',
    templateId: partial.templateId ?? null,
    schedule: partial.schedule ?? { kind: 'recurring', weekday: 'tuesday' },
    time: partial.time !== undefined ? partial.time : null,
    equipment: partial.equipment ?? ['thing'],
    status: partial.status ?? 'active',
    createdAt: partial.createdAt ?? '2026-06-01T00:00:00.000Z',
  };
}

describe('weekdayOf', () => {
  it('derives the correct weekday from an ISO date', () => {
    expect(weekdayOf(TUESDAY)).toBe('tuesday');
    expect(weekdayOf(SUNDAY)).toBe('sunday');
    expect(weekdayOf('2026-06-20')).toBe('saturday');
  });

  it('returns null for a malformed string', () => {
    expect(weekdayOf('16/06/2026')).toBeNull();
    expect(weekdayOf('')).toBeNull();
    expect(weekdayOf('2026-6-16')).toBeNull();
  });
});

describe('activeOnDate', () => {
  it('matches a recurring activity on its weekday only', () => {
    const a = make({ schedule: { kind: 'recurring', weekday: 'tuesday' } });
    expect(activeOnDate(a, TUESDAY)).toBe(true);
    expect(activeOnDate(a, SUNDAY)).toBe(false);
  });

  it('matches a one-off activity on its exact date only', () => {
    const a = make({ schedule: { kind: 'oneoff', date: TUESDAY } });
    expect(activeOnDate(a, TUESDAY)).toBe(true);
    expect(activeOnDate(a, '2026-06-17')).toBe(false);
  });

  it('never matches an archived activity', () => {
    const a = make({ status: 'archived', schedule: { kind: 'recurring', weekday: 'tuesday' } });
    expect(activeOnDate(a, TUESDAY)).toBe(false);
  });
});

describe('appliesToChild', () => {
  it('matches the named child', () => {
    expect(appliesToChild(make({ childId: 'kid1' }), 'kid1')).toBe(true);
    expect(appliesToChild(make({ childId: 'kid2' }), 'kid1')).toBe(false);
  });

  it('matches every child when the activity is family-wide (null)', () => {
    expect(appliesToChild(make({ childId: null }), 'kid1')).toBe(true);
    expect(appliesToChild(make({ childId: null }), 'anyone')).toBe(true);
  });
});

describe('buildPackingGroups', () => {
  it('includes only today + this child, with equipment', () => {
    const acts: Activity[] = [
      make({ id: 'football', title: 'Football', schedule: { kind: 'recurring', weekday: 'tuesday' }, time: '17:00', equipment: ['ball'] }),
      make({ id: 'guitar', title: 'Guitar', schedule: { kind: 'recurring', weekday: 'sunday' }, equipment: ['guitar'] }), // wrong day
      make({ id: 'pool', title: 'Pool', schedule: { kind: 'oneoff', date: TUESDAY }, equipment: ['swimsuit'] }),
      make({ id: 'otherkid', childId: 'kid2', schedule: { kind: 'recurring', weekday: 'tuesday' }, equipment: ['x'] }), // other child
    ];
    const groups = buildPackingGroups(acts, 'kid1', TUESDAY);
    expect(groups.map((g) => g.title)).toEqual(['Football', 'Pool']); // timed (17:00) before untimed
  });

  it('drops activities with no equipment', () => {
    const acts = [make({ id: 'empty', equipment: [], schedule: { kind: 'recurring', weekday: 'tuesday' } })];
    expect(buildPackingGroups(acts, 'kid1', TUESDAY)).toEqual([]);
  });

  it('includes family-wide activities for the child', () => {
    const acts = [make({ id: 'fam', childId: null, schedule: { kind: 'recurring', weekday: 'tuesday' }, equipment: ['shared'] })];
    const groups = buildPackingGroups(acts, 'kid1', TUESDAY);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toEqual(['shared']);
  });

  it('orders timed activities by time, then untimed by title', () => {
    const acts: Activity[] = [
      make({ id: 'b', title: 'Bravo', time: null, equipment: ['b'] }),
      make({ id: 'a', title: 'Alpha', time: null, equipment: ['a'] }),
      make({ id: 'late', title: 'Late', time: '18:00', equipment: ['l'] }),
      make({ id: 'early', title: 'Early', time: '08:00', equipment: ['e'] }),
    ];
    const groups = buildPackingGroups(acts, 'kid1', TUESDAY);
    expect(groups.map((g) => g.title)).toEqual(['Early', 'Late', 'Alpha', 'Bravo']);
  });

  it('shapes the group with source, templateId and time', () => {
    const acts = [make({ id: 'pool', title: 'Pool', templateId: 'pool_day', time: '09:00', schedule: { kind: 'oneoff', date: TUESDAY }, equipment: ['swimsuit', 'towel'] })];
    expect(buildPackingGroups(acts, 'kid1', TUESDAY)[0]).toEqual({
      source: 'activity',
      templateId: 'pool_day',
      title: 'Pool',
      time: '09:00',
      items: ['swimsuit', 'towel'],
    });
  });
});
