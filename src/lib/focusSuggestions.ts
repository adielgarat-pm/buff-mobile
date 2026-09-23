/**
 * Edit focus — suggestion diff + pro_settings merge (Freemium v2 / edit-focus,
 * D: Adi 2026-09-23, from the family-d111 parent interview).
 *
 * A parent who picked the wrong focus in onboarding can change it later from
 * Edit Child → "Focus & rewards". We then OFFER (never force) task and reward
 * ideas that fit the new focus and that the child does not already have. The
 * parent adds any of them or skips; nothing existing is ever edited or deleted.
 *
 * Pure (no I/O) so the rules are unit-tested.
 */
import type { I18nString, RewardItem } from '../screens/onboarding/unified/onboardingData';
import type { GeneratedTask } from '../screens/onboarding/unified/starterTasks';
import { pickLang } from './i18nString';

/** Case/space-insensitive title key. */
export function titleKey(s: string | null | undefined): string {
  return (s ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function bothLangKeys(title: I18nString): string[] {
  return [titleKey(pickLang(title, 'en')), titleKey(pickLang(title, 'he'))];
}

export interface FocusSuggestions {
  tasks:   GeneratedTask[];
  rewards: RewardItem[];
}

/**
 * Drop every suggestion whose title (in EITHER language — starter tasks are
 * stored in the child's language only) already exists for this child.
 */
export function diffSuggestions(input: {
  tasks:                GeneratedTask[];
  rewards:              RewardItem[];
  existingTaskTitles:   (string | null | undefined)[];
  existingRewardTitles: (string | null | undefined)[];
}): FocusSuggestions {
  const haveTasks   = new Set(input.existingTaskTitles.map(titleKey).filter(Boolean));
  const haveRewards = new Set(input.existingRewardTitles.map(titleKey).filter(Boolean));
  return {
    tasks:   input.tasks.filter(t => !bothLangKeys(t.title).some(k => haveTasks.has(k))),
    rewards: input.rewards.filter(r => !bothLangKeys(r.title).some(k => haveRewards.has(k))),
  };
}

export interface FocusChoice {
  mainChallenge:        string;
  additionalChallenges: string[];
  motivators:           string[];
}

/**
 * Merge a new focus into an existing pro_settings object without clobbering any
 * other field (language, age_group, gender, theme…). The first time a focus is
 * edited, the original onboarding answer is kept once in
 * `onboarding_data_initial` (admin board / funnel keep the real first answer).
 */
export function mergeFocusIntoProSettings(
  prev: Record<string, unknown> | null | undefined,
  focus: FocusChoice,
  nowIso: string,
): Record<string, unknown> {
  const base = prev ?? {};
  const prevData = (base.onboarding_data as Record<string, unknown> | undefined) ?? undefined;
  const next: Record<string, unknown> = {
    ...base,
    onboarding_data: {
      ...(prevData ?? {}),
      mainChallenge:        focus.mainChallenge,
      additionalChallenges: focus.additionalChallenges.filter(c => c !== focus.mainChallenge),
      motivators:           focus.motivators,
      focus_updated_at:     nowIso,
    },
  };
  if (base.onboarding_data_initial === undefined && prevData !== undefined) {
    next.onboarding_data_initial = prevData;
  }
  return next;
}
