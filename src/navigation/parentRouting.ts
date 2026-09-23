/**
 * parentRouting — the single predicate that decides whether a signed-in parent
 * lands in their real app (ParentApp, RootNavigator branch 4) or the onboarding
 * stack (Welcome → UStep…, branch 5).
 *
 * A parent reaches ParentApp only when BOTH hold:
 *   - `pro_settings.onboarding_complete === true` (set at UStep8_Complete), AND
 *   - they have at least one child row (`hasChildren`).
 *
 * Both are required on purpose. A brand-new parent creates their first child
 * mid-wizard (UStep5_Preview) BEFORE `onboarding_complete` is set, so a
 * `hasChildren`-only gate would eject them out of the wizard and into ParentApp
 * prematurely. Keeping the `onboarding_complete` gate protects that window — do
 * not "simplify" this to `hasChildren` alone.
 *
 * KNOWN GAP (report 2026-09-23): a legacy/Lovable-era parent whose profile
 * predates the `onboarding_complete` flag but who already has children returns
 * `false` here and is therefore routed to Welcome (onboarding). There is no
 * runtime signal that distinguishes such an account from a parent who is
 * legitimately mid-wizard, so this case is NOT rescued by a routing change — it
 * needs a data backfill (set onboarding_complete on legacy rows that have
 * children) or a signed-in "go to my app" escape hatch. Flagged to Adi; left
 * unchanged here deliberately so onboarding is not broken.
 */
export interface ParentRoutingInput {
  /** `!!profile.pro_settings.onboarding_complete` */
  onboardingComplete: boolean;
  /** the parent has ≥ 1 child row (useChildrenDashboard length > 0) */
  hasChildren: boolean;
}

export function isParentOnboarded({ onboardingComplete, hasChildren }: ParentRoutingInput): boolean {
  return onboardingComplete && hasChildren;
}
