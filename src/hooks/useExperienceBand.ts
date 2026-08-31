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
import { experienceBandFor, type ExperienceBand } from '../lib/experienceBand';

export function useExperienceBand(): ExperienceBand {
  const { profile } = useAuth();
  const { isChildPreview, previewChildAgeGroup } = useMode();
  const { themeName } = useTheme();

  const ownAgeGroup =
    (profile?.pro_settings as { age_group?: string } | undefined)?.age_group ?? null;
  const ageGroup = isChildPreview ? previewChildAgeGroup : ownAgeGroup;

  return useMemo(() => experienceBandFor(ageGroup, themeName), [ageGroup, themeName]);
}
