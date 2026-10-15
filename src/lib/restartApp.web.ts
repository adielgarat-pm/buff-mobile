/**
 * restartApp (web) — the RootErrorBoundary's "Try again" action.
 *
 * A full page reload is the web equivalent of a native JS restart: it drops
 * every module-level singleton (e.g. stale Supabase realtime channels) that a
 * plain remount would carry over. `remount` is only used if reload throws.
 * Never throws.
 */
export async function restartApp(remount: () => void): Promise<void> {
  try {
    window.location.reload();
    return;
  } catch {
    // fall through to remount
  }
  remount();
}
