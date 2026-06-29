import {
  JOIN_LINK_HOST,
  buildJoinUrl,
  buildJoinDeepLink,
  parseJoinCode,
} from '../buffConfig';

describe('buildJoinUrl', () => {
  it('builds an https smart link on the landing host', () => {
    expect(buildJoinUrl('ABC123')).toBe('https://buffadhd.com/join/ABC123');
    expect(buildJoinUrl('ABC123').startsWith(JOIN_LINK_HOST)).toBe(true);
  });

  it('uppercases the code', () => {
    expect(buildJoinUrl('xyz789')).toBe('https://buffadhd.com/join/XYZ789');
  });
});

describe('buildJoinDeepLink', () => {
  it('builds the buff:// custom-scheme fallback', () => {
    expect(buildJoinDeepLink('abc123')).toBe('buff://join/ABC123');
  });
});

describe('parseJoinCode', () => {
  it('parses a plain join_CODE referrer', () => {
    expect(parseJoinCode('join_ABC123')).toBe('ABC123');
  });

  it('parses with trailing utm params appended by the Play Store', () => {
    expect(parseJoinCode('join_ABC123&utm_source=x&utm_medium=y')).toBe('ABC123');
  });

  it('parses a percent-encoded referrer (%5F = underscore)', () => {
    expect(parseJoinCode('join%5FABC123')).toBe('ABC123');
  });

  it('uppercases a lowercase code', () => {
    expect(parseJoinCode('join_abc123')).toBe('ABC123');
  });

  it('returns null for an organic / non-join referrer', () => {
    expect(parseJoinCode('utm_source=google-play&utm_medium=organic')).toBeNull();
  });

  it('returns null for a malformed code (wrong length)', () => {
    expect(parseJoinCode('join_ABC12')).toBeNull();
  });

  it('returns null for empty / null / undefined', () => {
    expect(parseJoinCode('')).toBeNull();
    expect(parseJoinCode(null)).toBeNull();
    expect(parseJoinCode(undefined)).toBeNull();
  });
});
