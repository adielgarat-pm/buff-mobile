/**
 * shareInvite — cross-platform "share this invite message".
 *
 * The problem this solves: React Native's `Share.share()` is a no-op on
 * react-native-web, so on the web PWA the onboarding invite silently did
 * nothing — the child never received a way in. This unifies the *signal*
 * ("share this text") and splits the *action* per platform.
 *
 *   - native (Android/iOS): the OS Share sheet.
 *   - web (mobile browsers): the Web Share API (navigator.share).
 *   - web (desktop / no Web Share API): opens WhatsApp with the message
 *     prefilled.
 *
 * Never throws — a dismissed sheet (AbortError) or an unavailable share
 * resolves quietly so callers can proceed without trapping the user.
 */
import { Platform, Share } from 'react-native';

export async function shareInvite(message: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
        | { share?: (data: { text?: string }) => Promise<void> }
        | undefined;
      if (nav?.share) {
        await nav.share({ text: message });
      } else if (typeof window !== 'undefined') {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
    } else {
      await Share.share({ message });
    }
  } catch {
    // User dismissed the share sheet (AbortError) or share is unavailable —
    // non-fatal; callers proceed.
  }
}
