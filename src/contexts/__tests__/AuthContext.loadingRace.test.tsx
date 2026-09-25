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

  act(() => { authCallback('SIGNED_IN', SESSION); });
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
    authCallback('SIGNED_IN', SESSION);
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

it('still keeps the existing profile when the SIGNED_IN fetch fails, and releases the gate', async () => {
  await mountSignedIn();

  act(() => { authCallback('SIGNED_IN', SESSION); });
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

// web-smoke B5 (2026-09-25): signInSeq tells RootNavigator that the SAME account
// signed in again, so the spent /Login entry URL is dropped. supabase-js also
// re-emits SIGNED_IN for the session it already holds (tab refocus), which must
// NOT count — that would reset navigation on every refocus.
it('counts a fresh sign-in (new session) but not the re-emit for the held session', async () => {
  await mountSignedIn();
  expect(latest.signInSeq).toBe(0);

  // Tab refocus: same session re-emitted.
  act(() => { authCallback('SIGNED_IN', SESSION); });
  expect(latest.signInSeq).toBe(0);

  // Background refresh: new token, but not a sign-in.
  act(() => { authCallback('TOKEN_REFRESHED', { ...SESSION, access_token: 'b' }); });
  expect(latest.signInSeq).toBe(0);

  // Same account logs in again → new session.
  act(() => { authCallback('SIGNED_IN', { ...SESSION, access_token: 'c' }); });
  expect(latest.signInSeq).toBe(1);

  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    profileFetches.forEach((d) => d.resolve({ data: PROFILE, error: null }));
  });
  await waitFor(() => expect(latest.loading).toBe(false));
});
