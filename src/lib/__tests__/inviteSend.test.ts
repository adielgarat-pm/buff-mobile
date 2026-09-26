/**
 * inviteSend — mailto / WhatsApp URLs keep the whole invite (Hebrew, emoji,
 * newlines, the join link) intact.
 */
import { buildMailtoUrl, buildWhatsAppUrl } from '../inviteSend';

const MSG = 'היי נועה 🌱\nה-BUFF שלך מוכן.\n👉 https://buffadhd.com/join/BTTTAZ';

describe('buildMailtoUrl', () => {
  it('encodes subject and body so the mail app gets them verbatim', () => {
    const url = buildMailtoUrl('נועה, ה-BUFF שלך מוכן 🌱', MSG);
    expect(url.startsWith('mailto:?subject=')).toBe(true);
    const params = new URLSearchParams(url.slice('mailto:?'.length));
    expect(params.get('subject')).toBe('נועה, ה-BUFF שלך מוכן 🌱');
    expect(params.get('body')).toBe(MSG);
  });
  it('leaves the recipient empty — the parent picks the inbox', () => {
    expect(buildMailtoUrl('s', 'b')).toMatch(/^mailto:\?/);
  });
});

describe('buildWhatsAppUrl', () => {
  it('prefills the message', () => {
    const url = new URL(buildWhatsAppUrl(MSG));
    expect(url.host).toBe('wa.me');
    expect(url.searchParams.get('text')).toBe(MSG);
  });
});
