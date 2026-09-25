/**
 * Regression (Android runs 2026-09-24/25): Google OAuth silently reused the
 * only signed-in browser session — on a shared device a parent could not pick
 * another Google account. signInWithGoogle must always ask Google for the
 * account chooser (prompt=select_account), on web and native.
 */
import React from 'react';
import { Platform } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { AuthProvider, useAuth, GOOGLE_ACCOUNT_CHOOSER } from '../AuthContext';

const mockSignInWithOAuth = jest.fn();
jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithOAuth: (...a: unknown[]) => mockSignInWithOAuth(...a),
      setSession: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
}));
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: jest.fn(() => 'buff://auth/callback') }));
jest.mock('../../navigation/onboardingPersistence', () => ({ clearOnboardingSnapshot: jest.fn() }));
jest.mock('../../lib/acquisitionCapture', () => ({ resolveAcquisition: jest.fn() }));
jest.mock('../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));

let ctx: ReturnType<typeof useAuth>;
function Probe() { ctx = useAuth(); return null; }

describe('signInWithGoogle always shows the Google account chooser', () => {
  const realOS = Platform.OS;
  afterEach(() => { (Platform as { OS: string }).OS = realOS; mockSignInWithOAuth.mockReset(); });

  it('asks for prompt=select_account', () => {
    expect(GOOGLE_ACCOUNT_CHOOSER).toEqual({ prompt: 'select_account' });
  });

  it.each(['android', 'web'])('%s', async (os) => {
    (Platform as { OS: string }).OS = os;
    // web builds redirectTo from window.location.origin (jest has no location)
    if (os === 'web') (globalThis as { window: { location?: unknown } }).window.location = { origin: 'http://localhost', hash: '', pathname: '/', search: '' };
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.google.com/x' }, error: null });
    render(<AuthProvider><Probe /></AuthProvider>);
    await act(async () => { await ctx.signInWithGoogle(); });
    expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
    const arg = mockSignInWithOAuth.mock.calls[0][0];
    expect(arg.provider).toBe('google');
    expect(arg.options.queryParams).toEqual({ prompt: 'select_account' });
  });
});
