import { experienceBandFor, canSelfManageTasks } from '../experienceBand';

describe('experienceBandFor — age drives depth, skin is only a fallback', () => {
  test('junior age bands → junior, regardless of skin', () => {
    expect(experienceBandFor('6-8', 'mint')).toBe('junior');
    expect(experienceBandFor('6-8', 'gamer')).toBe('junior');
    expect(experienceBandFor('9-11', 'mint')).toBe('junior');
    // The reported bug: a ~9yo who picked the Gamer *look* must NOT get teen depth.
    expect(experienceBandFor('9-11', 'gamer')).toBe('junior');
  });

  test('teen age bands → teen, regardless of skin', () => {
    expect(experienceBandFor('12-14', 'gamer')).toBe('teen');
    expect(experienceBandFor('12-14', 'mint')).toBe('teen');
    expect(experienceBandFor('15-18', 'gamer')).toBe('teen');
    // A teen who picked the soft Mint look is still a teen (depth follows age).
    expect(experienceBandFor('15-18', 'mint')).toBe('teen');
  });

  test('missing age_group → Q3 skin-heuristic bridge (no teen regresses)', () => {
    expect(experienceBandFor(null, 'gamer')).toBe('teen');
    expect(experienceBandFor(undefined, 'gamer')).toBe('teen');
    expect(experienceBandFor('', 'gamer')).toBe('teen');
    expect(experienceBandFor(null, 'mint')).toBe('junior');
    expect(experienceBandFor(undefined, 'mint')).toBe('junior');
  });

  test('unrecognized age string is treated as non-teen (safe default)', () => {
    // isTeenAgeGroup only matches the two teen bands; anything else → junior.
    expect(experienceBandFor('nonsense', 'gamer')).toBe('junior');
  });
});

describe('canSelfManageTasks — task autonomy is a teen capability, never a theme', () => {
  test('teen band can self-manage tasks', () => {
    expect(canSelfManageTasks('teen')).toBe(true);
  });

  test('junior band cannot self-manage tasks', () => {
    expect(canSelfManageTasks('junior')).toBe(false);
  });

  test('a ~9yo who picked the Gamer look gets NO task autonomy (theme ≠ capability)', () => {
    // The load-bearing guarantee for pkg/teen-autonomy: gate is age, not skin.
    expect(canSelfManageTasks(experienceBandFor('9-11', 'gamer'))).toBe(false);
    expect(canSelfManageTasks(experienceBandFor('6-8', 'gamer'))).toBe(false);
  });

  test('real teens get autonomy regardless of skin', () => {
    expect(canSelfManageTasks(experienceBandFor('12-14', 'mint'))).toBe(true);
    expect(canSelfManageTasks(experienceBandFor('15-18', 'gamer'))).toBe(true);
  });
});
