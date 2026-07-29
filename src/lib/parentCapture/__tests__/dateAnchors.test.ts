/**
 * Pins the weekday arithmetic the parse-capture prompt hands to Gemini.
 *
 * Regression under test (found 2026-07-28 running Smart Organizer end-to-end
 * against production, capture_runs daa4a942-d1e6-4f0d-93df-3153b3b2a40c): the
 * prompt passed bare ISO dates, so the model had to infer the weekday itself
 * and got it wrong by one day. Anchored on Tuesday 2026-07-28, a class message
 * saying "the math quiz is on Thursday" came back as 2026-07-31 (a Friday) and
 * "pay by Sunday" as 2026-08-03 (a Monday).
 *
 * The module under test lives with the edge function (Deno) rather than in
 * src/ — it is dependency-free so both runtimes can load it. Import path is
 * relative on purpose; tsconfig excludes supabase/ from typecheck.
 */

import {
  addDays,
  buildDateAnchors,
  nextSevenDays,
  toDateOnly,
  weekdayIndex,
  weekdayName,
} from '../../../../supabase/functions/parse-capture/dateAnchors';

/** The anchor from the bug report. 2026-07-28 is a Tuesday. */
const TUESDAY = '2026-07-28';

describe('weekday resolution', () => {
  it('maps the reported anchor to Tuesday', () => {
    expect(weekdayName(TUESDAY, false)).toBe('Tuesday');
    expect(weekdayName(TUESDAY, true)).toBe('יום שלישי');
  });

  it('is independent of the host timezone', () => {
    // Historically the trap: a local-time parse shifts the weekday for hosts
    // west of UTC. Dates are parsed as UTC, so every day of the week holds.
    expect(weekdayIndex('2026-07-26')).toBe(0); // Sunday
    expect(weekdayIndex('2026-07-30')).toBe(4); // Thursday
    expect(weekdayIndex('2026-08-01')).toBe(6); // Saturday
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('toDateOnly', () => {
  it('accepts a bare date and a full ISO timestamp', () => {
    expect(toDateOnly(TUESDAY)).toBe(TUESDAY);
    expect(toDateOnly('2026-07-28T09:15:00.000Z')).toBe(TUESDAY);
  });

  it('rejects junk and impossible dates instead of rolling them over', () => {
    expect(toDateOnly(null)).toBeNull();
    expect(toDateOnly('')).toBeNull();
    expect(toDateOnly('yesterday')).toBeNull();
    expect(toDateOnly('28/07/2026')).toBeNull();
    expect(toDateOnly('2026-02-31')).toBeNull();
  });
});

describe('nextSevenDays', () => {
  it('resolves the two weekdays the model got wrong', () => {
    const table = nextSevenDays(TUESDAY, false);
    const on = (weekday: string) => table.find((r) => r.weekday === weekday)?.date;

    expect(on('Thursday')).toBe('2026-07-30'); // was 2026-07-31
    expect(on('Sunday')).toBe('2026-08-02'); // was 2026-08-03
    expect(on('Wednesday')).toBe('2026-07-29'); // "tomorrow", already correct
  });

  it('covers each weekday exactly once, strictly after the anchor', () => {
    const table = nextSevenDays(TUESDAY, false);
    expect(table).toHaveLength(7);
    expect(new Set(table.map((r) => r.weekday)).size).toBe(7);
    expect(table[0].date).toBe(addDays(TUESDAY, 1));
    // The anchor's own weekday resolves a full week out, never to the anchor.
    expect(table.find((r) => r.weekday === 'Tuesday')?.date).toBe('2026-08-04');
    expect(table.some((r) => r.date === TUESDAY)).toBe(false);
  });
});

describe('buildDateAnchors', () => {
  it('states the weekday for today in both languages', () => {
    expect(buildDateAnchors(TUESDAY, null, false)).toContain(`Today: ${TUESDAY} (Tuesday)`);
    expect(buildDateAnchors(TUESDAY, null, true)).toContain(`היום: ${TUESDAY} (יום שלישי)`);
  });

  it('ships the correct lookup rows in both languages', () => {
    const en = buildDateAnchors(TUESDAY, null, false);
    expect(en).toContain('- 2026-07-30 = Thursday');
    expect(en).toContain('- 2026-08-02 = Sunday');
    expect(en).not.toContain('- 2026-07-31 = Thursday');

    const he = buildDateAnchors(TUESDAY, null, true);
    // Israeli class messages write "יום ה'" — the letter form has to be there.
    expect(he).toContain("- 2026-07-30 = יום חמישי (ה')");
    expect(he).toContain("- 2026-08-02 = יום ראשון (א')");
  });

  it('anchors the table on the message date when one is supplied', () => {
    // Sent Sunday, parsed Tuesday: "Thursday" is still 2026-07-30, but the
    // table must start the day after the MESSAGE, not the day after today.
    const block = buildDateAnchors(TUESDAY, '2026-07-26T18:00:00.000Z', false);
    expect(block).toContain('Message sent: 2026-07-26 (Sunday)');
    expect(block).toContain(`Today: ${TUESDAY} (Tuesday)`);
    expect(block).toContain('- 2026-07-27 = Monday');
    expect(block).toContain('- 2026-07-30 = Thursday');
  });

  it('falls back to today when the message date is missing or unusable', () => {
    for (const bad of [null, 'unknown']) {
      const block = buildDateAnchors(TUESDAY, bad, false);
      expect(block).toContain('not provided, assume the message was sent today');
      expect(block).toContain('- 2026-07-30 = Thursday');
    }
  });

  it('forbids the model from doing its own weekday math', () => {
    expect(buildDateAnchors(TUESDAY, null, false)).toContain('NEVER work out for yourself');
    expect(buildDateAnchors(TUESDAY, null, true)).toContain('אסור להסיק בעצמך');
  });
});
