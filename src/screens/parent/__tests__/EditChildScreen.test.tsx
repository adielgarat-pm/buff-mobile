/**
 * Tests for EditChildScreen — parent edits an existing child's profile.
 *
 * Covers:
 *   - Loading state then hydrated form fields
 *   - Load error fallback
 *   - Empty-name guard (Alert fires, no UPDATE issued)
 *   - Avatar swap reaches the UPDATE payload
 *   - Save preserves existing pro_settings (gender etc.) and goes back
 *   - Cancel navigates back without writing
 *
 * The supabase mock is keyed by `select()` argument so the two distinct
 * SELECTs in the screen (initial 4-column load vs. pre-save pro_settings
 * read) are routed independently — and tolerate effects firing more than
 * once under React's dev-mode double-invoke without exhausting the queue.
 */
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditChildScreen from '../EditChildScreen';
import { supabase } from '../../../integrations/supabase/client';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute:      () => ({ params: { childId: 'child-1' } }),
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({
    isRTL:        false,
    rowDirection: 'row',
    textAlign:    'left',
  }),
}));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

// Stub the native date picker — it's not the system under test and depends
// on platform-specific native modules that aren't loaded in jsdom.
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a persistent supabase mock with:
 *   - SELECT('display_name, ...') → returns `loadRow`   (or load-time error)
 *   - SELECT('pro_settings')      → returns `{ pro_settings: prevProSettings }`
 *   - UPDATE                      → returns `updateResult` and records payload
 *
 * Returns the update-spy so tests can assert the payload that was sent.
 */
function installSupabaseMock(opts: {
  loadRow:           Record<string, unknown> | null;
  loadError?:        { message: string } | null;
  prevProSettings?:  Record<string, unknown> | null;
  updateResult?:     { error: unknown };
}) {
  const {
    loadRow,
    loadError       = null,
    prevProSettings = null,
    updateResult    = { error: null },
  } = opts;

  const updateSpy = jest.fn(() => ({
    eq: jest.fn().mockResolvedValue(updateResult),
  }));

  // Single shared mock used for any number of from('profiles') calls. The
  // returned `select` dispatches on its argument so the two SELECTs in the
  // component (4-column hydrate vs. 1-column pre-save read) stay distinct.
  mockedFrom.mockImplementation(() => ({
    select: jest.fn((columns: string) => {
      const single = jest.fn().mockResolvedValue(
        columns === 'pro_settings'
          ? { data: { pro_settings: prevProSettings }, error: null }
          : { data: loadRow, error: loadError },
      );
      return { eq: jest.fn(() => ({ single })) };
    }),
    update: updateSpy,
  }) as never);

  return updateSpy;
}

const baseChild = {
  display_name: 'Lia',
  avatar:       '🦄',
  birth_date:   '2014-03-10',
  pro_settings: { age_group: '9-11', gender: 'girl' },
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe('EditChildScreen', () => {
  beforeEach(() => {
    mockedFrom.mockReset();
    mockGoBack.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => { (Alert.alert as jest.Mock).mockRestore(); });

  test('renders form fields hydrated from the loaded profile', async () => {
    installSupabaseMock({ loadRow: baseChild });

    const { getByTestId, getByDisplayValue } = render(<EditChildScreen />);

    await waitFor(() => expect(getByDisplayValue('Lia')).toBeTruthy());
    const unicornBtn = getByTestId('edit-child-avatar-🦄');
    expect(unicornBtn.props.accessibilityState).toEqual({ selected: true });
  });

  test('shows error fallback when the load query fails', async () => {
    installSupabaseMock({ loadRow: null, loadError: { message: 'rls' } });

    const { getByText } = render(<EditChildScreen />);

    await waitFor(() => expect(getByText('editChild.loadError')).toBeTruthy());
  });

  test('blocks save when the name field is empty (Alert fires, no UPDATE)', async () => {
    const updateSpy = installSupabaseMock({
      loadRow: { ...baseChild, display_name: '' },
    });

    const { getByTestId } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-save')).toBeTruthy());

    fireEvent.press(getByTestId('edit-child-save'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('editChild.nameRequired'),
    );
    expect(updateSpy).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('save merges new fields into existing pro_settings and goes back', async () => {
    const updateSpy = installSupabaseMock({
      loadRow:         baseChild,
      // The server returns the full pro_settings — we must not clobber
      // `gender` or `onboarding_data`.
      prevProSettings: { age_group: '9-11', gender: 'girl', onboarding_data: { foo: 'bar' } },
    });

    const { getByTestId } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-name-input')).toBeTruthy());

    fireEvent.changeText(getByTestId('edit-child-name-input'), 'Lia Updated');
    fireEvent.press(getByTestId('edit-child-avatar-🐶'));
    fireEvent.press(getByTestId('edit-child-save'));

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const payload = updateSpy.mock.calls[0][0] as {
      display_name: string;
      avatar:       string;
      birth_date:   string;
      pro_settings: Record<string, unknown>;
    };
    expect(payload.display_name).toBe('Lia Updated');
    expect(payload.avatar).toBe('🐶');
    expect(payload.birth_date).toBe('2014-03-10');
    expect(payload.pro_settings).toEqual({
      age_group:       '9-11',
      gender:          'girl',
      onboarding_data: { foo: 'bar' },
    });
  });

  test('cancel navigates back without writing', async () => {
    const updateSpy = installSupabaseMock({ loadRow: baseChild });

    const { getByTestId } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-cancel')).toBeTruthy());

    fireEvent.press(getByTestId('edit-child-cancel'));

    expect(mockGoBack).toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
