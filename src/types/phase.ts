export type Phase = 'morning' | 'school' | 'afternoon' | 'evening';

export interface PhaseConfig {
  id: Phase;
  label: string;
  labelHe: string;
  shortLabel: string;
  shortLabelHe: string;
  icon: string;
  startHour: number;
  endHour: number;
  color: string;
}

export const PHASES: PhaseConfig[] = [
  {
    id: 'morning',
    label: 'Morning Routine',
    labelHe: 'שגרת בוקר',
    shortLabel: 'Morning',
    shortLabelHe: 'בוקר',
    icon: '🌅',
    startHour: 6,
    endHour: 9,
    color: '#F59E0B',
  },
  {
    id: 'school',
    label: 'School Day',
    labelHe: 'יום לימודים',
    shortLabel: 'School',
    shortLabelHe: 'בי״ס',
    icon: '📚',
    startHour: 9,
    endHour: 16,
    color: '#3B82F6',
  },
  {
    id: 'afternoon',
    label: 'Afternoon / Study',
    labelHe: 'צהריים / למידה',
    shortLabel: 'Afternoon',
    shortLabelHe: 'צהריים',
    icon: '📖',
    startHour: 16,
    endHour: 18,
    color: '#10B981',
  },
  {
    id: 'evening',
    label: 'Evening / Bedtime',
    labelHe: 'ערב / שינה',
    shortLabel: 'Evening',
    shortLabelHe: 'ערב',
    icon: '🌙',
    startHour: 18,
    endHour: 24,
    color: '#8B5CF6',
  },
];

export function getCurrentPhase(): Phase {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 16) return 'school';
  if (hour >= 16 && hour < 18) return 'afternoon';
  return 'evening';
}

export function getPhaseConfig(phase: Phase): PhaseConfig {
  return PHASES.find(p => p.id === phase) || PHASES[0];
}

export function getPhaseForTime(timeString: string): Phase {
  const [hours] = timeString.split(':').map(Number);
  if (hours >= 6 && hours < 9) return 'morning';
  if (hours >= 9 && hours < 16) return 'school';
  if (hours >= 16 && hours < 18) return 'afternoon';
  return 'evening';
}

/**
 * Get the phase for a specific time, using the actual school end time.
 * Tasks scheduled after school ends appear in 'afternoon' phase.
 *
 * IMPORTANT: When isSchoolDay is false (weekends OR school quest disabled),
 * tasks between 09:00–18:00 go to 'afternoon' — there is no 'school' phase.
 *
 * @param timeString   Time in HH:MM format
 * @param schoolEndTime School end time in HH:MM format (from schedule)
 * @param isSchoolDay  Whether today is a school day AND school quest is enabled
 */
export function getSmartPhaseForTime(
  timeString: string,
  schoolEndTime: string | null,
  isSchoolDay: boolean,
): Phase {
  const [hours, minutes] = timeString.split(':').map(Number);
  const taskMinutes = hours * 60 + minutes;

  // Morning: 6:00–9:00 (always applies)
  if (taskMinutes >= 360 && taskMinutes < 540) {
    return 'morning';
  }

  // Evening: 18:00+ (1080 minutes) (always applies)
  if (taskMinutes >= 1080) {
    return 'evening';
  }

  // Not a school day (weekend OR school quest disabled):
  // all tasks between 09:00–18:00 go to 'afternoon'
  if (!isSchoolDay) {
    return 'afternoon';
  }

  // School day — use actual school end time (default 14:00 = 840 min)
  let schoolEndMinutes = 840;
  if (schoolEndTime) {
    const [endHours, endMins] = schoolEndTime.split(':').map(Number);
    schoolEndMinutes = endHours * 60 + endMins;
  }

  // School phase: 9:00 until school actually ends
  if (taskMinutes >= 540 && taskMinutes < schoolEndMinutes) {
    return 'school';
  }

  // Afternoon: after school ends until 18:00
  return 'afternoon';
}
