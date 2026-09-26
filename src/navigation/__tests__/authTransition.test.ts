/**
 * Regression (2026-09-24): after a successful login on web the parent stayed on
 * an empty Login form — the remounted container re-resolved /Login, which the
 * shared-device fix registers in the parent branch. See authTransition.ts.
 */
import * as fs from 'fs';
import * as path from 'path';
import { isAuthEntryPath, identityChanged, navIdentity } from '../authTransition';

describe('isAuthEntryPath', () => {
  it.each(['/Login', '/login', '/RoleSelection', '/Signup', '/join/ABC123', '/join/abc123/'])(
    '%s is an entry path', (p) => expect(isAuthEntryPath(p)).toBe(true),
  );
  it.each(['/', '/founding-100', '/join', '/Loginx', '/ParentApp'])(
    '%s is not', (p) => expect(isAuthEntryPath(p)).toBe(false),
  );
});

describe('identityChanged', () => {
  it('cold start honours the URL', () => {
    expect(identityChanged(undefined, null)).toBe(false);
    expect(identityChanged(undefined, 'parent')).toBe(false); // shared-device /join/CODE
  });
  it('sign-in, account switch and sign-out are changes', () => {
    expect(identityChanged(null, 'parent')).toBe(true);
    expect(identityChanged('parent', 'child')).toBe(true);
    expect(identityChanged('parent', null)).toBe(true);
  });
  it('same identity is not', () => {
    expect(identityChanged('parent', 'parent')).toBe(false);
  });
});

describe('navIdentity', () => {
  it('signed out is null', () => {
    expect(navIdentity(null, 3)).toBeNull();
    expect(navIdentity(undefined, 0)).toBeNull();
  });
  it('the same account signing in again is an identity change', () => {
    expect(identityChanged(navIdentity('parent', 1), navIdentity('parent', 2))).toBe(true);
  });
  it('re-renders within one sign-in are not', () => {
    expect(identityChanged(navIdentity('parent', 1), navIdentity('parent', 1))).toBe(false);
  });
});

describe('RootNavigator wiring', () => {
  const root = fs.readFileSync(path.join(__dirname, '..', 'RootNavigator.tsx'), 'utf8');
  it('remounts the container per identity and consumes the entry URL on a switch', () => {
    expect(root).toMatch(/<NavigationContainer\s+key=\{authIdentity/);
    // sign-in only — after a sign-out the entry path is where the user wants to be
    expect(root).toMatch(/if \(switchedIdentity && authIdentity\) consumeAuthEntryUrl\(\)/);
    expect(root).toMatch(/linking=\{containerLinking\}/);
    // the identity includes the sign-in counter (same account again = switch)
    expect(root).toMatch(/const authIdentity = navIdentity\(user\?\.id, signInSeq/);
  });
});
