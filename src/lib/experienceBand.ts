/**
 * Experience band — the age-driven UI *depth* axis, decoupled from the cosmetic
 * skin (mint/gamer) per session `theme-age-decouple` (D-2026-08-30).
 *
 * The Mint/Gamer picker is a FREE aesthetic choice at any age (PRD §4.2 — kid
 * agency, Pillar 3). It must NOT change what the app does. The DEPTH of the UI —
 * whether HQ embeds the full task list + time-of-day chips, and whether the Stats
 * tab exists — follows the child's age band instead:
 *   - junior (6–11): summary HQ, tasks live on the Quests tab, no Stats tab
 *   - teen   (12–18): dashboard-depth HQ with inline task list + Stats tab
 *
 * Reuses the existing `isTeenAgeGroup` age model (profiles.pro_settings.age_group).
 *
 * Fallback (Q3, Adi → option b): when age_group is missing — family-code signups
 * store `pro_settings: { source: 'child_signup' }` with no age_group, and some
 * legacy children lack it — bridge off the skin heuristic (gamer→teen, mint→junior)
 * so no existing teen regresses. This is a legacy bridge ONLY; a parent setting the
 * age in EditChild makes age_group authoritative from then on.
 */
import type { ChildThemeName } from '../contexts/ThemeContext';
import { isTeenAgeGroup } from './activities/childMode';

export type ExperienceBand = 'junior' | 'teen';

export function experienceBandFor(
  ageGroup: string | null | undefined,
  skin: ChildThemeName,
): ExperienceBand {
  if (ageGroup == null || ageGroup === '') {
    // Legacy bridge — no stored age. Don't regress current teens (seeded gamer).
    return skin === 'gamer' ? 'teen' : 'junior';
  }
  return isTeenAgeGroup(ageGroup) ? 'teen' : 'junior';
}

/**
 * Capability: may a child self-manage their own tasks (create/edit/delete
 * directly, live)? Teens only — juniors keep the propose→parent-approve flow
 * (pkg/teen-autonomy, D1).
 *
 * Unlike `experienceBandFor`, this has **no skin fallback**: an unknown/absent
 * age fails CLOSED. That matters because the Gamer skin is the seeded default
 * for family-code signups that carry no age_group — routing task autonomy
 * through the band would hand a young, un-aged child on the gamer skin full
 * self-management. Gating strictly on a KNOWN teen age keeps the package's
 * "theme ≠ capability" guarantee real. See `useCanSelfManageTasks` for the
 * session-role gate (real child only, never a parent-in-preview).
 */
export function canSelfManageTasksForAge(ageGroup: string | null | undefined): boolean {
  return isTeenAgeGroup(ageGroup);
}
