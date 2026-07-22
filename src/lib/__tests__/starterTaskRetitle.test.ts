/**
 * buildRetitleMap — the pure half of starterTaskRetitle.
 *
 * Guards the contract that language changes only ever touch EXACT library
 * matches: a parent/child-authored title must never appear in the map.
 */
jest.mock('../../integrations/supabase/client', () => ({ supabase: {} }));

import { buildRetitleMap } from '../starterTaskRetitle';

describe('buildRetitleMap', () => {
  it('maps known library titles from English to Hebrew', () => {
    const map = buildRetitleMap('he');
    expect(map.get('Start with a 5-minute try')).toBe('להתחיל מ-5 דקות בלבד');
    expect(map.get("Pack your bag using tomorrow's schedule")).toBe('לארוז את התיק לפי המערכת של מחר');
  });

  it('maps known library titles from Hebrew to English', () => {
    const map = buildRetitleMap('en');
    expect(map.get('להתחיל מ-5 דקות בלבד')).toBe('Start with a 5-minute try');
    expect(map.get('לצחצח שיניים ולשטוף פנים')).toBe('Brush teeth & wash face');
  });

  it('never contains user-authored titles', () => {
    const map = buildRetitleMap('he');
    expect(map.has('לקחת את הילה')).toBe(false);
    expect(map.has('Feed the hamster')).toBe(false);
  });

  it('maps are direction-consistent (he→en→he round-trips for a shared title)', () => {
    const toHe = buildRetitleMap('he');
    const toEn = buildRetitleMap('en');
    const he = toHe.get('Start with a 5-minute try') as string;
    expect(toEn.get(he)).toBe('Start with a 5-minute try');
  });
});
