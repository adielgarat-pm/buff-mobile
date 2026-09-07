/**
 * buildRetitleMap — the pure half of starterTaskRetitle.
 *
 * Guards the contract that language changes only ever touch EXACT library
 * matches: a parent/child-authored title must never appear in the map.
 */
jest.mock('../../integrations/supabase/client', () => ({ supabase: {} }));

import { buildRetitleMap } from '../starterTaskRetitle';
import { pickLang } from '../i18nString';
import { STARTER_TASK_LIBRARY } from '../../screens/onboarding/unified/starterTasks/taskLibrary';
import { STARTER_TASKS_BY_CHALLENGE } from '../../screens/onboarding/unified/onboardingData';

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

  it('prefers the engine library variant over the legacy library on a collision (L6)', () => {
    const map = buildRetitleMap('he');
    // Any English title present in BOTH the engine library and the legacy
    // STARTER_TASKS_BY_CHALLENGE with a DIFFERENT Hebrew value must resolve to
    // the engine's Hebrew, not the legacy one.
    const legacy = Object.values(STARTER_TASKS_BY_CHALLENGE).flat();
    let collisionsChecked = 0;
    for (const eng of STARTER_TASK_LIBRARY) {
      const en    = pickLang(eng.title, 'en');
      const engHe = pickLang(eng.title, 'he');
      const clash = legacy.find(l => pickLang(l.title, 'en') === en && pickLang(l.title, 'he') !== engHe);
      if (!clash) continue;
      collisionsChecked++;
      expect(map.get(en)).toBe(engHe); // engine wins, not the legacy variant
    }
    // Guard the guard: if the libraries no longer collide, this test is moot —
    // surface that rather than passing vacuously.
    expect(collisionsChecked).toBeGreaterThan(0);
  });
});
