/**
 * openExternalUrl (web) — opens a URL in a new tab.
 *
 * Why this exists rather than just calling `Linking.openURL` everywhere:
 * react-native-web's `Linking.openURL` opens the window inside a promise
 * `.then()`, which loses the user-activation gesture and gets popup-blocked —
 * so the target never opens. This already cost us the Play Store CTA once
 * (see the comment in `components/install/GetTheAppCta.web.tsx`). The window
 * must be opened SYNCHRONOUSLY inside the click handler.
 *
 * Falls back to a same-tab navigation when the popup is blocked anyway, so the
 * user always gets somewhere. Never throws.
 */
export function openExternalUrl(url: string): void {
  try {
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) window.location.href = url;
  } catch {
    try {
      window.location.href = url;
    } catch {
      /* opening an external URL must never throw into the caller */
    }
  }
}
