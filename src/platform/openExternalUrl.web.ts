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
 * Do NOT pass 'noopener' in the features string: per the HTML spec,
 * `window.open` then returns null even when the tab DID open, so the old
 * `if (!w)` fallback also navigated the current tab away — the parent left the
 * app on every external link (found by the concierge-call web E2E,
 * 2026-09-25). Instead we open normally and cut the opener link ourselves,
 * which gives the same protection.
 *
 * Falls back to a same-tab navigation only when the popup was really blocked,
 * so the user always gets somewhere. Never throws.
 */
export function openExternalUrl(url: string): void {
  try {
    const w = window.open(url, '_blank');
    if (w) {
      try { w.opener = null; } catch { /* cross-origin: nothing to cut */ }
      return;
    }
    window.location.href = url;
  } catch {
    try {
      window.location.href = url;
    } catch {
      /* opening an external URL must never throw into the caller */
    }
  }
}
