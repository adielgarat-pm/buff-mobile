/**
 * captureReceipt — what the parent gets back the moment they confirm.
 *
 * Why this exists (red team 2026-07-28, finding F6): confirming a capture used to
 * do nothing visible. The parent pasted a camp schedule, waited 60-90s, reviewed
 * 15 cards, hit confirm — and landed on a list. Meanwhile the child's screen was
 * unchanged, because `isTaskVisibleToday` shows a dated task ONLY on its day, and
 * the real run's items were dated up to 13 days out. Effort now, payoff much
 * later, no acknowledgement in between. That alone explains a 0% repeat rate
 * without needing any other cause.
 *
 * This module turns the confirmed set into a receipt: who it was for, how much
 * landed, and when the first thing actually happens — so the parent can see the
 * week they just built instead of taking it on faith.
 *
 * Pure and side-effect free so the wording and the arithmetic can be tested
 * without a screen. Dates are compared as YYYY-MM-DD strings (the shape
 * `ParentItem.dueDate` already uses) — no timezone maths, no Date parsing.
 */

import type { ParentItem } from '../../types/parentCapture';

export interface ReceiptChildLine {
  childId: string;
  childName: string;
  count: number;
}

export interface CaptureReceipt {
  /** Everything kept, including parent-owned items. */
  total: number;
  /** Items that reached a child's task loop (status 'transferred'). */
  transferred: number;
  /** Kept items the parent owns. */
  parentCount: number;
  /** Per-child breakdown, biggest first, then alphabetical for a stable order. */
  perChild: ReceiptChildLine[];
  /**
   * The earliest dated item — "the first thing that happens". Null when nothing
   * in the batch carries a date (a pile of undated reference items).
   */
  firstDue: { date: string; title: string } | null;
  /** Distinct dated days covered, so the receipt can say "across N days". */
  daysCovered: number;
}

/**
 * Build the receipt from the items that were just saved.
 *
 * Counts what was KEPT — discards never reach here, they are already reflected
 * in the run's discarded_count metric.
 */
export function summarizeConfirm(items: ReadonlyArray<ParentItem>): CaptureReceipt {
  const perChildMap = new Map<string, ReceiptChildLine>();
  const days = new Set<string>();
  let transferred = 0;
  let parentCount = 0;
  let firstDue: { date: string; title: string } | null = null;

  for (const it of items) {
    if (it.status === 'transferred') transferred++;

    if (it.owner === 'child' && it.childId) {
      const prev = perChildMap.get(it.childId);
      perChildMap.set(it.childId, {
        childId:   it.childId,
        // A child with no stored name still needs a row; the screen falls back
        // to its own roster lookup rather than printing an empty label.
        childName: it.childName ?? prev?.childName ?? '',
        count:     (prev?.count ?? 0) + 1,
      });
    } else {
      parentCount++;
    }

    if (it.dueDate) {
      days.add(it.dueDate);
      // Earliest wins; ties keep the first item seen so the order is stable.
      if (!firstDue || it.dueDate < firstDue.date) {
        firstDue = { date: it.dueDate, title: it.title };
      }
    }
  }

  const perChild = Array.from(perChildMap.values()).sort(
    (a, b) => b.count - a.count || a.childName.localeCompare(b.childName),
  );

  return {
    total:       items.length,
    transferred,
    parentCount,
    perChild,
    firstDue,
    daysCovered: days.size,
  };
}

/**
 * Is the first dated item far enough out that the child will see nothing today?
 * That is the case the receipt has to speak to explicitly — otherwise the parent
 * checks the child's screen, finds it unchanged, and concludes it did not work.
 */
export function isPayoffDeferred(receipt: CaptureReceipt, todayISO: string): boolean {
  return !!receipt.firstDue && receipt.firstDue.date > todayISO;
}
