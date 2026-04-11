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
import UStep1_ChildProfile from '../screens/onboarding/unified/UStep1_ChildProfile';
import UStep2_Goal         from '../screens/onboarding/unified/UStep2_Goal';
import UStep3_Challenges   from '../screens/onboarding/unified/UStep3_Challenges';
import UStep4_Motivator    from '../screens/onboarding/unified/UStep4_Motivator';
import ULoadingScreen      from '../screens/onboarding/unified/ULoadingScreen';
import UStep5_Mission      from '../screens/onboarding/unified/UStep5_Mission';
import UStep6_Reward       from '../screens/onboarding/unified/UStep6_Reward';
import UStep7_Phone        from '../screens/onboarding/unified/UStep7_Phone';
import UStep8_Complete     from '../screens/onboarding/unified/UStep8_Complete';

// ── Main app tab navigators ───────────────────────────────────────────────────
import ParentTabs from './ParentTabs';
import ChildTabs  from './ChildTabs';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const { viewMode }               = useMode();

  // Only fetch children for parent accounts
  const isParent = profile?.role === 'parent';
  const { children, loading: childrenLoading } = useChildrenDashboard();

  // Show loading splash while auth or children data resolves
  if (loading || (isParent && user && profile && childrenLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  // Parent is onboarded when they have a family AND at least one child profile
  const hasFamilyId = !!profile?.family_id;
  const hasChildren = children.length > 0;
  const isOnboarded = profile?.role === 'child'
    ? hasFamilyId                   // child: just needs a family_id
    : hasFamilyId && hasChildren;   // parent: needs at least one child

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
            <Stack.Screen name="UStep1"          component={UStep1_ChildProfile} />
            <Stack.Screen name="UStep2_Goal"     component={UStep2_Goal} />
            <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges} />
            <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator} />
            <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen} />
            <Stack.Screen name="UStep5_Mission"    component={UStep5_Mission} />
            <Stack.Screen name="UStep6_Reward"     component={UStep6_Reward} />
            <Stack.Screen name="UStep7_Phone"      component={UStep7_Phone} />
            <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete} />
          </>

        ) : viewMode === 'parent' ? (
          // ─── 4. PARENT APP (ZEN MODE) ────────────────────────────────
          <Stack.Screen name="ParentApp" component={ParentTabs} />

        ) : (
          // ─── 5. CHILD APP (GAMER MODE) ───────────────────────────────
          <Stack.Screen name="ChildApp" component={ChildTabs} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
