/**
 * Tests for the pure vibe-state derivation helpers.
 *
 * The hook itself (useDailyVibe) is not unit-tested here — it would
 * require mocking supabase + realtime, and that ratio of test code
 * to confidence isn't worth it. The hook is a thin orchestrator over
 * these pure helpers, which ARE worth testing.
 */
import {
  getTodayKey,
  isLowPowerActive,
  computeLowPowerForLevel,
  isVibeShareable,
  trimTasksForLowPower,
  type VibeSnapshot,
  type TrimmableTask,
} from '../vibeUtils';

describe('getTodayKey', () => {
  test('returns YYYY-MM-DD for a UTC date', () => {
    const d = new Date('2026-05-16T12:34:56Z');
    expect(getTodayKey(d)).toBe('2026-05-16');
  });

  test('uses UTC, not local — date near midnight local stays in UTC day', () => {
    // 23:30 in UTC+3 is 20:30 UTC same day, so UTC date is unchanged.
    const d = new Date('2026-05-16T20:30:00Z');
    expect(getTodayKey(d)).toBe('2026-05-16');
  });

  test('rolls over at UTC midnight, not local midnight', () => {
    // 01:30 in UTC+3 is 22:30 UTC PREVIOUS day. UTC date = previous day.
    const d = new Date('2026-05-15T22:30:00Z');
    expect(getTodayKey(d)).toBe('2026-05-15');
  });

  test('default `now` parameter uses real Date', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('computeLowPowerForLevel', () => {
  test.each([
    [1, true],
    [2, true],
    [3, false],
    [4, false],
    [5, false],
  ] as const)('level %i → low_power_mode = %s', (level, expected) => {
    expect(computeLowPowerForLevel(level)).toBe(expected);
  });
});

describe('isVibeShareable', () => {
  // pkg/vibe-share-notification (D5): only non-low moods (≥3) can be shared;
  // low moods (≤2) belong to the SOS path.
  test.each([
    [1, false],
    [2, false],
    [3, true],
    [4, true],
    [5, true],
  ] as const)('level %i → shareable = %s', (level, expected) => {
    expect(isVibeShareable(level)).toBe(expected);
  });

  test('shareable boundary mirrors the low-power boundary (never both)', () => {
    ([1, 2, 3, 4, 5] as const).forEach((lvl) => {
      expect(isVibeShareable(lvl)).toBe(!computeLowPowerForLevel(lvl));
    });
  });
});

describe('isLowPowerActive', () => {
  const baseSnap: VibeSnapshot = {
    vibe_level:      3,
    low_power_mode:  false,
    parent_sos_sent: false,
    vibe_shared_with_parent: false,
    vibe_type:       'emoji',
    date:            '2026-05-16',
  };

  test('null snapshot → false', () => {
    expect(isLowPowerActive(null)).toBe(false);
  });

  test('undefined snapshot → false', () => {
    expect(isLowPowerActive(undefined)).toBe(false);
  });

  test('persisted low_power_mode = true → true (regardless of level)', () => {
    // Hypothetical drift: someone wrote low_power_mode=true with vibe_level=5.
    // We trust the persisted flag.
    const snap: VibeSnapshot = { ...baseSnap, vibe_level: 5, low_power_mode: true };
    expect(isLowPowerActive(snap)).toBe(true);
  });

  test('persisted false + level >= 3 → false', () => {
    const snap: VibeSnapshot = { ...baseSnap, vibe_level: 4, low_power_mode: false };
    expect(isLowPowerActive(snap)).toBe(false);
  });

  test('persisted false + level <= 2 → true (legacy fallback)', () => {
    // Legacy Lovable rows (~4 of them) were written before low_power_mode
    // existed. They default false. Recompute from level for those.
    const snap: VibeSnapshot = { ...baseSnap, vibe_level: 1, low_power_mode: false };
    expect(isLowPowerActive(snap)).toBe(true);

    const snap2: VibeSnapshot = { ...baseSnap, vibe_level: 2, low_power_mode: false };
    expect(isLowPowerActive(snap2)).toBe(true);
  });

  test('boundary: level=3 + persisted false → false', () => {
    const snap: VibeSnapshot = { ...baseSnap, vibe_level: 3, low_power_mode: false };
    expect(isLowPowerActive(snap)).toBe(false);
  });
});

describe('trimTasksForLowPower', () => {
  const T = (id: string, completed: boolean, category?: string): TrimmableTask =>
    ({ id, completed, category });

  test('empty list → empty', () => {
    expect(trimTasksForLowPower([])).toEqual([]);
  });

  test('all completed → return as-is (kid earned the rest)', () => {
    const list = [T('1', true), T('2', true)];
    expect(trimTasksForLowPower(list)).toEqual(list);
  });

  test('first incomplete only, no self-care → just first', () => {
    const list = [
      T('a', false, 'learning'),
      T('b', false, 'organization'),
      T('c', false, 'movement'),
    ];
    expect(trimTasksForLowPower(list).map(t => t.id)).toEqual(['a']);
  });

  test('first incomplete + first incomplete self-care → both', () => {
    const list = [
      T('a', false, 'learning'),
      T('b', false, 'self-care'),
      T('c', false, 'movement'),
    ];
    expect(trimTasksForLowPower(list).map(t => t.id)).toEqual(['a', 'b']);
  });

  test('first incomplete IS self-care → just one (no duplicate)', () => {
    const list = [
      T('a', false, 'self-care'),
      T('b', false, 'self-care'),
    ];
    // first is self-care; second self-care is picked as the +1
    expect(trimTasksForLowPower(list).map(t => t.id)).toEqual(['a', 'b']);
  });

  test('only one self-care task and it is the first → just one', () => {
    const list = [
      T('a', false, 'self-care'),
      T('b', false, 'learning'),
    ];
    expect(trimTasksForLowPower(list).map(t => t.id)).toEqual(['a']);
  });

  test('completed tasks at the front are skipped', () => {
    const list = [
      T('done1', true,  'learning'),
      T('a',     false, 'organization'),
      T('b',     false, 'self-care'),
    ];
    expect(trimTasksForLowPower(list).map(t => t.id)).toEqual(['a', 'b']);
  });
});
