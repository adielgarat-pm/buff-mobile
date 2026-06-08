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
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { useAuth } from '../contexts/AuthContext';
import { useFamilyMembers } from './useFamilyMembers';
import {
  getIsSubscribed,
  getIsFoundingMember,
  purchaseMonthly  as rcPurchaseMonthly,
  purchaseYearly   as rcPurchaseYearly,
  purchaseLifetime as rcPurchaseLifetime,
  restorePurchases as rcRestorePurchases,
  type FoundingTier,
} from '../services/purchaseService';

export const GRACE_PERIOD_END = new Date('2026-05-01T23:59:59');

export const FREE_CHILD_LIMIT = 1;
export const FREE_TASK_LIMIT  = 5;

const SIMULATE_SUBSCRIBED_KEY = 'buff_simulate_subscribed';

export function useSubscription() {
  const { profile, user, refreshProfile } = useAuth();
  const { children, parents } = useFamilyMembers();

  const [simulateSubscribed, setSimulateSubscribedState] = useState(false);
  const [rcSubscribed,    setRcSubscribed]    = useState(false);
  const [rcFounding,      setRcFounding]      = useState(false);
  const [customerInfo,    setCustomerInfo]    = useState<CustomerInfo | null>(null);
  const [rcLoading,       setRcLoading]       = useState(true);

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
      const [subscribed, founding, info] = await Promise.all([
        getIsSubscribed(),
        getIsFoundingMember(),
        Purchases.getCustomerInfo(),
      ]);
      setRcSubscribed(subscribed);
      setRcFounding(founding);
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
  const isLifetimeAccess     = profile?.is_lifetime_access ?? false;
  const isLifetimeFounding   = profile?.is_lifetime_founding ?? false;
  const foundingMemberNumber = profile?.founding_member_number ?? null;
  const isGracePeriod        = new Date() < GRACE_PERIOD_END;
  const isLifetime           = isLifetimeAccess;
  // Founding state is true if either the DB flag OR the RC entitlement says
  // so. The DB flag is set by the webhook (eventually consistent); the RC
  // entitlement is immediate on purchase. Either is sufficient to consider
  // the user a Founding Member.
  const isFoundingMember     = isLifetimeFounding || rcFounding;

  // ── Family-wide entitlement ────────────────────────────────────────────────
  // BUFF gates on the FAMILY (the parent's plan), not per-profile. If ANY parent
  // in the family has a DB-backed lifetime/founding plan, every family member
  // inherits it — children logged in on their own device (ChildJoin session,
  // whose own DB flags are false) AND a co-parent who joined the family without
  // purchasing themselves. RC entitlements are device-local and not inheritable;
  // the DB flags are the shared family signal.
  const familyHasEntitlement = parents.some(p => p.isLifetimeAccess || p.isLifetimeFounding);

  // iOS TestFlight phase (Phase 1): payments/IAP are not yet wired on iOS, so every
  // iOS tester is treated as entitled — this hides all paywall CTAs and unlocks the
  // premium features for the free beta. REMOVE this branch in Phase 2 when Apple IAP
  // lands (see pkg/ios-testflight plan + purchaseService.initRevenueCat iOS guard).
  const iosPaywallHidden = Platform.OS === 'ios';

  const isSubscribed =
    isLifetimeAccess ||
    familyHasEntitlement ||
    isGracePeriod    ||
    simulateSubscribed ||
    rcSubscribed     ||
    rcFounding       ||
    iosPaywallHidden;

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

  const purchaseLifetime = useCallback(async (tier: FoundingTier) => {
    const result = await rcPurchaseLifetime(tier);
    await refreshRC();
    // The is_lifetime_founding flag + founding_member_number are set by the
    // rc-webhook edge function. Refresh the profile so the UI picks them up
    // — there may be a brief lag between purchase complete and webhook fired.
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
    isFoundingMember,
    foundingMemberNumber,
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
    purchaseLifetime,
    restorePurchases,
    refresh: refreshRC,
  };
}
