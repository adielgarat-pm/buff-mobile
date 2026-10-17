/**
 * Every navigate/replace/reset target used by the auth, onboarding and entry
 * screens must be registered in EVERY RootNavigator branch that registers the
 * screen doing the navigating. React Navigation silently ignores an action to
 * an unregistered route (dev-only console error), so a missing registration
 * ships as a button that does nothing — bugs 2026-09-17 (ChildJoin) and
 * 2026-09-24 (Signup) were both this shape. Generalises
 * sharedDeviceAuthScreens.test.ts to all branches and all entry screens.
 *
 * Static on purpose: it reads RootNavigator.tsx as text, so it runs without
 * rendering the navigator and catches a new branch/screen the day it lands.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', '..');
const read = (p: string) => fs.readFileSync(path.join(SRC, p), 'utf8');

const root = read('navigation/RootNavigator.tsx');

// component identifier → source file (relative to src/)
const importOf = new Map<string, string>();
for (const m of root.matchAll(/^import\s+(\w+)\s+from\s+'\.\.\/screens\/([^']+)';/gm)) {
  importOf.set(m[1], `screens/${m[2]}.tsx`);
}

const sharedBlock = root.slice(
  root.indexOf('const sharedDeviceAuthScreens'),
  root.indexOf('</>', root.indexOf('const sharedDeviceAuthScreens')),
);

type Screen = { name: string; component: string };
const screensIn = (text: string): Screen[] =>
  [...text.matchAll(/<Stack\.Screen\s+name="(\w+)"[\s\S]*?component=\{(\w+)\}/g)].map((m) => ({
    name: m[1],
    component: m[2],
  }));

// Branches are delimited by the `─── N.` banner comments inside the navigator.
const navigatorJsx = root.slice(root.indexOf('<Stack.Navigator'));
const markers = [...navigatorJsx.matchAll(/─── (\d)\. ([^─\n]+)/g)];
const branches = markers.map((m, i) => {
  const body = navigatorJsx.slice(m.index, markers[i + 1]?.index ?? navigatorJsx.length);
  const screens = screensIn(body);
  if (body.includes('{sharedDeviceAuthScreens}')) screens.push(...screensIn(sharedBlock));
  return { id: `${m[1]}. ${m[2].trim()}`, screens, names: new Set(screens.map((s) => s.name)) };
});

/**
 * Targets that are legitimately absent from a branch, with the reason. Keep
 * this list short and justified — every entry is a place where a tap could be
 * a silent no-op if the reason ever stops holding.
 */
const ALLOWED: Record<string, string> = {
  // Guarded at runtime by canExitToParentApp() (routeNames check); outside
  // branch 4 the dialog continues the wizard instead.
  'UStep5_Preview→ParentApp@5': 'guarded by canExitToParentApp()',
  // Pressed only after saveAll() has set onboarding_complete and refreshed the
  // profile, which flips the navigator to branch 4 where ParentApp exists.
  'UStep8_Complete→ParentApp@5': 'branch flips to 4 before the CTA renders (saved gate)',
  // Landing only exists signed-out; on web it leaves for the marketing site.
};

const ENTRY_DIRS = ['screens/auth', 'screens/onboarding', 'screens/onboarding/unified'];
const entryFiles = new Set(
  ENTRY_DIRS.flatMap((d) =>
    fs.readdirSync(path.join(SRC, d)).filter((f) => f.endsWith('.tsx')).map((f) => `${d}/${f}`),
  ),
);

function targetsOf(file: string): string[] {
  const src = read(file);
  const out = new Set<string>();
  for (const m of src.matchAll(/\.(?:navigate|replace|push)\(\s*'(\w+)'/g)) out.add(m[1]);
  // navigation.reset({ routes: [{ name: 'X' ...
  for (const m of src.matchAll(/reset\(\{[\s\S]*?routes:\s*\[\s*\{\s*name:\s*'(\w+)'/g)) out.add(m[1]);
  return [...out];
}

describe('RootNavigator branches', () => {
  it('parses all five branches', () => {
    expect(branches.map((b) => b.id[0])).toEqual(['1', '2', '3', '4', '5']);
    for (const b of branches) expect(b.screens.length).toBeGreaterThan(0);
  });
});

const cases: [string, string, string][] = [];
for (const b of branches) {
  for (const s of b.screens) {
    const file = importOf.get(s.component);
    if (file && entryFiles.has(file)) cases.push([b.id, s.name, file]);
  }
}

describe.each(cases)('branch %s — screen %s', (branchId, screenName, file) => {
  const branch = branches.find((b) => b.id === branchId)!;
  const branchNo = branchId[0];
  const targets = targetsOf(file);
  if (targets.length === 0) {
    it('has no navigate targets', () => expect(targets).toEqual([]));
    return;
  }
  it.each(targets.map((t) => [t]))(`navigates only to registered routes → %s`, (target) => {
    const key = `${path.basename(file, '.tsx')}→${target}@${branchNo}`;
    if (ALLOWED[key]) return;
    expect({ key, registered: branch.names.has(target) }).toEqual({ key, registered: true });
  });
});

/**
 * Child app: every navigate target used by a child screen (or by PackingCard,
 * which renders on the child HQ + Gear tab) must resolve from EVERY branch
 * that mounts the child app (ChildApp → ChildTabs): the child's own login
 * (branch 3) and a parent's View-as-Child (branch 4). A target resolves if it
 * is a root-stack screen in that branch or a ChildTabs tab. Bug 2026-10-15:
 * PackingCard's "+ Add my own" → ChildAddActivity was registered only in
 * branch 4, so it did nothing on a kid's own login.
 */
const childTabsSrc = read('navigation/ChildTabs.tsx');
const childTabNames = new Set(
  [...childTabsSrc.matchAll(/<Tab\.Screen\s+name="(\w+)"/g)].map((m) => m[1]),
);

function walkTsx(dir: string): string[] {
  return fs.readdirSync(path.join(SRC, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walkTsx(rel);
    return e.name.endsWith('.tsx') ? [rel] : [];
  });
}

const CHILD_APP_FILES = ['components/PackingCard.tsx', ...walkTsx('screens/child')];
const childAppBranches = branches.filter((b) => b.names.has('ChildApp'));

describe('child app navigate targets', () => {
  it('finds the child-app branches and ChildTabs tabs', () => {
    expect(childAppBranches.map((b) => b.id[0])).toEqual(['3', '4']);
    expect(childTabNames.has('ChildBagPrep')).toBe(true);
  });

  it('PackingCard "+ Add my own" route is registered on the child\'s own login', () => {
    const child = branches.find((b) => b.id.startsWith('3'))!;
    expect(targetsOf('components/PackingCard.tsx')).toContain('ChildAddActivity');
    expect(child.names.has('ChildAddActivity')).toBe(true);
  });

  const childCases: [string, string, string][] = [];
  for (const b of childAppBranches) {
    for (const f of CHILD_APP_FILES) {
      for (const t of targetsOf(f)) childCases.push([b.id, f, t]);
    }
  }

  it.each(childCases)('branch %s — %s → %s is registered', (branchId, file, target) => {
    const branch = branches.find((b) => b.id === branchId)!;
    const key = `${path.basename(file, '.tsx')}→${target}@${branchId[0]}`;
    if (ALLOWED[key]) return;
    const registered = branch.names.has(target) || childTabNames.has(target);
    expect({ key, registered }).toEqual({ key, registered: true });
  });
});
