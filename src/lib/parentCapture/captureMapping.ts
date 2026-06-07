/**
 * Parent Capture — pure mapping / date / grouping helpers.
 *
 * No I/O, no React — easy to unit-test. Used by the store hook and the screens.
 */

import { EVENT_TYPE_TO_CATEGORY, PARENT_CAPTURE_CONFIG } from '../../config/parentCaptureConfig';
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

// ── Transfer-to-child mapping ──

const HE_DAYS: ReadonlyArray<[string, number]> = [
  ['ראשון', 0], ['שני', 1], ['שלישי', 2], ['רביעי', 3], ['חמישי', 4], ['שישי', 5], ['שבת', 6],
];
const EN_DAYS: ReadonlyArray<[string, number]> = [
  ['sunday', 0], ['monday', 1], ['tuesday', 2], ['wednesday', 3],
  ['thursday', 4], ['friday', 5], ['saturday', 6],
];

/**
 * Parse a free-text recurrence ("every Sunday and Thursday" / "כל ראשון וחמישי")
 * to sorted weekday indices, or null if no day name is found.
 */
export function recurrenceToScheduleDays(recurrence: string | null): number[] | null {
  if (!recurrence) return null;
  const lower = recurrence.toLowerCase();
  const days = new Set<number>();
  for (const [he, idx] of HE_DAYS) if (recurrence.includes(he)) days.add(idx);
  for (const [en, idx] of EN_DAYS) if (lower.includes(en)) days.add(idx);
  return days.size > 0 ? [...days].sort((a, b) => a - b) : null;
}

export interface ChildTaskFields {
  title: string;
  time: string;
  category: TaskCategory;
  credits: number;
  scheduleDays: number[];
  dueDate: string | null;
}

/**
 * Build child-task fields from a captured item.
 * - recurrence present → recurring (scheduleDays from recurrence; dueDate null)
 * - else dueDate present → ONE-TIME (scheduleDays = [] so it's inert on every
 *   recurring surface incl. the BUDDY EOD cron; dueDate drives visibility)
 * - else → recurring every day
 */
export function childTaskFieldsFromParsed(p: ParsedItem): ChildTaskFields {
  const recDays = recurrenceToScheduleDays(p.recurrence);
  let scheduleDays: number[];
  let dueDate: string | null;
  if (recDays) {
    scheduleDays = recDays;
    dueDate = null;
  } else if (p.dueDate) {
    scheduleDays = []; // one-time guard — matches no weekday
    dueDate = p.dueDate;
  } else {
    scheduleDays = [0, 1, 2, 3, 4, 5, 6];
    dueDate = null;
  }
  return {
    title: p.title,
    time: p.dueTime ?? '14:00',
    category: EVENT_TYPE_TO_CATEGORY[p.eventType],
    credits: PARENT_CAPTURE_CONFIG.DEFAULT_TASK_CREDITS,
    scheduleDays,
    dueDate,
  };
}
