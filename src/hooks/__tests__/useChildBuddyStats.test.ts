/**
 * Tests for useChildBuddyStats — Days Together + Tasks Completed counts.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useChildBuddyStats } from '../useChildBuddyStats';
import { supabase } from '../../integrations/supabase/client';

jest.mock('../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterAll(() => { (console.error as jest.Mock).mockRestore(); });

// ── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Mock the daily-check (Days Together) count chain.
 * Chain: from('buddy_daily_check').select(*, head).eq().gte() → { count, error }
 */
function mockDaysTogetherChain(count: number, error: unknown = null) {
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gte: jest.fn().mockResolvedValue({ count, error }),
      })),
    })),
  };
}

/**
 * Mock the daily-progress (Tasks Completed) count chain.
 * Chain: from('daily_progress').select(*, head).eq().eq().is() → { count, error }
 */
function mockTasksCompletedChain(count: number, error: unknown = null) {
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          is: jest.fn().mockResolvedValue({ count, error }),
        })),
      })),
    })),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('useChildBuddyStats', () => {
  beforeEach(() => { mockedFrom.mockReset(); });

  test('returns daysTogether + tasksCompleted on success', async () => {
    mockedFrom
      .mockImplementationOnce(() => mockDaysTogetherChain(47) as never)
      .mockImplementationOnce(() => mockTasksCompletedChain(184) as never);

    const { result } = renderHook(() => useChildBuddyStats('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({ daysTogether: 47, tasksCompleted: 184 });
    expect(result.current.error).toBeNull();
  });

  test('treats null counts as 0 (no rows yet)', async () => {
    mockedFrom
      .mockImplementationOnce(() => mockDaysTogetherChain(0) as never)
      .mockImplementationOnce(() => mockTasksCompletedChain(0) as never);

    const { result } = renderHook(() => useChildBuddyStats('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({ daysTogether: 0, tasksCompleted: 0 });
  });

  test('returns null stats when childId is null (no Supabase call)', async () => {
    const { result } = renderHook(() => useChildBuddyStats(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toBeNull();
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  test('filters buddy_daily_check by child_profile_id and daily_progress by child_id', async () => {
    const days  = mockDaysTogetherChain(3);
    const tasks = mockTasksCompletedChain(9);
    mockedFrom
      .mockImplementationOnce(() => days as never)
      .mockImplementationOnce(() => tasks as never);

    const { result } = renderHook(() => useChildBuddyStats('child-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedFrom).toHaveBeenNthCalledWith(1, 'buddy_daily_check');
    expect(mockedFrom).toHaveBeenNthCalledWith(2, 'daily_progress');

    // buddy_daily_check: .eq('child_profile_id', id).gte('tasks_completed', 1)
    const daysEq = days.select.mock.results[0].value.eq as jest.Mock;
    expect(daysEq).toHaveBeenCalledWith('child_profile_id', 'child-1');
    expect(daysEq.mock.results[0].value.gte).toHaveBeenCalledWith('tasks_completed', 1);

    // daily_progress: .eq('child_id', id).eq('completed', true).is('revoked_at', null)
    // (daily_progress has NO child_profile_id column — that 400'd in prod.)
    const tasksEq1 = tasks.select.mock.results[0].value.eq as jest.Mock;
    expect(tasksEq1).toHaveBeenCalledWith('child_id', 'child-1');
    expect(tasksEq1).not.toHaveBeenCalledWith('child_profile_id', expect.anything());
    const tasksEq2 = tasksEq1.mock.results[0].value.eq as jest.Mock;
    expect(tasksEq2).toHaveBeenCalledWith('completed', true);
    expect(tasksEq2.mock.results[0].value.is).toHaveBeenCalledWith('revoked_at', null);

    expect(result.current.stats).toEqual({ daysTogether: 3, tasksCompleted: 9 });
  });

  test('surfaces error if either query fails', async () => {
    mockedFrom
      .mockImplementationOnce(() => mockDaysTogetherChain(0, { message: 'days fail' }) as never)
      .mockImplementationOnce(() => mockTasksCompletedChain(184) as never);

    const { result } = renderHook(() => useChildBuddyStats('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toBeNull();
    expect(result.current.error).not.toBeNull();
  });
});
