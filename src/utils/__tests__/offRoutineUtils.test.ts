import { isOffRoutineActive } from '../offRoutineUtils';

describe('isOffRoutineActive', () => {
  const now = new Date('2026-06-08T10:00:00Z');

  it('returns false when off_routine_until is null/undefined (mode off)', () => {
    expect(isOffRoutineActive(null, now)).toBe(false);
    expect(isOffRoutineActive(undefined, now)).toBe(false);
  });

  it('returns true when off_routine_until is in the future (active)', () => {
    expect(isOffRoutineActive('2026-06-08T23:59:59Z', now)).toBe(true);
  });

  it('returns false when off_routine_until is in the past (stale → off)', () => {
    expect(isOffRoutineActive('2026-06-08T09:00:00Z', now)).toBe(false);
  });
});
