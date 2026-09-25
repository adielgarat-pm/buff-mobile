/**
 * authTransition — what the navigator does when the signed-in identity changes
 * (sign-in, sign-up, a child picking their profile on a shared device, sign-out).
 *
 * Why this exists (bug 2026-09-24): the auth-entry screens (RoleSelection /
 * Login / Signup / ChildJoin) are registered in the signed-in parent branches
 * too (shared-device join, #475/#479). A sign-in remounts the
 * NavigationContainer (AuthContext's loading gate), and on remount React
 * Navigation rebuilds its state from the entry URL — on web that is
 * window.location, e.g. /Login. Because Login now exists in the parent branch,
 * the freshly signed-in parent landed back on an empty Login form instead of
 * ParentApp / Welcome. The entry URL describes how the user got IN; once the
 * identity changes it is spent, so the new session must start at its branch's
 * default screen.
 *
 * Both platforms: web consumes the address-bar path (useLinking reads
 * window.location directly); native ignores getInitialURL for the remount
 * (otherwise a launch link like buff://join/CODE is re-applied after sign-in).
 */
import { Platform } from 'react-native';

/** Paths that only make sense to enter the app — safe to drop after sign-in. */
const AUTH_ENTRY_PATH = /^\/(RoleSelection|Login|Signup|join\/[^/]+)\/?$/i;

export function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PATH.test(pathname);
}

/**
 * True when the container is about to mount for a DIFFERENT identity than the
 * one it last mounted for. `undefined` = never mounted (cold start), which must
 * honour the URL (a signed-in parent opening /join/CODE on a shared device).
 */
export function identityChanged(
  lastMounted: string | null | undefined,
  current: string | null,
): boolean {
  return lastMounted !== undefined && lastMounted !== current;
}

/**
 * True for a SIGNED_IN that carries a NEW session: an explicit sign-in or
 * sign-up, including the SAME account signing in again (a signed-in parent who
 * opened /Login and logged in — web-smoke B5, 2026-09-25). False for the
 * re-emit supabase-js sends with the session it already holds (init and every
 * tab refocus, `_recoverAndRefresh`), which must not reset navigation.
 */
export function isFreshSignIn(
  event: string,
  prevAccessToken: string | null,
  nextAccessToken: string | null | undefined,
): boolean {
  return event === 'SIGNED_IN' && !!nextAccessToken && nextAccessToken !== prevAccessToken;
}

/**
 * The identity the navigator mounts for: the user plus which fresh sign-in of
 * theirs this is, so signing in again as the same account counts as a switch
 * (entry URL spent, container remounted at the branch's first screen).
 */
export function navIdentity(userId: string | null | undefined, signInSeq: number): string | null {
  return userId ? `${userId}#${signInSeq}` : null;
}

/** Web: replace an auth-entry path in the address bar with the app root. */
export function consumeAuthEntryUrl(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const { pathname, hash } = window.location;
    if (isAuthEntryPath(pathname)) window.history.replaceState(null, '', '/' + hash);
  } catch {
    /* non-fatal — worst case the old behaviour */
  }
}
