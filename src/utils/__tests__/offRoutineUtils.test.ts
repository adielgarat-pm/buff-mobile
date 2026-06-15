import { isOffRoutineActive, isTaskInActivePlan } from '../offRoutineUtils';

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

describe('isTaskInActivePlan', () => {
  const now    = new Date('2026-06-08T10:00:00Z');
  const future = '2026-06-08T23:59:59Z'; // off-routine ACTIVE
  const past   = '2026-06-08T09:00:00Z'; // off-routine inactive (stale)

  describe('off-routine INACTIVE (normal day)', () => {
    it('shows routine tasks', () => {
      expect(isTaskInActivePlan(false, null, now)).toBe(true);
      expect(isTaskInActivePlan(false, past, now)).toBe(true);
    });
    it('HIDES off-routine tasks — the leak that produced phantom incompletes', () => {
      expect(isTaskInActivePlan(true, null, now)).toBe(false);
      expect(isTaskInActivePlan(true, past, now)).toBe(false);
    });
  });

  describe('off-routine ACTIVE', () => {
    it('shows off-routine tasks', () => {
      expect(isTaskInActivePlan(true, future, now)).toBe(true);
    });
    it('hides routine tasks', () => {
      expect(isTaskInActivePlan(false, future, now)).toBe(false);
    });
  });

  it('treats null/undefined isOffRoutine as routine', () => {
    expect(isTaskInActivePlan(null, null, now)).toBe(true);
    expect(isTaskInActivePlan(undefined, future, now)).toBe(false);
  });
});
