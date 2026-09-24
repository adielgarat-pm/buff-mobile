/**
 * Regression (2026-09-24): with any session on the device, RoleSelection's
 * "I'm a parent" card and Login's "create account" link navigated to Signup,
 * which only existed in the signed-out branch — the tap silently did nothing.
 * Every screen the auth-entry screens navigate to must be registered in the
 * shared (session-independent) auth block of RootNavigator.
 */
import * as fs from 'fs';
import * as path from 'path';

const read = (p: string) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

describe('sharedDeviceAuthScreens', () => {
  const root = read('navigation/RootNavigator.tsx');
  const block = root.slice(
    root.indexOf('const sharedDeviceAuthScreens'),
    root.indexOf('</>', root.indexOf('const sharedDeviceAuthScreens')),
  );
  const registered = new Set([...block.matchAll(/name="([A-Za-z0-9_]+)"/g)].map((m) => m[1]));

  it.each([
    'screens/auth/RoleSelectionScreen.tsx',
    'screens/auth/LoginScreen.tsx',
    'screens/auth/SignupScreen.tsx',
    'screens/auth/ChildJoinScreen.tsx',
  ])('registers every route %s navigates to', (file) => {
    const targets = [...read(file).matchAll(/navigate\('([A-Za-z0-9_]+)'/g)].map((m) => m[1]);
    for (const target of targets) expect(registered).toContain(target);
  });
});
