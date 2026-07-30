/**
 * @jest-environment jsdom
 *
 * acquisitionCapture.web — first-touch capture + resolution, and the shared
 * source-normalization matrix (pkg/acquisition-attribution). Imports .web
 * explicitly so Metro platform resolution is bypassed in jest.
 */
import { normalizeSource } from '../acquisitionCapture.shared';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ regionCode: 'US' }],
}));

// Re-import after the mock is registered.
import {
  captureAcquisitionFromUrl,
  resolveAcquisition,
  clearAcquisition,
} from '../acquisitionCapture.web';

const setSearch = (search: string) =>
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true,
    configurable: true,
  });

const setReferrer = (referrer: string) =>
  Object.defineProperty(document, 'referrer', {
    value: referrer,
    configurable: true,
  });

beforeEach(async () => {
  sessionStorage.clear();
  setSearch('');
  setReferrer('');
});

describe('normalizeSource', () => {
  it('maps known utm_source values to the enum', () => {
    expect(normalizeSource('fb')).toBe('fb');
    expect(normalizeSource('facebook')).toBe('fb');
    expect(normalizeSource('winback')).toBe('winback');
    expect(normalizeSource('guide')).toBe('guide');
    expect(normalizeSource('reels')).toBe('reels');
    expect(normalizeSource('play_ads')).toBe('play_ads');
  });

  it('is case/space-insensitive', () => {
    expect(normalizeSource('  FaceBook ')).toBe('fb');
  });

  it('returns unknown for a present-but-unmapped utm_source', () => {
    expect(normalizeSource('tiktok')).toBe('unknown');
  });

  it('derives fb from a facebook referrer when no utm', () => {
    expect(normalizeSource(null, 'https://m.facebook.com/')).toBe('fb');
  });

  it('is organic with no utm and no referrer', () => {
    expect(normalizeSource(null, null)).toBe('organic');
  });

  it('is organic for a non-social external referrer with no utm', () => {
    expect(normalizeSource(null, 'https://www.google.com/search')).toBe('organic');
  });
});

describe('web first-touch capture + resolve', () => {
  it('captures utm params and resolves the normalized source + country', async () => {
    setSearch('?utm_source=fb&utm_campaign=intl_week1');
    await captureAcquisitionFromUrl();
    const sig = await resolveAcquisition();
    expect(sig.source).toBe('fb');
    expect(sig.country).toBe('US');
    expect(sig.raw).toMatchObject({
      utm_source: 'fb',
      utm_campaign: 'intl_week1',
      capture: 'web_first_touch',
    });
  });

  it('first-touch wins: a later capture does not overwrite the first', async () => {
    setSearch('?utm_source=fb');
    await captureAcquisitionFromUrl();
    setSearch('?utm_source=winback');
    await captureAcquisitionFromUrl();
    const sig = await resolveAcquisition();
    expect(sig.source).toBe('fb');
  });

  it('captures a bare referrer when no utm is present', async () => {
    setReferrer('https://l.facebook.com/');
    await captureAcquisitionFromUrl();
    const sig = await resolveAcquisition();
    expect(sig.source).toBe('fb');
    expect(sig.raw).toMatchObject({ capture: 'web_first_touch' });
  });

  it('resolves organic (web_direct) when there is no utm and no referrer', async () => {
    await captureAcquisitionFromUrl();
    const sig = await resolveAcquisition();
    expect(sig.source).toBe('organic');
    expect(sig.country).toBe('US');
    expect(sig.raw).toMatchObject({ capture: 'web_direct' });
  });

  it('clearAcquisition resets first-touch storage', async () => {
    setSearch('?utm_source=fb');
    await captureAcquisitionFromUrl();
    await clearAcquisition();
    setSearch('?utm_source=winback');
    await captureAcquisitionFromUrl();
    const sig = await resolveAcquisition();
    expect(sig.source).toBe('winback');
  });

  it('caps a hostile over-long utm value', async () => {
    setSearch('?utm_source=' + 'x'.repeat(500));
    await captureAcquisitionFromUrl();
    const sig = await resolveAcquisition();
    expect((sig.raw?.utm_source as string).length).toBeLessThanOrEqual(120);
  });
});
