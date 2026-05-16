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
