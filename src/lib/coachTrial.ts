/**
 * BUFF Coach reverse-trial moments (Freemium v2, D: Adi 2026-09-23).
 *
 * The 14-day trial starts silently in the DB at the child's first real
 * completed task (migration 058 → families.trial_started_at, parents'
 * premium_until). The parent hears about it only through three one-time,
 * dismissible dashboard notes — never a sales screen, never in onboarding,
 * never to a child:
 *   started — "your coach is on for 14 days"
 *   ending  — exactly 4 days left ("here's what it found so far")
 *   ended   — the trial is over; everything stays free, one insight a week
 *
 * Pure so every edge is unit-tested; `useFamilyTrial` feeds it.
 */

export type CoachTrialPhase = 'none' | 'started' | 'ending' | 'ended';

export const TRIAL_DAYS = 14;
/** The "ending" note shows on the day exactly this many days are left. */
export const ENDING_NOTE_DAYS_LEFT = 4;
/** The "ended" note is only offered this long after the trial started, so a
 *  family that comes back months later is not greeted with old news. */
export const ENDED_NOTE_WINDOW_DAYS = 35;

const DAY_MS = 86_400_000;

export interface CoachTrialInput {
  /** families.trial_started_at (null = the trial has not started). */
  trialStartedAt:     string | null;
  /** useSubscription().isTrialActive — a time-boxed grant is running. */
  isTrialActive:      boolean;
  /** useSubscription().trialDaysLeft (ceil of days to premium_until). */
  trialDaysLeft:      number;
  /** useSubscription().hasRealEntitlement — any real/family entitlement. */
  hasRealEntitlement: boolean;
  now:                Date;
}

export function coachTrialPhase(i: CoachTrialInput): CoachTrialPhase {
  if (!i.trialStartedAt) return 'none';
  const started = new Date(i.trialStartedAt).getTime();
  if (Number.isNaN(started)) return 'none';
  const ageDays = (i.now.getTime() - started) / DAY_MS;
  if (ageDays < 0) return 'none';

  if (i.isTrialActive) {
    if (i.trialDaysLeft === ENDING_NOTE_DAYS_LEFT) return 'ending';
    if (ageDays < TRIAL_DAYS) return 'started';
    return 'none';
  }

  if (!i.hasRealEntitlement && ageDays >= TRIAL_DAYS && ageDays < ENDED_NOTE_WINDOW_DAYS) {
    return 'ended';
  }
  return 'none';
}

/** Per-family, per-phase "already seen" key (AsyncStorage → localStorage on web). */
export function coachTrialSeenKey(familyId: string, phase: Exclude<CoachTrialPhase, 'none'>): string {
  return `coachTrialNote.${phase}.seen.${familyId}`;
}
