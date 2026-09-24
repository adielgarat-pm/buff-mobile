/**
 * Freemium v2 (D: Adi 2026-09-24): the Insights screen's rule-based stats are
 * free core for every parent; only the AI coach section is BUFF Coach, gated on
 * the same real-entitlement signal the server enforces (insightsUnlocked).
 * Before: a non-subscriber got an early-return lock screen with no stats, and
 * web (isSubscribed=true via the paywall-hiding flag) showed the AI controls
 * while the server refused them.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import ParentInsightsScreen from '../ParentInsightsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { childId: 'c1' } }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

let mockSub = { isSubscribed: true, hasRealEntitlement: false, insightsUnlocked: false };
jest.mock('../../../hooks/useSubscription', () => ({ useSubscription: () => mockSub }));
jest.mock('../../../hooks/useChildrenDashboard', () => ({
  useChildrenDashboard: () => ({ children: [{ childId: 'c1', displayName: 'Test Kid' }], loading: false }),
}));
const mockWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => ({
  date: `2026-09-${20 + i}`, dayKey: `day.${d}`, isActive: i < 3,
}));
jest.mock('../../../hooks/useWeeklyStats', () => ({
  useWeeklyStats: () => ({
    stats: { activeDays: 3, daysWithData: 5, thisWeek: mockWeek, lastWeekActiveDays: 2 },
    loading: false,
  }),
}));
jest.mock('../../../hooks/useParentInsights', () => ({
  useParentInsights: () => ({ phaseInsights: [], categoryStats: [], cachedFraming: null, loading: false }),
}));
jest.mock('../../../hooks/useRewardLoopHealth', () => ({ useRewardLoopHealth: () => ({ signals: {} }) }));
jest.mock('../../../hooks/useAppSettings', () => ({
  useAppSettings: () => ({ isPauseActive: false, fridayEnabled: true }),
}));
jest.mock('../../../hooks/useDailyVibe', () => ({ useDailyVibe: () => ({ isLowPower: false }) }));
jest.mock('../../../hooks/useTaskTimeline', () => ({
  useTaskTimeline: () => ({ rows: [], categorySummaries: [], hasWeekendPattern: false, loading: false }),
}));
jest.mock('../../../hooks/useSmartInsights', () => ({
  useSmartInsights: () => ({
    smartInsight: null, computedAt: null, parentContext: '', setParentContext: jest.fn(),
    generating: false, generate: jest.fn(), error: null, generationsLeft: 3,
    tasteWeeklyUsed: true, loadingState: 'idle', userVote: null, submitVote: jest.fn(),
  }),
}));
jest.mock('../../../hooks/useAutoCoachInsight', () => ({ useAutoCoachInsight: jest.fn() }));
jest.mock('../../../hooks/useInsightViewLog', () => ({ useInsightViewLog: jest.fn() }));
jest.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ familyId: 'f1' }) }));
jest.mock('../../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));

describe('ParentInsightsScreen — free stats, AI gated (Freemium v2)', () => {
  test('a free family sees the weekly stats and a BUFF Coach card, not the AI controls', () => {
    mockSub = { isSubscribed: true /* web/iOS paywall-hiding */, hasRealEntitlement: false, insightsUnlocked: false };
    const api = render(<ParentInsightsScreen />);
    expect(api.getByText('insights.weekly.map.title')).toBeTruthy();       // free stats render
    expect(api.getByTestId('insights-coach-locked')).toBeTruthy();         // upsell card
    expect(api.queryByText('insights.smart.generateCta')).toBeNull();      // no AI controls
  });

  test('an entitled family gets the AI controls and no upsell card', () => {
    mockSub = { isSubscribed: true, hasRealEntitlement: true, insightsUnlocked: true };
    const api = render(<ParentInsightsScreen />);
    expect(api.getByText('insights.weekly.map.title')).toBeTruthy();
    expect(api.getByText('insights.smart.generateCta')).toBeTruthy();
    expect(api.queryByTestId('insights-coach-locked')).toBeNull();
  });
});
