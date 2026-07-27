/**
 * openExternalUrl (native) — opens a URL outside the app.
 *
 * On Android/iOS this hands the URL to the OS, which routes it to the owning
 * app (WhatsApp for a `chat.whatsapp.com` invite) or the browser. The web
 * counterpart (`openExternalUrl.web.ts`) must open the window SYNCHRONOUSLY
 * inside the click handler instead — see that file for why.
 *
 * Metro resolves `openExternalUrl.web.ts` on web and this file on native; tsc
 * resolves this base file. Both files use the SAME extension (`.ts`) on
 * purpose: Metro resolves per-extension, so a mismatched pair would let the
 * base win on web and the override would be silently ignored (same trap
 * documented on `crossAlert`).
 *
 * Never throws — a dead link must not take a screen down with it.
 */
import { Linking } from 'react-native';

export function openExternalUrl(url: string): void {
  try {
    void Linking.openURL(url).catch(() => {
      /* no handler for the scheme, or the user cancelled — nothing to do */
    });
  } catch {
    /* opening an external URL must never throw into the caller */
  }
}
