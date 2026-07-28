/**
 * useMarketingConsentAsk — the one-time email opt-in ask.
 *
 * The rules worth guarding are the ones with legal and trust weight:
 *   - a parent is asked ONCE, ever (either answer closes the question);
 *   - nobody is ever silently defaulted to consenting;
 *   - a child profile never sees it.
 *
 * Getting any of these wrong sends mail to someone who never agreed, or nags
 * a parent who already said no — both are worse than never shipping this.
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMarketingConsentAsk } from '../useMarketingConsentAsk';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';

jest.mock('../../contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockedAuth = useAuth as unknown as jest.Mock;
const mockedFrom = supabase.from as unknown as jest.Mock;

const refreshProfile = jest.fn().mockResolvedValue(null);

/** Captures the payload handed to .update() so assertions can inspect it. */
let lastUpdate: Record<string, unknown> | null = null;

function mockProfileTable(existingProSettings: Record<string, unknown> = {}) {
  lastUpdate = null;
  mockedFrom.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: { pro_settings: existingProSettings }, error: null }),
      }),
    }),
    update: (payload: Record<string, unknown>) => {
      lastUpdate = payload;
      return { eq: async () => ({ error: null }) };
    },
  }));
}

function auth(profile: Record<string, unknown> | null, userId: string | null = 'u1') {
  mockedAuth.mockReturnValue({
    user: userId ? { id: userId } : null,
    profile,
    refreshProfile,
  });
}

const PARENT_NEVER_ASKED = { role: 'parent', marketing_consent: false, pro_settings: {} };

beforeEach(() => {
  jest.clearAllMocks();
  mockProfileTable();
});

describe('who gets asked', () => {
  it('asks a parent who was never asked and has not consented', () => {
    auth(PARENT_NEVER_ASKED);
    const { result } = renderHook(() => useMarketingConsentAsk());
    expect(result.current.shouldAsk).toBe(true);
  });

  it('never asks a child profile', () => {
    auth({ role: 'child', marketing_consent: false, pro_settings: {} });
    const { result } = renderHook(() => useMarketingConsentAsk());
    expect(result.current.shouldAsk).toBe(false);
  });

  it('never asks someone who already consented', () => {
    auth({ role: 'parent', marketing_consent: true, pro_settings: {} });
    const { result } = renderHook(() => useMarketingConsentAsk());
    expect(result.current.shouldAsk).toBe(false);
  });

  it('never re-asks someone who already answered — including a NO', () => {
    // marketing_consent false + the asked stamp present = they declined.
    auth({
      role: 'parent',
      marketing_consent: false,
      pro_settings: { marketing_consent_asked_at: '2026-07-27T10:00:00.000Z' },
    });
    const { result } = renderHook(() => useMarketingConsentAsk());
    expect(result.current.shouldAsk).toBe(false);
  });

  it('does not ask when there is no signed-in user', () => {
    auth(PARENT_NEVER_ASKED, null);
    const { result } = renderHook(() => useMarketingConsentAsk());
    expect(result.current.shouldAsk).toBe(false);
  });
});

describe('recording the answer', () => {
  it('a YES stores consent AND the asked stamp', async () => {
    auth(PARENT_NEVER_ASKED);
    const { result } = renderHook(() => useMarketingConsentAsk());

    await act(async () => { await result.current.answer(true); });

    expect(lastUpdate?.marketing_consent).toBe(true);
    expect((lastUpdate?.pro_settings as Record<string, unknown>).marketing_consent_asked_at)
      .toEqual(expect.any(String));
    await waitFor(() => expect(refreshProfile).toHaveBeenCalledWith('u1'));
  });

  it('a NO stores false AND the stamp, so it is never asked again', async () => {
    auth(PARENT_NEVER_ASKED);
    const { result } = renderHook(() => useMarketingConsentAsk());

    await act(async () => { await result.current.answer(false); });

    expect(lastUpdate?.marketing_consent).toBe(false);
    expect((lastUpdate?.pro_settings as Record<string, unknown>).marketing_consent_asked_at)
      .toEqual(expect.any(String));
  });

  it('preserves existing pro_settings keys instead of clobbering them', async () => {
    mockProfileTable({ onboarding_complete: true, child_theme: 'gamer' });
    auth(PARENT_NEVER_ASKED);
    const { result } = renderHook(() => useMarketingConsentAsk());

    await act(async () => { await result.current.answer(true); });

    expect(lastUpdate?.pro_settings).toMatchObject({
      onboarding_complete: true,
      child_theme: 'gamer',
    });
  });

  it('stops asking immediately after an answer, without waiting for a profile refetch', async () => {
    auth(PARENT_NEVER_ASKED);
    const { result } = renderHook(() => useMarketingConsentAsk());
    expect(result.current.shouldAsk).toBe(true);

    await act(async () => { await result.current.answer(false); });

    // The mocked auth context still reports the stale profile — the hook must
    // not re-show the sheet in that window.
    expect(result.current.shouldAsk).toBe(false);
  });

  it('a write failure still closes the sheet rather than trapping the parent', async () => {
    mockedFrom.mockImplementation(() => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: async () => ({ error: { message: 'rls denied' } }) }),
    }));
    auth(PARENT_NEVER_ASKED);
    const { result } = renderHook(() => useMarketingConsentAsk());

    await act(async () => { await result.current.answer(true); });

    expect(result.current.shouldAsk).toBe(false);
  });
});
