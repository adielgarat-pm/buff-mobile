/**
 * inviteSend — the ways a parent can send a child the BUFF join link, beyond
 * the OS share sheet (`shareInvite`).
 *
 * Why this exists (Adi's web run 2026-09-26): the end of onboarding showed only
 * the family code, and on desktop web the only share fallback was WhatsApp — a
 * child on the family computer usually has no WhatsApp; email is how that
 * computer is reached. So: share sheet where the platform has one (native
 * always; web when `navigator.share` exists), otherwise let the parent pick
 * WhatsApp / email / copy.
 *
 * Both platforms: `mailto:` goes to the mail app on Android (Linking) and to
 * the default mail handler on web (same-tab navigation to a `mailto:` URL does
 * not leave the page). Must be called synchronously from the press handler on
 * web (user activation). Never throws.
 */
import { Linking, Platform } from 'react-native';
import { openExternalUrl } from '../platform/openExternalUrl';

/** True when `shareInvite` will present a real share sheet (pick-an-app). */
export function hasShareSheet(): boolean {
  if (Platform.OS !== 'web') return true;
  return typeof navigator !== 'undefined' && typeof (navigator as { share?: unknown }).share === 'function';
}

export function buildMailtoUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Opens a new email with the invite prefilled; the parent picks the recipient. */
export function openInviteEmail(subject: string, body: string): void {
  const url = buildMailtoUrl(subject, body);
  try {
    if (Platform.OS === 'web') {
      window.location.href = url;
      return;
    }
    void Linking.openURL(url).catch(() => { /* no mail app — nothing to do */ });
  } catch {
    /* opening mail must never throw into the caller */
  }
}

export function openInviteWhatsApp(message: string): void {
  openExternalUrl(buildWhatsAppUrl(message));
}
