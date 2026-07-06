/**
 * timetableCopy tests — pkg/timetable-copy-day.
 */
import { copyTimetableDay, dayHasLessons } from '../timetableCopy';
import type { Timetable } from '../../types/timetable';

const camp = [
  { subject: 'קייטנה', startTime: '07:30', equipment: 'בקבוק מים, כובע, קרם הגנה' },
  { subject: 'בריכה', startTime: '10:00', equipment: 'בגד ים, מגבת' },
];

function base(): Timetable {
  return { sunday: camp.map(p => ({ ...p })) };
}

describe('copyTimetableDay', () => {
  test('replace into empty days copies all rows incl. equipment', () => {
    const out = copyTimetableDay(base(), 'sunday', ['monday', 'tuesday'], 'replace');
    expect(out.monday).toHaveLength(2);
    expect(out.tuesday).toHaveLength(2);
    expect(out.monday?.[0]).toEqual(camp[0]);
    expect(out.monday?.[1].equipment).toBe('בגד ים, מגבת');
  });

  test('deep copy — no shared references between source and targets', () => {
    const tt = base();
    const out = copyTimetableDay(tt, 'sunday', ['monday'], 'replace');
    expect(out.monday?.[0]).not.toBe(tt.sunday?.[0]);
    // mutating the copy must not leak back
    out.monday![0].subject = 'CHANGED';
    expect(tt.sunday?.[0].subject).toBe('קייטנה');
    expect(out.sunday?.[0].subject).toBe('קייטנה');
  });

  test('no shared references between two targets either', () => {
    const out = copyTimetableDay(base(), 'sunday', ['monday', 'tuesday'], 'replace');
    expect(out.monday?.[0]).not.toBe(out.tuesday?.[0]);
  });

  test('append keeps existing rows and re-sorts by startTime', () => {
    const tt: Timetable = {
      ...base(),
      monday: [{ subject: 'חוג ציור', startTime: '08:30' }],
    };
    const out = copyTimetableDay(tt, 'sunday', ['monday'], 'append');
    expect(out.monday?.map(p => p.startTime)).toEqual(['07:30', '08:30', '10:00']);
    expect(out.monday?.map(p => p.subject)).toEqual(['קייטנה', 'חוג ציור', 'בריכה']);
  });

  test('replace overwrites existing target rows', () => {
    const tt: Timetable = { ...base(), monday: [{ subject: 'ישן', startTime: '09:00' }] };
    const out = copyTimetableDay(tt, 'sunday', ['monday'], 'replace');
    expect(out.monday?.map(p => p.subject)).toEqual(['קייטנה', 'בריכה']);
  });

  test('source included in targets is ignored (no self-copy/duplication)', () => {
    const out = copyTimetableDay(base(), 'sunday', ['sunday', 'monday'], 'append');
    expect(out.sunday).toHaveLength(2); // unchanged
    expect(out.monday).toHaveLength(2);
  });

  test('empty source day → replace empties the target', () => {
    const tt: Timetable = { monday: [{ subject: 'ישן', startTime: '09:00' }] };
    const out = copyTimetableDay(tt, 'sunday', ['monday'], 'replace');
    expect(out.monday).toEqual([]);
  });

  test('input timetable object is never mutated', () => {
    const tt = base();
    const snapshot = JSON.stringify(tt);
    copyTimetableDay(tt, 'sunday', ['monday', 'tuesday'], 'append');
    expect(JSON.stringify(tt)).toBe(snapshot);
  });
});

describe('dayHasLessons', () => {
  test('true only when a named lesson exists', () => {
    expect(dayHasLessons(base(), 'sunday')).toBe(true);
    expect(dayHasLessons(base(), 'monday')).toBe(false);
    expect(dayHasLessons({ monday: [{ subject: '   ', startTime: '08:00' }] }, 'monday')).toBe(false);
  });
});
