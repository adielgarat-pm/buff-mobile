import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { Linking, Platform } from 'react-native';
import { User, Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../integrations/supabase/client';
import i18n from '../i18n';

// Required for expo-web-browser OAuth completion
WebBrowser.maybeCompleteAuthSession();

export interface Profile {
  id: string;
  user_id: string;
  family_id: string | null;
  display_name: string;
  role: 'parent' | 'child';
  is_pro: boolean;
  is_lifetime_access: boolean;
  is_lifetime_founding: boolean;
  founding_member_number: number | null;
  pro_settings: Record<string, unknown>;
}

// Discriminated result for a profile fetch. Distinguishing "no row exists"
// (empty) from "the query failed" (error) is critical: a transient network
// failure during a background TOKEN_REFRESHED must NOT be treated as "this
// user has no profile" — doing so nulls the profile and ejects a logged-in
// user back to role-selection / login mid-session.
type ProfileFetchResult =
  | { status: 'ok'; profile: Profile }
  | { status: 'empty' }
  | { status: 'error' };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  familyId: string | null;
  familyShortCode: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: 'parent' | 'child',
    familyCode?: string,
    marketingConsent?: boolean
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshProfile: (userId?: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyShortCode, setFamilyShortCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isInitialized = useRef(false);
  const fetchingProfile = useRef(false);

  const fetchProfile = useCallback(
    async (userId: string, retries = 2): Promise<ProfileFetchResult> => {
      for (let attempt = 0; ; attempt++) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) {
            console.error('Error fetching profile:', error);
            // fall through to retry / error result
          } else {
            return data
              ? { status: 'ok', profile: data as Profile }
              : { status: 'empty' };
          }
        } catch (err) {
          console.error('Network error fetching profile:', err);
        }

        if (attempt >= retries) {
          return { status: 'error' };
        }
        // Backoff before retrying a failed/errored fetch: 300ms, then 900ms.
        await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(3, attempt)));
      }
    },
    []
  );

  const fetchFamilyShortCode = useCallback(async (familyId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('short_code')
        .eq('id', familyId)
        .single();

      if (error) {
        console.error('Error fetching family short code:', error);
        return null;
      }
      return data?.short_code ?? null;
    } catch (err) {
      console.error('Network error fetching family code:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(
    async (userId?: string): Promise<Profile | null> => {
      if (!userId) {
        setProfile(null);
        setFamilyShortCode(null);
        return null;
      }

      // Do NOT guard on fetchingProfile.current here — explicit refresh calls
      // (e.g. end of onboarding) must always succeed and update state.
      fetchingProfile.current = true;

      try {
        const result = await fetchProfile(userId);

        if (result.status === 'error') {
          // Transient failure — keep whatever profile we already have rather
          // than nulling it and ejecting the user. Callers ignore the return.
          console.warn('[Auth] refreshProfile fetch failed; keeping existing profile');
          return null;
        }

        const p = result.status === 'ok' ? result.profile : null;
        setProfile(p);

        if (p?.family_id) {
          const code = await fetchFamilyShortCode(p.family_id);
          setFamilyShortCode(code);
        } else {
          setFamilyShortCode(null);
        }

        return p;
      } finally {
        fetchingProfile.current = false;
      }
    },
    [fetchFamilyShortCode, fetchProfile]
  );

  // ── Deep-link OAuth callback handler ──────────────────────────────────────
  //
  // Covers two cases that openAuthSessionAsync cannot handle:
  //   1. Cold start  — app was killed; OS opens it via buff://auth/callback#…
  //   2. Android     — Chrome Custom Tabs sometimes hands the redirect to the
  //                    OS instead of returning it to openAuthSessionAsync.
  //
  // When the in-app browser handles it normally (iOS / happy-path Android),
  // the tokens are already parsed inside signInWithGoogle and this handler
  // simply sees no matching URL — it's a no-op.
  const handleDeepLink = useCallback(async (url: string) => {
    // Only act on buff://auth/callback URLs
    if (!url.startsWith('buff://auth/callback')) return;

    // Tokens are in the URL fragment: buff://auth/callback#access_token=…&refresh_token=…
    const hash   = url.split('#')[1] ?? '';
    const params = new URLSearchParams(hash);
    const access_token  = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  }, []);

  useEffect(() => {
    // Warm-start listener — app is already running when the deep link arrives
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Cold-start — app was opened by the OS via the deep link
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [handleDeepLink]);

  // ── Auth initialization ────────────────────────────────────────────────────

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (existingSession?.user) {
          setSession(existingSession);
          setUser(existingSession.user);

          const result = await fetchProfile(existingSession.user.id);
          if (!isMounted) return;

          // On cold start there is no prior profile to preserve. 'error' (after
          // retries) falls through to AuthCallback, same as before — but the
          // retry inside fetchProfile absorbs most transient failures first.
          if (result.status === 'ok') {
            setProfile(result.profile);
            if (result.profile.family_id) {
              const code = await fetchFamilyShortCode(result.profile.family_id);
              if (isMounted) setFamilyShortCode(code);
            }
          } else if (result.status === 'empty') {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) { console.log('[Auth] setLoading(false)'); setLoading(false); }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      // Diagnostic: classify ejection cause from Logcat without PII. A real
      // email/password login screen can ONLY appear via a Supabase-emitted
      // SIGNED_OUT (nothing in app code calls signOut() automatically), which
      // points at a token-refresh failure rather than a missing profile.
      console.log('[Auth] onAuthStateChange:', event, 'hasSession:', !!newSession);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        console.warn('[Auth] SIGNED_OUT — session lost (token-refresh failure or explicit signOut); ejecting to login');
        setProfile(null);
        setFamilyShortCode(null);
        setLoading(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
        // On a fresh sign-in, setUser fires synchronously above but setProfile
        // is awaited inside the setTimeout below — leaving a render window with
        // user-set + profile-null. RootNavigator falls through to AuthCallback,
        // which flashes the role-selection UI until the profile arrives.
        // Setting loading=true here makes RootNavigator's loader gate kick in
        // for that window. TOKEN_REFRESHED is excluded so background refreshes
        // don't flash a spinner over the live UI.
        if (event === 'SIGNED_IN') {
          setLoading(true);
        }
        if (!fetchingProfile.current) {
          setTimeout(async () => {
            if (!isMounted || fetchingProfile.current) return;
            fetchingProfile.current = true;

            try {
              const result = await fetchProfile(newSession.user.id);
              if (!isMounted) return;

              if (result.status === 'ok') {
                setProfile(result.profile);
                if (result.profile.family_id) {
                  const code = await fetchFamilyShortCode(result.profile.family_id);
                  if (isMounted) setFamilyShortCode(code);
                }
              } else if (result.status === 'empty') {
                setProfile(null);
                setFamilyShortCode(null);
              } else {
                // status === 'error': transient failure on a background refresh
                // (the symptom Noa hit — token auto-refresh re-fetches the
                // profile, a blip returns null, and the user is ejected to
                // role-selection mid-session). Keep the existing profile.
                console.warn('[Auth] profile refresh failed; keeping existing profile');
              }
            } finally {
              fetchingProfile.current = false;
              if (isMounted) { console.log('[Auth] setLoading(false)'); setLoading(false); }
            }
          }, 0);
        }
      }
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchFamilyShortCode]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // Google OAuth via Expo AuthSession — opens in-app browser, returns tokens via deep link
  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      // Must include path so the URL matches handleDeepLink's buff://auth/callback check
      const redirectUri = makeRedirectUri({ scheme: 'buff', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) return { error: error ?? new Error('No OAuth URL returned') };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success') {
        const resultUrl = (result as { url: string }).url;

        // Check for error redirect (e.g. wrong client secret → server_error)
        const queryPart = resultUrl.split('?')[1]?.split('#')[0] ?? '';
        const queryParams = new URLSearchParams(queryPart);
        const oauthError = queryParams.get('error');
        const oauthErrorDesc = queryParams.get('error_description');
        if (oauthError) {
          console.log('[Google OAuth] error from provider:', oauthError, oauthErrorDesc);
          return { error: new Error(oauthErrorDesc ?? oauthError) };
        }

        const hash   = resultUrl.split('#')[1] ?? '';
        const params = new URLSearchParams(hash);
        const access_token  = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          return { error: sessionError };
        }
      }

      // Android: Chrome Custom Tab may return 'dismiss' — handled by handleDeepLink via Linking

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  // Native Sign in with Apple (iOS only) — Apple Guideline 4.8 requires an
  // Apple-equivalent option when third-party login (Google) is offered.
  const signInWithApple = async (): Promise<{ error: Error | null }> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { error: new Error('No identity token returned from Apple') };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      return { error };
    } catch (err) {
      // User dismissed the native Apple sheet — not an error.
      if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') {
        return { error: null };
      }
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'parent' | 'child',
    familyCode?: string,
    marketingConsent?: boolean
  ): Promise<{ error: Error | null }> => {
    // Preflight: for child + familyCode, check orphan-claim eligibility BEFORE
    // creating an auth user. Blocks on ambiguous or cross-script matches so we
    // don't leave a profile-less auth.users row behind. (See migration 007 and
    // docs/sessions/childjoin-claim-orphans/SPEC.md.)
    let preflightReason: string | null = null;

    if (familyCode && role === 'child') {
      const { data: preflight, error: preflightError } = await supabase.rpc(
        'preflight_claim_orphan',
        { p_family_code: familyCode, p_display_name: displayName }
      );

      if (preflightError) {
        // Network/RPC failure — fall through to legacy flow rather than blocking signup.
        console.warn('[signUp] preflight_claim_orphan failed:', preflightError);
      } else {
        preflightReason = (preflight as { reason?: string } | null)?.reason ?? null;

        if (preflightReason === 'family_not_found') {
          return { error: new Error(i18n.t('auth.codeNotFound')) };
        }
        if (
          preflightReason === 'ambiguous_match' ||
          preflightReason === 'cross_script_candidate_exists'
        ) {
          return { error: new Error(i18n.t('auth.orphanAmbiguous')) };
        }
        // match_found or no_orphan_match → proceed to auth.signUp
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { error: authError };
    if (!authData.user) return { error: new Error('Signup failed') };

    let familyId: string | null = null;

    if (familyCode && role === 'child') {
      const trimmedCode = familyCode.trim().toUpperCase();
      const shortCodeRegex = /^[A-Z0-9]{6}$/;

      if (shortCodeRegex.test(trimmedCode)) {
        console.log('[signUp] Looking up family with code:', JSON.stringify(familyCode));
        const { data: family, error: lookupError } = await supabase
          .from('families')
          .select('id')
          .ilike('short_code', trimmedCode)
          .single();

        console.log('[signUp] family lookup result:', JSON.stringify({ family, lookupError }));

        if (lookupError || !family) {
          return { error: new Error(i18n.t('auth.codeNotFound')) };
        }
        familyId = family.id;
      } else {
        return { error: new Error(i18n.t('auth.invalidCode')) };
      }
    }

    if (!familyId && role === 'parent') {
      const familyName = `${displayName}'s Family`;
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName, preferred_language: 'en', platform: Platform.OS } as never)
        .select()
        .single();

      if (familyError) return { error: familyError };
      familyId = (newFamily as { id: string }).id;
    }

    // If preflight found exactly one matching orphan, claim it instead of inserting.
    if (preflightReason === 'match_found' && familyCode && role === 'child') {
      const { data: claimData, error: claimError } = await supabase.rpc(
        'claim_orphan_profile',
        { p_family_code: familyCode, p_display_name: displayName }
      );

      const claimed = (claimData as { claimed?: boolean } | null)?.claimed === true;

      if (!claimError && claimed) {
        await refreshProfile(authData.user.id);
        return { error: null };
      }

      // Race lost or unexpected — fall through to INSERT so the child still gets a profile.
      console.warn('[signUp] claim_orphan_profile fell back to INSERT:', { claimError, claimData });
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authData.user.id,
      family_id: familyId,
      display_name: displayName,
      role,
      marketing_consent: marketingConsent ?? false,
      pro_settings: (role === 'child' && familyCode) ? { source: 'child_signup' } : {},
    } as never);

    if (profileError) return { error: profileError };

    if (familyId && role === 'parent') {
      await supabase.from('app_settings').insert({ family_id: familyId } as never);
    }

    await refreshProfile(authData.user.id);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setFamilyShortCode(null);
  };

  // Permanent in-app account deletion (Apple Guideline 5.1.1(v)). The RPC deletes
  // the caller's account + data server-side (sole parent => whole family; co-parent
  // => only this profile). On success the auth user no longer exists, so we clear
  // local session state directly (a server-side signOut may fail and is ignored).
  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    const { data, error } = await supabase.rpc('delete_my_account');
    if (error) return { error };
    const result = data as { success?: boolean; reason?: string } | null;
    if (!result?.success) {
      return { error: new Error(result?.reason ?? 'delete_failed') };
    }
    try { await supabase.auth.signOut(); } catch { /* auth user already gone */ }
    setUser(null);
    setSession(null);
    setProfile(null);
    setFamilyShortCode(null);
    return { error: null };
  };

  const familyId = profile?.family_id ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        familyId,
        familyShortCode,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
