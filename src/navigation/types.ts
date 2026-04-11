// Central param list for the root stack navigator.
// Every screen in the app is registered here so navigation.navigate() is fully typed.

import type { AgeGroup, Gender } from '../screens/onboarding/unified/onboardingData';

// ── Shared accumulated onboarding data ───────────────────────────────────────
// Each step extends the previous by adding its own field(s).

type UBase = {
  childName:  string;
  ageGroup:   AgeGroup;
  gender?:    Gender;
  birthDate?: string;
};

type UWithGoal          = UBase & { mainGoal: string };
type UWithChallenges    = UWithGoal & { mainChallenge: string; additionalChallenges: string[] };
type UWithMotivator     = UWithChallenges & { motivator: string };
type UWithMission       = UWithMotivator & { firstMission: string };
type UWithReward        = UWithMission & { firstReward: string };
type UWithPhone         = UWithReward & { hasPhone: boolean };

// ─────────────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  // ── Auth ──────────────────────────────────────────────────────────────
  Login:        undefined;
  Signup:       undefined;
  AuthCallback: undefined; // Role selection after Google OAuth

  // ── Unified onboarding flow ───────────────────────────────────────────
  UStep1:         undefined;           // Entry — no incoming params
  UStep2_Goal:    UBase;
  UStep3_Challenges: UWithGoal;
  UStep4_Motivator:  UWithChallenges;
  ULoadingScreen:    UWithMotivator;
  UStep5_Mission:    UWithMotivator;
  UStep6_Reward:     UWithMission;
  UStep7_Phone:      UWithReward;
  UStep8_Complete:   UWithPhone;

  // ── Main app (nested navigators) ─────────────────────────────────────
  ParentApp: undefined;
  ChildApp:  undefined;
};

export type ParentTabsParamList = {
  ParentDashboard: undefined;
  ParentTasks:     undefined;
  ParentRewards:   undefined;
  ParentSettings:  undefined;
};

export type ChildTabsParamList = {
  ChildDashboard: undefined;
  ChildTasks:     undefined;
  ChildRewards:   undefined;
  ChildSettings:  undefined;
};
