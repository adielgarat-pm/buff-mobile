/**
 * Tests for ChildDayBadge — the parent dashboard's count-based success badge
 * (pkg/ux-parent-count-goal, D-2026-06-14).
 *
 * The parent card was the LAST surface still framing a day as a percentage
 * ("40%", amber below 70) — the framing that arms "you only did 40%"
 * conversations. These tests lock in the count rule:
 *   - "{done}/{goal} ⚡" where goal = successGoal(assigned) = min(3, assigned)
 *   - done capped at goal (5 done of goal 3 → "3/3 ⚡")
 *   - at-goal → success green; below goal → NEUTRAL muted color, never amber
 *     (below-goal is progress, not failure — Pillar 2)
 *   - zero-task days (rest days) render nothing, no "0/0"
 *
 * The badge is a pure presentational component exported from
 * ParentDashboardScreen.tsx, so it is rendered directly — no need to mock the
 * whole dashboard's hook forest.
 */
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ChildDayBadge } from '../ParentDashboardScreen';
import { PARENT_THEME as T } from '../../../theme';

// ── Mocks — only what the MODULE (not the badge) pulls in at import time ────
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (!vars || Object.keys(vars).length === 0) return key;
      const parts = Object.entries(vars).map(([k, v]) => `${k}=${v}`).join(',');
      return `${key}(${parts})`;
    },
    i18n: { language: 'en' },
  }),
  // The dashboard module's import graph (uiLocale, LanguageContext) runs the
  // real i18n init, which calls i18n.use(initReactI18next) — keep the plugin
  // shape valid so that init doesn't throw under the mock.
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// MedReminderSheet (imported by the dashboard module) pulls LanguageContext,
// which initialises the real i18n singleton — dead on arrival once
// react-i18next is mocked. Mock the context so the real i18n never loads.
jest.mock('../../../contexts/LanguageContext', () => ({
  useLanguage:  () => ({ language: 'en', setLanguage: jest.fn(), isRTL: false }),
  useRTLStyles: () => ({ isRTL: false, rowDirection: 'row', textAlign: 'left' }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute:      () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: null, user: null, familyId: 'fam-1', familyShortCode: 'ABCD' }),
}));

jest.mock('../../../contexts/ModeContext', () => ({
  useMode: () => ({ enterChildPreview: jest.fn(), isChildPreview: false }),
}));

jest.mock('../../../hooks/useChildrenDashboard', () => ({
  useChildrenDashboard: () => ({ children: [], loading: false, refetch: jest.fn() }),
}));

jest.mock('../../../hooks/useParentInsights', () => ({
  useParentInsights: () => ({ insights: [], loading: false }),
}));

jest.mock('../../../hooks/useParentRecommendations', () => ({
  useParentRecommendations: () => ({ recommendations: [], dismiss: jest.fn() }),
}));

jest.mock('../../../hooks/useSubscription', () => ({
  useSubscription: () => ({ isSubscribed: false, insightsUnlocked: false, isTrialActive: false, trialDaysLeft: 0 }),
}));

jest.mock('../../../hooks/useUnlinkedChildren', () => ({
  useUnlinkedChildren: () => ({ unlinked: [], linkable: [], linkChild: jest.fn() }),
}));

jest.mock('../../../hooks/useParentNotifications', () => ({
  useParentNotifications: () => ({ getSosForChild: () => null }),
}));

jest.mock('../../../hooks/useYesterdayRecap', () => ({
  useYesterdayRecap: () => ({ recapByChildId: {}, shouldHide: true, yesterdayDate: null, loading: false }),
}));

jest.mock('../../../hooks/useAnchorRecoveryPrompts', () => ({
  useAnchorRecoveryPrompts: () => ({ prompts: [], resolveAll: jest.fn() }),
}));

jest.mock('../../../hooks/useAnchorRecoveryDismiss', () => ({
  useAnchorRecoveryDismiss: () => ({ shownToday: true, markShown: jest.fn(), loading: false }),
}));

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../../../components/install/InstallNudge', () => ({
  useInstallNudgeRegistration: jest.fn(),
}));

jest.mock('../../../components/rate/RateNudge', () => ({
  useRateNudgeRegistration: jest.fn(),
}));

jest.mock('../../../lib/nudges/nudgeManager', () => ({
  useActiveNudge: () => null,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────
const NEUTRAL_TEXT = T.textMuted;   // #9CA3AF — the card's regular muted color
const SUCCESS_TEXT = T.success;     // #059669
const AMBER_TEXT   = '#D97706';     // the OLD warning color — must never appear
const AMBER_BG     = '#FEF3C7';

function textColor(node: { props: { style: unknown } }): string | undefined {
  return (StyleSheet.flatten(node.props.style) as { color?: string })?.color;
}

function badgeBg(node: { props: { style: unknown } }): string | undefined {
  return (StyleSheet.flatten(node.props.style) as { backgroundColor?: string })?.backgroundColor;
}

// ── Tests ───────────────────────────────────────────────────────────────────
describe('ChildDayBadge (count-based success, D-2026-06-14)', () => {
  test('0 assigned (rest day) → badge hidden entirely, no "0/0"', () => {
    const { queryByTestId, queryByText } = render(
      <ChildDayBadge completed={0} assigned={0} />,
    );
    expect(queryByTestId('child-day-badge')).toBeNull();
    expect(queryByText(/0\/0/)).toBeNull();
  });

  test('2 assigned, 1 done → "1/2 ⚡" (goal shrinks to the assigned count)', () => {
    const { getByTestId } = render(<ChildDayBadge completed={1} assigned={2} />);
    expect(getByTestId('child-day-badge-text').props.children.join('')).toBe('1/2 ⚡');
  });

  test('10 assigned, 3 done → "3/3 ⚡" in the success color (goal reached)', () => {
    const { getByTestId } = render(<ChildDayBadge completed={3} assigned={10} />);
    const text = getByTestId('child-day-badge-text');
    expect(text.props.children.join('')).toBe('3/3 ⚡');
    expect(textColor(text)).toBe(SUCCESS_TEXT);
    expect(badgeBg(getByTestId('child-day-badge'))).toBe('#ECFDF5');
  });

  test('10 assigned, 1 done → neutral muted color, NOT amber/warning', () => {
    const { getByTestId } = render(<ChildDayBadge completed={1} assigned={10} />);
    const text = getByTestId('child-day-badge-text');
    expect(text.props.children.join('')).toBe('1/3 ⚡');
    expect(textColor(text)).toBe(NEUTRAL_TEXT);
    expect(textColor(text)).not.toBe(AMBER_TEXT);
    expect(badgeBg(getByTestId('child-day-badge'))).not.toBe(AMBER_BG);
  });

  test('overshoot caps at the goal: 10 assigned, 5 done → "3/3 ⚡", success color', () => {
    const { getByTestId } = render(<ChildDayBadge completed={5} assigned={10} />);
    const text = getByTestId('child-day-badge-text');
    expect(text.props.children.join('')).toBe('3/3 ⚡');
    expect(textColor(text)).toBe(SUCCESS_TEXT);
  });

  test('1 assigned, 1 done → "1/1 ⚡", success color (low-load day is winnable)', () => {
    const { getByTestId } = render(<ChildDayBadge completed={1} assigned={1} />);
    const text = getByTestId('child-day-badge-text');
    expect(text.props.children.join('')).toBe('1/1 ⚡');
    expect(textColor(text)).toBe(SUCCESS_TEXT);
  });

  test('never renders a percent sign', () => {
    const { queryByText } = render(<ChildDayBadge completed={7} assigned={10} />);
    expect(queryByText(/%/)).toBeNull();
  });
});
