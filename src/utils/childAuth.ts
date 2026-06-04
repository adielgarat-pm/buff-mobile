// Child auth credential derivation for the pick-from-list entry flow.
//
// child-login-stable-identity: a child's auth credentials are derived from the
// IMMUTABLE profiles.id (resolved by picking from the family list), never from a
// typed display name. This kills the duplicate-account bug where re-typing a
// name slightly differently (Hebrew "ליה" vs Latin "Liah") minted a fresh email
// → a brand-new auth user instead of signing into the existing one.

export interface ChildCreds {
  email: string;
  password: string;
}

// Stable, post-fix credentials keyed on the immutable profile id. The local-part
// is pure ASCII (`child_<32 hex>`) so Supabase never rejects it the way it
// rejected non-ASCII derived emails (see migration-era childjoin-hebrew-email).
export function stableChildCreds(profileId: string): ChildCreds {
  const compact = profileId.replace(/-/g, '');
  return {
    email: `child_${compact}@buff.app`,
    password: `${profileId}_buff_stable_2026`,
  };
}

// Legacy credentials — reproduced EXACTLY from the pre-fix ChildJoin derivation.
// Used only as a back-compat fallback (Option A) to sign an ALREADY-LINKED child
// into their existing account, reconstructed from the DB-stored display_name +
// family code (server-known, deterministic — never from live typed input). No
// re-keying; no auth.users rows are abandoned.
//
// NOTE: children originally created via SignupScreen (child role) chose their own
// username/password, so this formula cannot reconstruct those. That rare case
// falls through to the "ask your parent" path and is recoverable via the existing
// parent unlinked-children banner.
export function legacyChildCreds(displayName: string, familyCode: string): ChildCreds {
  const rawUsername   = displayName.trim().toLowerCase().replace(/\s+/g, '_');
  const asciiUsername = rawUsername.replace(/[^a-z0-9_]/g, '');
  const username      = asciiUsername.length >= 2
    ? asciiUsername
    : 'c' + Array.from(rawUsername).map((ch) => ch.charCodeAt(0).toString(16)).join('');
  const code = familyCode.trim().toUpperCase();
  return {
    email: `${username}@buff.app`,
    password: `${username}_${code}_buff2026`,
  };
}
