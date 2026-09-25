/**
 * Regression (Android run 2026-09-24, item 8): with edge-to-edge on, Android no
 * longer resizes the window for the soft keyboard. Signup's "Create Account" and
 * ChildJoin's code field + Continue were stuck behind the keyboard because their
 * KeyboardAvoidingView had no Android behavior (relying on the old resize);
 * Login, which uses behavior="height", passed. Every auth/entry screen that uses
 * a KeyboardAvoidingView must give Android a behavior while edge-to-edge is on.
 */
import * as fs from 'fs';
import * as path from 'path';

const root = path.join(__dirname, '..', '..', '..', '..');
const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const edgeToEdge = !!appJson.expo?.android?.edgeToEdgeEnabled;
const dir = path.join(__dirname, '..');
const screens = fs.readdirSync(dir).filter((f) => f.endsWith('Screen.tsx'));

describe('auth screens handle the keyboard on edge-to-edge Android', () => {
  it('edge-to-edge is on (if this flips, revisit this test)', () => {
    expect(edgeToEdge).toBe(true);
  });

  it.each(screens)('%s', (file) => {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    if (!src.includes('<KeyboardAvoidingView')) return;
    const behaviors = [...src.matchAll(/behavior=\{([^}]*)\}/g)].map((m) => m[1]);
    expect(behaviors.length).toBeGreaterThan(0);
    for (const b of behaviors) expect(b).not.toMatch(/:\s*undefined\s*$/);
  });
});
