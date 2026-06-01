/**
 * Device-locale currency symbol for the BUFFs→cash conversion reward.
 *
 * We deliberately do NOT store currency per family (see pkg/money-conversion-reward):
 * the cash amount is stored currency-agnostic in store_rewards.cash_value, and the
 * symbol is derived from the device at render time. Falls back to ₪ (Israel-first MVP).
 */
import * as Localization from 'expo-localization';

const DEFAULT_SYMBOL = '₪';

export function getCurrencySymbol(): string {
  try {
    const locales = Localization.getLocales();
    return locales?.[0]?.currencySymbol || DEFAULT_SYMBOL;
  } catch {
    return DEFAULT_SYMBOL;
  }
}
