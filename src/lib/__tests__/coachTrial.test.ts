/**
 * BUFF Coach trial moments — phase table + copy guards (Freemium v2).
 */
import { coachTrialPhase, coachTrialSeenKey, type CoachTrialInput } from '../coachTrial';

const START = '2026-09-01T10:00:00Z';
const day = (n: number) => new Date(new Date(START).getTime() + n * 86_400_000);

function input(over: Partial<CoachTrialInput>): CoachTrialInput {
  return {
    trialStartedAt: START, isTrialActive: false, trialDaysLeft: 0, hasRealEntitlement: false, now: day(1),
    ...over,
  };
}

describe('coachTrialPhase', () => {
  test('no trial clock → none (includes every family before its first real task)', () => {
    expect(coachTrialPhase(input({ trialStartedAt: null, isTrialActive: true, trialDaysLeft: 10 }))).toBe('none');
  });

  test('day 1 of an active trial → started', () => {
    expect(coachTrialPhase(input({ isTrialActive: true, trialDaysLeft: 13, hasRealEntitlement: true, now: day(1) }))).toBe('started');
  });

  test('exactly 4 days left → ending (the day-10 heads-up)', () => {
    expect(coachTrialPhase(input({ isTrialActive: true, trialDaysLeft: 4, hasRealEntitlement: true, now: day(10) }))).toBe('ending');
  });

  test('3/2/1 days left → not the "4 days" note (copy says 4; the ribbon counts down)', () => {
    for (const left of [3, 2, 1]) {
      expect(coachTrialPhase(input({ isTrialActive: true, trialDaysLeft: left, hasRealEntitlement: true, now: day(14 - left) })))
        .toBe('started');
    }
  });

  test('trial stacked on a referral, past day 14 but still active → none', () => {
    expect(coachTrialPhase(input({ isTrialActive: true, trialDaysLeft: 9, hasRealEntitlement: true, now: day(19) }))).toBe('none');
  });

  test('trial over, no entitlement, within the window → ended', () => {
    expect(coachTrialPhase(input({ now: day(14.5) }))).toBe('ended');
    expect(coachTrialPhase(input({ now: day(34) }))).toBe('ended');
  });

  test('trial over but the family now pays / is lifetime → none (never an upsell to a payer)', () => {
    expect(coachTrialPhase(input({ hasRealEntitlement: true, now: day(20) }))).toBe('none');
  });

  test('old trial (outside the 35-day window) → none', () => {
    expect(coachTrialPhase(input({ now: day(60) }))).toBe('none');
  });

  test('clock in the future / garbage → none', () => {
    expect(coachTrialPhase(input({ now: day(-1) }))).toBe('none');
    expect(coachTrialPhase(input({ trialStartedAt: 'nope' }))).toBe('none');
  });

  test('seen key is per family and phase', () => {
    expect(coachTrialSeenKey('fam-1', 'ended')).toBe('coachTrialNote.ended.seen.fam-1');
  });
});

describe('coach trial copy (Pillar 2 — no loss/shame framing; approved Hebrew verbatim)', () => {
  const en = require('../../i18n/en.json') as Record<string, string>;
  const he = require('../../i18n/he.json') as Record<string, string>;
  const KEYS = ['coachTrial.started', 'coachTrial.ending', 'coachTrial.ended', 'coachTrial.keep', 'coachTrial.close'];

  test('Hebrew is exactly the copy Adi approved (with {{name}} interpolation)', () => {
    expect(he['coachTrial.started']).toBe('✨ המאמן של BUFF פעיל אצלכם ל-14 יום. אחרי כמה ימים של משימות הוא ישתף מה עובד ל{{name}}.');
    expect(he['coachTrial.ending']).toBe('למאמן של BUFF נשארו עוד 4 ימים. הנה מה שהוא מצא עד עכשיו ›');
    expect(he['coachTrial.ended']).toBe('14 הימים עם המאמן של BUFF הסתיימו. כל מה ש{{name}} משתמש/ת בו נשאר חינם, ותמשיכו לקבל תובנה אחת מהמאמן בכל שבוע.');
    expect(he['coachTrial.keep']).toBe('להמשיך עם המאמן');
    expect(he['coachTrial.close']).toBe('סגור');
  });

  test('no loss / expiry / lock words in either language', () => {
    for (const k of KEYS) {
      expect(en[k]).toBeTruthy();
      expect(en[k]).not.toMatch(/\b(lost|lose|losing|expired?|locked|lock|miss(ed)?|gone|only)\b/i);
      expect(he[k]).not.toMatch(/(איבד|אבד|פג |פג\.|נעול|ננעל|הפסד)/);
    }
  });
});
