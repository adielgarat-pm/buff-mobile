/**
 * Regression (Android emulator 2026-10-15): with edge-to-edge on, Android no
 * longer resizes the window for the soft keyboard, so every KeyboardAvoidingView
 * must give Android a behavior. Inside an RN <Modal> bottom sheet only
 * behavior="padding" actually lifts the sheet — 'height' did nothing for the
 * Parent → Rewards "+ Add Reward" sheet (Title hidden behind the keyboard) while
 * the Tasks sheet, on "padding", worked.
 *
 * Generalizes src/screens/auth/__tests__/keyboardAvoidingAndroid.test.ts to every
 * .tsx under src/screens and src/components. Source-scan, no rendering.
 */
import * as fs from 'fs';
import * as path from 'path';

const srcRoot = path.join(__dirname, '..');

function listTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsx(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const files = ['screens', 'components']
  .flatMap((d) => listTsx(path.join(srcRoot, d)))
  .filter((f) => fs.readFileSync(f, 'utf8').includes('<KeyboardAvoidingView'));

interface Site { line: number; behavior: string | null; inModal: boolean }

function sites(src: string): Site[] {
  const result: Site[] = [];
  const re = /<KeyboardAvoidingView\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const before = src.slice(0, m.index);
    const opens = (before.match(/<Modal\b/g) ?? []).length;
    const closes = (before.match(/<\/Modal>/g) ?? []).length;
    // Props of the opening tag: everything up to the next JSX element start.
    const rest = src.slice(m.index + m[0].length);
    const next = rest.search(/<[A-Za-z{/]/);
    const props = next === -1 ? rest : rest.slice(0, next);
    const b = props.match(/behavior=(?:"([^"]*)"|\{([^}]*)\})/);
    result.push({
      line: before.split('\n').length,
      behavior: b ? (b[1] !== undefined ? `"${b[1]}"` : b[2].trim()) : null,
      inModal: opens > closes,
    });
  }
  return result;
}

describe('every KeyboardAvoidingView handles the keyboard on edge-to-edge Android', () => {
  it('found the known KAV sites (scanner sanity check)', () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  it.each(files.map((f) => [path.relative(srcRoot, f).replace(/\\/g, '/'), f]))(
    '%s',
    (_rel, file) => {
      const src = fs.readFileSync(file, 'utf8');
      for (const s of sites(src)) {
        const where = `line ${s.line}`;
        expect({ where, behavior: s.behavior }).toEqual({ where, behavior: expect.any(String) });
        const b = s.behavior as string;
        // No Android behavior at all (iOS-only ternary).
        expect({ where, androidUndefined: /:\s*undefined\s*$/.test(b) })
          .toEqual({ where, androidUndefined: false });
        if (s.inModal) {
          // Inside a Modal, 'height' does not lift the sheet — must be padding.
          expect({ where, modalHeight: /'height'|"height"/.test(b) })
            .toEqual({ where, modalHeight: false });
        }
      }
    },
  );
});
