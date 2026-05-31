/**
 * expoFileSystemImport.test.ts — regression guard for the System Import bug.
 *
 * Bug (2026-05-31): On the parent "ייבוא מערכת" screen, both Excel/CSV import
 * and photo OCR failed with the dialog "לא ניתן לקרוא את הקובץ". Root cause:
 * Expo SDK 54 (expo-file-system ~19.0.23) moved the classic API to the
 * `expo-file-system/legacy` subpath. The bare `expo-file-system` entry now
 * re-exports throwing stubs:
 *
 *   // node_modules/expo-file-system/src/legacyWarnings.ts
 *   export async function readAsStringAsync(...) {
 *     throw errorOnLegacyMethodUse('readAsStringAsync');  // "...is deprecated..."
 *   }
 *
 * So `import * as FileSystem from 'expo-file-system'` + `readAsStringAsync`
 * throws at runtime. The fix is to import from `expo-file-system/legacy`,
 * whose `readAsStringAsync` is the real native-backed implementation.
 *
 * This test fails if anyone reintroduces a bare `expo-file-system` import,
 * which would silently break file reads on a real device (jest mocks the
 * native module, so a runtime test here would NOT catch it — hence we guard
 * the import statement at the source level).
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC_ROOT = join(__dirname, '..', '..'); // -> src/

/** Recursively collect every .ts / .tsx file under src/ (excluding tests). */
function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      out.push(...collectSourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Matches a bare import from "expo-file-system" with NO subpath
// (e.g. /legacy, /next). The trailing (['"]) right after the package name is
// what distinguishes a bare import from a subpath import.
const BARE_FS_IMPORT = /from\s+['"]expo-file-system['"]/;

describe('expo-file-system import guard (System Import regression)', () => {
  const sourceFiles = collectSourceFiles(SRC_ROOT);

  it('finds source files to scan (sanity)', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it('no source file imports the deprecated bare "expo-file-system" entry', () => {
    const offenders = sourceFiles.filter((f) =>
      BARE_FS_IMPORT.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('TimetableScreen imports the file-system from the /legacy subpath', () => {
    const screen = join(SRC_ROOT, 'screens', 'parent', 'TimetableScreen.tsx');
    const src = readFileSync(screen, 'utf8');
    expect(src).toMatch(/from\s+['"]expo-file-system\/legacy['"]/);
    expect(src).not.toMatch(BARE_FS_IMPORT);
  });
});
