import {
  AUTH_STORAGE_KEY,
  DOMAIN_SWITCH_KEY,
  createHealingStorage,
  type KeyValueStorage,
} from '../authStorage';

// Minimal in-memory store standing in for AsyncStorage (native) / localStorage-backed
// AsyncStorage (web) — the wrapper is platform-agnostic, so one fake covers both.
function makeMemoryStore(seed: Record<string, string> = {}): KeyValueStorage & { dump(): Record<string, string> } {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (k) => Promise.resolve(map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); return Promise.resolve(); },
    removeItem: (k) => { map.delete(k); return Promise.resolve(); },
    dump: () => Object.fromEntries(map),
  };
}

const SESSION = JSON.stringify({ access_token: 'a', refresh_token: 'r' });

describe('createHealingStorage — #290 domain-switch recovery', () => {
  it('pre-#290 user: session already under the pinned key is returned as-is', async () => {
    const backing = makeMemoryStore({ [AUTH_STORAGE_KEY]: SESSION });
    const storage = createHealingStorage(backing);
    await expect(storage.getItem(AUTH_STORAGE_KEY)).resolves.toBe(SESSION);
  });

  it('post-#290 user: session stranded under the api key is recovered AND copied forward', async () => {
    const backing = makeMemoryStore({ [DOMAIN_SWITCH_KEY]: SESSION });
    const storage = createHealingStorage(backing);

    // Pinned key was empty, but the read heals it from the stranded api-domain key.
    await expect(storage.getItem(AUTH_STORAGE_KEY)).resolves.toBe(SESSION);
    // ...and it was copied forward so future reads need no fallback.
    expect(backing.dump()[AUTH_STORAGE_KEY]).toBe(SESSION);
  });

  it('brand-new user: both keys empty → null (normal first login, nothing broken)', async () => {
    const backing = makeMemoryStore();
    const storage = createHealingStorage(backing);
    await expect(storage.getItem(AUTH_STORAGE_KEY)).resolves.toBeNull();
  });

  it('both keys present: keeps the pinned-key session (does not clobber from the api key)', async () => {
    const PINNED = JSON.stringify({ access_token: 'pinned' });
    const backing = makeMemoryStore({ [AUTH_STORAGE_KEY]: PINNED, [DOMAIN_SWITCH_KEY]: SESSION });
    const storage = createHealingStorage(backing);
    await expect(storage.getItem(AUTH_STORAGE_KEY)).resolves.toBe(PINNED);
  });

  it('other keys (e.g. PKCE code-verifier) pass through untouched, no fallback', async () => {
    const verifierKey = `${AUTH_STORAGE_KEY}-code-verifier`;
    const backing = makeMemoryStore({ [DOMAIN_SWITCH_KEY]: SESSION });
    const storage = createHealingStorage(backing);
    // A miss on a non-pinned key must NOT borrow the stranded session.
    await expect(storage.getItem(verifierKey)).resolves.toBeNull();
  });

  it('writes and deletes target the key supabase asks for (no rewrite)', async () => {
    const backing = makeMemoryStore();
    const storage = createHealingStorage(backing);
    await storage.setItem(AUTH_STORAGE_KEY, SESSION);
    expect(backing.dump()[AUTH_STORAGE_KEY]).toBe(SESSION);
    await storage.removeItem(AUTH_STORAGE_KEY);
    expect(backing.dump()[AUTH_STORAGE_KEY]).toBeUndefined();
  });
});
