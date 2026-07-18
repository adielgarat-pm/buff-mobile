/**
 * Tests for ChildSettingsScreen — focused on the chunk 2d Buddy section.
 *
 * Smoke-tests that the new "Buddy on dashboard" + "Rename Buddy" entries
 * render with the correct labels + current status, and that tapping
 * them invokes the corresponding modal (verified indirectly by checking
 * the rendered DOM updates from the BuddyToggleModal / BuddyNameModal).
 */
import { render, fireEvent, within, waitFor } from '@testing-library/react-native';
import ChildSettingsScreen from '../ChildSettingsScreen';
import type { BuddyRelationship } from '../../../types/buddy';

// ── Mock dependencies ──────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  // LanguagePickerModal pulls in src/i18n, which calls i18n.use(initReactI18next).
  // Keep a stub plugin so that init doesn't throw under this mock.
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  // Invoke the callback synchronously so the focus-refetch wiring is
  // actually exercised in tests (otherwise the new behavior is dead code
  // to the test suite). See test below: "refetches buddy on mount/focus".
  useFocusEffect: (cb: () => void | (() => void)) => { cb(); },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'child-1', display_name: 'TestKid' } }),
}));

// Mutable so a test can flip viewMode without re-mocking the module.
const mockMode = {
  isChildPreview: false,
  exitChildPreview: jest.fn(),
  viewMode: 'child' as 'child' | 'parent',
  previewChildId: null as string | null,
  previewChildName: null as string | null,
};
jest.mock('../../../contexts/ModeContext', () => ({
  useMode: () => mockMode,
}));

jest.mock('../../../platform/crossAlert', () => ({
  crossAlert: jest.fn(),
}));
import { crossAlert } from '../../../platform/crossAlert';
const mockedCrossAlert = crossAlert as jest.MockedFunction<typeof crossAlert>;

jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ themeName: 'gamer', setTheme: jest.fn() }),
  useChildTheme: () => ({
    background: '#1a1636', card: '#2D2546', border: '#333',
    primary: '#A8E63E', primaryForeground: '#000',
    foreground: '#fff', mutedForeground: '#A78BFA',
    accent: '#A8E63E', muted: '#444', buff: '#A8E63E',
  }),
  CHILD_THEMES: {
    mint:  { card: '#fff', primary: '#0a0', accent: '#0a0', success: '#0a0', foreground: '#000', mutedForeground: '#666', border: '#ccc', primaryForeground: '#fff' },
    gamer: { card: '#222', primary: '#A8E63E', accent: '#A8E63E', success: '#A8E63E', foreground: '#fff', mutedForeground: '#A78BFA', border: '#444', primaryForeground: '#000' },
  },
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ rowDirection: 'row' }),
  useLanguage: () => ({
    language: 'en',
    setLanguage: jest.fn(),
    isRTL: false,
    direction: 'ltr',
    isHydrating: false,
  }),
}));

jest.mock('../../../hooks/useSubscription', () => ({
  useSubscription: () => ({ isSubscribed: true }),
}));

jest.mock('../../../hooks/useBuddyRelationship', () => ({
  useBuddyRelationship: jest.fn(),
}));

jest.mock('../../../hooks/useChildProgress', () => ({
  useChildData: () => ({ totalBalance: 4242 }),
}));

import { useBuddyRelationship } from '../../../hooks/useBuddyRelationship';
const mockedUseBuddy = useBuddyRelationship as jest.MockedFunction<typeof useBuddyRelationship>;

const baseRelationship: BuddyRelationship = {
  id: 'rel-1',
  child_profile_id: 'child-1',
  friendship_level: 2,
  successful_days_count: 5,
  current_skin_id: 'wolf',
  current_theme_color: null,
  buddy_name: null,
  buddy_visible: true,
  has_pending_gift: false,
  relationship_started_at: '2026-05-01T00:00:00Z',
  last_level_up_at: null,
  last_successful_day_date: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
};

function mockBuddyHook(overrides: Partial<BuddyRelationship> | null = {}) {
  const setBuddyVisible = jest.fn().mockResolvedValue({ error: null });
  const setBuddyName    = jest.fn().mockResolvedValue({ error: null });
  const refetch         = jest.fn();
  const relationship: BuddyRelationship | null =
    overrides === null ? null : { ...baseRelationship, ...overrides };
  mockedUseBuddy.mockReturnValue({
    relationship,
    loading: false,
    error: null,
    refetch,
    setBuddyVisible,
    setBuddyName,
  } as any);
  return { setBuddyVisible, setBuddyName, refetch };
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('ChildSettingsScreen — Buddy section', () => {
  beforeEach(() => {
    mockedUseBuddy.mockReset();
    mockedCrossAlert.mockReset();
    mockMode.viewMode = 'child';
    mockMode.isChildPreview = false;
    mockMode.previewChildId = null;
    mockMode.previewChildName = null;
  });

  // Guards against regression: if someone removes useFocusEffect from the
  // screen, this test fails. The screen is one of 4 instances of
  // useBuddyRelationship that must refetch on focus to stay in sync with
  // mutations from sister screens. See pkg/buddy-relationship-cross-screen-sync.
  test('refetches buddy relationship on focus', () => {
    const { refetch } = mockBuddyHook();
    render(<ChildSettingsScreen />);
    expect(refetch).toHaveBeenCalled();
  });

  test('renders both Buddy entries with "Showing" status + default name when buddy_visible=true and buddy_name=null', () => {
    mockBuddyHook({ buddy_visible: true, buddy_name: null, current_skin_id: 'wolf' });

    const { getByText, getByTestId } = render(<ChildSettingsScreen />);

    expect(getByTestId('buddy-view-entry')).toBeTruthy();
    expect(getByTestId('rename-buddy-entry')).toBeTruthy();
    expect(getByText('childSettings.buddyView.entry')).toBeTruthy();
    expect(getByText('childSettings.buddyView.statusShown')).toBeTruthy();
    expect(getByText('childSettings.renameBuddy.entry')).toBeTruthy();
    expect(getByText('STORMY')).toBeTruthy(); // default name for wolf skin
  });

  test('shows "Hidden" status when buddy_visible=false', () => {
    mockBuddyHook({ buddy_visible: false });

    const { getByText, queryByText } = render(<ChildSettingsScreen />);

    expect(getByText('childSettings.buddyView.statusHidden')).toBeTruthy();
    expect(queryByText('childSettings.buddyView.statusShown')).toBeNull();
  });

  test('shows custom buddy_name when set', () => {
    mockBuddyHook({ buddy_name: 'Sparky' });

    const { getByText } = render(<ChildSettingsScreen />);
    expect(getByText('Sparky')).toBeTruthy();
  });

  test('falls back to the TRANSLATED default (pet.defaultName) when current_skin_id is unknown', () => {
    mockBuddyHook({ current_skin_id: 'panda', buddy_name: null });

    const { getByTestId, queryByText } = render(<ChildSettingsScreen />);
    // Scope to the rename-buddy row; must be the i18n key, not the old
    // hard-coded English literal 'Buddy' (Hebrew UI showed English).
    expect(within(getByTestId('rename-buddy-entry')).getByText('pet.defaultName')).toBeTruthy();
    expect(queryByText('Buddy')).toBeNull();
  });

  test('null relationship (fresh child) renders with default-visible + translated default name', () => {
    mockBuddyHook(null);

    const { getByText, getByTestId } = render(<ChildSettingsScreen />);
    expect(getByText('childSettings.buddyView.statusShown')).toBeTruthy();
    expect(within(getByTestId('rename-buddy-entry')).getByText('pet.defaultName')).toBeTruthy();
  });

  test('tapping "Buddy view" opens the toggle modal (modal title becomes visible)', () => {
    mockBuddyHook({ buddy_visible: true });

    const { getByTestId, queryByText, getByText } = render(<ChildSettingsScreen />);

    // Modal closed initially — toggle title not in tree (visible=false)
    expect(queryByText('buddy.toggleModal.hide.title')).toBeNull();

    fireEvent.press(getByTestId('buddy-view-entry'));

    // Now the hide-mode title should be findable
    expect(getByText('buddy.toggleModal.hide.title')).toBeTruthy();
  });

  test('tapping "Rename Buddy" opens the name modal', () => {
    mockBuddyHook({});

    const { getByTestId, queryByText, getByText } = render(<ChildSettingsScreen />);

    expect(queryByText('buddy.nameModal.title')).toBeNull();

    fireEvent.press(getByTestId('rename-buddy-entry'));

    expect(getByText('buddy.nameModal.title')).toBeTruthy();
  });

  // Regression guard for BUG-2026-05-20-02: the profile card must show the
  // child's real balance (useChildData.totalBalance), not the old MOCK_MY_CHILD
  // hardcoded 1,240 Buffs.
  test('profile card shows real balance from useChildData, not mock 1,240', () => {
    mockBuddyHook({});

    const { getByText, queryByText } = render(<ChildSettingsScreen />);

    expect(getByText(/4,242/)).toBeTruthy();
    expect(queryByText(/1,240/)).toBeNull();
  });

  // ── vc68 bug regressions (pkg/fix-buddy-name-sources) ────────────────────

  // Symptom 1: in View-as-Child the Menu's profile card rendered the PARENT's
  // display_name ("ADI") next to the pet emoji — read as the buddy's name.
  // The card must show the ACTIVE child's name, never the parent's.
  test('View-as-Child: profile card shows the previewed child name, never the parent name', () => {
    mockBuddyHook({});
    mockMode.isChildPreview = true;
    mockMode.previewChildId = 'child-2';
    mockMode.previewChildName = 'Emi';

    const { getByText, queryByText } = render(<ChildSettingsScreen />);

    expect(getByText('Emi')).toBeTruthy();
    expect(queryByText('TestKid')).toBeNull(); // parent profile name must not leak
    // Buddy data must be loaded for the previewed child, not the parent.
    expect(mockedUseBuddy).toHaveBeenCalledWith('child-2');
  });

  test('real child (no preview): profile card shows own profile name', () => {
    mockBuddyHook({});

    const { getByText } = render(<ChildSettingsScreen />);
    expect(getByText('TestKid')).toBeTruthy();
  });

  // Symptom 2: a rename whose write is silently dropped (0 rows updated —
  // RLS in View-as-Child) must surface an alert instead of pretending it
  // saved and reverting to the default name on the next screen.
  test('rename failure surfaces the save-error alert', async () => {
    const { setBuddyName } = mockBuddyHook({});
    setBuddyName.mockResolvedValue({ error: new Error('no rows updated') });

    const { getByTestId, getByText } = render(<ChildSettingsScreen />);

    fireEvent.press(getByTestId('rename-buddy-entry'));
    fireEvent.press(getByText('buddy.nameModal.save'));

    await waitFor(() => {
      expect(mockedCrossAlert).toHaveBeenCalledWith(
        'childSettings.buddySaveError.title',
        'childSettings.buddySaveError.body',
      );
    });
  });

  test('successful rename shows no error alert', async () => {
    const { setBuddyName } = mockBuddyHook({});

    const { getByTestId, getByText } = render(<ChildSettingsScreen />);

    fireEvent.press(getByTestId('rename-buddy-entry'));
    fireEvent.press(getByText('buddy.nameModal.save'));

    await waitFor(() => expect(setBuddyName).toHaveBeenCalled());
    expect(mockedCrossAlert).not.toHaveBeenCalled();
  });

  // OQ-2(a): language is parent-owned. The picker must not appear to a child
  // viewer (real child or a parent in View-as-Child), so the parent stays in
  // control and a preview can't flip the device language.
  test('hides the language row for a child viewer (viewMode=child)', () => {
    mockBuddyHook({});
    mockMode.viewMode = 'child';

    const { queryByTestId } = render(<ChildSettingsScreen />);
    expect(queryByTestId('language-entry')).toBeNull();
  });
});
