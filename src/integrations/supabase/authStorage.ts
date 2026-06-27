/**
 * Supabase auth-token storage — pinned key + one-time self-heal for the #290 domain switch.
 *
 * supabase-js DERIVES its storage key from the client URL host
 * (`sb-${hostname.split('.')[0]}-auth-token`). Moving the client off
 * gfrongfnyigxsexuofrg.supabase.co onto the api.buffadhd.com custom domain (#290) therefore
 * silently changed the key (AUTH_STORAGE_KEY → DOMAIN_SWITCH_KEY), so on update the client
 * could no longer find existing persisted sessions and logged EVERY user out — children on
 * their own devices included, who have no credentials to log back in.
 *
 * Fix = pin the key to its original value AND wrap the storage so it heals across the switch:
 *   • pre-#290 users   → session already under AUTH_STORAGE_KEY → returned directly
 *   • post-#290 users  → AUTH_STORAGE_KEY empty, session under DOMAIN_SWITCH_KEY → copied forward
 *   • brand-new users  → both empty → normal first login
 * So NO cohort is logged out, and the key is immune to any future URL/domain change.
 *
 * Platform parity: identical on native (AsyncStorage) and web (AsyncStorage → localStorage).
 * The wrapper only special-cases reads of AUTH_STORAGE_KEY; every other key passes straight
 * through, so PKCE code-verifier keys etc. are unaffected.
 */

/** Pinned auth-token storage key (the value supabase-js derived from the original supabase.co URL). */
export const AUTH_STORAGE_KEY = 'sb-gfrongfnyigxsexuofrg-auth-token';

/** Key the session briefly lived under while the client pointed at api.buffadhd.com (#290). */
export const DOMAIN_SWITCH_KEY = 'sb-api-auth-token';

/** Minimal async key/value contract — satisfied by AsyncStorage on native and on web. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Wrap a key/value store so a read of AUTH_STORAGE_KEY transparently falls back to (and copies
 * forward) any session stranded under DOMAIN_SWITCH_KEY by the #290 domain switch. Race-free:
 * supabase-js reads the session via this same getItem, so the heal happens inline on first read.
 */
export function createHealingStorage(backing: KeyValueStorage): KeyValueStorage {
  return {
    async getItem(key: string): Promise<string | null> {
      const value = await backing.getItem(key);
      if (value != null || key !== AUTH_STORAGE_KEY) return value;

      // Pinned key is empty — recover a session stranded under the api.buffadhd.com key.
      const stranded = await backing.getItem(DOMAIN_SWITCH_KEY);
      if (stranded != null) {
        await backing.setItem(AUTH_STORAGE_KEY, stranded); // one-time copy forward
      }
      return stranded;
    },
    setItem: (key, value) => backing.setItem(key, value),
    removeItem: (key) => backing.removeItem(key),
  };
}
