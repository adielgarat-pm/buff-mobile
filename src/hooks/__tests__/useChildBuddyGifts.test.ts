/**
 * Tests for useChildBuddyGifts — buddy_gifts_history rows for a child.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { useChildBuddyGifts } from '../useChildBuddyGifts';
import { supabase } from '../../integrations/supabase/client';
import type { BuddyGift } from '../../types/buddy';

jest.mock('../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
const mockedRpc  = supabase.rpc  as jest.MockedFunction<typeof supabase.rpc>;

beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterAll(() => { (console.error as jest.Mock).mockRestore(); });

// ── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Mock the buddy_gifts_history fetch chain.
 * Chain: from('buddy_gifts_history').select('*').eq().order() → { data, error }
 */
function mockGiftsChain(data: BuddyGift[] | null, error: unknown = null) {
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({ data, error }),
      })),
    })),
  };
}

const sampleGift: BuddyGift = {
  id: 'gift-1',
  child_profile_id: 'child-1',
  gift_type: 'theme_color',
  gift_value: 'lime',
  given_at_level: 2,
  given_at: '2026-05-15T00:00:00Z',
  used_at: null,
  is_used: false,
  created_at: '2026-05-15T00:00:00Z',
};

// ── Tests ───────────────────────────────────────────────────────────────────
describe('useChildBuddyGifts', () => {
  beforeEach(() => { mockedFrom.mockReset(); });

  test('returns gifts array on success', async () => {
    mockedFrom.mockImplementation(() => mockGiftsChain([sampleGift]) as never);

    const { result } = renderHook(() => useChildBuddyGifts('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gifts).toEqual([sampleGift]);
    expect(result.current.error).toBeNull();
  });

  test('returns empty array when no rows', async () => {
    mockedFrom.mockImplementation(() => mockGiftsChain([]) as never);

    const { result } = renderHook(() => useChildBuddyGifts('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gifts).toEqual([]);
  });

  test('returns empty array when childId is null — no Supabase call', async () => {
    const { result } = renderHook(() => useChildBuddyGifts(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gifts).toEqual([]);
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  test('surfaces error if query fails', async () => {
    mockedFrom.mockImplementation(() => mockGiftsChain(null, { message: 'fetch fail' }) as never);

    const { result } = renderHook(() => useChildBuddyGifts('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gifts).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });

  describe('useGift', () => {
    beforeEach(() => {
      mockedFrom.mockImplementation(() => mockGiftsChain([sampleGift]) as never);
      mockedRpc.mockReset();
    });

    test('calls use_buddy_gift RPC and returns the result on success', async () => {
      mockedRpc.mockResolvedValue({
        data: { success: true, theme_color: '#7C5CFF', pending_remaining: 0 },
        error: null,
      } as never);

      const { result } = renderHook(() => useChildBuddyGifts('child-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const res = await result.current.useGift('gift-1');

      expect(mockedRpc).toHaveBeenCalledWith('use_buddy_gift', { p_gift_id: 'gift-1' });
      expect(res.error).toBeNull();
      expect(res.result?.theme_color).toBe('#7C5CFF');
    });

    test('returns an error when the RPC reports failure', async () => {
      mockedRpc.mockResolvedValue({
        data: { success: false, reason: 'already_used' },
        error: null,
      } as never);

      const { result } = renderHook(() => useChildBuddyGifts('child-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const res = await result.current.useGift('gift-1');

      expect(res.error).not.toBeNull();
      expect(res.error?.message).toBe('already_used');
    });

    test('surfaces a transport error from the RPC', async () => {
      mockedRpc.mockResolvedValue({ data: null, error: { message: 'network' } } as never);

      const { result } = renderHook(() => useChildBuddyGifts('child-1'));
      await waitFor(() => expect(result.current.loading).toBe(false));

      const res = await result.current.useGift('gift-1');

      expect(res.error).not.toBeNull();
      expect(res.result).toBeNull();
    });
  });
});
