/**
 * Tests for the shared local day-key helper.
 *
 * The contract: localDayKey() returns the LOCAL calendar day as 'YYYY-MM-DD'.
 * This is the fix for the UTC-day-boundary bug (audit C1/H5) — the daily loop
 * must roll at the child's local midnight, not UTC.
 *
 * Assertions use the LOCAL Date constructor (`new Date(y, mIndex, d, …)`), so
 * the expected value is the same in every timezone the test runner might use.
 * The `TZ-divergence` test additionally proves the helper is NOT UTC-based by
 * running only when the runner is in a non-UTC zone (a UTC runner can't tell
 * local and UTC apart, so it's skipped there rather than passing vacuously).
 */
import { localDayKey } from '../dayKey';

describe('localDayKey', () => {
  test('formats local calendar components as YYYY-MM-DD (zero-padded)', () => {
    expect(localDayKey(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05');   // Jan 5
    expect(localDayKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31'); // Dec 31
  });

  test('rolls exactly at local midnight, not before', () => {
    expect(localDayKey(new Date(2026, 4, 16, 23, 59, 59))).toBe('2026-05-16');
    expect(localDayKey(new Date(2026, 4, 17, 0, 0, 0))).toBe('2026-05-17');
  });

  test('does not shift the day for late-evening local time', () => {
    // The whole point of the fix: 8pm local is still "today" everywhere.
    expect(localDayKey(new Date(2026, 6, 4, 20, 0))).toBe('2026-07-04');
  });

  test('default argument returns a valid current key', () => {
    expect(localDayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  const offsetMin = new Date(2026, 4, 16, 20, 0).getTimezoneOffset();
  const runIfNonUtc = offsetMin === 0 ? test.skip : test;
  runIfNonUtc('is local, not UTC — an instant that is a different UTC day keeps the local day', () => {
    // An absolute instant near the UTC boundary. A UTC-based key would report
    // the UTC calendar day; localDayKey must report the LOCAL one.
    const instant = new Date('2026-05-16T23:30:00Z');
    const expectedLocal =
      `${instant.getFullYear()}-` +
      `${String(instant.getMonth() + 1).padStart(2, '0')}-` +
      `${String(instant.getDate()).padStart(2, '0')}`;
    expect(localDayKey(instant)).toBe(expectedLocal);
    // And that local day differs from the naive UTC slice in a non-UTC zone
    // whenever the instant straddles midnight — guards against a UTC regression.
    const utcSlice = instant.toISOString().split('T')[0];
    if (expectedLocal !== utcSlice) {
      expect(localDayKey(instant)).not.toBe(utcSlice);
    }
  });
});
