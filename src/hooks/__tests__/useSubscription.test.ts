/**
 * Tests for useSubscription — iOS Phase-1 paywall gate.
 *
 * During the iOS TestFlight phase (no IAP yet) every iOS user is treated as
 * entitled so all paywall CTAs are hidden and premium features are unlocked.
 * On Android, with no other entitlement signal, the user is NOT subscribed
 * (this guards against the iOS branch accidentally leaking to Android).
 *
 * All real entitlement signals (lifetime/founding DB flags, family entitlement,
 * grace period, dev toggle, RevenueCat) are mocked to FALSE so the only thing
 * that can flip isSubscribed is the platform branch under test.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useSubscription } from '../useSubscription';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: null, user: null, refreshProfile: jest.fn() }),
}));

jest.mock('../useFamilyMembers', () => ({
  useFamilyMembers: () => ({ children: [], parents: [] }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/purchaseService', () => ({
  getIsSubscribed: jest.fn().mockResolvedValue(false),
  getIsFoundingMember: jest.fn().mockResolvedValue(false),
  purchaseMonthly: jest.fn(),
  purchaseYearly: jest.fn(),
  purchaseLifetime: jest.fn(),
  restorePurchases: jest.fn(),
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { getCustomerInfo: jest.fn().mockResolvedValue({}) },
}));

const originalOS = Platform.OS;

afterEach(() => {
  (Platform as { OS: string }).OS = originalOS;
});

describe('useSubscription — iOS paywall gate', () => {
  it('treats an iOS user as subscribed (paywall hidden) with no other entitlement', async () => {
    (Platform as { OS: string }).OS = 'ios';

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.needsUpgrade).toBe(false);
  });

  it('does NOT subscribe an Android user when no entitlement signal is present', async () => {
    (Platform as { OS: string }).OS = 'android';

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isSubscribed).toBe(false);
  });
});
