/**
 * Parent Capture — shared types.
 *
 * Mirrors the validated "Extraction Contract" in
 * docs/sessions/parent-capture/SPEC.md. The parser (a STUB today, Gemini later)
 * returns ParsedItem[]; confirmed items are stored as ParentItem[].
 *
 * Feature is gated by FEATURE_PARENT_CAPTURE (config/parentCaptureConfig.ts) and
 * is OFF in production until approved. See docs/sessions/parent-capture/.
 */

export type CapturedItemType = 'task' | 'event' | 'schedule' | 'reference';
export type CapturedItemOwner = 'parent' | 'child';
export type CaptureRelevance = 'matched' | 'no_match' | 'unknown';
export type CaptureConfidence = 'high' | 'medium' | 'low';
export type CaptureEventType =
  | 'performance'
  | 'test'
  | 'homework'
  | 'activity'
  | 'errand'
  | 'payment'
  | 'form'
  | 'other';

/** The tasks.category CHECK enum a transferred child item must map to. */
export type TaskCategory =
  | 'learning'
  | 'organization'
  | 'self-care'
  | 'responsibility'
  | 'movement';

/** Raw item returned by the parser. Relative dates are resolved by the parser. */
export interface ParsedItem {
  id: string; // client-generated, for list keying
  title: string;
  type: CapturedItemType;
  owner: CapturedItemOwner;
  childName: string | null;
  relevance: CaptureRelevance;
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:MM
  recurrence: string | null;
  dates: string[];
  dateSource: string;
  location: string | null;
  bring: string[];
  eventType: CaptureEventType;
  forChildToRemember: boolean;
  linkedEvent: string | null;
  confidence: CaptureConfidence;
  missing: string | null;
}

/** A confirmed, stored parent item — the "This Week" store. */
export interface ParentItem {
  id: string;
  familyId: string;
  title: string;
  type: CapturedItemType;
  owner: CapturedItemOwner;
  childId: string | null;
  childName: string | null;
  dueDate: string | null;
  dueTime: string | null;
  recurrence: string | null;
  location: string | null;
  bring: string[];
  eventType: CaptureEventType;
  status: 'active' | 'archived' | 'done' | 'transferred';
  reminderOptIn: boolean;
  confidence: CaptureConfidence;
  /** When transferred to a child, the id of the created `tasks` row. */
  childTaskId?: string | null;
  createdAt: string; // ISO
}

export type CaptureInputKind = 'text' | 'file';

export interface CaptureInput {
  kind: CaptureInputKind;
  text?: string;
  /** Any file: PDF, Word, Excel, image, etc. */
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  /** Best-effort timestamp the source message was sent (anchors relative dates). */
  messageSentAt?: string;
}

/** Minimal roster entry used by the confirm card's owner picker. */
export interface FamilyChild {
  id: string;
  displayName: string;
}

/** Time grouping bucket for the "This Week" surface. */
export type TimeBucket = 'today' | 'thisWeek' | 'later' | 'noDate';
