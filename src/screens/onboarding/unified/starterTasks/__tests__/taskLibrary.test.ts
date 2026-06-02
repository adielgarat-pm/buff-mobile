/**
 * Data-integrity tests for the starter-task library.
 *
 * These guard the DATA layer independently of the generator: if someone edits
 * taskLibrary.ts (the expected, frequent change), these catch malformed records
 * before they reach onboarding. No clinical judgement here — just structure.
 */
import { STARTER_TASK_LIBRARY, TASK_BY_ID } from '../taskLibrary';
import { CHALLENGE_TO_DOMAIN } from '../challengeMap';
import type { AgeBand, Domain, SexLean } from '../types';

const AGE_BANDS: AgeBand[] = ['6-8', '9-11', '12-14', '15-18'];
const SEX_LEANS: SexLean[] = ['both', 'girls', 'boys'];
const DOMAINS: Domain[] = [1, 2, 3, 4, 5, 6, 7];
const TIMES = ['morning', 'school', 'afternoon', 'evening'];

describe('taskLibrary — structure', () => {
  it('has tasks', () => {
    expect(STARTER_TASK_LIBRARY.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = STARTER_TASK_LIBRARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('TASK_BY_ID indexes every task', () => {
    expect(Object.keys(TASK_BY_ID).length).toBe(STARTER_TASK_LIBRARY.length);
    for (const t of STARTER_TASK_LIBRARY) expect(TASK_BY_ID[t.id]).toBe(t);
  });

  it('every record is well-formed', () => {
    for (const t of STARTER_TASK_LIBRARY) {
      expect(DOMAINS).toContain(t.domain);
      expect(SEX_LEANS).toContain(t.sexLean);
      expect(TIMES).toContain(t.timeOfDay);
      expect(t.title.en.length).toBeGreaterThan(0);
      expect(t.title.he.length).toBeGreaterThan(0);
      expect(t.ageBands.length).toBeGreaterThan(0);
      for (const band of t.ageBands) expect(AGE_BANDS).toContain(band);
      expect(t.evidenceTag.length).toBeGreaterThan(0);
      expect(t.rationale.length).toBeGreaterThan(0);
      expect(typeof t.enabled).toBe('boolean');
      expect(t.baseWeight).toBeGreaterThan(0);
    }
  });
});

describe('taskLibrary — coverage', () => {
  it('every domain has at least one enabled task per age band', () => {
    for (const domain of DOMAINS) {
      for (const band of AGE_BANDS) {
        const matches = STARTER_TASK_LIBRARY.filter(
          (t) => t.enabled && t.domain === domain && t.ageBands.includes(band),
        );
        expect({ domain, band, count: matches.length }).toEqual(
          expect.objectContaining({ domain, band }),
        );
        expect(matches.length).toBeGreaterThan(0);
      }
    }
  });

  it('every mapped challenge resolves to a domain that has tasks', () => {
    const domainsWithTasks = new Set(STARTER_TASK_LIBRARY.map((t) => t.domain));
    for (const [challenge, domain] of Object.entries(CHALLENGE_TO_DOMAIN)) {
      expect({ challenge, hasTasks: domainsWithTasks.has(domain) }).toEqual({
        challenge,
        hasTasks: true,
      });
    }
  });
});
