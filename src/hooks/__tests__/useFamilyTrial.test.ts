/**
 * useFamilyTrial — reads the family trial clock, hides a phase once dismissed,
 * never shows anything to a child profile.
 */
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useFamilyTrial } from '../useFamilyTrial';

const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((k: string) => Promise.resolve(mockStore[k] ?? null)),
    setItem: jest.fn((k: string, v: string) => { mockStore[k] = v; return Promise.resolve(); }),
  },
}));

const mockAuth = { familyId: 'fam-1', profile: { role: 'parent' } as { role: string } };
jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => mockAuth }));

const mockSub = { isTrialActive: true, trialDaysLeft: 12, hasRealEntitlement: true };
jest.mock('../useSubscription', () => ({ useSubscription: () => mockSub }));

const mockClock = { trial_started_at: null as string | null };
jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { trial_started_at: mockClock.trial_started_at }, error: null }),
        }),
      }),
    }),
  },
}));

describe('useFamilyTrial', () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    mockAuth.profile = { role: 'parent' };
    mockClock.trial_started_at = new Date(Date.now() - 2 * 86_400_000).toISOString();
  });

  test('an active trial started 2 days ago shows the "started" note until dismissed', async () => {
    const { result } = renderHook(() => useFamilyTrial());
    await waitFor(() => expect(result.current.phase).toBe('started'));
    act(() => result.current.dismiss());
    expect(result.current.phase).toBe('none');
    expect(mockStore['coachTrialNote.started.seen.fam-1']).toBe('1');
  });

  test('a dismissed phase stays hidden on the next mount', async () => {
    mockStore['coachTrialNote.started.seen.fam-1'] = '1';
    const { result } = renderHook(() => useFamilyTrial());
    await new Promise(r => setTimeout(r, 0));
    expect(result.current.phase).toBe('none');
  });

  test('no trial clock yet → nothing', async () => {
    mockClock.trial_started_at = null;
    const { result } = renderHook(() => useFamilyTrial());
    await new Promise(r => setTimeout(r, 0));
    expect(result.current.phase).toBe('none');
  });

  test('a child profile never gets a trial note', async () => {
    mockAuth.profile = { role: 'child' };
    const { result } = renderHook(() => useFamilyTrial());
    await new Promise(r => setTimeout(r, 0));
    expect(result.current.phase).toBe('none');
  });
});
