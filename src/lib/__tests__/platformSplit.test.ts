/**
 * platformSplit — static guard that the web-only native-install-CTA modules
 * never leak into the native bundle (the launch-crash blind spot, IN-2026-06-17).
 *
 * Rule: a `*.web.*` module may only be imported via an explicit `.web` specifier
 * from another `*.web.*` file or a test. Any shared/native file that needs the
 * surface must import it WITHOUT the extension (Metro resolves the `.tsx`/`.ts`
 * native stub, which renders null / is inert). An explicit `.web` import in a
 * shared file would pull DOM/web code into the Android/iOS bundle.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', '..'); // src/lib/__tests__ -> src

// The web-only modules introduced by this feature. Their `.web` specifier must
// never appear in a shared (native-bundled) file.
const WEB_ONLY = [
  'installTarget.web',
  'GetTheAppCta.web',
  'installCtaTelemetry.web',
  'installCtaEligibility.web',
  'InstallNudge.web',
  'useInstallPrompt.web',
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const isWebFile = (f: string) => /\.web\.(ts|tsx)$/.test(f);
const isTestFile = (f: string) => /(__tests__|\.test\.)/.test(f.replace(/\\/g, '/'));

it('no shared/native file imports a web-only install module via an explicit .web specifier', () => {
  const importRe = /from\s+['"]([^'"]+)['"]/g;
  const offenders: string[] = [];

  for (const file of walk(SRC)) {
    if (isWebFile(file) || isTestFile(file)) continue; // web files + tests may import .web
    const src = fs.readFileSync(file, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(src)) !== null) {
      const spec = m[1];
      if (WEB_ONLY.some((mod) => spec.endsWith(mod))) {
        offenders.push(`${path.relative(SRC, file)} imports ${spec}`);
      }
    }
  }

  expect(offenders).toEqual([]);
});

it('the native stubs exist alongside each web module (so extension-less imports resolve on native)', () => {
  const pairs = [
    ['installTarget.ts', 'installTarget.web.ts'],
    ['../components/install/GetTheAppCta.tsx', '../components/install/GetTheAppCta.web.tsx'],
    ['../components/install/InstallNudge.tsx', '../components/install/InstallNudge.web.tsx'],
    ['../hooks/useInstallPrompt.ts', '../hooks/useInstallPrompt.web.ts'],
  ];
  for (const [nativeRel, webRel] of pairs) {
    const nativePath = path.join(SRC, 'lib', nativeRel);
    const webPath = path.join(SRC, 'lib', webRel);
    expect(fs.existsSync(nativePath)).toBe(true);
    expect(fs.existsSync(webPath)).toBe(true);
  }
});
