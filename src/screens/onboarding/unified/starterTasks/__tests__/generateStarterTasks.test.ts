/**
 * Behaviour tests for the generator (LOGIC layer).
 *
 * Covers the contract UStep5_Preview depends on (cap, main-first, every task
 * carries title/buff_value/time/category) AND the clinical-policy decisions
 * from DOMAIN_RESEARCH.md §8 (sex-lean guarantee, 6-8 left unified, opposite
 * lean deprioritized-not-excluded, dedupe, deterministic output).
 */
import {
  generateStarterTasks,
  leanForSelection,
  scoreTask,
} from '../generateStarterTasks';
import { DEFAULT_GENERATOR_CONFIG, resolveConfig } from '../generatorConfig';
import { hhmmFor } from '../timeOfDay';
import { TASK_BY_ID } from '../taskLibrary';
import type { AgeGroup } from '../onboardingData';
import { pickLang } from '../../../../../lib/i18nString';

const BUFF_VALUE = 20; // ONBOARDING_CONFIG.DEFAULT_BUFF_VALUE

describe('leanForSelection', () => {
  const cfg = DEFAULT_GENERATOR_CONFIG;
  it('maps boy → boys, girl → girls', () => {
    expect(leanForSelection('boy', '12-14', cfg)).toBe('boys');
    expect(leanForSelection('girl', '12-14', cfg)).toBe('girls');
  });
  it('returns null for other / undefined', () => {
    expect(leanForSelection('other', '12-14', cfg)).toBeNull();
    expect(leanForSelection(undefined, '12-14', cfg)).toBeNull();
  });
  it('leaves the 6-8 band unified by default (§8.3)', () => {
    expect(leanForSelection('boy', '6-8', cfg)).toBeNull();
    expect(leanForSelection('girl', '6-8', cfg)).toBeNull();
  });
  it('honors tune6to8 override', () => {
    const tuned = resolveConfig({ tune6to8: true });
    expect(leanForSelection('boy', '6-8', tuned)).toBe('boys');
  });
});

describe('scoreTask', () => {
  const cfg = DEFAULT_GENERATOR_CONFIG;
  const both = TASK_BY_ID['d1_layout_clothes']; // sexLean 'both', baseWeight 3
  const girls = TASK_BY_ID['d5_mistake_okay']; // sexLean 'girls', baseWeight 1

  it('adds the bonus when lean matches', () => {
    expect(scoreTask(girls, 'girls', '12-14', 'girl', {}, cfg)).toBe(
      girls.baseWeight + cfg.sexLeanBonus,
    );
  });
  it('applies the penalty for opposite lean but keeps it positive-eligible', () => {
    const s = scoreTask(girls, 'boys', '12-14', 'boy', {}, cfg);
    expect(s).toBe(girls.baseWeight + cfg.oppositeLeanPenalty);
  });
  it('is lean-neutral for both-tasks', () => {
    expect(scoreTask(both, 'girls', '12-14', 'girl', {}, cfg)).toBe(both.baseWeight);
    expect(scoreTask(both, null, '12-14', undefined, {}, cfg)).toBe(both.baseWeight);
  });
  it('folds in learned scores by key', () => {
    const key = '12-14|girl|d1_layout_clothes';
    expect(scoreTask(both, null, '12-14', 'girl', { [key]: 5 }, cfg)).toBe(
      both.baseWeight + 5,
    );
  });
});

describe('generateStarterTasks — contract', () => {
  const base = {
    ageGroup: '12-14' as AgeGroup,
    mainChallenge: 'screen_time',
    additionalChallenges: ['homework_focus', 'confidence'],
  };

  it('never exceeds the cap', () => {
    const out = generateStarterTasks(base);
    expect(out.length).toBeLessThanOrEqual(DEFAULT_GENERATOR_CONFIG.taskCap);
    expect(out.length).toBeGreaterThan(0);
  });

  it('every task carries the fields the preview + DB insert need', () => {
    for (const t of generateStarterTasks(base)) {
      expect(t.id).toBeTruthy();
      expect(pickLang(t.title, 'en')).toBeTruthy();
      expect(pickLang(t.title, 'he')).toBeTruthy();
      expect(t.buff_value).toBe(BUFF_VALUE);
      expect(t.time).toBe(hhmmFor(t.timeOfDay)); // time bug fix: derived, not positional
      expect(t.category).toBeTruthy();
    }
  });

  it('puts the main challenge first', () => {
    const out = generateStarterTasks(base);
    expect(out[0].source).toBe('main');
    expect(out[0].domain).toBe(4); // screen_time → domain 4
  });

  it('is deterministic — same input, identical output', () => {
    expect(generateStarterTasks(base)).toEqual(generateStarterTasks(base));
  });

  it('returns unique task ids (dedupes across challenges in the same domain)', () => {
    // screen_time + social_media both map to domain 4
    const out = generateStarterTasks({
      ageGroup: '15-18',
      mainChallenge: 'screen_time',
      additionalChallenges: ['social_media'],
    });
    const ids = out.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('generateStarterTasks — the positional time bug it fixes', () => {
  it('assigns an evening task its evening clock time regardless of list order', () => {
    const out = generateStarterTasks({
      ageGroup: '15-18',
      mainChallenge: 'screen_time', // includes d4_screens_off (evening)
    });
    const screensOff = out.find((t) => t.id === 'd4_screens_off');
    if (screensOff) {
      // The old code gave the 2nd list item 16:00; the engine fixes meaning→time.
      expect(screensOff.time).toBe('20:00');
    }
    // And universally: no task's clock time contradicts its timeOfDay.
    for (const t of out) expect(t.time).toBe(hhmmFor(t.timeOfDay));
  });
});

describe('generateStarterTasks — clinical policy', () => {
  it('guarantees a leaned task for a girl when the domain has one (§8.1)', () => {
    const out = generateStarterTasks({
      ageGroup: '12-14',
      gender: 'girl',
      mainChallenge: 'confidence', // domain 5 — strong girls-lean content
    });
    expect(out.some((t) => t.sexLean === 'girls')).toBe(true);
  });

  it('guarantees a leaned task for a boy when the domain has one', () => {
    const out = generateStarterTasks({
      ageGroup: '9-11',
      gender: 'boy',
      mainChallenge: 'homework_focus', // domain 2 has boys-lean focus rounds
    });
    expect(out.some((t) => t.sexLean === 'boys')).toBe(true);
  });

  it('does NOT sex-tune the 6-8 band (stays unified)', () => {
    const out = generateStarterTasks({
      ageGroup: '6-8',
      gender: 'boy',
      mainChallenge: 'confidence',
    });
    // With no lean, the guarantee never fires; top-weighted picks are 'both'.
    expect(out.every((t) => t.sexLean === 'both')).toBe(true);
  });

  it('respects age bands — never returns an off-band task', () => {
    const out = generateStarterTasks({
      ageGroup: '6-8',
      mainChallenge: 'independence',
      additionalChallenges: ['time_management'],
    });
    for (const t of out) {
      expect(TASK_BY_ID[t.id].ageBands).toContain('6-8');
    }
  });
});

describe('generateStarterTasks — robustness', () => {
  it('falls back (never empty) for an unknown challenge', () => {
    const out = generateStarterTasks({
      ageGroup: '9-11',
      mainChallenge: 'totally_unknown_challenge',
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((t) => t.source === 'fallback')).toBe(true);
  });

  it('handles no additional challenges', () => {
    const out = generateStarterTasks({
      ageGroup: '15-18',
      mainChallenge: 'morning_routine',
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(DEFAULT_GENERATOR_CONFIG.mainCount);
  });

  it('ignores an additional challenge equal to the main one', () => {
    const out = generateStarterTasks({
      ageGroup: '12-14',
      mainChallenge: 'screen_time',
      additionalChallenges: ['screen_time'],
    });
    const ids = out.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
