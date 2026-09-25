import { pickFirstMission } from '../pickFirstMission';

const T = (id: string, time: string | null) => ({ id, title: id, time });
const morning = T('morning', '08:00');
const school = T('school', '12:00');
const afternoon = T('afternoon', '16:00');
const evening = T('evening', '20:00');
const all = [morning, school, afternoon, evening];

describe('pickFirstMission', () => {
  it('returns null for an empty list', () => {
    expect(pickFirstMission([], 8 * 60)).toBeNull();
  });

  it('picks the morning task at 07:30', () => {
    expect(pickFirstMission(all, 7 * 60 + 30)?.id).toBe('morning');
  });

  it('picks the evening task at 21:00 (the bug case: not "morning routine")', () => {
    expect(pickFirstMission(all, 21 * 60)?.id).toBe('evening');
  });

  it('picks the nearest around midday', () => {
    expect(pickFirstMission(all, 13 * 60)?.id).toBe('school');
    expect(pickFirstMission(all, 15 * 60)?.id).toBe('afternoon');
  });

  it('is order-independent (ties keep the earlier clock time)', () => {
    // 10:00 is equidistant from 08:00 and 12:00 → earlier (08:00) wins, either order.
    expect(pickFirstMission([morning, school], 10 * 60)?.id).toBe('morning');
    expect(pickFirstMission([school, morning], 10 * 60)?.id).toBe('morning');
  });

  it('sorts timeless/blank/bad times last but still returns one when only those exist', () => {
    expect(pickFirstMission([evening, T('notime', null)], 20 * 60)?.id).toBe('evening');
    expect(pickFirstMission([T('bad', '99:99'), T('blank', '')], 12 * 60)?.id).toBe('bad');
  });
});
