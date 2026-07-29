/**
 * The capture receipt's counted lines, rendered through the REAL i18n instance.
 *
 * Why this exists: the receipt shipped with a single form per line, so a run that
 * produced one item said "1 משימות לאמי" / "1 tasks for Emi" — a grammar slip on
 * the exact screen whose whole job is to make the parent trust that the 90-second
 * wait produced something real.
 *
 * The fix relies on i18next resolving the plural suffix itself, and Hebrew has a
 * `_two` category that English does not. That resolution is the thing worth
 * pinning: a missing suffix does not throw, it silently renders the raw key.
 */
import i18n from '../../i18n';

const forChild = (count: number, name: string) =>
  i18n.t('capture.receiptForChild', { count, n: count, name });

const forParent = (count: number) =>
  i18n.t('capture.receiptParent', { count, n: count });

describe('receipt count lines — Hebrew', () => {
  beforeAll(async () => { await i18n.changeLanguage('he'); });

  it('uses the singular form for one item', () => {
    expect(forChild(1, 'אמי')).toBe('משימה אחת לאמי');
    expect(forParent(1)).toBe('משימה אחת שלך');
  });

  it('uses the dual form for two items', () => {
    expect(forChild(2, 'איתי')).toBe('שתי משימות לאיתי');
    expect(forParent(2)).toBe('שתי משימות שלך');
  });

  it('uses the plural form beyond two', () => {
    expect(forChild(4, 'איתי')).toBe('4 משימות לאיתי');
    expect(forParent(3)).toBe('3 משימות שלך');
  });

  it('never leaks a raw key or an unresolved placeholder', () => {
    for (const n of [0, 1, 2, 3, 5, 10, 11, 20, 21, 100]) {
      const line = forChild(n, 'אמי');
      expect(line).not.toContain('capture.receipt');
      expect(line).not.toContain('{{');
      expect(line).toContain('אמי');
    }
  });
});

describe('receipt count lines — English', () => {
  beforeAll(async () => { await i18n.changeLanguage('en'); });

  it('uses the singular form for one item', () => {
    expect(forChild(1, 'Emi')).toBe('1 task for Emi');
    expect(forParent(1)).toBe('1 task for you');
  });

  it('uses the plural form for more than one', () => {
    expect(forChild(4, 'Itay')).toBe('4 tasks for Itay');
    expect(forParent(2)).toBe('2 tasks for you');
  });

  it('never leaks a raw key or an unresolved placeholder', () => {
    for (const n of [0, 1, 2, 3, 5, 10, 11, 20, 21, 100]) {
      const line = forChild(n, 'Emi');
      expect(line).not.toContain('capture.receipt');
      expect(line).not.toContain('{{');
      expect(line).toContain('Emi');
    }
  });
});
