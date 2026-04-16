/**
 * RootNavigator — single NavigationContainer for the entire app.
 *
 * Screen groups shown conditionally based on auth + onboarding state:
 *   1. Auth group       — user not logged in
 *   2. Callback group   — logged-in user has no role yet (Google OAuth or partial profile)
 *   3. Onboarding group — logged in, parent has no children set up yet
 *   4. Parent app       — logged in, onboarded, Zen mode
 *   5. Child app        — logged in, onboarded, Gamer mode (child OR parent preview)
 */
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { useChildrenDashboard } from '../hooks/useChildrenDashboard';
import type { RootStackParamList } from './types';

// ── Auth ──────────────────────────────────────────────────────────────────────
import LoginScreen    from '../screens/auth/LoginScreen';
import SignupScreen   from '../screens/auth/SignupScreen';
import AuthCallbackScreen from '../screens/auth/AuthCallbackScreen';

// ── Unified onboarding flow ───────────────────────────────────────────────────
import WelcomeScreen       from '../screens/onboarding/WelcomeScreen';
import UStep1_ChildProfile from '../screens/onboarding/unified/UStep1_ChildProfile';
import UStep2_Goal         from '../screens/onboarding/unified/UStep2_Goal';
import UStep3_Challenges   from '../screens/onboarding/unified/UStep3_Challenges';
import UStep4_Motivator    from '../screens/onboarding/unified/UStep4_Motivator';
import ULoadingScreen      from '../screens/onboarding/unified/ULoadingScreen';
import UStep5_Preview      from '../screens/onboarding/unified/UStep5_Preview';
import UStep7_Phone        from '../screens/onboarding/unified/UStep7_Phone';
import UStep8_Complete     from '../screens/onboarding/unified/UStep8_Complete';

// ── Main app tab navigators ───────────────────────────────────────────────────
import ParentTabs    from './ParentTabs';
import ChildTabs     from './ChildTabs';
import PaywallScreen from '../screens/PaywallScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const { viewMode }               = useMode();

  // Only fetch children for parent accounts
  const isParent = profile?.role === 'parent';
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildrenDashboard();

  // When refreshProfile() is called (e.g. at the end of onboarding), `profile`
  // is set to a new object reference even if family_id hasn't changed.
  // useChildrenDashboard only re-fetches when familyId changes, so it misses
  // the child profile that was inserted in UStep5_Preview.
  // This effect bridges that gap: any profile update triggers a children refetch.
  const prevProfileRef = useRef(profile);
  useEffect(() => {
    if (profile === prevProfileRef.current) return;   // no change
    prevProfileRef.current = profile;
    if (profile?.family_id) {
      console.log('[RootNavigator] profile changed — re-fetching children');
      refetchChildren();
    }
  }, [profile, refetchChildren]);

  // Show loading splash while auth or children data resolves
  if (loading || (isParent && user && profile && childrenLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  // Parent is onboarded when they have a family AND have completed the onboarding flow.
  // We gate on onboarding_complete (set by UStep8_Complete) rather than hasChildren,
  // because the child profile is inserted during UStep5_Preview — using hasChildren
  // would cause an early transition before the user finishes the flow.
  const hasFamilyId        = !!profile?.family_id;
  const hasChildren        = children.length > 0;
  const onboardingComplete = !!(profile?.pro_settings?.onboarding_complete);
  const isOnboarded = profile?.role === 'child'
    ? hasFamilyId                                       // child: just needs a family_id
    : hasFamilyId && onboardingComplete && hasChildren; // parent: needs flag + at least one child

  console.log('[RootNavigator] hasChildren:', hasChildren, 'onboardingComplete:', onboardingComplete, 'isOnboarded:', isOnboarded);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {!user ? (
          // ─── 1. UNAUTHENTICATED ──────────────────────────────────────
          <>
            <Stack.Screen name="Login"  component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>

        ) : !profile || !profile.role ? (
          // ─── 2. NO ROLE YET — NEEDS ROLE SELECTION ──────────────────
          <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />

        ) : !isOnboarded ? (
          // ─── 3. UNIFIED ONBOARDING ──────────────────────────────────
          <>
            <Stack.Screen name="Welcome"         component={WelcomeScreen} />
            <Stack.Screen name="UStep1"          component={UStep1_ChildProfile} />
            <Stack.Screen name="UStep2_Goal"     component={UStep2_Goal} />
            <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges} />
            <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator} />
            <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen} />
            <Stack.Screen name="UStep5_Preview"    component={UStep5_Preview} />
            <Stack.Screen name="UStep7_Phone"      component={UStep7_Phone} />
            <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete} />
          </>

        ) : (
          // ─── 4 & 5. MAIN APP + PAYWALL OVERLAY ──────────────────────
          <>
            {viewMode === 'parent' ? (
              // ─── 4. PARENT APP (ZEN MODE) ─────────────────────────────
              <Stack.Screen name="ParentApp" component={ParentTabs} />
            ) : (
              // ─── 5. CHILD APP (GAMER MODE) ────────────────────────────
              <Stack.Screen name="ChildApp" component={ChildTabs} />
            )}
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            {/* Add-child flow — navigated to from "+ Add Child" on the dashboard */}
            <Stack.Screen name="UStep1"            component={UStep1_ChildProfile} options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="UStep2_Goal"       component={UStep2_Goal}         options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges}   options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator}    options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen}      options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="UStep5_Preview"    component={UStep5_Preview}      options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="UStep7_Phone"      component={UStep7_Phone}        options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete}     options={{ presentation: 'modal', headerShown: false }} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
