/**
 * Guards the canonical referral-code shape used by every capture surface
 * (web URL, Android manual entry) before a code reaches redeem_referral.
 * The same rule is duplicated in landing-web/src/pages/Join.tsx — keep in sync.
 */
import { sanitizeRefCode } from '../referralCapture.web';

describe('sanitizeRefCode', () => {
  it('returns empty string for empty / nullish input', () => {
    expect(sanitizeRefCode('')).toBe('');
    expect(sanitizeRefCode(null)).toBe('');
    expect(sanitizeRefCode(undefined)).toBe('');
  });

  it('uppercases and trims surrounding junk', () => {
    expect(sanitizeRefCode('  dya7gn  ')).toBe('DYA7GN');
  });

  it('strips non-alphanumeric characters', () => {
    expect(sanitizeRefCode('ab-cd_ef')).toBe('ABCDEF');
    expect(sanitizeRefCode('D Y A 7 G N')).toBe('DYA7GN');
  });

  it('caps length at 12 to blunt hostile input', () => {
    expect(sanitizeRefCode('ABCDEFGHIJKL999999')).toBe('ABCDEFGHIJKL');
    expect(sanitizeRefCode('ABCDEFGHIJKL999999').length).toBe(12);
  });

  it('reduces all-garbage input to empty string', () => {
    expect(sanitizeRefCode('!!!___...')).toBe('');
  });

  it('leaves a canonical 6-char code unchanged', () => {
    expect(sanitizeRefCode('DYA7GN')).toBe('DYA7GN');
  });
});
