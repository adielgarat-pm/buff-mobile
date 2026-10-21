/**
 * Pure routine-edit helpers (pkg/anchor-routine-onboarding M3) + the generator's
 * moment override used by the preview's moment switch.
 */
import {
  MIN_ROUTINE_STEPS, MAX_TITLE_LEN,
  canRemove, cleanTitle, shiftRoutine, sortByTime, startTime,
} from '../routineEdit';
import { generateStarterTasks } from '../starterTasks';

const rows = [
  { id: 'c', title: 'Breakfast', time: '07:10' },
  { id: 'a', title: 'Get dressed', time: '07:00' },
  { id: 'b', title: 'Teeth', time: '07:05' },
  { id: 'd', title: 'Bag by the door', time: '07:15' },
  { id: 'e', title: 'Shoes', time: '07:20' },
];

describe('routineEdit', () => {
  it('sorts by clock time', () => {
    expect(sortByTime(rows).map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('startTime is the earliest step', () => {
    expect(startTime(rows)).toBe('07:00');
    expect(startTime([])).toBeNull();
  });

  it('shifts every step and keeps the spacing', () => {
    const out = shiftRoutine(sortByTime(rows), 15)!;
    expect(out.map((r) => r.time)).toEqual(['07:15', '07:20', '07:25', '07:30', '07:35']);
    expect(out.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('refuses to start before 05:00 or end after 22:30', () => {
    expect(shiftRoutine([{ id: 'x', title: 't', time: '05:10' }], -15)).toBeNull();
    expect(shiftRoutine([{ id: 'x', title: 't', time: '22:20' }], 15)).toBeNull();
    expect(shiftRoutine([], 15)).toBeNull();
  });

  it('allows removing only above the minimum', () => {
    expect(canRemove(rows)).toBe(true);
    expect(canRemove(rows.slice(0, MIN_ROUTINE_STEPS))).toBe(false);
  });

  it('cleans titles', () => {
    expect(cleanTitle('  Brush   teeth ')).toBe('Brush teeth');
    expect(cleanTitle('   ')).toBeNull();
    expect(cleanTitle('x'.repeat(100))!.length).toBe(MAX_TITLE_LEN);
  });
});

describe('generateStarterTasks — moment override', () => {
  it('forces the requested moment regardless of the main challenge', () => {
    const base = { ageGroup: '9-11' as const, gender: 'girl' as const, mainChallenge: 'morning_routine', config: { shape: 'routine' as const } };
    expect(generateStarterTasks(base)[0].source).toBe('routine:morning');
    const evening = generateStarterTasks({ ...base, moment: 'evening' });
    expect(evening[0].source).toBe('routine:evening');
    expect(evening[0].time).toBe('19:30');
    expect(evening.length).toBeGreaterThanOrEqual(4);
  });
});
