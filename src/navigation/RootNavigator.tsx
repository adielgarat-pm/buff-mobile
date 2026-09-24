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
import { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer, type NavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { useChildrenDashboard } from '../hooks/useChildrenDashboard';
import type { RootStackParamList } from './types';
import { linking } from './linking';
import { isOnboardingRoute, snapshotBelongsTo, type OnboardingSnapshot } from './onboardingRoutes';
import { isParentOnboarded } from './parentRouting';
import { setCurrentRoute } from '../lib/currentRoute';
import { identityChanged, consumeAuthEntryUrl } from './authTransition';
import {
  ONBOARDING_PERSISTENCE_ENABLED,
  loadOnboardingSnapshot,
  saveOnboardingSnapshot,
  clearOnboardingSnapshot,
} from './onboardingPersistence';

// ── Auth ──────────────────────────────────────────────────────────────────────
import LandingScreen       from '../screens/auth/LandingScreen';
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
import UStep6_FirstTask    from '../screens/onboarding/unified/UStep6_FirstTask';
import ChildAccessStep     from '../screens/onboarding/unified/ChildAccessStep';
import UStep8_Complete     from '../screens/onboarding/unified/UStep8_Complete';

// ── Main app tab navigators ───────────────────────────────────────────────────
import ParentTabs            from './ParentTabs';
import ChildTabs             from './ChildTabs';
import PaywallScreen         from '../screens/PaywallScreen';
import FoundingHundredScreen from '../screens/FoundingHundredScreen';
import PhilosophyScreen      from '../screens/parent/PhilosophyScreen';
import NotificationSettingsScreen from '../screens/parent/NotificationSettingsScreen';
import GamerMeAndBuddyScreen from '../screens/child/GamerMeAndBuddyScreen';
import BuffCatchScreen from '../screens/child/BuffCatchScreen';
import NotificationFeedScreen from '../screens/parent/NotificationFeedScreen';
import ManageChildrenScreen  from '../screens/parent/ManageChildrenScreen';
import EditChildScreen       from '../screens/parent/EditChildScreen';
import EditFocusScreen       from '../screens/parent/EditFocusScreen';
import CaptureScreen         from '../screens/parent/CaptureScreen';
import ThisWeekScreen        from '../screens/parent/ThisWeekScreen';
import ParentInsightsScreen  from '../screens/parent/ParentInsightsScreen';
import ActivitiesScreen      from '../screens/parent/ActivitiesScreen';
import ChildAddActivityScreen from '../screens/child/ChildAddActivityScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Web: when the stack fills the whole browser window (phones), React Navigation
// switches each card to "page" mode (minHeight 100%, grows with its content and
// expects the document to scroll). Expo Web locks body scrolling, so screens with
// a pinned bottom CTA pushed it below the fold — mobile-web parents could not
// tap Continue on onboarding step 4. Bounding the card like native keeps every
// screen's own ScrollView in charge and the footer on screen.
const ROOT_SCREEN_OPTIONS = {
  headerShown: false,
  ...(Platform.OS === 'web' ? { cardStyle: { flex: 1, overflow: 'hidden' as const } } : null),
};


export default function RootNavigator() {
  const { user, profile, loading } = useAuth();
  const { viewMode }               = useMode();

  // Children data is only needed for parents (to determine onboarding state).
  const isParent = profile?.role === 'parent';
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildrenDashboard();

  // ── Web-only: reload-safe onboarding ──────────────────────────────────────
  // The onboarding flow threads its data through route params only, so a manual
  // browser reload would lose all progress (params live in in-memory nav state).
  // On web we restore a {route, params} snapshot from storage; native uses the
  // no-op split, and `navStateReady` starts true there so the gate below is
  // byte-for-byte identical to before. See onboardingPersistence.web.ts.
  const [navStateReady, setNavStateReady] = useState(!ONBOARDING_PERSISTENCE_ENABLED);
  const [restoredSnap,  setRestoredSnap]  = useState<OnboardingSnapshot | null>(null);

  useEffect(() => {
    if (!ONBOARDING_PERSISTENCE_ENABLED) return;
    loadOnboardingSnapshot().then((snap) => {
      setRestoredSnap(snap);
      setNavStateReady(true);
    });
  }, []);

  // Current auth user for the (stable) nav-state callback below, so each
  // snapshot is stamped with its owner — see snapshotBelongsTo.
  const userIdRef = useRef<string | undefined>(user?.id);
  userIdRef.current = user?.id;

  // Snapshot the focused route as the parent advances through onboarding; drop
  // the snapshot once they leave the flow for the real app. No-op on native.
  const onNavStateChange = useCallback((state: NavigationState | undefined) => {
    if (!state) return;
    const route = state.routes[state.index];
    // Publish the top-level focused route so the OTA restart toast (Layer 3) can
    // tell it is on the stable parent shell vs. over a modal/editor/paywall/child
    // surface. All platforms; independent of the web-only onboarding snapshot.
    setCurrentRoute(route?.name ?? null);
    if (!ONBOARDING_PERSISTENCE_ENABLED) return;
    if (route && isOnboardingRoute(route.name)) {
      saveOnboardingSnapshot({
        route:  route.name,
        params: (route.params ?? {}) as OnboardingSnapshot['params'],
        t:      Date.now(),
        uid:    userIdRef.current,
      });
    } else if (route && (route.name === 'ParentApp' || route.name === 'ChildApp')) {
      clearOnboardingSnapshot();
    }
  }, []);

  // Identity the NavigationContainer was last mounted for — see authTransition.ts.
  const mountedIdentityRef = useRef<string | null | undefined>(undefined);

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

  // Block render until auth resolves; also wait for children data on parent
  // accounts and (web only) the onboarding snapshot read. `navStateReady` is
  // always true on native, so this gate is unchanged there.
  if (loading || !navStateReady || (isParent && user && profile && childrenLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  const hasChildren        = children.length > 0;
  const onboardingComplete = !!(profile?.pro_settings?.onboarding_complete);
  const parentOnboarded    = isParentOnboarded({ onboardingComplete, hasChildren });

  console.log('[RootNavigator] role:', profile?.role, 'onboardingComplete:', onboardingComplete, 'hasChildren:', hasChildren);

  // Resume UX: instead of silently jumping the parent into the middle of the
  // wizard (the old initialState auto-restore), we always land them on Welcome
  // and hand it the snapshot so it can OFFER "Continue where you left off" vs
  // "Start fresh" (Shape A — an invitation, not a forced restore; Pillar 2).
  // Only meaningful in the not-yet-onboarded parent branch, which is the only
  // branch that renders Welcome. Both platforms (restoredSnap resolves on native
  // now too — see onboardingPersistence.ts).
  const resumeSnapshot =
    restoredSnap && !parentOnboarded && profile?.role === 'parent'
      && snapshotBelongsTo(restoredSnap, user?.id)
      ? restoredSnap
      : null;

  // Shared-computer child join (bug 2026-09-17): when a parent session already
  // exists in a browser, branches 4/5 below used to register ONLY the parent
  // surfaces, so a child on the same shared computer had no route to the family-
  // code entry — the smart join link (/join/:code) and the /RoleSelection deep
  // link the marketing site promises both fell through to the parent default
  // (Welcome / ParentApp), blocking the child entirely (churn case: family 37f4).
  // Registering the auth-entry screens in the parent-authed branches makes those
  // routes resolve regardless of session; picking a child in ChildJoin signs in
  // with the child's credentials, which replaces the parent session and routes to
  // ChildApp. Screen names are unique within each (mutually-exclusive) branch, so
  // there is no duplicate-registration; the first Screen in each branch stays the
  // initial route, so the normal parent flow is unchanged. Both platforms.
  // Signup belongs here too: RoleSelection's parent card and Login's "create
  // account" link both navigate to it, and without it those taps were silent
  // no-ops whenever any session existed on the device (bug 2026-09-24). A
  // successful signUp replaces the current session, same as ChildJoin.
  const sharedDeviceAuthScreens = (
    <>
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Login"         component={LoginScreen} />
      <Stack.Screen name="Signup"        component={SignupScreen} />
      <Stack.Screen name="ChildJoin"     component={ChildJoinScreen} />
    </>
  );

  // Sign-in / sign-up / child pick on a shared device / sign-out: the entry
  // URL (/Login, /join/CODE…) that brought the user here is spent. Without this
  // the remounted container re-resolved /Login — registered in the parent
  // branch for shared devices — and a signed-in parent sat on an empty Login
  // form (bug 2026-09-24). Keyed by identity so the container always remounts
  // on a switch, starting at the new branch's first screen. A cold start
  // (never mounted) still honours the URL.
  const authIdentity = user?.id ?? null;
  const switchedIdentity = identityChanged(mountedIdentityRef.current, authIdentity);
  if (switchedIdentity) consumeAuthEntryUrl();
  mountedIdentityRef.current = authIdentity;
  const containerLinking = switchedIdentity
    ? { ...linking, getInitialURL: async () => null }
    : linking;

  return (
    <NavigationContainer
      key={authIdentity ?? 'signed-out'}
      linking={containerLinking}
      onStateChange={onNavStateChange}
    >
      <Stack.Navigator screenOptions={ROOT_SCREEN_OPTIONS}>

        {!user ? (
          // ─── 1. UNAUTHENTICATED ──────────────────────────────────────
          <>
            <Stack.Screen name="Landing"       component={LandingScreen} />
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
          // NOTE: Paywall / FoundingHundred are deliberately NOT registered
          // here (Pillar 1 — children never see purchase screens). A deep
          // link like buff://founding-100 opened on a child device falls
          // back to ChildApp instead of a purchase screen. Both screens
          // also carry their own role guard as defense-in-depth.
          <>
            <Stack.Screen name="ChildApp" component={ChildTabs} />
            <Stack.Screen
              name="GamerMeAndBuddy"
              component={GamerMeAndBuddyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BuffCatch"
              component={BuffCatchScreen}
              options={{ headerShown: false }}
            />
            {/* "Grown-up sign-in" from Child Settings (shared device): the
                child UI has no logout by design, so this is the parent's way
                in. The child session is replaced only when the parent's
                sign-in succeeds. See src/lib/handBack.ts. */}
            <Stack.Screen name="Login"  component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
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
            <Stack.Screen
              name="BuffCatch"
              component={BuffCatchScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NotificationFeed"
              component={NotificationFeedScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="ManageChildren"
              component={ManageChildrenScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="EditChild"
              component={EditChildScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="EditFocus"
              component={EditFocusScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Activities"
              component={ActivitiesScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="ChildAddActivity"
              component={ChildAddActivityScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="ParentCapture"
              component={CaptureScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="ParentThisWeek"
              component={ThisWeekScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="ParentInsights"
              component={ParentInsightsScreen}
              options={{ headerShown: false }}
            />
            {/* Shared-computer child join — see note above sharedDeviceAuthScreens. */}
            {sharedDeviceAuthScreens}
            <Stack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
              <Stack.Screen name="UStep1"            component={UStep1_ChildProfile} />
              <Stack.Screen name="UStep2_Goal"       component={UStep2_Goal} />
              <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges} />
              <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator} />
              <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen} />
              <Stack.Screen name="UStep5_Preview"    component={UStep5_Preview} />
              <Stack.Screen name="UStep6_FirstTask"  component={UStep6_FirstTask} />
              <Stack.Screen name="ChildAccessStep"   component={ChildAccessStep} />
              <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete} />
            </Stack.Group>
          </>

        ) : (
          // ─── 5. PARENT — onboarding incomplete ───────────────────────
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              initialParams={{ resumeSnapshot }}
            />
            <Stack.Screen name="UStep1"            component={UStep1_ChildProfile} />
            <Stack.Screen name="UStep2_Goal"       component={UStep2_Goal} />
            <Stack.Screen name="UStep3_Challenges" component={UStep3_Challenges} />
            <Stack.Screen name="UStep4_Motivator"  component={UStep4_Motivator} />
            <Stack.Screen name="ULoadingScreen"    component={ULoadingScreen} />
            <Stack.Screen name="UStep5_Preview"    component={UStep5_Preview} />
            <Stack.Screen name="UStep6_FirstTask"  component={UStep6_FirstTask} />
            <Stack.Screen name="ChildAccessStep"   component={ChildAccessStep} />
            <Stack.Screen name="UStep8_Complete"   component={UStep8_Complete} />
            {/* Shared-computer child join — see note above sharedDeviceAuthScreens.
                Welcome is the screen the churned family lands on; the affordance
                added there navigates to ChildJoin, now registered here. */}
            {sharedDeviceAuthScreens}
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}
