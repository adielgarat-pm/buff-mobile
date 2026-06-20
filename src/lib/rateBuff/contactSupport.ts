/**
 * Low-rating "we'd love to hear more" — opens Adi's direct line.
 *
 * Tries WhatsApp first (on-brand: WhatsApp is already the tester channel), falls
 * back to email if no number is configured or WhatsApp can't open. Cross-platform
 * via Linking (wa.me + mailto both work on Android and web).
 *
 * SPEC §9: set SUPPORT_WHATSAPP to enable WhatsApp; until then it's mailto.
 */
import { Linking } from 'react-native';

/** Country code + number, digits only, no '+' (e.g. '972500000000'). Empty = email only. */
const SUPPORT_WHATSAPP = '';
const SUPPORT_EMAIL = 'adi@buffadhd.com';
const EMAIL_SUBJECT = 'BUFF feedback';

export async function openSupportContact(message: string): Promise<void> {
  const text = encodeURIComponent(message);

  if (SUPPORT_WHATSAPP) {
    const wa = `https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`;
    try {
      if (await Linking.canOpenURL(wa)) {
        await Linking.openURL(wa);
        return;
      }
    } catch {
      /* fall through to email */
    }
  }

  const mail = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${text}`;
  try {
    await Linking.openURL(mail);
  } catch {
    /* nothing else we can do; the in-app feedback was already saved */
  }
}
