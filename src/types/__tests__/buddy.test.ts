/**
 * Tests for the pure friendship-level helpers in src/types/buddy.ts.
 *
 * These mirror the SQL EOD function's threshold logic
 * (compute_buddy_eod_for_child in phase-1-migration.sql). If the
 * thresholds drift between SQL and TS, both this test file AND the
 * SQL function must be updated together.
 */
import {
  levelForSuccessfulDays,
  daysUntilNextLevel,
  FRIENDSHIP_LEVEL_THRESHOLDS,
} from '../buddy';

describe('levelForSuccessfulDays', () => {
  describe('thresholds (matches V0.5 spec: 3, 10, 30, 100)', () => {
    test('exact threshold values map to the new level', () => {
      expect(levelForSuccessfulDays(3)).toBe(2);
      expect(levelForSuccessfulDays(10)).toBe(3);
      expect(levelForSuccessfulDays(30)).toBe(4);
      expect(levelForSuccessfulDays(100)).toBe(5);
    });

    test('one day before each threshold stays at previous level', () => {
      expect(levelForSuccessfulDays(2)).toBe(1);
      expect(levelForSuccessfulDays(9)).toBe(2);
      expect(levelForSuccessfulDays(29)).toBe(3);
      expect(levelForSuccessfulDays(99)).toBe(4);
    });

    test('zero days = level 1 (Buddy Buddies)', () => {
      expect(levelForSuccessfulDays(0)).toBe(1);
    });

    test('beyond 100 days stays at level 5 (max)', () => {
      expect(levelForSuccessfulDays(101)).toBe(5);
      expect(levelForSuccessfulDays(500)).toBe(5);
      expect(levelForSuccessfulDays(10_000)).toBe(5);
    });
  });

  describe('threshold constants are documented correctly', () => {
    test('FRIENDSHIP_LEVEL_THRESHOLDS matches V0.5 spec', () => {
      expect(FRIENDSHIP_LEVEL_THRESHOLDS).toEqual({
        2: 3,
        3: 10,
        4: 30,
        5: 100,
      });
    });
  });
});

describe('daysUntilNextLevel', () => {
  test('returns days remaining at level 1 → next is L2 at 3 days', () => {
    expect(daysUntilNextLevel(0)).toBe(3);
    expect(daysUntilNextLevel(1)).toBe(2);
    expect(daysUntilNextLevel(2)).toBe(1);
  });

  test('returns days remaining at level 2 → next is L3 at 10 days', () => {
    expect(daysUntilNextLevel(3)).toBe(7);
    expect(daysUntilNextLevel(9)).toBe(1);
  });

  test('returns days remaining at level 3 → next is L4 at 30 days', () => {
    expect(daysUntilNextLevel(10)).toBe(20);
    expect(daysUntilNextLevel(29)).toBe(1);
  });

  test('returns days remaining at level 4 → next is L5 at 100 days', () => {
    expect(daysUntilNextLevel(30)).toBe(70);
    expect(daysUntilNextLevel(99)).toBe(1);
  });

  test('returns null at level 5 (no next)', () => {
    expect(daysUntilNextLevel(100)).toBeNull();
    expect(daysUntilNextLevel(500)).toBeNull();
  });
});
