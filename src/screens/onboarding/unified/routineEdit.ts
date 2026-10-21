/**
 * Pure helpers for editing the onboarding routine in UStep5
 * (pkg/anchor-routine-onboarding M3). No I/O — the screen applies the result
 * to the already-saved task rows.
 */
import { addMinutes } from './starterTasks/routines';

export interface RoutineRow {
  id: string;
  title: string;
  time: string; // HH:MM
}

/** Below this many steps the parent can't delete more (SPEC: 4–6 steps). */
export const MIN_ROUTINE_STEPS = 4;
/** Start-time nudge per tap. */
export const SHIFT_STEP_MIN = 15;
/** Keep a routine inside a sane waking window. */
const EARLIEST = 5 * 60;      // 05:00
const LATEST = 22 * 60 + 30;  // 22:30
export const MAX_TITLE_LEN = 60;

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Sort by clock time (rows from the DB come back unordered). */
export function sortByTime(rows: RoutineRow[]): RoutineRow[] {
  return [...rows].sort((a, b) => toMin(a.time) - toMin(b.time));
}

/**
 * Shift every step by `deltaMin`, keeping the spacing. Returns null when the
 * shift would push the first step before 05:00 or the last after 22:30, so the
 * caller can simply disable the button.
 */
export function shiftRoutine(rows: RoutineRow[], deltaMin: number): RoutineRow[] | null {
  if (rows.length === 0) return null;
  const times = rows.map((r) => toMin(r.time));
  if (Math.min(...times) + deltaMin < EARLIEST) return null;
  if (Math.max(...times) + deltaMin > LATEST) return null;
  return rows.map((r) => ({ ...r, time: addMinutes(r.time, deltaMin) }));
}

export function canRemove(rows: RoutineRow[]): boolean {
  return rows.length > MIN_ROUTINE_STEPS;
}

/** Trimmed, collapsed whitespace, capped; null when empty (= keep the old title). */
export function cleanTitle(raw: string): string | null {
  const t = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE_LEN);
  return t.length > 0 ? t : null;
}

/** First step's time — what the "starts at" line shows. */
export function startTime(rows: RoutineRow[]): string | null {
  return rows.length ? sortByTime(rows)[0].time : null;
}
