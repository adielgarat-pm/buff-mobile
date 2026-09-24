/**
 * handBack — "Grown-up sign-in" on a child's session, and the way back.
 *
 * The child UI has no logout by design (2026-06-05). On a shared device a
 * parent therefore had no way in while a kid was signed in (smoke A3). The
 * child's Settings now offers "Grown-up sign-in" → Login; the child session is
 * replaced only when the parent's sign-in succeeds, so a curious tap costs the
 * kid nothing. Before leaving, we note which child was here; the parent's
 * Settings then offers "Hand back to {name}", which opens ChildJoin with that
 * child's family code and goes straight to the card picker (Pillar 3 — the kid
 * gets back in by themselves). UX review 2026-09-24, approved by Adi.
 *
 * Device storage (AsyncStorage → localStorage on web), TTL-bounded, cleared
 * when used. Holds a first name + family code only — the same data the family
 * code screen already shows to anyone who has the code.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'buff_hand_back_v1';
const TTL_MS = 12 * 60 * 60 * 1000;

export interface HandBackNote {
  childName: string;
  familyCode: string;
  t: number;
}

export function isFreshHandBack(note: unknown, now = Date.now()): note is HandBackNote {
  const n = note as Partial<HandBackNote> | null;
  return !!n
    && typeof n.childName === 'string' && n.childName.length > 0
    && typeof n.familyCode === 'string' && /^[A-Z0-9]{6}$/i.test(n.familyCode)
    && typeof n.t === 'number' && now - n.t <= TTL_MS && n.t <= now;
}

export async function saveHandBack(childName: string, familyCode: string): Promise<void> {
  const note: HandBackNote = { childName, familyCode: familyCode.toUpperCase(), t: Date.now() };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(note)); } catch { /* best-effort */ }
}

export async function loadHandBack(): Promise<HandBackNote | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const note = JSON.parse(raw);
    if (isFreshHandBack(note)) return note;
    await AsyncStorage.removeItem(KEY);
    return null;
  } catch {
    return null;
  }
}

export async function clearHandBack(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
}
