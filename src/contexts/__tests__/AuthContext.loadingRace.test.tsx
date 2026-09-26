/**
 * AuthContext — the SIGNED_IN loading gate must always be released.
 *
 * On SIGNED_IN the provider sets loading=true so RootNavigator shows its
 * spinner until the profile arrives (no role-selection flash). Only the
 * profile fetch's `finally` sets it back to false. Before the fix, that fetch
 * was skipped when another fetch (e.g. refreshProfile) was already in flight —
 * so loading stayed true and the app sat on the spinner forever.
 *
 * Both windows are covered: the in-flight fetch starts before SIGNED_IN
 * (fetch never scheduled) and right after it (scheduled fetch bailed early).
 *
 * Only a sign-in to a NEW identity raises the gate: a SIGNED_IN for the user
 * already held (relayed from another tab, session recovery) must not, or the
 * NavigationContainer unmounts and a parent mid-onboarding is reset to Welcome.
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '../../integrations/supabase/client';

jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(),
  },
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: jest.fn(() => 'buff://auth/callback') }));
jest.mock('../../navigation/onboardingPersistence', () => ({ clearOnboardingSnapshot: jest.fn() }));
jest.mock('../../lib/acquisitionCapture', () => ({ resolveAcquisition: jest.fn() }));
jest.mock('../../lib/onboardingFunnel', () => ({ logOnboardingEvent: jest.fn() }));

const mockedAuth = supabase.auth as unknown as {
  getSession: jest.Mock;
  onAuthStateChange: jest.Mock;
  signInWithPassword: jest.Mock;
};
const mockedFrom = supabase.from as unknown as jest.Mock;

const PROFILE = {
  id: 'p1',
  user_id: 'u1',
  family_id: null,
  display_name: 'Parent',
  role: 'parent',
  pro_settings: { onboarding_complete: true },
};
const SESSION = { user: { id: 'u1' }, access_token: 'a', refresh_token: 'r' };
// A different account signing in on this device — the case the gate is for.
const OTHER_SESSION = { user: { id: 'u2' }, access_token: 'x', refresh_token: 'y' };

type Deferred = { promise: Promise<unknown>; resolve: (v: unknown) => void };
function deferred(): Deferred {
  let resolve!: (v: unknown) => void;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

/** Queue of pending profile fetches; each maybeSingle() call takes the next. */
let profileFetches: Deferred[] = [];
let authCallback: (event: string, session: unknown) => void;
let latest: ReturnType<typeof useAuth>;

function Probe() {
  latest = useAuth();
  return null;
}

async function mountSignedIn() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  // initializeAuth's own profile fetch
  await waitFor(() => expect(profileFetches.length).toBe(1));
  await act(async () => { profileFetches[0].resolve({ data: PROFILE, error: null }); });
  await waitFor(() => expect(latest.loading).toBe(false));
  profileFetches = [];
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  profileFetches = [];
  mockedAuth.getSession.mockResolvedValue({ data: { session: SESSION } });
  mockedAuth.onAuthStateChange.mockImplementation((cb) => {
    authCallback = cb;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
  mockedFrom.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => {
          const d = deferred();
          profileFetches.push(d);
          return d.promise;
        },
        single: async () => ({ data: null, error: null }),
      }),
    }),
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('releases the loading gate when SIGNED_IN arrives during an in-flight refreshProfile', async () => {
  await mountSignedIn();

  let refresh!: Promise<unknown>;
  act(() => { refresh = latest.refreshProfile('u1'); });
  await waitFor(() => expect(profileFetches.length).toBe(1));

  act(() => { authCallback('SIGNED_IN', OTHER_SESSION); });
  expect(latest.loading).toBe(true);

  await act(async () => {
    profileFetches.forEach((d) => d.resolve({ data: PROFILE, error: null }));
    await refresh;
  });
  // A SIGNED_IN fetch that started after the refresh must also be resolved.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    profileFetches.forEach((d) => d.resolve({ data: PROFILE, error: null }));
  });

  await waitFor(() => expect(latest.loading).toBe(false));
  expect(latest.profile?.id).toBe('p1');
});

it('releases the loading gate when a refreshProfile starts between SIGNED_IN and its scheduled fetch', async () => {
  await mountSignedIn();

  let refresh!: Promise<unknown>;
  act(() => {
    authCallback('SIGNED_IN', OTHER_SESSION);
    // Starts synchronously, before the setTimeout(0) scheduled by SIGNED_IN.
    refresh = latest.refreshProfile('u1');
  });
  expect(latest.loading).toBe(true);

  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    profileFetches.forEach((d) => d.resolve({ data: PROFILE, error: null }));
    await refresh;
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    profileFetches.forEach((d) => d.resolve({ data: PROFILE, error: null }));
  });

  await waitFor(() => expect(latest.loading).toBe(false));
});

it('still keeps the existing profile when a SIGNED_IN fetch fails, and releases the gate', async () => {
  await mountSignedIn();

  act(() => { authCallback('SIGNED_IN', OTHER_SESSION); });
  expect(latest.loading).toBe(true);

  // fetchProfile retries twice (300ms, 900ms) before reporting 'error'.
  await act(async () => {
    for (let i = 0; i < 3; i++) {
      await waitFor(() => expect(profileFetches.length).toBe(i + 1), { timeout: 3000 });
      profileFetches[i].resolve({ data: null, error: { message: 'network' } });
    }
  });
  await waitFor(() => expect(latest.loading).toBe(false), { timeout: 3000 });
  expect(latest.profile?.id).toBe('p1');
});

// Adi's web run 2026-09-26: a parent finishing onboarding on web was thrown back
// to Welcome. supabase-js relays SIGNED_IN from the app's other tabs over
// BroadcastChannel (same user, sometimes a new token); raising the gate for it
// unmounted the NavigationContainer mid-wizard.
it('a SIGNED_IN for the user already held does not raise the gate, and refreshes the profile quietly', async () => {
  await mountSignedIn();

  act(() => { authCallback('SIGNED_IN', SESSION); });
  expect(latest.loading).toBe(false);
  act(() => { authCallback('SIGNED_IN', { ...SESSION, access_token: 'relayed' }); });
  expect(latest.loading).toBe(false);

  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    profileFetches.forEach((d) => d.resolve({ data: { ...PROFILE, display_name: 'Renamed' }, error: null }));
  });
  expect(latest.loading).toBe(false);
  expect(latest.profile?.display_name).toBe('Renamed');
});

// web-smoke B5 (2026-09-25): signInSeq tells RootNavigator that the SAME account
// signed in again, so the spent /Login entry URL is dropped. It counts only this
// tab's own successful signIn(): SIGNED_IN events — re-emits on refocus, or
// relayed from another tab with a new token (2026-09-26) — must NOT count, as
// that would remount the navigator and reset whatever the user was doing.
it('counts this tab\'s successful signIn() but no SIGNED_IN event', async () => {
  await mountSignedIn();
  expect(latest.signInSeq).toBe(0);

  act(() => { authCallback('SIGNED_IN', SESSION); });
  act(() => { authCallback('TOKEN_REFRESHED', { ...SESSION, access_token: 'b' }); });
  act(() => { authCallback('SIGNED_IN', { ...SESSION, access_token: 'c' }); });
  expect(latest.signInSeq).toBe(0);

  mockedAuth.signInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
  await act(async () => { await latest.signIn('p@x.com', 'wrong'); });
  expect(latest.signInSeq).toBe(0);

  mockedAuth.signInWithPassword.mockResolvedValueOnce({ data: { session: SESSION }, error: null });
  await act(async () => { await latest.signIn('p@x.com', 'right'); });
  expect(latest.signInSeq).toBe(1);

  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    profileFetches.forEach((d) => d.resolve({ data: PROFILE, error: null }));
  });
  await waitFor(() => expect(latest.loading).toBe(false));
});
