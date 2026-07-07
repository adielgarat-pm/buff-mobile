import { buildTimetableGroups, splitEquipment } from '../fromTimetable';
import type { Timetable } from '../../../types/timetable';

// 2026-07-07 is a Tuesday; 2026-07-04 is a Saturday (verified against the same
// local-noon weekday math weekdayOf() uses).
const TUESDAY = '2026-07-07';
const SATURDAY = '2026-07-04';

describe('splitEquipment', () => {
  it('splits on Latin and Arabic commas, trims, drops blanks', () => {
    expect(splitEquipment('בקבוק מים, כובע ،בגד ים')).toEqual(['בקבוק מים', 'כובע', 'בגד ים']);
    expect(splitEquipment('a, , b')).toEqual(['a', 'b']);
    expect(splitEquipment('')).toEqual([]);
    expect(splitEquipment(undefined)).toEqual([]);
  });
});

describe('buildTimetableGroups', () => {
  it('returns one group per subject with its equipment for the date weekday', () => {
    const tt: Timetable = {
      tuesday: [{ subject: 'קייטנה', startTime: '08:00', equipment: 'בקבוק מים, כובע' }],
    };
    expect(buildTimetableGroups(tt, TUESDAY)).toEqual([
      { source: 'school', templateId: null, title: 'קייטנה', time: '08:00', items: ['בקבוק מים', 'כובע'] },
    ]);
  });

  it('merges periods of the same subject, de-dupes items, keeps earliest time', () => {
    const tt: Timetable = {
      tuesday: [
        { subject: 'קייטנה', startTime: '10:00', equipment: 'כובע, קרם הגנה' },
        { subject: 'קייטנה', startTime: '08:00', equipment: 'כובע, בגד ים' },
      ],
    };
    const [g] = buildTimetableGroups(tt, TUESDAY);
    expect(g.time).toBe('08:00');
    expect(g.items).toEqual(['כובע', 'קרם הגנה', 'בגד ים']);
  });

  it('drops subjects that carry no equipment', () => {
    const tt: Timetable = {
      tuesday: [
        { subject: 'מתמטיקה', startTime: '09:00' },
        { subject: 'ספורט', startTime: '10:00', equipment: 'נעלי ספורט' },
      ],
    };
    expect(buildTimetableGroups(tt, TUESDAY).map((g) => g.title)).toEqual(['ספורט']);
  });

  it('returns [] on Saturday (timetable has no Saturday)', () => {
    const tt: Timetable = { tuesday: [{ subject: 'קייטנה', startTime: '08:00', equipment: 'כובע' }] };
    expect(buildTimetableGroups(tt, SATURDAY)).toEqual([]);
  });

  it('returns [] when the day has no periods', () => {
    expect(buildTimetableGroups({}, TUESDAY)).toEqual([]);
  });
});
