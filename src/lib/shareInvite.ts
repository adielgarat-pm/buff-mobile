/**
 * shareInvite — cross-platform "share this invite message".
 *
 * The problem this solves: React Native's `Share.share()` is a no-op on
 * react-native-web, so on the web PWA invite buttons silently did nothing —
 * the child never received a way in. This unifies the *signal* ("share this
 * text") and splits the *action* per platform.
 *
 *   - native (Android/iOS): the OS Share sheet.
 *   - web (mobile browsers): the Web Share API (navigator.share).
 *   - web (desktop / no Web Share API): opens WhatsApp with the message
 *     prefilled.
 *
 * Never throws — a dismissed sheet (AbortError) or an unavailable share
 * resolves quietly so callers can proceed without trapping the user.
 *
 * Returns whether a share surface was actually presented:
 *   - `true`  — a share sheet opened (including the user then dismissing it —
 *               that's a choice, not a failure) or the WhatsApp tab opened.
 *   - `false` — nothing visible happened (no Web Share API and the WhatsApp
 *               window was blocked, or the native share threw). Callers should
 *               fall back to something visible, e.g. copy-to-clipboard + toast.
 */
import { Platform, Share } from 'react-native';

export async function shareInvite(message: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const nav = (typeof navigator !== 'undefined' ? navigator : undefined) as
        | { share?: (data: { text?: string }) => Promise<void> }
        | undefined;
      if (nav?.share) {
        await nav.share({ text: message });
        return true;
      }
      if (typeof window !== 'undefined') {
        const opened = window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        // Pop-up blockers return null — nothing visible happened.
        return opened != null;
      }
      return false;
    }
    await Share.share({ message });
    return true;
  } catch (err) {
    // AbortError = the user dismissed the Web Share sheet after it opened —
    // the share surface DID appear, so no fallback is needed.
    if (err instanceof Error && err.name === 'AbortError') return true;
    // Anything else: share is unavailable/broken — non-fatal; callers proceed
    // (and may show a visible fallback).
    return false;
  }
}
