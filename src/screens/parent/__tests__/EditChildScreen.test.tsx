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

// EditChildScreen now reads deleteAccount from AuthContext (for the last-child →
// delete-family flow). Mock it so the real context (and its i18n init) isn't pulled in.
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ deleteAccount: jest.fn() }),
}));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

// Stub the platform-split BirthdayField (pkg/ux-parent-web-pickers replaced the
// screen's inline DateTimePicker with it — same fix onboarding got in PR #287).
// The stub exposes a button that "picks" a fixed date so tests can verify the
// screen wires value/onChange through to the save payload.
jest.mock('../../../components/BirthdayField', () => {
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ value, onChange, placeholder }: any) => (
      <TouchableOpacity
        testID="edit-child-birthday-field"
        onPress={() => onChange(new Date('2015-06-01T00:00:00Z'))}
      >
        <Text>{value ? value.toISOString().split('T')[0] : placeholder}</Text>
      </TouchableOpacity>
    ),
  };
});

// Off-routine card is its own unit (its own auth/language/supabase deps) — stub
// it out of the EditChild test so it doesn't pull those into this suite.
jest.mock('../../../components/OffRoutineCard', () => () => null);

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
  updateResult?:     { data?: unknown; error: unknown };
}) {
  const {
    loadRow,
    loadError       = null,
    prevProSettings = null,
    // UPDATE…eq…select() resolves to the rows actually written. Default to a
    // single returned row so the screen's 0-row guard treats the save as ok.
    updateResult    = { data: [{ id: 'child-1' }], error: null },
  } = opts;

  const updateSpy = jest.fn(() => ({
    eq: jest.fn(() => ({
      select: jest.fn().mockResolvedValue(updateResult),
    })),
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
      // Seeded from the Latin name "Lia" (no stored language) → 'en'.
      language:        'en',
      // Every EditChild save marks the language as an explicit parent choice.
      language_source: 'parent',
    });
  });

  test('birthday field renders the stored date and a picked date reaches the save payload', async () => {
    const updateSpy = installSupabaseMock({
      loadRow:         baseChild,
      prevProSettings: { age_group: '9-11', gender: 'girl' },
    });

    const { getByTestId, getByText } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-birthday-field')).toBeTruthy());

    // Hydrated from profiles.birth_date.
    expect(getByText('2014-03-10')).toBeTruthy();

    // "Pick" a new date via the platform-split field, then save.
    fireEvent.press(getByTestId('edit-child-birthday-field'));
    fireEvent.press(getByTestId('edit-child-save'));

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    const payload = updateSpy.mock.calls[0][0] as { birth_date: string };
    expect(payload.birth_date).toBe('2015-06-01'); // same "YYYY-MM-DD" contract as before
  });

  test('language toggle writes the chosen pro_settings.language', async () => {
    const updateSpy = installSupabaseMock({
      loadRow:         baseChild,
      prevProSettings: { age_group: '9-11', gender: 'girl' },
    });

    const { getByTestId } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-language-he')).toBeTruthy());

    // Latin name "Lia" seeds the toggle to English; parent overrides to Hebrew.
    fireEvent.press(getByTestId('edit-child-language-he'));
    fireEvent.press(getByTestId('edit-child-save'));

    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());

    const payload = updateSpy.mock.calls[0][0] as { pro_settings: Record<string, unknown> };
    expect(payload.pro_settings.language).toBe('he');
  });

  test('seeds the toggle from a stored pro_settings.language (overrides name script)', async () => {
    const updateSpy = installSupabaseMock({
      // Latin name but parent previously stored Hebrew → toggle must reflect 'he'.
      loadRow:         { ...baseChild, pro_settings: { age_group: '9-11', language: 'he' } },
      prevProSettings: { age_group: '9-11', language: 'he' },
    });

    const { getByTestId } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-language-he')).toBeTruthy());

    expect(getByTestId('edit-child-language-he').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('edit-child-language-en').props.accessibilityState).toEqual({ selected: false });

    // Saving without touching the toggle preserves the stored language.
    fireEvent.press(getByTestId('edit-child-save'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    const payload = updateSpy.mock.calls[0][0] as { pro_settings: Record<string, unknown> };
    expect(payload.pro_settings.language).toBe('he');
  });

  test('surfaces an error and stays put when the update affects 0 rows (RLS blocked)', async () => {
    // An RLS-blocked UPDATE returns no error but an empty row set. The screen
    // must NOT navigate back as if the save succeeded (own-device child bug).
    const updateSpy = installSupabaseMock({
      loadRow:         baseChild,
      prevProSettings: { age_group: '9-11', gender: 'girl' },
      updateResult:    { data: [], error: null },
    });

    const { getByTestId, getByText } = render(<EditChildScreen />);
    await waitFor(() => expect(getByTestId('edit-child-save')).toBeTruthy());

    fireEvent.press(getByTestId('edit-child-save'));

    await waitFor(() => expect(getByText('editChild.saveError')).toBeTruthy());
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
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
