/**
 * Currency symbol for the BUFFs→cash conversion reward.
 *
 * We deliberately do NOT store currency per family (see pkg/money-conversion-reward):
 * the cash amount is stored currency-agnostic in store_rewards.cash_value, and the
 * symbol is derived at render time.
 *
 * Symbol resolution (see D-2026-06-06 — Tamar's £-in-Hebrew bug):
 *  - App language is Hebrew  → always ₪ (Hebrew is a reliable signal for one country).
 *  - Any other app language  → device's currencySymbol (e.g. £ in the UK, $ in the US),
 *    falling back to $ when the device can't supply one.
 *
 * We key off the *app language* (i18n), NOT Localization.getLocales()[0]. The device's
 * first locale is its top language-preference, which is frequently English-UK even on
 * phones whose owner runs BUFF in Hebrew — that mismatch is exactly what surfaced £
 * inside the Hebrew UI.
 */
import * as Localization from 'expo-localization';

import i18n from '../i18n';

const SHEKEL = '₪';
const DEFAULT_SYMBOL = '$';

export function getCurrencySymbol(): string {
  // Hebrew app language → Israel → always shekel.
  if (i18n.language?.startsWith('he')) return SHEKEL;

  // Otherwise honour the device's own currency setting.
  try {
    const locales = Localization.getLocales();
    return locales?.[0]?.currencySymbol || DEFAULT_SYMBOL;
  } catch {
    return DEFAULT_SYMBOL;
  }
}
