/**
 * purchaseService.ts — RevenueCat integration.
 *
 * Thin wrapper around react-native-purchases so the rest of the app
 * never imports the SDK directly (easier to mock in tests).
 */
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const RC_API_KEY     = 'goog_JXENrpCCcYObBesSjSeFGoKvuaA';
const ENTITLEMENT_ID = 'BUFF Premium';
const FOUNDING_ENTITLEMENT_ID = 'Founding Member';

/** Product IDs for the Founding 100 lifetime tier. Must match RC dashboard. */
export const FOUNDING_PRODUCT_IDS = {
  tier_99:  'lifetime_founding_99',
  tier_149: 'lifetime_founding_149',
} as const;

export type FoundingTier = 99 | 149;

/**
 * Call once after the user signs in.
 * Uses the Supabase user.id as the RevenueCat appUserID so purchases
 * survive reinstalls and are consistent across platforms.
 */
export async function initRevenueCat(userId: string): Promise<void> {
  // iOS TestFlight phase (Phase 1): no iOS RevenueCat API key / IAP products yet.
  // Configuring the SDK with the Android key (`goog_…`) on iOS would error, so we
  // skip init entirely. Paired with the iOS branch in useSubscription (paywall hidden,
  // premium unlocked). REMOVE when Apple IAP lands in Phase 2 and an iOS key exists.
  if (Platform.OS === 'ios') {
    console.log('[RevenueCat] skipped on iOS (Phase 1 — no IAP yet)');
    return;
  }
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  await Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId });
  console.log('[RevenueCat] configured for user:', userId);
}

/** Returns true if the "BUFF Premium" entitlement is active. */
export async function getIsSubscribed(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/** Returns true if the "Founding Member" entitlement is active. */
export async function getIsFoundingMember(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[FOUNDING_ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/** Returns all current offerings, or null on error. */
export async function getOfferings() {
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

/** Purchase the monthly package from the current offering. */
export async function purchaseMonthly() {
  const offerings = await getOfferings();
  const monthly   = offerings?.current?.monthly;
  if (!monthly) throw new Error('Monthly package not found');
  return await Purchases.purchasePackage(monthly);
}

/** Purchase the annual package from the current offering. */
export async function purchaseYearly() {
  const offerings = await getOfferings();
  const yearly    = offerings?.current?.annual;
  if (!yearly) throw new Error('Yearly package not found');
  return await Purchases.purchasePackage(yearly);
}

/**
 * Purchase the Founding 100 lifetime tier.
 *
 * Uses Purchases.purchaseStoreProduct (direct product purchase, bypasses
 * offerings/packages — the founding SKUs are not part of the standard
 * subscription offering).
 *
 * The webhook (supabase/functions/rc-webhook) handles the post-purchase
 * grant of is_lifetime_founding + founding_member_number atomically.
 */
export async function purchaseLifetime(tier: FoundingTier) {
  const productId = tier === 99
    ? FOUNDING_PRODUCT_IDS.tier_99
    : FOUNDING_PRODUCT_IDS.tier_149;

  const products = await Purchases.getProducts([productId]);
  const product = products[0];
  if (!product) {
    throw new Error(
      `Founding tier product not found in RevenueCat: ${productId}. ` +
      `Verify the product exists in the RC dashboard and is mapped to the ` +
      `"BUFF Premium" + "Founding Member" entitlements.`,
    );
  }

  return await Purchases.purchaseStoreProduct(product);
}

/** Restore previous purchases (e.g. after reinstall). */
export async function restorePurchases() {
  return await Purchases.restorePurchases();
}
