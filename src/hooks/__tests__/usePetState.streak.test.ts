/**
 * usePetState — streak side-effect tests.
 *
 * Regression guard for the bug where the daily streak was stuck at 0: the pet
 * hook's onTaskCompleted was never wired to task completion, so daily_streak,
 * evolution_days_count, and XP never advanced. The fix routes every real
 * incomplete→complete transition through applyTaskCompletionToPet (called from
 * useChildData.completeTask). These tests assert that entry point advances the
 * streak once per calendar day and accrues XP on every call.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTaskCompletionToPet } from '../usePetState';
import { DEFAULT_PET_STATE, PetState } from '../../types/pet';

const PET_STATE_KEY = 'buff_pet_state';

const todayKey = () => new Date().toISOString().split('T')[0];
function daysAgoKey(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split('T')[0];
}

async function readState(): Promise<PetState> {
  const raw = await AsyncStorage.getItem(PET_STATE_KEY);
  return JSON.parse(raw as string);
}
async function seedState(overrides: Partial<PetState>) {
  await AsyncStorage.setItem(
    PET_STATE_KEY,
    JSON.stringify({ ...DEFAULT_PET_STATE, ...overrides }),
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('applyTaskCompletionToPet', () => {
  it('starts the streak at 1 on the first ever completion (no stored state)', async () => {
    await applyTaskCompletionToPet(10);

    const s = await readState();
    expect(s.daily_streak).toBe(1);
    expect(s.evolution_days_count).toBe(1);
    expect(s.last_task_completion_date).toBe(todayKey());
    expect(s.experience).toBeGreaterThanOrEqual(5);
  });

  it('does not advance the streak twice on the same day, but keeps accruing XP', async () => {
    await applyTaskCompletionToPet(10);
    const afterFirst = await readState();

    await applyTaskCompletionToPet(10);
    const afterSecond = await readState();

    expect(afterSecond.daily_streak).toBe(1);           // unchanged same day
    expect(afterSecond.evolution_days_count).toBe(1);   // unchanged same day
    expect(afterSecond.experience).toBeGreaterThan(afterFirst.experience); // XP per task
  });

  it('increments the streak when the previous completion was yesterday', async () => {
    await seedState({ daily_streak: 3, evolution_days_count: 3, last_task_completion_date: daysAgoKey(1) });

    await applyTaskCompletionToPet(10);

    const s = await readState();
    expect(s.daily_streak).toBe(4);
    expect(s.evolution_days_count).toBe(4);
  });

  it('grants a rest card at the 5-day evolution milestone', async () => {
    await seedState({ daily_streak: 4, evolution_days_count: 4, rest_cards_balance: 0, last_task_completion_date: daysAgoKey(1) });

    await applyTaskCompletionToPet(10);

    const s = await readState();
    expect(s.evolution_days_count).toBe(5);
    expect(s.rest_cards_balance).toBe(1);
  });
});
