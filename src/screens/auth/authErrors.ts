/**
 * authErrors — classify Supabase auth errors so the UI can tell the user
 * the truth: "your password is wrong" vs "your connection is flaky".
 *
 * Why: LoginScreen used to map EVERY signIn failure to
 * `auth.invalidCredentials`. A parent on flaky wifi would then "fix" a
 * password that was never wrong. (BUFF parents are exhausted and often
 * ADHD themselves — misdirected error messages are expensive.)
 *
 * What supabase-js exposes (see @supabase/auth-js errors.ts):
 *   - Genuine bad credentials  → AuthApiError    { name: 'AuthApiError',
 *       status: 400, message: 'Invalid login credentials' }
 *   - Network / fetch failure  → AuthRetryableFetchError { name:
 *       'AuthRetryableFetchError', status: 0 } (also used for 5xx / 429
 *       responses, which are server problems, not the user's password)
 *   - fetch throwing outright (web) → TypeError 'Failed to fetch'
 */

type AuthErrorLike = {
  name?: string;
  status?: number;
  message?: string;
} | null;

/**
 * True when the sign-in failure is a connectivity/server problem the user
 * should retry — NOT a wrong email/password.
 */
export function isNetworkAuthError(error: AuthErrorLike): boolean {
  if (!error) return false;

  // supabase-js wraps network failures and retryable (5xx/429) responses
  // in AuthRetryableFetchError.
  if (error.name === 'AuthRetryableFetchError') return true;

  // status 0 = request never reached the server; >= 500 = server fault.
  if (typeof error.status === 'number' && (error.status === 0 || error.status >= 500)) {
    return true;
  }

  // Raw fetch/network TypeErrors that escape supabase's wrapper
  // ('Failed to fetch' on web, 'Network request failed' on native).
  const msg = error.message?.toLowerCase() ?? '';
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('timeout') ||
    msg.includes('timed out')
  );
}
