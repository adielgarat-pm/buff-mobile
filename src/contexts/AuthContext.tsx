import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { Linking } from 'react-native';
import { User, Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../integrations/supabase/client';

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
  pro_settings: Record<string, unknown>;
}

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
  signOut: () => Promise<void>;
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

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Network error fetching profile:', err);
      return null;
    }
  }, []);

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
        const p = await fetchProfile(userId);
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

          const p = await fetchProfile(existingSession.user.id);
          if (!isMounted) return;

          setProfile(p);

          if (p?.family_id) {
            const code = await fetchFamilyShortCode(p.family_id);
            if (isMounted) setFamilyShortCode(code);
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

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setFamilyShortCode(null);
        setLoading(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
        if (!fetchingProfile.current) {
          setTimeout(async () => {
            if (!isMounted || fetchingProfile.current) return;
            fetchingProfile.current = true;

            try {
              const p = await fetchProfile(newSession.user.id);
              if (!isMounted) return;

              setProfile(p);
              if (p?.family_id) {
                const code = await fetchFamilyShortCode(p.family_id);
                if (isMounted) setFamilyShortCode(code);
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

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'parent' | 'child',
    familyCode?: string,
    marketingConsent?: boolean
  ): Promise<{ error: Error | null }> => {
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
          return { error: new Error('קוד משפחה לא נמצא') };
        }
        familyId = family.id;
      } else {
        return { error: new Error('קוד משפחה חייב להכיל 6 תווים') };
      }
    }

    if (!familyId && role === 'parent') {
      const familyName = `${displayName}'s Family`;
      const { data: newFamily, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName, preferred_language: 'en' } as never)
        .select()
        .single();

      if (familyError) return { error: familyError };
      familyId = (newFamily as { id: string }).id;
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
        signOut,
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
