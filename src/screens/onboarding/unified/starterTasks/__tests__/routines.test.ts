/**
 * Routine-shaped generator (pkg/anchor-routine-onboarding M2).
 *
 * Contract: with { shape: 'routine' } onboarding gets ONE routine — 4..5 steps,
 * all at the main challenge's moment, in slot order, times spaced from the
 * routine start, never two alternatives of the same slot. Unknown challenge or
 * a too-small pool falls back to the mixed list. Default config is unchanged.
 */
import { generateStarterTasks } from '../generateStarterTasks';
import { DEFAULT_GENERATOR_CONFIG } from '../generatorConfig';
import { CHALLENGE_TO_DOMAIN } from '../challengeMap';
import { TASK_BY_ID } from '../taskLibrary';
import { MOMENT_FOR_DOMAIN, ROUTINES, addMinutes } from '../routines';
import type { AgeGroup, Gender } from '../../onboardingData';

const AGES: AgeGroup[] = ['6-8', '9-11', '12-14', '15-18'];
const GENDERS: (Gender | undefined)[] = ['boy', 'girl', 'other', undefined];
const ROUTINE = { shape: 'routine' as const };

describe('routines data', () => {
  it.each(Object.values(ROUTINES))('$moment: every id exists and matches the moment', (r) => {
    for (const ids of r.slots) {
      for (const id of ids) {
        expect(TASK_BY_ID[id]).toBeDefined();
        expect(TASK_BY_ID[id].timeOfDay).toBe(r.moment);
      }
    }
  });

  it('no id appears in two slots', () => {
    const all = Object.values(ROUTINES).flatMap((r) => r.slots.flat());
    expect(new Set(all).size).toBe(all.length);
  });

  it('addMinutes', () => {
    expect(addMinutes('07:00', 5)).toBe('07:05');
    expect(addMinutes('19:30', 40)).toBe('20:10');
    expect(addMinutes('16:00', 60)).toBe('17:00');
  });
});

describe('generateStarterTasks — routine shape', () => {
  const challenges = Object.keys(CHALLENGE_TO_DOMAIN);

  it('every age × gender × challenge yields one coherent routine of 4..5 steps', () => {
    for (const ageGroup of AGES) {
      for (const gender of GENDERS) {
        for (const mainChallenge of challenges) {
          const out = generateStarterTasks({ ageGroup, gender, mainChallenge, config: ROUTINE });
          const moment = MOMENT_FOR_DOMAIN[CHALLENGE_TO_DOMAIN[mainChallenge]];
          const r = ROUTINES[moment];
          const ctx = `${ageGroup}/${gender}/${mainChallenge}`;

          expect([ctx, out.length >= 4 && out.length <= 5]).toEqual([ctx, true]);
          out.forEach((t, i) => {
            expect([ctx, t.source]).toEqual([ctx, `routine:${moment}`]);
            expect([ctx, t.timeOfDay]).toEqual([ctx, moment]);
            expect([ctx, t.time]).toEqual([ctx, addMinutes(r.start, i * r.spacingMin)]);
            expect([ctx, TASK_BY_ID[t.id].ageBands.includes(ageGroup)]).toEqual([ctx, true]);
          });

          // slot order, and at most one alternative per slot
          const slotOf = (id: string) => r.slots.findIndex((ids) => ids.includes(id));
          const slots = out.map((t) => slotOf(t.id));
          expect([ctx, [...slots].sort((a, b) => a - b)]).toEqual([ctx, slots]);
          expect([ctx, new Set(slots).size]).toEqual([ctx, slots.length]);
        }
      }
    }
  });

  it('morning-routine challenge → getting-out-of-the-house routine starting 07:00', () => {
    const out = generateStarterTasks({ ageGroup: '9-11', gender: 'boy', mainChallenge: 'morning_routine', config: ROUTINE });
    expect(out[0].time).toBe('07:00');
    expect(out.map((t) => t.id)).toContain('d1_get_dressed');
    expect(out.map((t) => t.id)).toContain('d1_eat_breakfast');
  });

  it('main-domain steps outrank other domains', () => {
    const out = generateStarterTasks({ ageGroup: '12-14', gender: 'girl', mainChallenge: 'homework_focus', config: ROUTINE });
    const domain2 = out.filter((t) => t.domain === 2).length;
    expect(domain2).toBeGreaterThanOrEqual(3);
  });

  it('is deterministic', () => {
    const input = { ageGroup: '15-18' as AgeGroup, gender: 'girl' as Gender, mainChallenge: 'planning_org', config: ROUTINE };
    expect(generateStarterTasks(input)).toEqual(generateStarterTasks(input));
  });

  it('unknown main challenge falls back to the mixed list', () => {
    const out = generateStarterTasks({ ageGroup: '9-11', mainChallenge: 'nope', config: ROUTINE });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((t) => !t.source.startsWith('routine:'))).toBe(true);
  });

  it('routineMin above the pool falls back to the mixed list', () => {
    const out = generateStarterTasks({
      ageGroup: '9-11', mainChallenge: 'morning_routine', config: { shape: 'routine', routineMin: 99 },
    });
    expect(out.every((t) => !t.source.startsWith('routine:'))).toBe(true);
  });

  it('default config is still the mixed shape (Edit Focus unchanged)', () => {
    expect(DEFAULT_GENERATOR_CONFIG.shape).toBe('mixed');
    const out = generateStarterTasks({ ageGroup: '9-11', mainChallenge: 'morning_routine' });
    expect(out.every((t) => !t.source.startsWith('routine:'))).toBe(true);
  });
});
