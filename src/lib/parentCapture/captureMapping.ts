/**
 * Parent Capture — pure mapping / date / grouping helpers.
 *
 * No I/O, no React — easy to unit-test. Used by the store hook and the screens.
 */

import { EVENT_TYPE_TO_CATEGORY } from '../../config/parentCaptureConfig';
import type {
  CaptureEventType,
  FamilyChild,
  ParentItem,
  ParsedItem,
  TaskCategory,
  TimeBucket,
} from '../../types/parentCapture';

// ── Date helpers (UTC-noon anchored to avoid TZ off-by-one on date strings) ──

function toDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
}

function fmtUTC(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local "today" as YYYY-MM-DD (what the user perceives as today). */
export function todayISO(base: Date = new Date()): string {
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, n: number): string {
  const dt = toDate(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmtUTC(dt);
}

/** Whole-day difference a - b (positive = a is later). */
export function diffDays(a: string, b: string): number {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86_400_000);
}

// ── Mapping ──

export function eventTypeToCategory(e: CaptureEventType): TaskCategory {
  return EVENT_TYPE_TO_CATEGORY[e];
}

/** A dated item strictly before today is "past" (→ archived from "This Week"). */
export function isPastDate(dateISO: string | null, today: string): boolean {
  if (!dateISO) return false;
  return diffDays(dateISO, today) < 0;
}

export function timeBucketFor(dateISO: string | null, today: string): TimeBucket {
  if (!dateISO) return 'noDate';
  const d = diffDays(dateISO, today);
  if (d <= 0) return 'today'; // today (past handled separately by recencyPartition)
  if (d <= 7) return 'thisWeek';
  return 'later';
}

export const BUCKET_ORDER: TimeBucket[] = ['today', 'thisWeek', 'later', 'noDate'];

/** Split into the calm "This Week" set vs the archived (past-dated) set. */
export function recencyPartition(
  items: ParentItem[],
  today: string,
): { active: ParentItem[]; archived: ParentItem[] } {
  const active: ParentItem[] = [];
  const archived: ParentItem[] = [];
  for (const it of items) {
    if (it.status === 'archived' || isPastDate(it.dueDate, today)) archived.push(it);
    else active.push(it);
  }
  return { active, archived };
}

/** Group active items by time bucket, preserving BUCKET_ORDER. */
export function groupByBucket(
  items: ParentItem[],
  today: string,
): { bucket: TimeBucket; items: ParentItem[] }[] {
  const map: Record<TimeBucket, ParentItem[]> = {
    today: [],
    thisWeek: [],
    later: [],
    noDate: [],
  };
  for (const it of items) map[timeBucketFor(it.dueDate, today)].push(it);
  return BUCKET_ORDER.filter((b) => map[b].length > 0).map((bucket) => ({
    bucket,
    items: map[bucket],
  }));
}

// ── Confirm → stored item ──

let _idCounter = 0;
function genId(): string {
  _idCounter += 1;
  return `pi_${Date.now().toString(36)}_${_idCounter}`;
}

/** Convert a (possibly edited) ParsedItem + chosen owner into a stored ParentItem. */
export function parsedToParentItem(
  p: ParsedItem,
  familyId: string,
  owner: ParentItem['owner'],
  child: FamilyChild | null,
  nowISO: string = new Date().toISOString(),
): ParentItem {
  return {
    id: genId(),
    familyId,
    title: p.title,
    type: p.type,
    owner,
    childId: child?.id ?? null,
    childName: child?.displayName ?? p.childName,
    dueDate: p.dueDate,
    dueTime: p.dueTime,
    recurrence: p.recurrence,
    location: p.location,
    bring: p.bring,
    eventType: p.eventType,
    status: 'active',
    reminderOptIn: false, // calm-pull: notifications are opt-in per item
    confidence: p.confidence,
    createdAt: nowISO,
  };
}
