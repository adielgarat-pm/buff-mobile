/**
 * Guardrail — user-facing copy must NOT be chosen by a hand-rolled language
 * check. It must go through i18next (`t('key')`, strings in en.json/he.json).
 *
 * Why this exists: BUFF has three parallel "which language" sources —
 *   1. i18next            (`useTranslation`/`t()`)      → tracks the active UI
 *                                                          language, INCLUDING
 *                                                          the previewed child's
 *                                                          language in
 *                                                          View-as-Child.
 *   2. LanguageContext    (`useLanguage().language`)    → device/global language;
 *                                                          deliberately NOT changed
 *                                                          during View-as-Child.
 *   3. i18nString/pickLang(`{en,he}` data)             → bilingual DB/seed CONTENT.
 *
 * Choosing copy with an inline `language === 'he' ? '...' : '...'` ternary keyed
 * off source #2 leaks the device language into the UI — the exact bug that hit
 * OffRoutineBanner (Hebrew banner inside an otherwise-English child preview).
 * This is the same bug class as IN-2026-05-27-04 (which only guarded the data
 * path, #3). This test guards the UI-chrome path, #1-vs-#2.
 *
 * If this test fails: move the strings into src/i18n/{en,he}.json and read them
 * with `useTranslation()` + `t('your.key')` instead of branching on language.
 *
 * Allowlist below = the legitimate places a language name/label is shown in its
 * own script (a language picker always shows "עברית" / "English" literally),
 * plus the context that owns device-language/RTL.
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC_ROOT = path.join(__dirname, '..', '..'); // → src/

// Paths (relative to src/, forward-slash) allowed to branch copy on language.
const ALLOWLIST = new Set<string>([
  'contexts/LanguageContext.tsx',   // defines + owns device language / RTL
  'contexts/ModeContext.tsx',       // uses deviceLanguage to restore on exit
  'components/LanguagePicker.tsx',  // shows each language in its own name
  'components/LanguagePickerModal.tsx',
  'screens/child/ChildSettingsScreen.tsx',   // "עברית" / "English" picker label
  'screens/parent/ParentSettingsScreen.tsx', // "עברית" / "English" picker label
  'screens/parent/EditChildScreen.tsx',      // "עברית" / "English" picker label
]);

// `language === 'he' ? '...'` — a language ternary that immediately returns a
// string literal = hardcoded copy. \s* spans newlines.
//
// The `(?<!i18n\.)` lookbehind deliberately EXEMPTS `i18n.language === 'he' ?
// '...'`: that reads from i18next (the correct source, #1) and is used to derive
// a locale code (e.g. 'he-IL' for toLocaleDateString) — not to pick UI copy off
// the device language. Only a bare `language` (i.e. from useLanguage(), #2) is
// the bug this guards against.
const HARDCODED_COPY_TERNARY =
  /(?<!i18n\.)\blanguage\s*===\s*['"]he['"]\s*\?\s*['"]/;

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      collectSourceFiles(full, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

test('no component chooses user-facing copy by language (use i18next t() instead)', () => {
  const offenders: string[] = [];
  for (const file of collectSourceFiles(SRC_ROOT)) {
    const rel = path.relative(SRC_ROOT, file).split(path.sep).join('/');
    if (ALLOWLIST.has(rel)) continue;
    if (HARDCODED_COPY_TERNARY.test(fs.readFileSync(file, 'utf8'))) {
      offenders.push(rel);
    }
  }
  expect(offenders).toEqual([]);
});
