/**
 * Edit focus — suggestion diff + pro_settings merge (Freemium v2).
 */
import { diffSuggestions, mergeFocusIntoProSettings, titleKey } from '../focusSuggestions';
import type { GeneratedTask } from '../../screens/onboarding/unified/starterTasks';
import type { RewardItem } from '../../screens/onboarding/unified/onboardingData';

const task = (id: string, en: string, he: string): GeneratedTask => ({
  id, title: { en, he }, buff_value: 10, timeOfDay: 'morning', time: '07:30',
  category: 'self-care', domain: 1, sexLean: 'both', evidenceTag: 'x', source: 'main',
} as GeneratedTask);
const reward = (id: string, en: string, he: string): RewardItem => ({ id, title: { en, he }, emoji: '🎁', size: 'small' });

describe('diffSuggestions', () => {
  const tasks = [task('t1', 'Brush teeth', 'לצחצח שיניים'), task('t2', 'Pack bag', 'לארוז תיק')];
  const rewards = [reward('r1', 'Movie night', 'ערב סרט'), reward('r2', 'Pizza', 'פיצה')];

  test('drops a task the child already has in EITHER language (starter tasks are stored in the child language)', () => {
    const out = diffSuggestions({ tasks, rewards, existingTaskTitles: ['  לצחצח   שיניים '], existingRewardTitles: [] });
    expect(out.tasks.map(t => t.id)).toEqual(['t2']);
    expect(out.rewards).toHaveLength(2);
  });

  test('drops a reward matching the title or title_he column, case-insensitive', () => {
    const out = diffSuggestions({ tasks, rewards, existingTaskTitles: [], existingRewardTitles: ['MOVIE NIGHT', null, 'פיצה'] });
    expect(out.rewards).toEqual([]);
  });

  test('keeps everything when the child has nothing yet; ignores null/empty titles', () => {
    const out = diffSuggestions({ tasks, rewards, existingTaskTitles: [null, ''], existingRewardTitles: [undefined] });
    expect(out.tasks).toHaveLength(2);
    expect(out.rewards).toHaveLength(2);
  });

  test('titleKey normalises case and inner whitespace', () => {
    expect(titleKey('  Pack   Bag ')).toBe('pack bag');
  });
});

describe('mergeFocusIntoProSettings', () => {
  const focus = { mainChallenge: 'homework_focus', additionalChallenges: ['homework_focus', 'organisation'], motivators: ['gaming'] };

  test('keeps every other pro_settings field and stores the original answer once', () => {
    const prev = {
      age_group: '9-11', language: 'he', language_source: 'parent', child_theme: 'mint',
      onboarding_data: { mainChallenge: 'screen_balance', additionalChallenges: [], motivators: ['money'] },
    };
    const next = mergeFocusIntoProSettings(prev, focus, '2026-09-23T10:00:00Z');
    expect(next).toMatchObject({ age_group: '9-11', language: 'he', language_source: 'parent', child_theme: 'mint' });
    expect(next.onboarding_data).toEqual({
      mainChallenge: 'homework_focus',
      additionalChallenges: ['organisation'],        // main is never duplicated in "other"
      motivators: ['gaming'],
      focus_updated_at: '2026-09-23T10:00:00Z',
    });
    expect(next.onboarding_data_initial).toEqual(prev.onboarding_data);
  });

  test('a second edit never overwrites the original onboarding answer', () => {
    const first = mergeFocusIntoProSettings(
      { onboarding_data: { mainChallenge: 'a', additionalChallenges: [], motivators: [] } }, focus, 't1');
    const second = mergeFocusIntoProSettings(first, { ...focus, mainChallenge: 'organisation' }, 't2');
    expect(second.onboarding_data_initial).toEqual({ mainChallenge: 'a', additionalChallenges: [], motivators: [] });
    expect((second.onboarding_data as { mainChallenge: string }).mainChallenge).toBe('organisation');
  });

  test('a child with no onboarding data (older profile) gets focus without an "initial" copy', () => {
    const next = mergeFocusIntoProSettings({ age_group: '6-8' }, focus, 't');
    expect(next.onboarding_data_initial).toBeUndefined();
    expect(next.age_group).toBe('6-8');
  });
});
