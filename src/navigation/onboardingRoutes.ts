/**
 * onboardingRoutes — shared (NOT platform-split) constants describing which
 * root-stack routes belong to the parent onboarding flow.
 *
 * Kept separate from onboardingPersistence so the route list lives in ONE place
 * and can't drift between the native (no-op) and web persistence splits.
 */
import type { RootStackParamList } from './types';

/** The onboarding screens, in flow order. Source of truth for "is this an
 *  onboarding route?" used by both the persistence layer and RootNavigator. */
export const ONBOARDING_ROUTES = [
  'UStep1',
  'UStep2_Goal',
  'UStep3_Challenges',
  'UStep4_Motivator',
  'ULoadingScreen',
  'UStep5_Preview',
  'ChildAccessStep',
  'UStep8_Complete',
] as const;

export type OnboardingRouteName = (typeof ONBOARDING_ROUTES)[number];

const ROUTE_SET = new Set<string>(ONBOARDING_ROUTES);

/** Type-guard: true when `name` is one of the onboarding routes. */
export function isOnboardingRoute(
  name: string | undefined,
): name is OnboardingRouteName {
  return !!name && ROUTE_SET.has(name);
}

/** What we persist on web so a browser reload can resume the in-progress flow.
 *  `params` carries the accumulated onboarding data (the only source of truth —
 *  there is no parallel store), `t` is the write time for TTL expiry. */
export type OnboardingSnapshot = {
  route: OnboardingRouteName;
  params: RootStackParamList[OnboardingRouteName];
  t: number;
  /** auth user id of the parent who wrote it. The snapshot lives in device
   *  storage, not per account, so without this a second parent on the same
   *  browser was offered the first parent's flow — child name included. */
  uid?: string;
};

/**
 * A snapshot may only be offered back to the parent who wrote it (bug
 * 2026-09-24: parent B signing up on a shared browser saw "Pick up where you
 * left off with <parent A's child>"). Snapshots without a uid predate the
 * scoping and are treated as foreign — at worst a parent mid-flow at deploy
 * time restarts from Welcome (snapshots expire after 6h anyway).
 */
export function snapshotBelongsTo(
  snap: OnboardingSnapshot | null | undefined,
  userId: string | null | undefined,
): boolean {
  return !!snap && !!userId && snap.uid === userId;
}
