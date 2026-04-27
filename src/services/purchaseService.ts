/**
 * purchaseService.ts — RevenueCat integration.
 *
 * Thin wrapper around react-native-purchases so the rest of the app
 * never imports the SDK directly (easier to mock in tests).
 */
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const RC_API_KEY     = 'goog_JXENrpCCcYObBesSjSeFGoKvuaA';
const ENTITLEMENT_ID = 'BUFF Premium';

/**
 * Call once after the user signs in.
 * Uses the Supabase user.id as the RevenueCat appUserID so purchases
 * survive reinstalls and are consistent across platforms.
 */
export async function initRevenueCat(userId: string): Promise<void> {
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

/** Restore previous purchases (e.g. after reinstall). */
export async function restorePurchases() {
  return await Purchases.restorePurchases();
}
