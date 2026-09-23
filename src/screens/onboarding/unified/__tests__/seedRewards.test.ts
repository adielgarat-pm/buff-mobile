/**
 * buildSeedRewards — extracted from UStep5_Preview with NO behaviour change
 * (onboarding must stay exactly the same, Freemium v2 hard requirement).
 * The reference below is the pre-extraction inline algorithm, verbatim.
 */
import { buildSeedRewards } from '../seedRewards';
import { MOTIVATORS, REWARD_PICKS, FALLBACK_REWARDS, type AgeGroup, type RewardItem } from '../onboardingData';
import { ONBOARDING_CONFIG } from '../../../../config/onboardingConfig';
import { pickLang } from '../../../../lib/i18nString';

function referenceBuildRewards(motivatorsIn: string[] | undefined, ageGroup: AgeGroup): RewardItem[] {
  const motivators = motivatorsIn ?? [];
  const combined = motivators.flatMap(motivatorId =>
    (REWARD_PICKS[motivatorId] as Record<AgeGroup, typeof FALLBACK_REWARDS> | undefined)?.[ageGroup] ?? []
  );
  const seen = new Set<string>();
  const deduped = combined.filter(r => {
    const key = pickLang(r.title, 'en');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.length > 0 ? deduped : FALLBACK_REWARDS.slice(0, ONBOARDING_CONFIG.DEFAULT_REWARDS_COUNT);
}

const AGES: AgeGroup[] = ['6-8', '9-11', '12-14', '15-18'];
const IDS = MOTIVATORS.map(m => m.id);

describe('buildSeedRewards — parity with the onboarding inline builder', () => {
  test('identical for every age group × every single / pair / all motivators, and none', () => {
    const combos: (string[] | undefined)[] = [undefined, [], IDS];
    for (const a of IDS) {
      combos.push([a]);
      for (const b of IDS) if (a !== b) combos.push([a, b]);
    }
    for (const age of AGES) {
      for (const m of combos) {
        expect(buildSeedRewards(m, age)).toEqual(referenceBuildRewards(m, age));
      }
    }
  });

  test('fallback:false returns [] instead of the generic fallback (for Edit focus)', () => {
    expect(buildSeedRewards([], '9-11', { fallback: false })).toEqual([]);
    expect(buildSeedRewards(['money'], '9-11', { fallback: false })).toEqual([]);
  });
});
