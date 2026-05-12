/**
 * Tests for the pure pause-state derivation function.
 *
 * Covers the 4 boolean × time states + null/undefined edge cases.
 */
import { isPauseActive, type PauseSnapshot } from '../pauseUtils';

describe('isPauseActive', () => {
  const NOW = new Date('2026-05-12T12:00:00Z');
  const PAST = '2026-05-10T00:00:00Z';
  const FUTURE = '2026-05-14T00:00:00Z';

  describe('inactive states', () => {
    test('null snapshot → false', () => {
      expect(isPauseActive(null, NOW)).toBe(false);
    });

    test('undefined snapshot → false', () => {
      expect(isPauseActive(undefined, NOW)).toBe(false);
    });

    test('pause_mode_active = false → false', () => {
      const snap: PauseSnapshot = { pause_mode_active: false, pause_until: null };
      expect(isPauseActive(snap, NOW)).toBe(false);
    });

    test('pause_mode_active = null → false (defensive)', () => {
      const snap: PauseSnapshot = { pause_mode_active: null, pause_until: null };
      expect(isPauseActive(snap, NOW)).toBe(false);
    });

    test('pause_mode_active = true BUT pause_until in past → false (stale)', () => {
      const snap: PauseSnapshot = { pause_mode_active: true, pause_until: PAST };
      expect(isPauseActive(snap, NOW)).toBe(false);
    });
  });

  describe('active states', () => {
    test('pause_mode_active = true + pause_until = null → true (indefinite)', () => {
      const snap: PauseSnapshot = { pause_mode_active: true, pause_until: null };
      expect(isPauseActive(snap, NOW)).toBe(true);
    });

    test('pause_mode_active = true + pause_until in future → true', () => {
      const snap: PauseSnapshot = { pause_mode_active: true, pause_until: FUTURE };
      expect(isPauseActive(snap, NOW)).toBe(true);
    });

    test('pause_mode_active = true + pause_until = undefined → true (treats as null)', () => {
      const snap: PauseSnapshot = { pause_mode_active: true, pause_until: undefined };
      expect(isPauseActive(snap, NOW)).toBe(true);
    });
  });

  describe('boundary behavior at pause_until', () => {
    test('pause_until exactly equal to now → false (boundary excluded)', () => {
      const snap: PauseSnapshot = {
        pause_mode_active: true,
        pause_until: NOW.toISOString(),
      };
      expect(isPauseActive(snap, NOW)).toBe(false);
    });

    test('pause_until 1ms after now → true', () => {
      const oneMsLater = new Date(NOW.getTime() + 1).toISOString();
      const snap: PauseSnapshot = { pause_mode_active: true, pause_until: oneMsLater };
      expect(isPauseActive(snap, NOW)).toBe(true);
    });
  });

  describe('default `now` parameter', () => {
    test('uses real Date.now() when no override passed', () => {
      const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      const snap: PauseSnapshot = { pause_mode_active: true, pause_until: farFuture };
      expect(isPauseActive(snap)).toBe(true);
    });
  });
});
