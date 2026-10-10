/**
 * recordChildActivity — goes through the record_child_activity RPC (migration
 * 061, child writes to app_settings are blocked by RLS) and keeps a stable
 * identity when settings change, so effects depending on it do not loop.
 */
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useAppSettings } from '../useAppSettings';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { family_id: 'fam-1' } }),
}));

const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = jest.fn();
let mockRealtime: ((p: { new: unknown }) => void) | null = null;

jest.mock('../../integrations/supabase/client', () => {
  const channel = {
    on: (_e: unknown, _f: unknown, cb: (p: { new: unknown }) => void) => { mockRealtime = cb; return channel; },
    subscribe: () => channel,
  };
  return {
    supabase: {
      rpc: (...a: unknown[]) => mockRpc(...a),
      channel: () => channel,
      removeChannel: jest.fn(),
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { family_id: 'fam-1', last_child_activity: null }, error: null }),
          }),
        }),
        update: (...a: unknown[]) => { mockUpdate(...a); return { eq: () => Promise.resolve({ error: null }) }; },
      }),
    },
  };
});

beforeEach(() => jest.clearAllMocks());

describe('useAppSettings.recordChildActivity', () => {
  it('calls the RPC instead of a direct app_settings update', async () => {
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.recordChildActivity(); });
    expect(mockRpc).toHaveBeenCalledWith('record_child_activity');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('keeps the same identity when settings change', async () => {
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current.recordChildActivity;
    act(() => { mockRealtime?.({ new: { family_id: 'fam-1', last_child_activity: new Date().toISOString() } }); });
    await waitFor(() => expect(result.current.lastChildActivity).not.toBeNull());
    expect(result.current.recordChildActivity).toBe(before);
  });

  it('swallows RPC failures (older backend without migration 061)', async () => {
    mockRpc.mockRejectedValueOnce(new Error('function not found'));
    const { result } = renderHook(() => useAppSettings());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.recordChildActivity()).resolves.toBeUndefined();
  });
});
