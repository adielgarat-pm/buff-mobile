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
