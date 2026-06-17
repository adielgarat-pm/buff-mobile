/**
 * sfx — sound effects for kid-facing moments (task complete, etc.).
 *
 * TEMPORARILY SOUNDLESS (hotfix 1.6.2). The expo-audio native module was
 * crashing some Android devices on launch: its JS module is imported at app
 * startup (App.tsx → loadSfxPref → this file) which runs BEFORE Sentry.init,
 * so the fatal closed the app before any screen rendered and produced no crash
 * report. We removed the expo-audio dependency entirely for this build.
 *
 * The mute-preference API (loadSfxPref / isSfxEnabled / setSfxEnabled) is kept
 * intact so the child Settings "Sounds" toggle keeps working and persisting;
 * playSfx is a no-op until sound is re-added on a device-tested build.
 * See docs/INTEGRATION_LEARNINGS.md (IN-2026-06-17).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SfxKey = 'success' | 'ding' | 'tap';

const STORAGE_KEY = 'buff-sfx-enabled';
let enabled = true;

/** Load the persisted on/off preference. Call once at app start. */
export async function loadSfxPref(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === 'false') enabled = false;
  } catch {
    /* default: enabled */
  }
}

export function isSfxEnabled(): boolean {
  return enabled;
}

export async function setSfxEnabled(on: boolean): Promise<void> {
  enabled = on;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, on ? 'true' : 'false');
  } catch {
    /* in-memory toggle still applies */
  }
}

/** No-op until sound is re-added on a device-tested build (see file header). */
export function playSfx(_key: SfxKey): void {
  /* sound disabled — expo-audio removed in hotfix 1.6.2 */
}
