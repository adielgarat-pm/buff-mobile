/**
 * Tests for ManageChildrenScreen — parent-side family management list.
 *
 * Covers the regression that motivated the screen: Settings → Manage Children
 * was inert. These tests guard:
 *   - Empty state when family has no children
 *   - List rendering with avatar + computed age
 *   - Row tap navigates to EditChild with the right childId
 *   - "+ Add another child" routes into the existing UStep1 onboarding flow
 *   - Back button calls navigation.goBack
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ManageChildrenScreen from '../ManageChildrenScreen';
import { supabase } from '../../../integrations/supabase/client';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-i18next', () => ({
  // Echo the key plus any interpolation vars as `key(var=val)`. The actual
  // "Age {{age}}" placeholder lives in en.json, not in the key itself, so
  // a key-only mock would lose the interpolated value. This shape lets
  // assertions check both the key chosen and the value passed.
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (!vars || Object.keys(vars).length === 0) return key;
      const parts = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',');
      return `${key}(${parts})`;
    },
    i18n: { language: 'en' },
  }),
}));

const mockNavigate = jest.fn();
const mockGoBack   = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  // useFocusEffect intentionally no-op'd here. The screen's plain useEffect
  // already exercises the same fetch path on mount; firing the focus
  // callback synchronously during render triggers setState→re-render→cb
  // again → "Too many re-renders" infinite loop. The focus-driven refetch
  // is wired by navigation in production and not the SUT here.
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ familyId: 'fam-1' }),
}));

jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({
    isRTL:         false,
    rowDirection:  'row',
    textAlign:     'left',
  }),
}));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

/**
 * Persistent mock of the children-list SELECT chain. Both useEffect and the
 * mocked useFocusEffect call fetchChildren on mount, and React dev-mode may
 * double-invoke effects — so we install a persistent implementation rather
 * than queueing a finite number of `mockReturnValueOnce` responses.
 */
function mockChildrenSelect(rows: unknown[] | null, error: { message: string } | null = null) {
  // Chain mirrors the screen query: select → eq(family_id) → eq(role)
  // → eq(is_deleted) → order. The is_deleted=false filter hides soft-deleted
  // children (e.g. a duplicate twin removed via soft-delete) from the list.
  mockedFrom.mockImplementation(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: rows, error }),
          })),
        })),
      })),
    })),
  }) as never);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('ManageChildrenScreen', () => {
  beforeEach(() => {
    mockedFrom.mockReset();
    mockNavigate.mockReset();
    mockGoBack.mockReset();
  });

  test('renders the empty state when the family has no children', async () => {
    mockChildrenSelect([]);

    const { getByText, queryByTestId } = render(<ManageChildrenScreen />);

    await waitFor(() => {
      expect(getByText('manageChildren.empty')).toBeTruthy();
    });
    expect(queryByTestId(/^child-row-/)).toBeNull();
  });

  test('renders one row per child, with avatar, name and computed age', async () => {
    // Born 12 years ago this week → "Age 12" (or 11 depending on month — both
    // are acceptable since the screen does the same arithmetic the test does).
    const birthYear = new Date().getFullYear() - 12;
    const childWithBirth = {
      id:           'child-1',
      display_name: 'Lia',
      avatar:       '🦄',
      birth_date:   `${birthYear}-01-15`,
      pro_settings: { age_group: '9-11' },
      created_at:   '2026-05-01T00:00:00Z',
    };
    const childWithoutBirth = {
      id:           'child-2',
      display_name: 'Etay',
      avatar:       '🦊',
      birth_date:   null,
      pro_settings: { age_group: '15-18' },
      created_at:   '2026-05-02T00:00:00Z',
    };

    mockChildrenSelect([childWithBirth, childWithoutBirth]);

    const { getByText, getByTestId } = render(<ManageChildrenScreen />);

    await waitFor(() => {
      expect(getByTestId('child-row-child-1')).toBeTruthy();
    });
    expect(getByText('Lia')).toBeTruthy();
    expect(getByText('Etay')).toBeTruthy();
    expect(getByText('🦄')).toBeTruthy();
    expect(getByText('🦊')).toBeTruthy();

    // Lia → numeric age via ageLabel (11 or 12 depending on today vs. birthday).
    expect(getByText(/^manageChildren\.ageLabel\(age=1[12]\)$/)).toBeTruthy();

    // Etay → falls back to age-group when no birth_date.
    expect(getByText('manageChildren.ageGroupLabel(group=15-18)')).toBeTruthy();
  });

  test('tapping a child row navigates to EditChild with the right id', async () => {
    mockChildrenSelect([
      { id: 'child-1', display_name: 'Lia', avatar: '🦄', birth_date: null,
        pro_settings: null, created_at: '2026-05-01' },
    ]);

    const { getByTestId } = render(<ManageChildrenScreen />);
    await waitFor(() => expect(getByTestId('child-row-child-1')).toBeTruthy());

    fireEvent.press(getByTestId('child-row-child-1'));

    expect(mockNavigate).toHaveBeenCalledWith('EditChild', { childId: 'child-1' });
  });

  test('"+ Add another child" navigates to the existing UStep1 onboarding flow', async () => {
    mockChildrenSelect([]);

    const { getByTestId } = render(<ManageChildrenScreen />);
    await waitFor(() =>
      expect(getByTestId('manage-children-add-another')).toBeTruthy(),
    );

    fireEvent.press(getByTestId('manage-children-add-another'));

    expect(mockNavigate).toHaveBeenCalledWith('UStep1');
  });

  test('back button calls navigation.goBack', async () => {
    mockChildrenSelect([]);

    const { getByTestId } = render(<ManageChildrenScreen />);
    await waitFor(() => expect(getByTestId('manage-children-back')).toBeTruthy());

    fireEvent.press(getByTestId('manage-children-back'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  test('renders the empty state on supabase error (no crash)', async () => {
    mockChildrenSelect(null, { message: 'boom' });

    const { getByText, queryByTestId } = render(<ManageChildrenScreen />);

    await waitFor(() => expect(getByText('manageChildren.empty')).toBeTruthy());
    expect(queryByTestId(/^child-row-/)).toBeNull();
  });
});
