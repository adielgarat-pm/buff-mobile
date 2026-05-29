/**
 * Tests for the bilingual-string helpers.
 *
 * Co-located here (not next to the source) to match the repo convention
 * of `src/<area>/__tests__/<file>.test.ts`. The source for these helpers
 * lives in `src/lib/i18nString.ts`.
 */
import { pickLang, pickI18nColumn, bilingualForDb, detectLangFromName } from '../i18nString';

describe('pickLang', () => {
  const literal = { en: 'Brush teeth', he: 'לצחצח שיניים' };

  it('returns Hebrew when lang is "he"', () => {
    expect(pickLang(literal, 'he')).toBe('לצחצח שיניים');
  });

  it('returns Hebrew when lang is a "he-*" variant (e.g. he-IL)', () => {
    expect(pickLang(literal, 'he-IL')).toBe('לצחצח שיניים');
  });

  it('returns English when lang is "en"', () => {
    expect(pickLang(literal, 'en')).toBe('Brush teeth');
  });

  it('returns English when lang is an unsupported locale', () => {
    expect(pickLang(literal, 'fr')).toBe('Brush teeth');
  });

  it('falls back to English when Hebrew is an empty string', () => {
    expect(pickLang({ en: 'Brush teeth', he: '' }, 'he')).toBe('Brush teeth');
  });

  it('falls back to English when lang is empty', () => {
    expect(pickLang(literal, '')).toBe('Brush teeth');
  });
});

describe('pickI18nColumn', () => {
  it('returns title_he when present and lang is Hebrew', () => {
    expect(
      pickI18nColumn({ title: 'Family movie', title_he: 'ערב סרט' }, 'he'),
    ).toBe('ערב סרט');
  });

  it('returns title (English/legacy) when lang is English', () => {
    expect(
      pickI18nColumn({ title: 'Family movie', title_he: 'ערב סרט' }, 'en'),
    ).toBe('Family movie');
  });

  it('falls back to title when title_he is null (legacy row)', () => {
    expect(
      pickI18nColumn({ title: 'Family movie', title_he: null }, 'he'),
    ).toBe('Family movie');
  });

  it('falls back to title when title_he is undefined', () => {
    expect(pickI18nColumn({ title: 'Family movie' }, 'he')).toBe('Family movie');
  });

  it('falls back to title when title_he is empty string', () => {
    expect(
      pickI18nColumn({ title: 'Family movie', title_he: '' }, 'he'),
    ).toBe('Family movie');
  });

  it('returns user-typed Hebrew in title column for Hebrew locale', () => {
    // Common case: user typed Hebrew directly into the Add Reward form;
    // it lives in `title` (the only column they edit). No `title_he`.
    expect(
      pickI18nColumn({ title: 'יום כיף', title_he: null }, 'he'),
    ).toBe('יום כיף');
  });

  it('handles he-IL locale variant', () => {
    expect(
      pickI18nColumn({ title: 'Family movie', title_he: 'ערב סרט' }, 'he-IL'),
    ).toBe('ערב סרט');
  });
});

describe('bilingualForDb', () => {
  it('maps en → title and he → title_he', () => {
    const result = bilingualForDb({ en: 'Family movie', he: 'ערב סרט' });
    expect(result).toEqual({ title: 'Family movie', title_he: 'ערב סרט' });
  });

  it('returns the exact two-key shape (no extra keys)', () => {
    const result = bilingualForDb({ en: 'a', he: 'ב' });
    expect(Object.keys(result).sort()).toEqual(['title', 'title_he']);
  });

  it('preserves empty Hebrew string as empty (not stripped)', () => {
    // Empty he is unusual but we don't fabricate a value — the row will
    // just have an empty title_he and the read-side fallback handles it.
    expect(bilingualForDb({ en: 'a', he: '' })).toEqual({ title: 'a', title_he: '' });
  });
});

describe('detectLangFromName', () => {
  it('returns "he" for a Hebrew name', () => {
    expect(detectLangFromName('איתי')).toBe('he');
  });

  it('returns "en" for a Latin name', () => {
    expect(detectLangFromName('Emi')).toBe('en');
  });

  it('Hebrew wins for a mixed-script name (Israel-first)', () => {
    expect(detectLangFromName('Dani דני')).toBe('he');
  });

  it('defaults to "he" for an empty string', () => {
    expect(detectLangFromName('')).toBe('he');
  });

  it('defaults to "he" for null / undefined', () => {
    expect(detectLangFromName(null)).toBe('he');
    expect(detectLangFromName(undefined)).toBe('he');
  });

  it('defaults to "he" for a name with no letters (digits / emoji only)', () => {
    expect(detectLangFromName('123')).toBe('he');
    expect(detectLangFromName('🙂')).toBe('he');
  });

  it('handles a Latin name with surrounding whitespace', () => {
    expect(detectLangFromName('  Noa  ')).toBe('en');
  });
});
