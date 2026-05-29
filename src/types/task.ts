export type TaskCategory =
  | 'learning'
  | 'organization'
  | 'self-care'
  | 'responsibility'
  | 'movement';

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  learning: 'Learning',
  organization: 'Organization',
  'self-care': 'Self-Care',
  responsibility: 'Responsibility',
  movement: 'Movement',
};

export const CATEGORY_LABELS_HE: Record<TaskCategory, string> = {
  learning: 'למידה',
  organization: 'התארגנות',
  'self-care': 'טיפול עצמי',
  responsibility: 'בית ואחריות',
  movement: 'גוף ותנועה',
};

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
  /** Days of week (0 = Sunday … 6 = Saturday). Defaults to [0,1,2,3,4,5] (Sun–Fri). */
  scheduleDays?: number[];
  /**
   * School-day-only task: hidden on weekend days. Weekend = Sat always,
   * Fri unless app_settings.friday_enabled. Mirrors Lovable's hideOnWeekend.
   */
  hideOnWeekend?: boolean;
  assignedTo?: string;
  strategyId?: string;
}
