/**
 * Guardrails for the i18n catalog + the "wrong language leaks into the UI"
 * bug family (companion to i18nNoHardcodedCopy.test.ts; see PR #216 history).
 *
 * 1. en.json / he.json must not contain DUPLICATE keys — JSON.parse silently
 *    keeps the last one, so an innocent re-add of an existing key invisibly
 *    overrides copy (19 such shadowed keys were found and removed 2026-06-12).
 * 2. en.json / he.json must have IDENTICAL key sets — a key present in only
 *    one file falls back to the other language at runtime.
 * 3. No bare `toLocaleString()` / `toLocaleTimeString([])` — argument-less
 *    locale formatters use the DEVICE locale, which leaks the wrong format
 *    during View-as-Child preview. Use src/lib/uiLocale.ts instead.
 * 4. No hardcoded Hebrew string literals in components outside the allowlist —
 *    user-facing copy belongs in the i18n catalog (t()), bilingual seed
 *    content belongs in `{en,he}` objects picked via pickLang/i18n.language.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.join(__dirname, '..', '..'); // → src/

// ─── helpers ──────────────────────────────────────────────────────────────────

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === '_dev' || entry.name === 'node_modules') continue;
      collectSourceFiles(full, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

/** Crude but effective: drop block comments and line-comment tails before scanning. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

const readCatalogRaw = (lang: 'en' | 'he') =>
  fs.readFileSync(path.join(SRC_ROOT, 'i18n', `${lang}.json`), 'utf8');

// ─── 1. duplicate keys ────────────────────────────────────────────────────────

test('translation catalogs have no duplicate keys', () => {
  for (const lang of ['en', 'he'] as const) {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const m of readCatalogRaw(lang).matchAll(/^\s*"((?:[^"\\]|\\.)+)"\s*:/gm)) {
      if (seen.has(m[1])) dups.push(`${lang}.json: ${m[1]}`);
      seen.add(m[1]);
    }
    expect(dups).toEqual([]);
  }
});

// ─── 2. key parity ────────────────────────────────────────────────────────────

test('en.json and he.json have identical key sets', () => {
  const en = JSON.parse(readCatalogRaw('en'));
  const he = JSON.parse(readCatalogRaw('he'));
  const onlyEn = Object.keys(en).filter((k) => !(k in he));
  const onlyHe = Object.keys(he).filter((k) => !(k in en));
  expect({ onlyEn, onlyHe }).toEqual({ onlyEn: [], onlyHe: [] });
});

// ─── 3. device-locale formatters ──────────────────────────────────────────────

const BARE_LOCALE_FORMATTER = /\.toLocaleString\(\)|\.toLocale(?:Time|Date)?String\(\s*\[\s*\]/;

test('no bare toLocaleString()/toLocaleTimeString([]) — use lib/uiLocale instead', () => {
  const offenders: string[] = [];
  for (const file of collectSourceFiles(SRC_ROOT)) {
    if (BARE_LOCALE_FORMATTER.test(stripComments(fs.readFileSync(file, 'utf8')))) {
      offenders.push(path.relative(SRC_ROOT, file).split(path.sep).join('/'));
    }
  }
  expect(offenders).toEqual([]);
});

// ─── 4. hardcoded Hebrew literals ─────────────────────────────────────────────

// Paths (relative to src/, forward-slash) where Hebrew CHARACTERS are legitimate
// in code: bilingual `{en,he}` seed data, Hebrew-input parsers, and the
// language-picker labels that always show each language in its own script.
const HEBREW_ALLOWLIST = new Set<string>([
  'i18n/index.ts',                                          // 'עברית' locale metadata
  'lib/i18nString.ts',                                      // Hebrew-script detection regex
  'utils/timetableParser.ts',                               // parses Hebrew school exports
  'types/timetable.ts',                                     // Hebrew day-name parse map
  'types/phase.ts',                                         // bilingual phase label config
  'screens/child/GamerDashboardScreen.tsx',                 // Hebrew keyword regex (phase inference from task titles)
  'screens/onboarding/unified/onboardingData.ts',           // bilingual {en,he} seed
  'screens/onboarding/unified/starterTasks/taskLibrary.ts', // bilingual {en,he} seed
  'screens/onboarding/unified/starterTasks/offRoutineTasks.ts',
  'types/activities.ts',                                    // bilingual {en,he} weekday labels (#229)
  'lib/packingTemplates/catalog.ts',                        // bilingual {en,he} packing-template seed (#228)
  'hooks/useParentInsights.ts',                             // matches Hebrew task titles (data, not copy)
  'screens/child/ChildSettingsScreen.tsx',                  // 'עברית' picker label
  'screens/parent/ParentSettingsScreen.tsx',                // 'עברית' picker label
  'screens/parent/EditChildScreen.tsx',                     // 'עברית' picker label
]);

const HEBREW_CHARS = /[֐-׿]/;

test('no hardcoded Hebrew outside i18n/bilingual-data allowlist (use t() instead)', () => {
  const offenders: string[] = [];
  for (const file of collectSourceFiles(SRC_ROOT)) {
    const rel = path.relative(SRC_ROOT, file).split(path.sep).join('/');
    if (HEBREW_ALLOWLIST.has(rel)) continue;
    if (HEBREW_CHARS.test(stripComments(fs.readFileSync(file, 'utf8')))) {
      offenders.push(rel);
    }
  }
  expect(offenders).toEqual([]);
});
