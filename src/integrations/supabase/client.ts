import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Pin the auth-token storage key. supabase-js otherwise DERIVES it from the URL host
    // (`sb-${hostname.split('.')[0]}-auth-token`). When the client moved off the
    // gfrongfnyigxsexuofrg.supabase.co URL onto the api.buffadhd.com custom domain (#290),
    // that derived key silently changed (sb-gfrongfnyigxsexuofrg-auth-token → sb-api-auth-token),
    // so the app could no longer find existing persisted sessions and logged EVERY user out
    // on update (kids on their own devices included — they have no credentials to log back in).
    // Pinning to the ORIGINAL key both recovers those orphaned sessions (still in storage under
    // the old key) and makes the session immune to any future URL/domain change. Do not change.
    storageKey: 'sb-gfrongfnyigxsexuofrg-auth-token',
    // Web: the Google OAuth redirect returns tokens in the URL hash, so supabase
    // must parse them on load (→ fires SIGNED_IN → profile/familyId load → dashboard
    // populates without a manual reload). Native has no URL bar, so keep it off there.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Pause/resume token auto-refresh based on app foreground state.
// Native only — web has no real app foreground/background lifecycle, and Supabase
// manages refresh via page visibility itself.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
