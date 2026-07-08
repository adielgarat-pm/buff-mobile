import { isTeenAgeGroup, childAddOptions } from '../childMode';

describe('isTeenAgeGroup', () => {
  it('is true for 12+ bands', () => {
    expect(isTeenAgeGroup('12-14')).toBe(true);
    expect(isTeenAgeGroup('15-18')).toBe(true);
  });
  it('is false for younger bands / unknown', () => {
    expect(isTeenAgeGroup('6-8')).toBe(false);
    expect(isTeenAgeGroup('9-11')).toBe(false);
    expect(isTeenAgeGroup(null)).toBe(false);
    expect(isTeenAgeGroup(undefined)).toBe(false);
  });
});

describe('childAddOptions', () => {
  it('always adds directly active — no parent approval gate (D3-A)', () => {
    expect(childAddOptions()).toEqual({ status: 'active', createdByChild: true });
  });
});
