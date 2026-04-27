export type WeekDay =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export interface PeriodInfo {
  subject:    string;
  startTime:  string;    // "HH:MM"
  equipment?: string;    // comma-separated items, e.g. "ruler, calculator"
}

/** The full weekly schedule — a record of day → ordered list of periods. */
export type Timetable = Partial<Record<WeekDay, PeriodInfo[]>>;

export const WEEK_DAYS: WeekDay[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
];

export const WEEK_DAYS_WITH_FRIDAY: WeekDay[] = [
  ...WEEK_DAYS, 'friday',
];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  sunday:    'ראשון',
  monday:    'שני',
  tuesday:   'שלישי',
  wednesday: 'רביעי',
  thursday:  'חמישי',
  friday:    'שישי',
};

export const WEEK_DAY_LABELS_EN: Record<WeekDay, string> = {
  sunday:    'Sunday',
  monday:    'Monday',
  tuesday:   'Tuesday',
  wednesday: 'Wednesday',
  thursday:  'Thursday',
  friday:    'Friday',
};
