/**
 * RootNavigator — single NavigationContainer for the entire app.
 *
 * Routing tree (evaluated top to bottom):
 *   1. No user            → Auth stack (RoleSelection / Login / Signup / ChildJoin)
 *   2. User, no role      → AuthCallback (Google OAuth partial profile)
 *   3. role === 'child'   → ChildTabs (always — children skip onboarding entirely)
 *   4. role === 'parent', onboarding_complete + hasChildren → ParentTabs (+ modals)
 *   5. role === 'parent', otherwise → Onboarding stack (Welcome → UStep…)
 */
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { useChildrenDashboard } from '../hooks/useChildrenDashboard';
import type { RootStackParamList } from './types';
import { linking } from './linking';

// ── Auth ──────────────────────────────────────────────────────────────────────
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import LoginScreen         from '../screens/auth/LoginScreen';
import SignupScreen        from '../screens/auth/SignupScreen';
import ChildJoinScreen     from '../screens/auth/ChildJoinScreen';
import AuthCallbackScreen  from '../screens/auth/AuthCallbackScreen';

// ── Parent onboarding flow ────────────────────────────────────────────────────
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
import ParentTabs            from './ParentTabs';
import ChildTabs             from './ChildTabs';
import PaywallScreen         from '../screens/PaywallScreen';
import FoundingHundredScreen from '../screens/FoundingHundredScreen';
import PhilosophyScreen      from '../screens/parent/PhilosophyScreen';
import GamerMeAndBuddyScreen from '../screens/child/GamerMeAndBuddyScreen';

const Stack = createStackNavigator<RootStackParamList>();


export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const { viewMode }               = useMode();

  // Children data is only needed for parents (to determine onboarding state).
  const isParent = profile?.role === 'parent';
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildrenDashboard();

  // Re-fetch children whenever the profile object changes (e.g. after refreshProfile()
  // is called at the end of onboarding — family_id may not have changed but a new
  // child profile was inserted during UStep5_Preview).
  const prevProfileRef = useRef(profile);
  useEffect(() => {
    if (profile === prevProfileRef.current) return;
    prevProfileRef.current = profile;
    if (profile?.family_id) {
      console.log('[RootNavigator] profile changed — re-fetching children');
      refetchChildren();
    }
  }, [profile, refetchChildren]);

  // Block render until auth resolves; also wait for children data on parent accounts.
  if (loading || (isParent && user && profile && childrenLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  const hasChildren        = children.length > 0;
  const onboardingComplete = !!(profile?.pro_settings?.onboarding_complete);
  const parentOnboarded    = onboardingComplete && hasChildren;

  console.log('[RootNavigator] role:', profile?.role, 'onboardingComplete:', onboardingComplete, 'hasChildren:', hasChildren);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {!user ? (
          // ─── 1. UNAUTHENTICATED ──────────────────────────────────────
          <>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login"         component={LoginScreen} />
            <Stack.Screen name="Signup"        component={SignupScreen} />
            <Stack.Screen name="ChildJoin"     component={ChildJoinScreen} />
          </>

        ) : !profile || !profile.role ? (
          // ─── 2. NO ROLE YET (Google OAuth / partial profile) ────────
          <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />

        ) : profile.role === 'child' ? (
          // ─── 3. CHILD — always goes straight to the child app ────────
          <>
            <Stack.Screen name="ChildApp" component={ChildTabs} />
            <Stack.Screen
              name="GamerMeAndBuddy"
              component={GamerMeAndBuddyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="FoundingHundred"
              component={FoundingHundredScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
          </>

        ) : parentOnboarded ? (
          // ─── 4. ONBOARDED PARENT ─────────────────────────────────────
          <>
            {viewMode === 'parent' ? (
              <Stack.Screen name="ParentApp" component={ParentTabs} />
            ) : (
              // Parent previewing child view
              <Stack.Screen name="ChildApp" component={ChildTabs} />
            )}
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="FoundingHundred"
              component={FoundingHundredScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="Philosophy"
              component={PhilosophyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GamerMeAndBuddy"
              component={GamerMeAndBuddyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
              <Stack.Screen name="UStep1"            component={UStep1_ChildProfile} />
              <Stack.Screen name="UStep2_Goal"       component={UStep2_Goal} />
              <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges} />
              <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator} />
              <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen} />
              <Stack.Screen name="UStep5_Preview"    component={UStep5_Preview} />
              <Stack.Screen name="UStep7_Phone"      component={UStep7_Phone} />
              <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete} />
            </Stack.Group>
          </>

        ) : (
          // ─── 5. PARENT — onboarding incomplete ───────────────────────
          <>
            <Stack.Screen name="Welcome"           component={WelcomeScreen} />
            <Stack.Screen name="UStep1"            component={UStep1_ChildProfile} />
            <Stack.Screen name="UStep2_Goal"       component={UStep2_Goal} />
            <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges} />
            <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator} />
            <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen} />
            <Stack.Screen name="UStep5_Preview"    component={UStep5_Preview} />
            <Stack.Screen name="UStep7_Phone"      component={UStep7_Phone} />
            <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
