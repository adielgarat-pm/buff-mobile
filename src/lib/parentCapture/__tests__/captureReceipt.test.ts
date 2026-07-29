/**
 * captureReceipt — the parent's proof that confirming did something.
 *
 * The rules worth guarding are the ones that decide whether the receipt tells the
 * truth about a week the parent cannot yet see on the child's screen:
 *   - per-child counts are right (the receipt names who it was for);
 *   - firstDue is the EARLIEST dated item, not the first in the array — it is the
 *     "first thing that happens" line;
 *   - a batch dated entirely in the future is flagged as deferred, because that is
 *     exactly the case where the child's screen looks unchanged (red team F6);
 *   - undated batches degrade gracefully instead of inventing a date.
 */
import { summarizeConfirm, isPayoffDeferred, formatDueDate } from '../captureReceipt';
import type { ParentItem } from '../../../types/parentCapture';

function item(over: Partial<ParentItem> = {}): ParentItem {
  return {
    id: Math.random().toString(36).slice(2),
    familyId: 'fam-1',
    title: 'Pack swimsuit',
    type: 'task',
    owner: 'child',
    childId: 'kid-1',
    childName: 'Emmy',
    dueDate: null,
    dueTime: null,
    recurrence: null,
    location: null,
    bring: [],
    eventType: 'other',
    status: 'transferred',
    reminderOptIn: false,
    confidence: 'high',
    createdAt: new Date(0).toISOString(),
    ...over,
  };
}

describe('summarizeConfirm', () => {
  it('counts totals, transfers and parent-owned items separately', () => {
    const r = summarizeConfirm([
      item(),
      item(),
      item({ owner: 'parent', childId: null, childName: null, status: 'active' }),
    ]);
    expect(r.total).toBe(3);
    expect(r.transferred).toBe(2);
    expect(r.parentCount).toBe(1);
  });

  it('breaks down per child, biggest first', () => {
    const r = summarizeConfirm([
      item({ childId: 'kid-1', childName: 'Emmy' }),
      item({ childId: 'kid-2', childName: 'Leia' }),
      item({ childId: 'kid-2', childName: 'Leia' }),
    ]);
    expect(r.perChild).toEqual([
      { childId: 'kid-2', childName: 'Leia', count: 2 },
      { childId: 'kid-1', childName: 'Emmy', count: 1 },
    ]);
  });

  it('picks the EARLIEST dated item as firstDue, not the array order', () => {
    const r = summarizeConfirm([
      item({ dueDate: '2026-08-06', title: 'Last day' }),
      item({ dueDate: '2026-07-30', title: 'Pack swimsuit' }),
      item({ dueDate: '2026-08-02', title: 'Trip' }),
    ]);
    expect(r.firstDue).toEqual({ date: '2026-07-30', title: 'Pack swimsuit' });
  });

  it('counts distinct dated days, not dated items', () => {
    const r = summarizeConfirm([
      item({ dueDate: '2026-07-30' }),
      item({ dueDate: '2026-07-30' }),
      item({ dueDate: '2026-08-02' }),
      item({ dueDate: null }),
    ]);
    expect(r.daysCovered).toBe(2);
  });

  it('handles a batch with no dates at all', () => {
    const r = summarizeConfirm([item({ type: 'reference', dueDate: null })]);
    expect(r.firstDue).toBeNull();
    expect(r.daysCovered).toBe(0);
  });

  it('still records a child with no stored name', () => {
    const r = summarizeConfirm([item({ childName: null })]);
    expect(r.perChild).toEqual([{ childId: 'kid-1', childName: '', count: 1 }]);
  });

  it('returns an empty receipt for an empty confirm', () => {
    const r = summarizeConfirm([]);
    expect(r).toEqual({
      total: 0, transferred: 0, parentCount: 0,
      perChild: [], firstDue: null, daysCovered: 0,
    });
  });
});

describe('isPayoffDeferred', () => {
  // The real 2026-07-24 run: every item dated 7/26 → 8/6, nothing visible to the
  // child that day. This is the case the receipt must speak to.
  it('is true when the first dated item is in the future', () => {
    const r = summarizeConfirm([item({ dueDate: '2026-07-30' })]);
    expect(isPayoffDeferred(r, '2026-07-29')).toBe(true);
  });

  it('is false when something lands today', () => {
    const r = summarizeConfirm([
      item({ dueDate: '2026-07-29' }),
      item({ dueDate: '2026-08-06' }),
    ]);
    expect(isPayoffDeferred(r, '2026-07-29')).toBe(false);
  });

  it('is false when nothing is dated', () => {
    const r = summarizeConfirm([item({ dueDate: null })]);
    expect(isPayoffDeferred(r, '2026-07-29')).toBe(false);
  });
});

describe('formatDueDate', () => {
  // The receipt shipped printing the raw ISO string. A parent plans by weekday,
  // so the weekday is the part that has to be there.
  it('renders the weekday in Hebrew', () => {
    // 2026-08-02 is a Sunday.
    expect(formatDueDate('2026-08-02', 'he')).toContain('יום ראשון');
  });

  it('renders the weekday in English', () => {
    expect(formatDueDate('2026-08-02', 'en')).toContain('Sunday');
  });

  // The regression that matters: `new Date('2026-08-02')` is UTC midnight, which
  // renders as Saturday 8/1 for anyone west of Greenwich. Building the date from
  // its parts keeps the weekday stable everywhere — same failure class as #403.
  it('does not shift the day the way UTC parsing would', () => {
    // The trap, made explicit: `new Date('2026-08-02')` is UTC midnight, which is
    // still Saturday in Los Angeles. Anyone west of Greenwich would be shown the
    // wrong weekday.
    const utcParsed = new Date('2026-08-02').toLocaleDateString('en-US', {
      weekday: 'long', timeZone: 'America/Los_Angeles',
    });
    expect(utcParsed).toBe('Saturday');
    // Ours builds the date from its parts, so the weekday is whatever was written.
    expect(formatDueDate('2026-08-02', 'en')).toContain('Sunday');
  });

  it('falls back to the raw value rather than printing "Invalid Date"', () => {
    expect(formatDueDate('not-a-date', 'he')).toBe('not-a-date');
    expect(formatDueDate('', 'en')).toBe('');
  });
});
