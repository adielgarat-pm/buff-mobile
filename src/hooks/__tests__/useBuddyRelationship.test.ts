/**
 * Tests for useBuddyRelationship — read hook + setBuddyVisible/setBuddyName mutators.
 *
 * Covers:
 *   - Read: fetches the relationship row on mount
 *   - setBuddyVisible: optimistic state update; refetch-on-error rollback
 *   - setBuddyName: optimistic update for both name and null (clear)
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBuddyRelationship } from '../useBuddyRelationship';
import { supabase } from '../../integrations/supabase/client';
import type { BuddyRelationship } from '../../types/buddy';

// ── Mock supabase client ────────────────────────────────────────────────────
jest.mock('../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

// Silence console.error in test output (mutators log on error path)
beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
afterAll(() => { (console.error as jest.Mock).mockRestore(); });

// ── Fixtures ────────────────────────────────────────────────────────────────
const baseRelationship: BuddyRelationship = {
  id:                          'rel-1',
  child_profile_id:            'child-1',
  friendship_level:            3,
  successful_days_count:       12,
  current_skin_id:             'wolf',
  current_theme_color:         null,
  buddy_name:                  null,
  buddy_visible:               true,
  has_pending_gift:            false,
  relationship_started_at:     '2026-04-01T00:00:00Z',
  last_level_up_at:            '2026-04-12T00:00:00Z',
  last_successful_day_date:    '2026-05-15',
  created_at:                  '2026-04-01T00:00:00Z',
  updated_at:                  '2026-05-15T00:00:00Z',
};

// ── Helpers ─────────────────────────────────────────────────────────────────
/** Mock a successful SELECT…maybeSingle returning a relationship. */
function mockSelectReturns(row: BuddyRelationship | null) {
  return {
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
      })),
    })),
  };
}

/** Mock an UPDATE…eq…select with a given final result. Default: 1 row updated. */
function mockUpdateReturns(result: { error: unknown; data?: unknown }) {
  const final = { data: result.data ?? [{ id: 'rel-1' }], error: result.error };
  return {
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn().mockResolvedValue(final),
      })),
    })),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('useBuddyRelationship', () => {
  beforeEach(() => { mockedFrom.mockReset(); });

  test('fetches the relationship row on mount', async () => {
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.relationship).toEqual(baseRelationship);
    expect(result.current.error).toBeNull();
  });

  test('returns null relationship when childId is null (no fetch)', async () => {
    const { result } = renderHook(() => useBuddyRelationship(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.relationship).toBeNull();
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  test('setBuddyVisible(false) applies optimistic update and resolves success', async () => {
    // 1. initial fetch
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);
    // 2. update call
    mockedFrom.mockReturnValueOnce(mockUpdateReturns({ error: null }) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));
    await waitFor(() => expect(result.current.relationship).not.toBeNull());

    let returnValue: { error: Error | null } | undefined;
    await act(async () => {
      returnValue = await result.current.setBuddyVisible(false);
    });

    expect(returnValue).toEqual({ error: null });
    expect(result.current.relationship?.buddy_visible).toBe(false);
  });

  test('setBuddyVisible refetches on Supabase error (server is source of truth)', async () => {
    // 1. initial fetch — visible:true
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);
    // 2. update fails
    mockedFrom.mockReturnValueOnce(
      mockUpdateReturns({ error: { message: 'boom' } }) as never
    );
    // 3. refetch — server still says visible:true (rollback)
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));
    await waitFor(() => expect(result.current.relationship).not.toBeNull());

    let returnValue: { error: Error | null } | undefined;
    await act(async () => {
      returnValue = await result.current.setBuddyVisible(false);
    });

    expect(returnValue?.error).not.toBeNull();
    // After refetch, server truth wins: still visible
    await waitFor(() => expect(result.current.relationship?.buddy_visible).toBe(true));
  });

  test('setBuddyName sets a new name optimistically', async () => {
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);
    mockedFrom.mockReturnValueOnce(mockUpdateReturns({ error: null }) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));
    await waitFor(() => expect(result.current.relationship).not.toBeNull());

    await act(async () => {
      await result.current.setBuddyName('Sparky');
    });

    expect(result.current.relationship?.buddy_name).toBe('Sparky');
  });

  test('setBuddyName(null) clears the name (reverts to default at render time)', async () => {
    const named: BuddyRelationship = { ...baseRelationship, buddy_name: 'Sparky' };
    mockedFrom.mockReturnValueOnce(mockSelectReturns(named) as never);
    mockedFrom.mockReturnValueOnce(mockUpdateReturns({ error: null }) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));
    await waitFor(() => expect(result.current.relationship?.buddy_name).toBe('Sparky'));

    await act(async () => {
      await result.current.setBuddyName(null);
    });

    expect(result.current.relationship?.buddy_name).toBeNull();
  });

  // Regression guard for the vc68 "renamed to BOBO but באדי came back" bug:
  // an UPDATE that matches 0 rows (missing relationship row, or RLS silently
  // filtering it — e.g. a parent in View-as-Child) resolves WITHOUT a
  // Supabase error. The hook must treat 0 rows as a failure, refetch server
  // truth, and return an error so the screen can tell the user.
  test('setBuddyName treats 0 rows updated (RLS/missing row) as an error and restores server truth', async () => {
    // 1. initial fetch — buddy_name null (server truth)
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);
    // 2. update "succeeds" but matches 0 rows
    mockedFrom.mockReturnValueOnce(mockUpdateReturns({ error: null, data: [] }) as never);
    // 3. refetch — server still says buddy_name null
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));
    await waitFor(() => expect(result.current.relationship).not.toBeNull());

    let returnValue: { error: Error | null } | undefined;
    await act(async () => {
      returnValue = await result.current.setBuddyName('BOBO');
    });

    expect(returnValue?.error).toBeInstanceOf(Error);
    // Optimistic "BOBO" must not survive — server truth (null) wins.
    await waitFor(() => expect(result.current.relationship?.buddy_name).toBeNull());
  });

  test('setBuddyVisible treats 0 rows updated as an error', async () => {
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);
    mockedFrom.mockReturnValueOnce(mockUpdateReturns({ error: null, data: [] }) as never);
    mockedFrom.mockReturnValueOnce(mockSelectReturns(baseRelationship) as never);

    const { result } = renderHook(() => useBuddyRelationship('child-1'));
    await waitFor(() => expect(result.current.relationship).not.toBeNull());

    let returnValue: { error: Error | null } | undefined;
    await act(async () => {
      returnValue = await result.current.setBuddyVisible(false);
    });

    expect(returnValue?.error).toBeInstanceOf(Error);
    await waitFor(() => expect(result.current.relationship?.buddy_visible).toBe(true));
  });

  test('mutators return error if childId is null (no Supabase call)', async () => {
    const { result } = renderHook(() => useBuddyRelationship(null));

    let visibleResult: { error: Error | null } | undefined;
    let nameResult:    { error: Error | null } | undefined;
    await act(async () => {
      visibleResult = await result.current.setBuddyVisible(false);
      nameResult    = await result.current.setBuddyName('X');
    });

    expect(visibleResult?.error).toBeInstanceOf(Error);
    expect(nameResult?.error).toBeInstanceOf(Error);
    expect(mockedFrom).not.toHaveBeenCalled();
  });
});
