/**
 * restartApp (native) — the RootErrorBoundary's "Try again" action.
 *
 * Contract (shared with restartApp.web.ts): restart the app from a clean JS
 * state. `remount` is the boundary's resetError — the last-resort fallback that
 * re-renders the tree in place when a full restart is not available.
 *
 * Order:
 *  1. reloadOnce() — expo-updates reloadAsync, a full JS restart (release builds).
 *  2. Dev builds (updates disabled): DevSettings.reload(), the Metro reload.
 *  3. Otherwise remount the tree.
 *
 * Never throws: it runs from inside an error fallback, so a second crash here
 * would leave the user with nothing to tap.
 */
import { DevSettings } from 'react-native';
import { reloadOnce } from './reloadOnce';

export async function restartApp(remount: () => void): Promise<void> {
  try {
    if (await reloadOnce('error_boundary')) return;
    if (__DEV__) {
      DevSettings.reload('error_boundary');
      return;
    }
  } catch {
    // fall through to remount
  }
  remount();
}
