/**
 * Tests for PackingCard — the one child packing surface (HQ + ציוד tab).
 *
 * Locks in tomorrow-pack-inconsistency Phase 1 (SPEC §3 D2/D4, §4):
 *  - today is the dominant block (filled pill + accent rail), tomorrow the
 *    quieter collapsible block whose header names the weekday and, while
 *    collapsed, the first thing on tomorrow — content, never a count;
 *  - per-host default: `defaultTomorrowExpanded` (ציוד tab) vs collapsed on HQ,
 *    auto-expanded when today has nothing;
 *  - no `camp.empty` while either source is still loading;
 *  - toggling never touches the check-off state;
 *  - check-off state is re-read on every host focus (two live cards converge).
 */

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import '@testing-library/react-native/extend-expect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PackingCard from '../PackingCard';
import type { Activity } from '../../types/activities';
import type { Timetable } from '../../types/timetable';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Identity translator that also exposes interpolation params.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params && 'day' in params ? `${key}[${params.day}]` : key,
  }),
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme:      () => ({ themeName: 'mint' }),
  useChildTheme: () => new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

// useFocusEffect → plain effect so the initial "focus" runs in tests; keep a
// handle on the latest callback so a test can simulate a re-focus.
const mockFocus: { latest: (() => void | (() => void)) | null } = { latest: null };
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      mockFocus.latest = cb;
      React.useEffect(cb, [cb]);
    },
  };
});

const mockHaptic = jest.fn(() => Promise.resolve());
jest.mock('expo-haptics', () => ({
  notificationAsync: (...a: unknown[]) => mockHaptic(...a),
  NotificationFeedbackType: { Success: 'success' },
}));

let mockActivities: { activities: Activity[]; loading: boolean } = { activities: [], loading: false };
let mockTimetable: { timetable: Timetable; loading: boolean } = { timetable: {}, loading: false };
jest.mock('../../hooks/useActivities', () => ({ useActivities: () => mockActivities }));
jest.mock('../../hooks/useTimetable', () => ({ useTimetable: () => mockTimetable }));

// ── Fixtures (Noa's data, relative to the device's today) ────────────────────

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const today = new Date(); today.setHours(12, 0, 0, 0);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const TODAY_WD = WEEKDAYS[today.getDay()];
const TOMORROW_WD = WEEKDAYS[tomorrow.getDay()];

function club(id: string, title: string, time: string, weekday: typeof WEEKDAYS[number]): Activity {
  return {
    id, familyId: 'F', childId: 'C', title, templateId: null,
    schedule: { kind: 'recurring', weekdays: [weekday] },
    time, equipment: ['בגדי ספורט', 'נעלי ספורט'],
    status: 'active', createdByChild: false, createdAt: '2026-09-01T00:00:00Z',
  };
}

const electronicsToday = { ...club('a0', "חוג אלקטרוניקה", '17:00', TODAY_WD), equipment: ['ארגז כלים'] };
const ninja = club('a1', "חוג נינג'ה", '16:15', TOMORROW_WD);
const basketball = club('a2', 'חוג כדורסל', '17:30', TOMORROW_WD);
const selfDefense = club('a3', 'חוג הגנה עצמית', '18:15', TOMORROW_WD);

const artToday: Timetable = TODAY_WD === 'saturday'
  ? {}
  : { [TODAY_WD]: [{ subject: 'אמנות', startTime: '09:00', equipment: 'תיקיית אמנות' }] } as Timetable;

function setData(opts: { todayGroups: boolean; tomorrowClubs: boolean; loading?: 'activities' | 'timetable' | null }) {
  mockActivities = {
    activities: [
      ...(opts.todayGroups ? [electronicsToday] : []),
      ...(opts.tomorrowClubs ? [ninja, basketball, selfDefense] : []),
    ],
    loading: opts.loading === 'activities',
  };
  mockTimetable = {
    timetable: opts.todayGroups ? artToday : {},
    loading: opts.loading === 'timetable',
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockHaptic.mockClear();
  mockFocus.latest = null;
  setData({ todayGroups: true, tomorrowClubs: true });
});

// ── Structure & hierarchy ────────────────────────────────────────────────────

describe('PackingCard — today vs tomorrow blocks (D2)', () => {
  test('today is a rail-contained block with a filled pill; tomorrow a muted pill below a divider', () => {
    const { getByTestId } = render(<PackingCard childId="C" />);
    expect(getByTestId('packing-today')).toHaveStyle({ borderStartWidth: 3, borderStartColor: 'accent' });
    expect(getByTestId('packing-today-pill')).toHaveStyle({ backgroundColor: 'primary' });
    expect(getByTestId('packing-tomorrow')).toHaveStyle({ borderTopWidth: 1, borderTopColor: 'border' });
    expect(getByTestId('packing-tomorrow-pill')).toHaveStyle({ backgroundColor: 'muted' });
  });

  test('tomorrow header names the weekday via the existing childTasks.tomorrow + weekday.{n} keys', () => {
    const { getByText } = render(<PackingCard childId="C" />);
    expect(getByText(`childTasks.tomorrow[weekday.${tomorrow.getDay()}]`)).toBeTruthy();
  });

  test('tomorrow rows carry no opacity (grey already means "done" in this card)', () => {
    const { getByText } = render(<PackingCard childId="C" defaultTomorrowExpanded />);
    const row = getByText("חוג נינג'ה · 16:15");
    expect(row.props.style).not.toEqual(expect.arrayContaining([expect.objectContaining({ opacity: expect.anything() })]));
  });
});

// ── Default state per host (Q6) ──────────────────────────────────────────────

describe('PackingCard — tomorrow default state (Q6, per host)', () => {
  test('HQ (no prop): collapsed — hint shows the first tomorrow group, no rows in the tree', () => {
    const { getByTestId, queryByTestId, queryByText } = render(<PackingCard childId="C" />);
    expect(queryByTestId('packing-tomorrow-body')).toBeNull();
    expect(getByTestId('packing-tomorrow-hint').props.children).toBe("חוג נינג'ה · 16:15");
    expect(queryByText('חוג כדורסל · 17:30')).toBeNull();
    expect(getByTestId('packing-tomorrow-header').props.accessibilityState).toEqual({ expanded: false });
  });

  test('ציוד tab (defaultTomorrowExpanded): expanded — all three clubs with both gear rows, no hint', () => {
    const { getAllByText, queryByTestId, getByText } = render(<PackingCard childId="C" defaultTomorrowExpanded />);
    expect(queryByTestId('packing-tomorrow-hint')).toBeNull();
    expect(getByText("חוג נינג'ה · 16:15")).toBeTruthy();
    expect(getByText('חוג כדורסל · 17:30')).toBeTruthy();
    expect(getByText('חוג הגנה עצמית · 18:15')).toBeTruthy();
    expect(getAllByText('נעלי ספורט')).toHaveLength(3);
  });

  test('HQ with nothing today: tomorrow auto-expands (never an empty card over "+ add my own")', () => {
    setData({ todayGroups: false, tomorrowClubs: true });
    const { queryByTestId, getByTestId, queryByText } = render(<PackingCard childId="C" />);
    expect(queryByTestId('packing-today')).toBeNull();
    expect(getByTestId('packing-tomorrow-body')).toBeTruthy();
    expect(queryByText('camp.empty')).toBeNull();
  });

  test('header toggles: press collapses/expands and flips accessibilityState.expanded', () => {
    const { getByTestId, queryByTestId } = render(<PackingCard childId="C" defaultTomorrowExpanded />);
    const header = getByTestId('packing-tomorrow-header');
    expect(header.props.accessibilityRole).toBe('button');
    fireEvent.press(header);
    expect(queryByTestId('packing-tomorrow-body')).toBeNull();
    expect(getByTestId('packing-tomorrow-header').props.accessibilityState).toEqual({ expanded: false });
    fireEvent.press(getByTestId('packing-tomorrow-header'));
    expect(getByTestId('packing-tomorrow-body')).toBeTruthy();
  });

  test('collapsed header is content, not a count: no digits other than the time inside the hint', () => {
    const { getByTestId } = render(<PackingCard childId="C" />);
    const pillText = getByTestId('packing-tomorrow-pill').props.children[1].props.children as string;
    expect(pillText).toMatch(/^childTasks\.tomorrow\[weekday\.\d\]$/); // only the weekday index from the mock
    const hint = getByTestId('packing-tomorrow-hint').props.children as string;
    expect(hint.replace(/\d{1,2}:\d{2}/, '')).not.toMatch(/\d/);
  });
});

// ── Loading & empty (D4) ─────────────────────────────────────────────────────

describe('PackingCard — loading gate (D4)', () => {
  test.each(['activities', 'timetable'] as const)('while %s is loading: spinner, no camp.empty, no groups', (which) => {
    setData({ todayGroups: false, tomorrowClubs: false, loading: which });
    const { getByTestId, queryByText, queryByTestId } = render(<PackingCard childId="C" />);
    expect(getByTestId('packing-loading')).toBeTruthy();
    expect(queryByText('camp.empty')).toBeNull();
    expect(queryByTestId('packing-today')).toBeNull();
    expect(queryByTestId('packing-tomorrow')).toBeNull();
  });

  test('both settled and both days empty → camp.empty', () => {
    setData({ todayGroups: false, tomorrowClubs: false });
    const { getByText } = render(<PackingCard childId="C" />);
    expect(getByText('camp.empty')).toBeTruthy();
  });

  test('today empty but tomorrow has clubs → NOT camp.empty (the reported bug, on the card side)', () => {
    setData({ todayGroups: false, tomorrowClubs: true });
    const { queryByText, getByTestId } = render(<PackingCard childId="C" />);
    expect(queryByText('camp.empty')).toBeNull();
    expect(getByTestId('packing-tomorrow')).toBeTruthy();
  });

  test('null childId renders nothing', () => {
    const { toJSON } = render(<PackingCard childId={null} />);
    expect(toJSON()).toBeNull();
  });
});

// ── Check-off ────────────────────────────────────────────────────────────────

describe('PackingCard — check-off state', () => {
  test('toggling collapse never changes ticks and never writes storage', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const { getByText, getByTestId, getAllByText } = render(<PackingCard childId="C" defaultTomorrowExpanded />);
    fireEvent.press(getAllByText('נעלי ספורט')[0]);
    await waitFor(() => expect(setItem).toHaveBeenCalledTimes(1));
    fireEvent.press(getByTestId('packing-tomorrow-header'));
    fireEvent.press(getByTestId('packing-tomorrow-header'));
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(getAllByText('נעלי ספורט')[0].props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: 'mutedForeground' })]),
    );
    expect(getByText('ארגז כלים')).toBeTruthy(); // today untouched
  });

  test('a tick made before the initial storage read resolves is not wiped by it', async () => {
    const { getAllByText } = render(<PackingCard childId="C" defaultTomorrowExpanded />);
    fireEvent.press(getAllByText('נעלי ספורט')[0]); // synchronous, before multiGet resolves
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(getAllByText('נעלי ספורט')[0]).toHaveStyle({ color: 'mutedForeground' });
  });

  test('ticks are keyed per day: tomorrow key holds only tomorrow ids', async () => {
    const { getAllByText } = render(<PackingCard childId="C" defaultTomorrowExpanded />);
    fireEvent.press(getAllByText('נעלי ספורט')[0]);
    const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(`buff_packing_C_${iso}`);
      expect(JSON.parse(raw ?? '[]')).toEqual([`${iso}::activity::חוג נינג'ה::נעלי ספורט`]);
    });
  });

  test('re-focus re-reads storage so a tick made by the other host shows up (L6)', async () => {
    const { queryByText, getByText } = render(<PackingCard childId="C" />);
    expect(queryByText('camp.allPacked')).toBeNull();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayIds = [
      ...(TODAY_WD === 'saturday' ? [] : [`${iso}::school::אמנות::תיקיית אמנות`]),
      `${iso}::activity::חוג אלקטרוניקה::ארגז כלים`,
    ];
    await AsyncStorage.setItem(`buff_packing_C_${iso}`, JSON.stringify(todayIds));
    await act(async () => { mockFocus.latest?.(); });
    await waitFor(() => expect(getByText('camp.allPacked')).toBeTruthy());
  });

  test('completing a whole section: success-styled pill, "מוכנים!" in foreground colour, one success haptic', async () => {
    const { getByText, getByTestId } = render(<PackingCard childId="C" />);
    fireEvent.press(getByText('ארגז כלים'));
    if (TODAY_WD !== 'saturday') fireEvent.press(getByText('תיקיית אמנות'));
    await waitFor(() => expect(getByText('camp.allPacked')).toBeTruthy());
    expect(getByText('camp.allPacked')).toHaveStyle({ color: 'foreground', fontWeight: '700' });
    expect(getByTestId('packing-today-pill')).toHaveStyle({ borderColor: 'success' });
    expect(mockHaptic).toHaveBeenCalledTimes(1);
  });
});
