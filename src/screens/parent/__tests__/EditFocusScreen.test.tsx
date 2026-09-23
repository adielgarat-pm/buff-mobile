/**
 * EditFocusScreen — Freemium v2 edit-focus (D: Adi 2026-09-23).
 *
 * Locks the promises made to the parent:
 *   - the stored focus is pre-filled and can be changed;
 *   - saving merges into pro_settings without clobbering other fields;
 *   - suggestions exclude what the child already has and start UNCHECKED;
 *   - Skip writes nothing; Add inserts ONLY the picked items;
 *   - existing tasks / rewards are never updated or deleted.
 */
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditFocusScreen from '../EditFocusScreen';
import { supabase } from '../../../integrations/supabase/client';
import { generateStarterTasks } from '../../onboarding/unified/starterTasks';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, v?: Record<string, unknown>) => (v && 'count' in v ? `${key}:${v.count}` : key), i18n: { language: 'en' } }),
}));

const mockGoBack = jest.fn();
const mockRoute = { params: { childId: 'child-1' } as { childId: string; ageGroup?: string | null } };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => mockRoute,
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../../../contexts/LanguageContext', () => ({
  useRTLStyles: () => ({ isRTL: false, rowDirection: 'row', textAlign: 'left' }),
}));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ familyId: 'fam-1' }) }));
jest.mock('../../../integrations/supabase/client', () => ({ supabase: { from: jest.fn() } }));

const mockedFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;

const PRO_SETTINGS = {
  age_group: '9-11', gender: 'girl', language: 'en', language_source: 'parent', child_theme: 'mint',
  onboarding_data: { mainChallenge: 'screen_balance', additionalChallenges: ['morning_routine'], motivators: ['gaming'] },
};

function install(opts: { proSettings?: Record<string, unknown>; existingTasks?: string[]; existingRewards?: { title: string; title_he: string }[] } = {}) {
  const proSettings = opts.proSettings ?? PRO_SETTINGS;
  const spies = {
    profileUpdate: jest.fn(),
    taskInsert:    jest.fn().mockResolvedValue({ error: null }),
    rewardInsert:  jest.fn().mockResolvedValue({ error: null }),
    taskUpdate:    jest.fn(), taskDelete: jest.fn(), rewardUpdate: jest.fn(), rewardDelete: jest.fn(),
  };
  mockedFrom.mockImplementation(((table: string) => {
    if (table === 'profiles') {
      return {
        select: jest.fn(() => ({ eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { display_name: 'Lia', pro_settings: proSettings }, error: null }),
        })) })),
        update: jest.fn((payload: unknown) => {
          spies.profileUpdate(payload);
          return { eq: jest.fn(() => ({ select: jest.fn().mockResolvedValue({ data: [{ id: 'child-1' }], error: null }) })) };
        }),
      };
    }
    if (table === 'tasks') {
      return {
        select: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: (opts.existingTasks ?? []).map(title => ({ title })), error: null }) })),
        insert: spies.taskInsert, update: spies.taskUpdate, delete: spies.taskDelete,
      };
    }
    return {
      select: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: opts.existingRewards ?? [], error: null }) })),
      insert: spies.rewardInsert, update: spies.rewardUpdate, delete: spies.rewardDelete,
    };
  }) as never);
  return spies;
}

const expectedTasks = () => generateStarterTasks({
  ageGroup: '9-11', gender: 'girl', mainChallenge: 'homework_focus', additionalChallenges: ['morning_routine'],
});

async function saveNewFocus(utils: ReturnType<typeof render>) {
  await waitFor(() => expect(utils.getByTestId('edit-focus-main-homework_focus')).toBeTruthy());
  fireEvent.press(utils.getByTestId('edit-focus-main-homework_focus'));
  fireEvent.press(utils.getByTestId('edit-focus-save'));
  await waitFor(() => expect(utils.getByTestId('edit-focus-skip')).toBeTruthy());
}

describe('EditFocusScreen', () => {
  beforeEach(() => {
    mockedFrom.mockReset();
    mockGoBack.mockReset();
    mockRoute.params = { childId: 'child-1' };
  });

  test('pre-fills the stored focus and motivators', async () => {
    install();
    const { getByTestId } = render(<EditFocusScreen />);
    await waitFor(() => expect(getByTestId('edit-focus-main-screen_balance')).toBeTruthy());
    expect(getByTestId('edit-focus-main-screen_balance').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('edit-focus-other-morning_routine').props.accessibilityState).toEqual({ checked: true });
    expect(getByTestId('edit-focus-motivator-gaming').props.accessibilityState).toEqual({ checked: true });
  });

  test('save merges the new focus and keeps every other pro_settings field', async () => {
    const spies = install();
    const utils = render(<EditFocusScreen />);
    await saveNewFocus(utils);
    const payload = spies.profileUpdate.mock.calls[0][0] as { pro_settings: Record<string, any> };
    expect(Object.keys(payload)).toEqual(['pro_settings']);
    expect(payload.pro_settings).toMatchObject({ age_group: '9-11', gender: 'girl', language: 'en', language_source: 'parent', child_theme: 'mint' });
    expect(payload.pro_settings.onboarding_data).toMatchObject({
      mainChallenge: 'homework_focus', additionalChallenges: ['morning_routine'], motivators: ['gaming'],
    });
    expect(payload.pro_settings.onboarding_data_initial).toEqual(PRO_SETTINGS.onboarding_data);
  });

  test('suggestions start UNCHECKED; Skip writes nothing', async () => {
    const spies = install();
    const utils = render(<EditFocusScreen />);
    await saveNewFocus(utils);
    const rows = [...utils.queryAllByTestId(/^edit-focus-task-/), ...utils.queryAllByTestId(/^edit-focus-reward-/)];
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.props.accessibilityState).toEqual({ checked: false });
    expect(utils.getByTestId('edit-focus-add').props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(utils.getByTestId('edit-focus-skip'));
    expect(mockGoBack).toHaveBeenCalled();
    expect(spies.taskInsert).not.toHaveBeenCalled();
    expect(spies.rewardInsert).not.toHaveBeenCalled();
  });

  test('Add inserts ONLY the picked task, never touches existing rows', async () => {
    const spies = install();
    const utils = render(<EditFocusScreen />);
    await saveNewFocus(utils);
    const first = expectedTasks()[0];
    fireEvent.press(utils.getByTestId(`edit-focus-task-${first.id}`));
    fireEvent.press(utils.getByTestId('edit-focus-add'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());

    expect(spies.taskInsert).toHaveBeenCalledTimes(1);
    const rows = spies.taskInsert.mock.calls[0][0] as Record<string, unknown>[];
    expect(rows).toEqual([expect.objectContaining({
      family_id: 'fam-1', assigned_to: 'child-1', title: first.title.en, time: first.time,
      category: first.category, credits: first.buff_value, schedule_days: [0, 1, 2, 3, 4, 5, 6],
    })]);
    expect(spies.rewardInsert).not.toHaveBeenCalled();
    for (const s of [spies.taskUpdate, spies.taskDelete, spies.rewardUpdate, spies.rewardDelete]) {
      expect(s).not.toHaveBeenCalled();
    }
  });

  test('a task the child already has (stored in Hebrew) is not suggested again', async () => {
    const first = expectedTasks()[0];
    install({ existingTasks: [first.title.he] });
    const utils = render(<EditFocusScreen />);
    await saveNewFocus(utils);
    expect(utils.queryByTestId(`edit-focus-task-${first.id}`)).toBeNull();
  });

  test('uses the age group being edited on Edit Child over the stored one', async () => {
    install();
    mockRoute.params = { childId: 'child-1', ageGroup: '6-8' };
    const { getByTestId, queryByTestId } = render(<EditFocusScreen />);
    await waitFor(() => expect(getByTestId('edit-focus-main-calm_mornings')).toBeTruthy());
    expect(queryByTestId('edit-focus-main-screen_balance')).toBeNull();
    // stored focus is from another band → nothing selected, Save disabled until a pick
    expect(getByTestId('edit-focus-save').props.accessibilityState).toMatchObject({ disabled: true });
  });

  test('no age group at all → asks for one, nothing to save', async () => {
    install({ proSettings: { gender: 'boy' } });
    const { getByTestId, queryByTestId } = render(<EditFocusScreen />);
    await waitFor(() => expect(getByTestId('edit-focus-need-age')).toBeTruthy());
    expect(queryByTestId('edit-focus-save')).toBeNull();
  });
});
