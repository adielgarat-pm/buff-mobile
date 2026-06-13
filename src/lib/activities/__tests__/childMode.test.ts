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
  it('teen adds directly active', () => {
    expect(childAddOptions('15-18')).toEqual({ status: 'active', createdByChild: true });
  });
  it('young child proposes for approval', () => {
    expect(childAddOptions('9-11')).toEqual({ status: 'proposed', createdByChild: true });
  });
});
