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

type UWithGoal        = UBase           & { mainChallenge: string };
type UWithChallenges  = UWithGoal       & { additionalChallenges: string[] };
type UWithMotivator   = UWithChallenges & { motivators: string[] };
type UWithPreview     = UWithMotivator  & { childProfileId: string };  // set after Preview saves
type UWithPhone       = UWithPreview    & { hasPhone: boolean };

// ─────────────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  // ── Auth ──────────────────────────────────────────────────────────────
  RoleSelection: undefined;
  Login:         undefined;
  Signup:        { initialRole?: 'parent' | 'child' } | undefined;
  ChildJoin:     undefined;
  AuthCallback:  undefined;

  // ── Unified onboarding flow ───────────────────────────────────────────
  Welcome:             undefined;        // First screen — shown before UStep1
  UStep1:              undefined;        // Entry — no incoming params
  UStep2_Goal:         UBase;
  UStep3_Challenges:   UWithGoal;
  UStep4_Motivator:    UWithChallenges;
  ULoadingScreen:      UWithMotivator;
  UStep5_Preview:      UWithMotivator;   // saves child profile + tasks + rewards; produces childProfileId
  UStep7_Phone:        UWithPreview;     // receives childProfileId from Preview
  UStep8_Complete:     UWithPhone;       // only updates parent profile + refreshes auth

  // ── Main app (nested navigators) ─────────────────────────────────────
  ParentApp: undefined;
  ChildApp:  undefined;

  // ── Premium paywall (accessible from both parent and child app) ──────
  Paywall: { childName?: string } | undefined;

  // ── Founding 100 (lifetime tier offer screen) ────────────────────────
  FoundingHundred: undefined;

  // ── Philosophy / About ───────────────────────────────────────────────
  Philosophy: undefined;
};

export type ParentTabsParamList = {
  ParentDashboard: undefined;
  ParentTasks:     undefined;
  ParentRewards:   undefined;
  ParentTimetable: undefined;
  ParentSettings:  undefined;
};

export type ChildTabsParamList = {
  ChildDashboard: undefined;
  ChildTasks:     undefined;
  ChildRewards:   undefined;
  ChildMyStats:   undefined;
  ChildSettings:  undefined;
};
