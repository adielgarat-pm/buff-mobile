/**
 * Seed rewards from the motivators a parent picked for a child.
 *
 * Extracted verbatim from UStep5_Preview (behaviour unchanged) so the same
 * logic can offer reward ideas again from "Edit focus" after onboarding
 * (Freemium v2 / edit-focus, D: Adi 2026-09-23).
 *
 * Seeds from EVERY selected motivator's list, so the menu scales with — and
 * reflects — everything the child chose (Pillar 1: a rich menu of real,
 * child-chosen rewards, always close to a win). Deduped by English title (the
 * picks lists reuse the same reward under different ids across motivators).
 * Money is intentionally absent from REWARD_PICKS — real cash is never
 * auto-seeded; the parent adds it deliberately from the Rewards screen.
 */
import { ONBOARDING_CONFIG } from '../../../config/onboardingConfig';
import { pickLang } from '../../../lib/i18nString';
import { REWARD_PICKS, FALLBACK_REWARDS, type AgeGroup, type RewardItem } from './onboardingData';

export function buildSeedRewards(
  motivators: string[] | undefined,
  ageGroup: AgeGroup,
  { fallback = true }: { fallback?: boolean } = {},
): RewardItem[] {
  const combined = (motivators ?? []).flatMap(motivatorId =>
    (REWARD_PICKS[motivatorId] as Record<AgeGroup, RewardItem[]> | undefined)?.[ageGroup] ?? []
  );

  const seen = new Set<string>();
  const deduped = combined.filter(r => {
    // Language-independent key via the sanctioned accessor (check:i18n-access).
    const key = pickLang(r.title, 'en');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length > 0 || !fallback) return deduped;
  return FALLBACK_REWARDS.slice(0, ONBOARDING_CONFIG.DEFAULT_REWARDS_COUNT);
}
