/**
 * Role-gating tests for the purchase screens (Pillar 1 — children must never
 * see purchase pressure).
 *
 * Guards the defense-in-depth layer added in pkg/ux-paywall-child-gate:
 *   - PaywallScreen and FoundingHundredScreen render NOTHING (and navigate
 *     back) when the signed-in profile role is 'child'. This matters because
 *     buff://founding-100 (and /founding-100 on web) is a public marketing
 *     deep link that could be opened on a child's device.
 *   - Both screens render normally for a parent profile.
 *   - The Paywall footer legal links actually open the privacy/terms pages
 *     (Google Play requirement for subscription screens — they were dead
 *     Text nodes before).
 */
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import PaywallScreen, { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../PaywallScreen';
import FoundingHundredScreen from '../FoundingHundredScreen';

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mutable auth state so each test can flip the role without re-mocking.
const mockAuth = {
  profile: { id: 'p-1', role: 'parent' as 'parent' | 'child' },
};
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { childName: 'Emi' } }),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../../hooks/useSubscription', () => ({
  useSubscription: () => ({
    purchaseMonthly: jest.fn(),
    purchaseYearly: jest.fn(),
    purchaseLifetime: jest.fn(),
    restorePurchases: jest.fn(),
    isFoundingMember: false,
    foundingMemberNumber: null,
  }),
}));

jest.mock('../../services/purchaseService', () => ({
  getOfferings: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../integrations/supabase/client', () => ({
  supabase: { rpc: jest.fn().mockResolvedValue({ data: 0, error: null }) },
}));

jest.mock('../../components/FoundingBadge', () => ({
  FoundingBadge: () => null,
}));

// ── Tests ───────────────────────────────────────────────────────────────────

describe('purchase screens — child role gate (Pillar 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.canGoBack.mockReturnValue(true);
    mockAuth.profile = { id: 'p-1', role: 'parent' };
  });

  test('PaywallScreen renders nothing for a child profile and navigates back', () => {
    mockAuth.profile = { id: 'c-1', role: 'child' };

    const { toJSON, queryByText } = render(<PaywallScreen />);

    expect(toJSON()).toBeNull();
    expect(queryByText('Unlock BUFF Premium')).toBeNull();
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  test('PaywallScreen renders nothing for a child even when it cannot go back (deep-link cold start)', () => {
    mockAuth.profile = { id: 'c-1', role: 'child' };
    mockNavigation.canGoBack.mockReturnValue(false);

    const { toJSON } = render(<PaywallScreen />);

    expect(toJSON()).toBeNull();
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });

  test('PaywallScreen renders the offer for a parent profile', () => {
    const { getByText } = render(<PaywallScreen />);

    expect(getByText('Unlock BUFF Premium')).toBeTruthy();
    expect(getByText('Monthly')).toBeTruthy();
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });

  test('FoundingHundredScreen renders nothing for a child profile and navigates back', () => {
    mockAuth.profile = { id: 'c-1', role: 'child' };

    const { toJSON, queryByText } = render(<FoundingHundredScreen />);

    expect(toJSON()).toBeNull();
    expect(queryByText(/Claim spot/)).toBeNull();
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  test('FoundingHundredScreen renders for a parent profile (loading state, not null)', () => {
    const { toJSON } = render(<FoundingHundredScreen />);

    // Parent gets the real screen (initially the loading spinner while the
    // live counter is fetched) — the important bit is it is NOT gated away.
    expect(toJSON()).not.toBeNull();
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });
});

describe('PaywallScreen — legal footer links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.profile = { id: 'p-1', role: 'parent' };
  });

  test('Privacy Policy opens the privacy page', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Privacy Policy'));

    expect(openURL).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
  });

  test('Terms of Use opens the terms page', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    const { getByText } = render(<PaywallScreen />);
    fireEvent.press(getByText('Terms of Use'));

    expect(openURL).toHaveBeenCalledWith(TERMS_OF_USE_URL);
  });
});
