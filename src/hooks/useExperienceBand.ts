/**
 * useExperienceBand — resolves the active child's age-driven UI depth band.
 *
 * Shared layer (not per-screen) per IN-2026-07-06-01: any behavior that differs
 * across children must live in a hook/util, not be re-derived inside each screen.
 * Both ChildTabs (Stats tab) and the dashboards read from here so the gate is
 * defined once.
 *
 * Age source, in priority order:
 *   1. Parent view-as-child → the PREVIEWED child's age_group (ModeContext). On
 *      shared devices (~65% of families) this preview IS the kid's real interface,
 *      so it must win over the parent's own profile.
 *   2. A real child session → the signed-in child's pro_settings.age_group.
 * When age_group is unavailable, `experienceBandFor` falls back to the skin
 * heuristic (see that fn's Q3 note).
 */
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { useTheme } from '../contexts/ThemeContext';
import { experienceBandFor, canSelfManageTasksForAge, type ExperienceBand } from '../lib/experienceBand';

/**
 * useCanSelfManageTasks — may the CURRENT session self-author/edit/delete its
 * own tasks (pkg/teen-autonomy)? Two gates, both must hold:
 *   1. a REAL child session (`profile.role === 'child'`) — a parent viewing
 *      as-child is still the parent, and must not write tasks tagged as the
 *      child (that would misattribute and fire a false "teen added a task"
 *      alert). Parents author tasks from ParentTasksScreen instead.
 *   2. a KNOWN teen age (no skin fallback — see canSelfManageTasksForAge).
 * Fails closed on anything else (juniors, un-aged accounts, parent preview).
 */
export function useCanSelfManageTasks(): boolean {
  const { profile } = useAuth();
  if (profile?.role !== 'child') return false;
  const ageGroup =
    (profile?.pro_settings as { age_group?: string } | undefined)?.age_group ?? null;
  return canSelfManageTasksForAge(ageGroup);
}

export function useExperienceBand(): ExperienceBand {
  const { profile } = useAuth();
  const { isChildPreview, previewChildAgeGroup } = useMode();
  const { themeName } = useTheme();

  const ownAgeGroup =
    (profile?.pro_settings as { age_group?: string } | undefined)?.age_group ?? null;
  const ageGroup = isChildPreview ? previewChildAgeGroup : ownAgeGroup;

  return useMemo(() => experienceBandFor(ageGroup, themeName), [ageGroup, themeName]);
}
