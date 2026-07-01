import { useEffect, useState } from 'react';

/**
 * Join — referral landing hop.
 *
 * People click `buffadhd.com/join?ref=CODE` (shared from the app's invite
 * sheet). Before this route existed, `/join` fell through to the catch-all and
 * rendered the homepage, and the `?ref=` code was dropped when the visitor
 * moved on to the app domain — so no referral could ever auto-redeem.
 *
 * This page:
 *   1. Extracts + sanitises the ref code.
 *   2. Logs the click (fire-and-forget beacon → track-referral-click function)
 *      so the admin funnel can show clicks, not just redemptions.
 *   3. Forwards to the app's RoleSelection screen WITH the code preserved, where
 *      referralCapture (web) stashes it for auto-redeem at onboarding's end.
 */

// The live BUFF web app (Expo web PWA) at www — NOT the apex (that's this site).
const APP_URL = 'https://www.buffadhd.com';

// Public click-tracking edge function (verify_jwt disabled — anonymous beacon).
const TRACK_CLICK_URL =
  'https://gfrongfnyigxsexuofrg.supabase.co/functions/v1/track-referral-click';

/** Referral codes are 6 uppercase alphanumerics. Sanitise before use. */
function sanitiseRef(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  return cleaned.length ? cleaned : null;
}

function trackClick(code: string): void {
  try {
    const payload = JSON.stringify({ code });
    const blob = new Blob([payload], { type: 'application/json' });
    // sendBeacon survives the imminent navigation; fall back to fetch keepalive.
    if (navigator.sendBeacon?.(TRACK_CLICK_URL, blob)) return;
    void fetch(TRACK_CLICK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* non-fatal — tracking must never block the redirect */ });
  } catch {
    /* non-fatal */
  }
}

// The interstitial flashes for a split second before redirect, but is the full
// screen a Hebrew clicker sees if the auto-redirect stalls — so localize it.
const isHe =
  typeof navigator !== 'undefined' && (navigator.language ?? '').toLowerCase().startsWith('he');

const COPY = isHe
  ? { opening: 'פותח את BUFF…', notRedirected: 'לא הועברת?', link: 'הקישו כאן להמשך' }
  : { opening: 'Opening BUFF…', notRedirected: 'Not redirected?', link: 'Tap or click here to continue' };

export default function Join() {
  const [target, setTarget] = useState<string>(`${APP_URL}/RoleSelection`);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = sanitiseRef(params.get('ref'));

    const dest = ref
      ? `${APP_URL}/RoleSelection?ref=${encodeURIComponent(ref)}`
      : `${APP_URL}/RoleSelection`;
    setTarget(dest);

    if (ref) trackClick(ref);

    // Replace (not push) so Back doesn't bounce the visitor here again.
    window.location.replace(dest);
  }, []);

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#2A2150',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700 }}>{COPY.opening}</div>
      <div style={{ fontSize: 14, opacity: 0.7 }}>
        {COPY.notRedirected}{' '}
        <a href={target} style={{ color: '#6D5AE6', fontWeight: 600 }}>
          {COPY.link}
        </a>
      </div>
    </div>
  );
}
