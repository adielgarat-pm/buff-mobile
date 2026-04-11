/**
 * useSubscription — BUFF subscription model (v2)
 *
 * Business model: gate on NUMBER OF CHILDREN, not features.
 *   Free tier  — 1 child, 5 tasks (always free)
 *   Family     — $9/month, unlimited children + tasks (RevenueCat, coming soon)
 *
 * All features (buddy, skins, animations, celebrations) are available to ALL users.
 * The only paywall is adding a second child when not subscribed.
 *
 * Subscription state (in priority order):
 *   1. is_lifetime_access on profile  → always subscribed, never sees paywall
 *   2. Grace period (< 2026-05-01)    → everyone is subscribed during beta
 *   3. simulateSubscribed dev toggle  → dev testing
 *   4. RevenueCat (TODO)              → real subscription check
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useFamilyMembers } from './useFamilyMembers';

export const GRACE_PERIOD_END = new Date('2026-05-01T23:59:59');

export const FREE_CHILD_LIMIT = 1;
export const FREE_TASK_LIMIT  = 5;

const SIMULATE_SUBSCRIBED_KEY = 'buff_simulate_subscribed';

export function useSubscription() {
  const { profile } = useAuth();
  const { children } = useFamilyMembers();

  const [simulateSubscribed, setSimulateSubscribedState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SIMULATE_SUBSCRIBED_KEY).then((val) => {
      if (val === 'true') setSimulateSubscribedState(true);
    });
  }, []);

  const setSimulateSubscribed = useCallback((value: boolean) => {
    setSimulateSubscribedState(value);
    AsyncStorage.setItem(SIMULATE_SUBSCRIBED_KEY, String(value));
  }, []);

  const isLifetimeAccess = profile?.is_lifetime_access ?? false;
  const isGracePeriod    = new Date() < GRACE_PERIOD_END;

  // Will be replaced with RevenueCat purchase check
  const isSubscribed = isLifetimeAccess || isGracePeriod || simulateSubscribed;

  const childCount   = children.length;
  const needsUpgrade = !isSubscribed && childCount >= FREE_CHILD_LIMIT;

  return {
    isSubscribed,
    isLifetimeAccess,
    isGracePeriod,
    needsUpgrade,
    childCount,
    FREE_CHILD_LIMIT,
    FREE_TASK_LIMIT,
    simulateSubscribed,
    setSimulateSubscribed,
  };
}
