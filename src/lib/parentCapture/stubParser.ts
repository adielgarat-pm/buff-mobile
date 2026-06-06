/**
 * Parent Capture — STUB parser.
 *
 * This is a deterministic placeholder that stands in for the real `parse-capture`
 * Gemini Edge Function (gated on Gemini paid-key + privacy approval — see
 * docs/sessions/parent-capture/SPEC.md § "Parse service"). It lets the whole
 * capture → confirm → This-Week flow be built and tested with ZERO backend,
 * ZERO new dependencies, and ZERO production risk.
 *
 * When Gemini is approved, replace `stubParse` with a call to the Edge Function
 * that returns the SAME ParsedItem[] shape. Nothing else in the UI changes.
 */

import type { CaptureInput, ParsedItem } from '../../types/parentCapture';
import { addDays, todayISO } from './captureMapping';

export interface StubParseOptions {
  /** Anchor for the mock relative dates (defaults to local today). */
  todayISO?: string;
}

/**
 * Returns a representative mock item set for any non-empty input, and an empty
 * array for empty/whitespace input (mirrors "noise → no ghost items"). The set
 * intentionally covers every UI branch: parent/child owners, a parent↔child
 * split, a no_match (filtered) item, a reference ("to-know"), and all three
 * confidence levels.
 */
export async function stubParse(
  input: CaptureInput,
  opts: StubParseOptions = {},
): Promise<ParsedItem[]> {
  const base = opts.todayISO ?? todayISO();

  if (input.kind === 'text' && !input.text?.trim()) return [];

  const items: ParsedItem[] = [
    {
      id: 'stub-0',
      title: 'Grade-4 concert — get there',
      type: 'event',
      owner: 'parent',
      childName: null,
      relevance: 'matched',
      dueDate: addDays(base, 3),
      dueTime: '15:00',
      recurrence: null,
      dates: [],
      dateSource: '8/6',
      location: null,
      bring: [],
      eventType: 'performance',
      forChildToRemember: false,
      linkedEvent: 'grade-4-concert',
      confidence: 'high',
      missing: 'exact location',
    },
    {
      id: 'stub-1',
      title: 'Grade-4 concert — wear the outfit',
      type: 'event',
      owner: 'child',
      childName: null,
      relevance: 'matched',
      dueDate: addDays(base, 3),
      dueTime: '15:00',
      recurrence: null,
      dates: [],
      dateSource: '8/6',
      location: null,
      bring: ['white shirt', 'black leggings'],
      eventType: 'performance',
      forChildToRemember: true,
      linkedEvent: 'grade-4-concert',
      confidence: 'high',
      missing: null,
    },
    {
      id: 'stub-2',
      title: "Bring 'Naama from Dganya' workbook",
      type: 'task',
      owner: 'child',
      childName: null,
      relevance: 'unknown',
      dueDate: addDays(base, 1),
      dueTime: null,
      recurrence: 'every Sunday and Thursday',
      dates: [],
      dateSource: 'Sundays and Thursdays',
      location: 'school',
      bring: ['workbook', 'notebook'],
      eventType: 'homework',
      forChildToRemember: true,
      linkedEvent: null,
      confidence: 'medium',
      missing: 'which child',
    },
    {
      id: 'stub-3',
      title: 'Grades 5-6 soccer championship',
      type: 'event',
      owner: 'child',
      childName: null,
      relevance: 'no_match',
      dueDate: null,
      dueTime: null,
      recurrence: null,
      dates: [],
      dateSource: 'Tuesday',
      location: 'school',
      bring: [],
      eventType: 'activity',
      forChildToRemember: true,
      linkedEvent: null,
      confidence: 'low',
      missing: 'full date',
    },
    {
      id: 'stub-4',
      title: 'Timetable + Zoom links arrive Wed evening',
      type: 'reference',
      owner: 'parent',
      childName: null,
      relevance: 'unknown',
      dueDate: addDays(base, 6),
      dueTime: null,
      recurrence: null,
      dates: [],
      dateSource: 'Wednesday evening',
      location: null,
      bring: [],
      eventType: 'other',
      forChildToRemember: false,
      linkedEvent: null,
      confidence: 'high',
      missing: null,
    },
  ];

  // For an image input, return just the homework item (mirrors the verified
  // single-item extraction from a WhatsApp photo, 2026-06-05).
  if (input.kind === 'image') return [items[2]];

  return items;
}
