/**
 * Freemium v2 source guards (D: Adi 2026-09-23, docs/sessions/freemium-v2).
 *
 * Cheap static checks for the product rules that are easy to regress by a
 * one-line edit and expensive to catch in a full-screen render test:
 *   - the 2nd-child wall is gone (add-child never routes to the Paywall);
 *   - onboarding never navigates to the Paywall / FoundingHundred and never
 *     mentions a price or a trial;
 *   - no free task / child limit constant survives in src.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');

function read(rel: string): string {
  return fs.readFileSync(path.join(SRC, rel), 'utf8');
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === '__tests__' ? [] : walk(p);
    return /\.(ts|tsx)$/.test(d.name) ? [p] : [];
  });
}

describe('Freemium v2 guards', () => {
  test('dashboard add-child goes straight to onboarding (no 2nd-child paywall)', () => {
    const src = read('screens/parent/ParentDashboardScreen.tsx');
    const start = src.indexOf('const handleAddChild');
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('};', start));
    expect(body).toContain("navigate('UStep1')");
    expect(body).not.toContain('Paywall');
  });

  test('onboarding screens never navigate to a purchase screen or show price/trial copy', () => {
    const files = walk(path.join(SRC, 'screens/onboarding'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      expect({ f, paywall: /navigate\(\s*['"](Paywall|FoundingHundred)['"]/.test(src) })
        .toEqual({ f, paywall: false });
      expect({ f, price: /\$\d/.test(src) }).toEqual({ f, price: false });
    }
  });

  test('no free task / child limit survives anywhere in src', () => {
    for (const f of walk(SRC)) {
      const src = fs.readFileSync(f, 'utf8');
      expect({ f, limit: /FREE_(TASK|CHILD)_LIMIT|needsUpgrade/.test(src) })
        .toEqual({ f, limit: false });
    }
  });
});
