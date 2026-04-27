/**
 * useSubscription — BUFF subscription model
 *
 * Business model: gate on NUMBER OF CHILDREN, not features.
 *   Free tier  — 1 child (always free)
 *   BUFF Premium — $9/month or yearly, unlimited children (RevenueCat)
 *
 * Subscription state (in priority order):
 *   1. is_lifetime_access on profile  → always subscribed, never sees paywall
 *   2. Grace period (< 2026-05-01)    → everyone subscribed during beta
 *   3. simulateSubscribed dev toggle  → dev testing
 *   4. RevenueCat "BUFF Premium" entitlement → real subscription
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { useAuth } from '../contexts/AuthContext';
import { useFamilyMembers } from './useFamilyMembers';
import {
  getIsSubscribed,
  purchaseMonthly  as rcPurchaseMonthly,
  purchaseYearly   as rcPurchaseYearly,
  restorePurchases as rcRestorePurchases,
} from '../services/purchaseService';

export const GRACE_PERIOD_END = new Date('2026-05-01T23:59:59');

export const FREE_CHILD_LIMIT = 1;
export const FREE_TASK_LIMIT  = 5;

const SIMULATE_SUBSCRIBED_KEY = 'buff_simulate_subscribed';

export function useSubscription() {
  const { profile, user, refreshProfile } = useAuth();
  const { children } = useFamilyMembers();

  const [simulateSubscribed, setSimulateSubscribedState] = useState(false);
  const [rcSubscribed,  setRcSubscribed]  = useState(false);
  const [customerInfo,  setCustomerInfo]  = useState<CustomerInfo | null>(null);
  const [rcLoading,     setRcLoading]     = useState(true);

  // ── Load dev toggle ────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SIMULATE_SUBSCRIBED_KEY).then((val) => {
      if (val === 'true') setSimulateSubscribedState(true);
    });
  }, []);

  const setSimulateSubscribed = useCallback((value: boolean) => {
    setSimulateSubscribedState(value);
    AsyncStorage.setItem(SIMULATE_SUBSCRIBED_KEY, String(value));
  }, []);

  // ── Fetch RC status on mount ───────────────────────────────────────────────
  const refreshRC = useCallback(async (): Promise<void> => {
    try {
      const [subscribed, info] = await Promise.all([
        getIsSubscribed(),
        Purchases.getCustomerInfo(),
      ]);
      setRcSubscribed(subscribed);
      setCustomerInfo(info);
    } catch (err) {
      console.warn('[useSubscription] RC refresh error (non-fatal):', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshRC();
      } finally {
        if (mounted) setRcLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [refreshRC]);

  // ── Derived subscription status ────────────────────────────────────────────
  const isLifetimeAccess = profile?.is_lifetime_access ?? false;
  const isGracePeriod    = new Date() < GRACE_PERIOD_END;
  const isLifetime       = isLifetimeAccess;

  const isSubscribed =
    isLifetimeAccess ||
    isGracePeriod    ||
    simulateSubscribed ||
    rcSubscribed;

  const childCount   = children.length;
  const needsUpgrade = !isSubscribed && childCount >= FREE_CHILD_LIMIT;

  // ── Purchase helpers ────────────────────────────────────────────────────────
  const purchaseMonthly = useCallback(async () => {
    const result = await rcPurchaseMonthly();
    await refreshRC();
    if (user) await refreshProfile(user.id);
    return result;
  }, [refreshRC, refreshProfile, user]);

  const purchaseYearly = useCallback(async () => {
    const result = await rcPurchaseYearly();
    await refreshRC();
    if (user) await refreshProfile(user.id);
    return result;
  }, [refreshRC, refreshProfile, user]);

  const restorePurchases = useCallback(async () => {
    const result = await rcRestorePurchases();
    await refreshRC();
    if (user) await refreshProfile(user.id);
    return result;
  }, [refreshRC, refreshProfile, user]);

  return {
    // Status
    isSubscribed,
    isLifetime,
    isLifetimeAccess,
    isGracePeriod,
    needsUpgrade,
    isLoading: rcLoading,
    customerInfo,
    // Plan limits
    childCount,
    FREE_CHILD_LIMIT,
    FREE_TASK_LIMIT,
    // Dev toggle
    simulateSubscribed,
    setSimulateSubscribed,
    // Purchase actions
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    refresh: refreshRC,
  };
}
