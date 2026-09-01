export type TaskCategory =
  | 'learning'
  | 'organization'
  | 'self-care'
  | 'responsibility'
  | 'movement';

// Category display labels live in i18n (`category.*` keys) — render with t(),
// never from a hardcoded map (the old EN/HE maps here let English leak into
// the Hebrew UI).

export interface Task {
  id: string;
  title: string;
  /** Time in HH:MM format — used to determine which phase this task belongs to */
  time: string;
  category: TaskCategory;
  credits: number;
  completed: boolean;
  /** ISO string or Date — set when the task is completed */
  completedAt?: Date | string;
  description?: string;
  icon?: string;
  /** Days of week (0 = Sunday … 6 = Saturday). null/empty → every day (see isTaskVisibleToday). */
  scheduleDays?: number[];
  /**
   * School-day-only task: hidden on weekend days. Weekend = Sat always,
   * Fri unless app_settings.friday_enabled. Mirrors Lovable's hideOnWeekend.
   */
  hideOnWeekend?: boolean;
  /**
   * One-time task: ISO date 'YYYY-MM-DD'. When set, the task appears ONLY on this
   * date and ignores scheduleDays/hideOnWeekend. Undefined = recurring.
   */
  dueDate?: string;
  assignedTo?: string;
  strategyId?: string;
  /** Off-routine-day task: shown only while the child's off-routine mode is active. */
  isOffRoutine?: boolean;
  /**
   * Teen self-authored task (pkg/teen-autonomy): the teen created this row
   * themselves. Only these rows get the teen's edit/delete affordances; a
   * parent-assigned task is not the teen's to change. Server-governed: credits
   * are stamped to 0 until the parent assigns a value (migration 058).
   */
  createdByChild?: boolean;
}
