/**
 * Parent Capture — feature config & gate.
 *
 * FEATURE_PARENT_CAPTURE gates EVERY entry point. It MUST stay `false` in
 * production until the feature is approved (Gemini paid key + privacy posture +
 * now-vs-V-next). With it false, no entry point renders and the screens are
 * unreachable, so `main` stays releasable. See docs/sessions/parent-capture/.
 */

import type { CaptureEventType, TaskCategory } from '../types/parentCapture';

/** Master gate. Flip to `true` only on the feature branch / when approved. */
export const FEATURE_PARENT_CAPTURE = false;

export const PARENT_CAPTURE_CONFIG = {
  /** Per-family/day cap (abuse + cost guard, enforced once Gemini is wired). */
  DAILY_CAPTURE_CAP: 30,
  /** Default credits for a transferred child task. */
  DEFAULT_TASK_CREDITS: 10,
  /** Max image dimension before upload (downscale for cost/bandwidth). */
  MAX_IMAGE_DIMENSION: 1600,
  /** AsyncStorage key prefix for the local (pre-Supabase) item store. */
  STORE_KEY_PREFIX: 'buff_parent_capture_items_',
} as const;

/**
 * Maps a captured event_type -> the tasks.category CHECK enum.
 * Used when a captured item is transferred into the child's existing task loop.
 */
export const EVENT_TYPE_TO_CATEGORY: Record<CaptureEventType, TaskCategory> = {
  homework: 'learning',
  test: 'learning',
  performance: 'movement',
  activity: 'movement',
  errand: 'organization',
  form: 'responsibility',
  payment: 'responsibility',
  other: 'organization',
};
