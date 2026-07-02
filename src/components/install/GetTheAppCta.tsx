/**
 * GetTheAppCta (native no-op). The web-to-native install CTA is a WEB-ONLY
 * surface — on the native app there is nothing to install, so this renders null.
 * Metro resolves GetTheAppCta.web.tsx for the Expo Web bundle.
 *
 * IMPORTANT: keep this file free of any web/DOM import so no web code reaches the
 * native bundle (launch-crash blind spot, IN-2026-06-17).
 */
export interface GetTheAppCtaProps {
  placement: 'entry' | 'post-signup' | 'dashboard-nudge';
  onDismiss?: () => void;
}

export default function GetTheAppCta(_props: GetTheAppCtaProps): null {
  return null;
}
