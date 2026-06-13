/**
 * Packing-template catalog — type layer.
 *
 * Templates are ready-made equipment lists (pool day, day camp, overnight camp)
 * that PRE-FILL an activity's equipment so a parent doesn't type it from scratch
 * (SPEC D6). They are pure, bilingual DATA — mirrors starterTasks/taskLibrary.ts.
 * Editing wording/items is a data edit; no logic changes.
 */
import type { I18nString } from '../i18nString';

/** One default item inside a template. */
export interface PackingItemDef {
  /** Stable id, unique within its template. */
  id: string;
  label: I18nString;
  /** Whether this item is checked-on by default when the template is applied. */
  defaultApplies: boolean;
}

/** A named packing template the parent can start an activity from. */
export interface PackingTemplateDef {
  /** Stable key, e.g. 'pool_day'. Stored on Activity.templateId. */
  id: string;
  title: I18nString;
  /** Ionicons name driving the card icon (parent + child surfaces). */
  icon: string;
  items: PackingItemDef[];
  /**
   * Smart default for the "when" step so the parent makes one fewer decision:
   * a pool day defaults to a one-off date, a recurring camp to a weekday.
   */
  defaultSchedule: 'oneoff' | 'recurring';
}
