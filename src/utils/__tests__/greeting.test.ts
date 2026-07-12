/**
 * greeting.ts — time-bucketed parent-dashboard greeting.
 * Feature: pkg/ux-parent-dashboard-ergo ("Good morning" was shown all day).
 *
 * Buckets: hour < 12 → morning, 12 ≤ hour < 18 → afternoon, hour ≥ 18 → evening.
 */
import { greetingBucketForHour, greetingKeyForHour } from '../greeting';

describe('greetingBucketForHour', () => {
  test.each([
    [0, 'morning'],
    [6, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [15, 'afternoon'],
    [17, 'afternoon'],
    [18, 'evening'],
    [21, 'evening'],
    [23, 'evening'],
  ] as const)('hour %i → %s', (hour, bucket) => {
    expect(greetingBucketForHour(hour)).toBe(bucket);
  });
});

describe('greetingKeyForHour', () => {
  test('maps each bucket to its i18n catalog key', () => {
    expect(greetingKeyForHour(8)).toBe('dashboard.goodMorning');
    expect(greetingKeyForHour(13)).toBe('dashboard.goodAfternoon');
    expect(greetingKeyForHour(20)).toBe('dashboard.goodEvening');
  });

  test('boundary hours land on the spec buckets (12 → afternoon, 18 → evening)', () => {
    expect(greetingKeyForHour(11)).toBe('dashboard.goodMorning');
    expect(greetingKeyForHour(12)).toBe('dashboard.goodAfternoon');
    expect(greetingKeyForHour(17)).toBe('dashboard.goodAfternoon');
    expect(greetingKeyForHour(18)).toBe('dashboard.goodEvening');
  });

  test('every returned key exists in BOTH catalogs (en + he parity)', () => {
    // Guard against the key being renamed in the catalog but not here.
    const en = require('../../i18n/en.json');
    const he = require('../../i18n/he.json');
    for (const hour of [8, 13, 20]) {
      const key = greetingKeyForHour(hour);
      expect(en[key]).toBeTruthy();
      expect(he[key]).toBeTruthy();
    }
  });
});
