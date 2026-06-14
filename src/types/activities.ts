/**
 * Activities & seasonal packing — domain types.
 *
 * An Activity is something OUTSIDE the school timetable that carries gear:
 * a recurring חוג ("every Tuesday"), a one-off day ("pool day on the 12th"),
 * or a seasonal day whose equipment was pre-filled from a packing template.
 * One model serves both — see docs/sessions/activities-and-camp-lists/SPEC.md (D6).
 *
 * The school timetable (src/types/timetable.ts) is owned by a sibling session;
 * this feature deliberately does NOT import from it. `ActivityWeekday` is a
 * local copy of the same vocabulary to avoid cross-session coupling.
 */

/** Day-of-week token. Local to this feature (not imported from timetable.ts). */
export type ActivityWeekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

/** Ordered Sun→Sat — index matches JS Date.getDay() (0 = sunday). */
export const ACTIVITY_WEEKDAYS: readonly ActivityWeekday[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const;

/** Bilingual short labels for the weekday picker. */
export const ACTIVITY_WEEKDAY_LABELS: Record<ActivityWeekday, { he: string; en: string }> = {
  sunday:    { he: 'ראשון',  en: 'Sun' },
  monday:    { he: 'שני',    en: 'Mon' },
  tuesday:   { he: 'שלישי',  en: 'Tue' },
  wednesday: { he: 'רביעי',  en: 'Wed' },
  thursday:  { he: 'חמישי',  en: 'Thu' },
  friday:    { he: 'שישי',   en: 'Fri' },
  saturday:  { he: 'שבת',    en: 'Sat' },
};

/**
 * When an activity happens.
 * - `recurring` — every `weekday` (e.g. a חוג).
 * - `oneoff`    — a single calendar `date` (YYYY-MM-DD, e.g. a pool day).
 */
export type ActivitySchedule =
  | { kind: 'recurring'; weekday: ActivityWeekday }
  | { kind: 'oneoff'; date: string };

export type ActivityStatus = 'active' | 'archived' | 'proposed';

/** A parent-authored activity with the gear the child needs. */
export interface Activity {
  id: string;
  familyId: string;
  /** null = whole family; usually a specific child. */
  childId: string | null;
  title: string;
  /** → packing-template catalog key, or null for a blank/manual activity. */
  templateId: string | null;
  schedule: ActivitySchedule;
  /** "HH:MM", optional. */
  time: string | null;
  /** Equipment list — copied from a template at creation, then parent-edited. */
  equipment: string[];
  status: ActivityStatus;
  /** True when the child authored it (Feature C) — drives "added by X" + child edit rights. */
  createdByChild: boolean;
  createdAt: string; // ISO
}

/** Fields supplied to create an activity (ids/timestamps/status are server-side). */
export type NewActivity =
  Omit<Activity, 'id' | 'familyId' | 'createdAt' | 'status' | 'createdByChild'>
  & { createdByChild?: boolean };

/**
 * The unified shape the child-facing packing surface reads, regardless of
 * source. Built by buildPackingGroups() for a child + a given day.
 */
export interface PackingGroup {
  source: 'activity';
  /** Drives the card icon on the child surface. */
  templateId: string | null;
  title: string;
  /** "HH:MM" anchor shown to the child, when known. */
  time: string | null;
  items: string[];
}
