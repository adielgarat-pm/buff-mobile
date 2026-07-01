/**
 * Tests for UStep8_Complete — final onboarding screen that marks the parent
 * profile as onboarding_complete.
 *
 * Guards the data-loss regression (IN-2026-05-28-01): saveAll() used to write
 * a bare pro_settings object, clobbering any keys the parent already had. In
 * the Add-Child flow (ParentSettings → UStep1 → … → UStep8) the parent is
 * already onboarded, so the write must MERGE — read current pro_settings and
 * spread it alongside the 3 onboarding keys.
 *
 * The screen auto-saves on mount (useEffect → saveAll), so the tests render and
 * wait for refreshProfile to fire, then assert the UPDATE payload.
 */
import { render, waitFor } from '@testing-library/react-native';
import UStep8_Complete from '../UStep8_Complete';
import { supabase } from '../../../../integrations/supabase/client';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (!vars || Object.keys(vars).length === 0) return key;
      const parts = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',');
      return `${key}(${parts})`;
    },
    i18n: { language: 'en' },
  }),
}));

const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: mockReset }),
  useRoute:      () => ({
    params: { childName: 'Lia', childProfileId: 'child-1', hasPhone: false },
  }),
}));

// RTL hook — the screen only reads isRTL for styling; stub it so importing
// LanguageContext doesn't pull in the real i18n init (react-i18next is mocked
// without initReactI18next).
jest.mock('../../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false }),
}));

const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user:            { id: 'parent-1' },
    familyShortCode: 'ABCD',
    refreshProfile:  mockRefreshProfile,
  }),
}));

jest.mock('../../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

/**
 * Persistent mock of the profiles table. SELECT('pro_settings') resolves the
 * parent's current settings; UPDATE records its payload and resolves.
 * Returns the update-spy so tests can assert the merged payload.
 */
function installSupabaseMock(prevProSettings: Record<string, unknown> | null) {
  const updateSpy = jest.fn(() => ({
    eq: jest.fn().mockResolvedValue({ error: null }),
  }));

  mockedFrom.mockImplementation(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { pro_settings: prevProSettings },
          error: null,
        }),
      })),
    })),
    update: updateSpy,
  }) as never);

  return updateSpy;
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('UStep8_Complete', () => {
  beforeEach(() => {
    mockedFrom.mockReset();
    mockReset.mockReset();
    mockRefreshProfile.mockClear();
  });

  test('merges the 3 onboarding keys into the parent\'s existing pro_settings', async () => {
    // Parent already onboarded with another child — has keys we must not lose.
    const updateSpy = installSupabaseMock({
      onboarding_complete:   true,
      onboarding_child_name: 'Noa',
      onboarding_child_id:   'child-0',
      age_group:             '9-11',
      gender:                'girl',
    });

    render(<UStep8_Complete />);

    await waitFor(() => expect(mockRefreshProfile).toHaveBeenCalledWith('parent-1'));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const payload = updateSpy.mock.calls[0][0] as { pro_settings: Record<string, unknown> };
    expect(payload.pro_settings).toEqual({
      // pre-existing keys survive
      age_group:             '9-11',
      gender:                'girl',
      // onboarding keys updated to point at the newly-added child
      onboarding_complete:   true,
      onboarding_child_name: 'Lia',
      onboarding_child_id:   'child-1',
    });
  });

  test('falls back to the 3 keys when the parent has empty pro_settings (first onboarding)', async () => {
    const updateSpy = installSupabaseMock({});

    render(<UStep8_Complete />);

    await waitFor(() => expect(mockRefreshProfile).toHaveBeenCalledWith('parent-1'));

    const payload = updateSpy.mock.calls[0][0] as { pro_settings: Record<string, unknown> };
    expect(payload.pro_settings).toEqual({
      onboarding_complete:   true,
      onboarding_child_name: 'Lia',
      onboarding_child_id:   'child-1',
    });
  });
});
