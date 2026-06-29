/**
 * JoinRedirect — the device-aware landing for the smart join link.
 *
 * URL: https://buffadhd.com/join/:code
 *
 * This page only runs when the Android App Link did NOT intercept the URL,
 * i.e. one of:
 *   • Android WITHOUT the app installed  → redirect to Play Store, carrying the
 *     family code in the install `referrer` so the app can auto-fill it on first
 *     launch (Play Install Referrer; see pkg/smart-join-link Chunk 3).
 *   • iOS (app not yet released)          → redirect to the Web PWA join flow.
 *   • Desktop / anything else             → redirect to the Web PWA join flow.
 *
 * When the app IS installed on Android, the verified App Link opens the app
 * directly and this page never loads.
 *
 * A visible fallback (code + manual buttons) is rendered in case the automatic
 * redirect is slow or blocked.
 */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ANDROID_PACKAGE = 'com.buffapp.mobile';
const PLAY_STORE = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
// The app PWA lives on www; the bare apex (this page) is the landing.
const WEB_PWA_JOIN = 'https://www.buffadhd.com/join';

function sanitizeCode(raw: string | undefined): string {
  return (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

/** Where this device should go. Exported pure fn so it can be unit-tested. */
export function resolveJoinDestination(code: string, ua: string): string {
  if (/android/i.test(ua)) {
    // Carry the code through the install so the app auto-fills it (Chunk 3).
    return `${PLAY_STORE}&referrer=${encodeURIComponent(`join_${code}`)}`;
  }
  // iOS / desktop / other → Web PWA join (no native app to open).
  return `${WEB_PWA_JOIN}/${encodeURIComponent(code)}`;
}

export default function JoinRedirect() {
  const { code: rawCode } = useParams();
  const code = sanitizeCode(rawCode);

  useEffect(() => {
    if (!code) return;
    // `replace` so the redirect target doesn't trap Back on this interstitial.
    window.location.replace(resolveJoinDestination(code, navigator.userAgent));
  }, [code]);

  const androidNoApp = isAndroid();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 24,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        background: '#F4F0FA',
        color: '#1a1636',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 40 }}>🐺</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Joining BUFF…</h1>
      <p style={{ color: '#6B5B8A', maxWidth: 320, lineHeight: 1.5, margin: 0 }}>
        Taking you to the right place. If nothing happens, tap below.
      </p>

      {code ? (
        <>
          <a
            href={
              androidNoApp
                ? `${PLAY_STORE}&referrer=${encodeURIComponent(`join_${code}`)}`
                : `${WEB_PWA_JOIN}/${encodeURIComponent(code)}`
            }
            style={{
              background: '#7C3AED',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 14,
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: 16,
            }}
          >
            {androidNoApp ? 'Install BUFF' : 'Continue to BUFF'}
          </a>
          <p style={{ color: '#6B5B8A', fontSize: 14, margin: 0 }}>
            Family code:{' '}
            <strong style={{ letterSpacing: 3, color: '#1a1636' }}>{code}</strong>
          </p>
        </>
      ) : (
        <p style={{ color: '#EF4444' }}>That join link looks incomplete.</p>
      )}
    </div>
  );
}
