import { coerceWeekdays, normalizeWeekdays } from '../activities';

describe('normalizeWeekdays', () => {
  it('dedupes and sorts into Sun→Sat order regardless of input order', () => {
    expect(normalizeWeekdays(['thursday', 'sunday', 'tuesday'])).toEqual(['sunday', 'tuesday', 'thursday']);
    expect(normalizeWeekdays(['tuesday', 'tuesday', 'sunday'])).toEqual(['sunday', 'tuesday']);
  });

  it('returns [] for an empty input', () => {
    expect(normalizeWeekdays([])).toEqual([]);
  });
});

describe('coerceWeekdays (untrusted jsonb boundary)', () => {
  it('coerces a valid array, deduped and sorted', () => {
    expect(coerceWeekdays(['thursday', 'sunday', 'sunday'])).toEqual(['sunday', 'thursday']);
  });

  it('drops unknown / non-string tokens', () => {
    expect(coerceWeekdays(['sunday', 'funday', 42, null, 'tuesday'])).toEqual(['sunday', 'tuesday']);
  });

  it('returns null (not []) for non-arrays so the legacy weekday fallback fires', () => {
    expect(coerceWeekdays(null)).toBeNull();
    expect(coerceWeekdays(undefined)).toBeNull();
    expect(coerceWeekdays('sunday')).toBeNull();      // scalar jsonb
    expect(coerceWeekdays({ sunday: true })).toBeNull(); // object jsonb
  });

  it('returns null when the array has no valid tokens', () => {
    expect(coerceWeekdays([])).toBeNull();
    expect(coerceWeekdays(['nope', 7])).toBeNull();
  });
});
