/**
 * sfx — short sound effects for kid-facing moments (task complete, credit, tap).
 *
 * Cross-platform via expo-audio (web + native). Sounds are generated WAVs
 * (assets/sfx, see scripts/gen-sfx.js) — gentle, low-dopamine, non-gambling per
 * BUFF's pillars. Mute-aware: the child can turn sound off in their Menu; the
 * preference is persisted and loaded once at app start (loadSfxPref).
 *
 * Every call is best-effort and wrapped in try/catch — audio must NEVER break a
 * task completion or crash a screen (esp. on web, where autoplay policy can
 * reject playback that isn't tied to a user gesture).
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOURCES = {
  success: require('../../assets/sfx/success.wav'),
  ding:    require('../../assets/sfx/ding.wav'),
  tap:     require('../../assets/sfx/tap.wav'),
} as const;

export type SfxKey = keyof typeof SOURCES;

const STORAGE_KEY = 'buff-sfx-enabled';
let enabled = true;
const players: Partial<Record<SfxKey, AudioPlayer>> = {};

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

function getPlayer(key: SfxKey): AudioPlayer | null {
  try {
    if (!players[key]) players[key] = createAudioPlayer(SOURCES[key]);
    return players[key] ?? null;
  } catch {
    return null;
  }
}

/** Fire-and-forget. Silent if muted or if playback fails. */
export function playSfx(key: SfxKey): void {
  if (!enabled) return;
  try {
    const p = getPlayer(key);
    if (!p) return;
    p.seekTo(0);
    p.play();
  } catch {
    /* never let a sound break the interaction */
  }
}
