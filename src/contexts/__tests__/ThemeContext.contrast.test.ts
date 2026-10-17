/**
 * ThemeContext — text-token contrast guard.
 *
 * Regression guard for the Mint "invisible headings" bug: child screens used
 * `T.primary` (#E9D5FF, a pale lavender FILL) and `T.accent` / `T.buff`
 * (#C084FC) as TEXT colours on the mint background / white cards — about
 * 1.1:1 to 2.4:1 contrast. Text now uses the dedicated *Text tokens, which must
 * meet WCAG AA (4.5:1 normal text) on both surfaces. Gamer must look unchanged.
 */
import { CHILD_THEMES } from '../ThemeContext';

jest.mock('../AuthContext', () => ({ useAuth: () => ({ profile: null }) }));
jest.mock('../ModeContext', () => ({ useMode: () => ({ previewChildId: null }) }));
jest.mock('../../integrations/supabase/client', () => ({ supabase: {} }));

// WCAG 2.x relative luminance + contrast ratio.
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const MINT = CHILD_THEMES.mint;
const GAMER = CHILD_THEMES.gamer;
const TEXT_TOKENS = ['primaryText', 'accentText', 'buffText'] as const;

describe('contrast helper', () => {
  it('matches known WCAG reference values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});

describe('Mint text tokens', () => {
  it.each(TEXT_TOKENS)('%s is >= 4.5:1 on the mint background and on cards', (token) => {
    expect(contrast(MINT[token], MINT.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(MINT[token], MINT.card)).toBeGreaterThanOrEqual(4.5);
  });

  it('documents why the base fill tokens must not be used as text', () => {
    // If someone "fixes" primary itself into a dark colour, buttons that pair
    // it with primaryForeground would break — keep the split explicit.
    expect(contrast(MINT.primary, MINT.background)).toBeLessThan(3);
    expect(contrast(MINT.accent, MINT.card)).toBeLessThan(3);
  });
});

describe('Gamer is visually unchanged', () => {
  it('text tokens equal the colours Gamer already used for text', () => {
    expect(GAMER.primaryText).toBe(GAMER.primary);
    expect(GAMER.accentText).toBe(GAMER.accent);
    expect(GAMER.buffText).toBe(GAMER.buff);
  });

  it('base Gamer tokens keep their values', () => {
    expect({
      background: GAMER.background,
      card: GAMER.card,
      primary: GAMER.primary,
      primaryForeground: GAMER.primaryForeground,
      accent: GAMER.accent,
      buff: GAMER.buff,
    }).toEqual({
      background: '#171C2E',
      card: '#1E2436',
      primary: '#22D3EE',
      primaryForeground: '#111827',
      accent: '#A855F7',
      buff: '#22D3EE',
    });
  });
});
