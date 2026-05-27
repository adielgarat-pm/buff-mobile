#!/usr/bin/env node
/**
 * check-bilingual-access.js
 *
 * Guardrail against the i18n regression class documented in
 * docs/INTEGRATION_LEARNINGS.md IN-2026-05-27-04.
 *
 * BUFF stores bilingual strings in two shapes:
 *   - In-memory `I18nString` literals: `{ en, he }`
 *   - DB rows with two columns: `{ title, title_he }`
 *
 * Every read or write that picks ONE language side MUST go through the
 * helpers in `src/lib/i18nString.ts` (`pickLang`, `pickI18nColumn`,
 * `bilingualForDb`). Direct access to `.en` / `.he` / `.title_he`
 * outside that file is banned.
 *
 * Why: the same bug regressed twice with the same root cause and no
 * guardrail. See SPEC.md § "Why a systemic fix".
 *
 * This script scans `src/**\/*.{ts,tsx}` for the banned patterns and
 * exits non-zero if any are found outside the helper.
 *
 * Run: `npm run check:i18n-access` (or `node scripts/check-bilingual-access.js`)
 * Exit code 0 = clean, 1 = violations.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

// Files exempt from the rule — they implement the helpers themselves.
const ALLOWED_RELATIVE = [
  'src/lib/i18nString.ts',
  'src/lib/__tests__/i18nString.test.ts',
];

// Pattern: `.title.en`, `.title.he`, `.title_he` as member access.
// The leading `\.` anchors on the dot; the `\b` word boundary stops
// false positives like `.title_he_legacy_column` or `.en_US`.
const PATTERN = /\.title\.(en|he)\b|\.title_he\b/;

// ── walk ────────────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// ── scan ────────────────────────────────────────────────────────────────────

const files = walk(SRC);
const violations = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (ALLOWED_RELATIVE.includes(rel)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (PATTERN.test(line)) {
      violations.push({ file: rel, line: i + 1, text: line.trim() });
    }
  });
}

// ── report ──────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log(`✓ check-bilingual-access: clean (${files.length} files scanned).`);
  console.log('  No direct .en / .he / .title_he access outside src/lib/i18nString.ts.');
  process.exit(0);
}

console.error('✗ check-bilingual-access: direct bilingual access detected.');
console.error('');
console.error('  Direct access to `.en` / `.he` / `.title_he` is banned outside');
console.error('  `src/lib/i18nString.ts`. Use one of:');
console.error('');
console.error('    pickLang(s, lang)               — for I18nString literals (read or single-column write)');
console.error('    pickI18nColumn(row, lang)       — for DB rows with title + title_he columns (read)');
console.error('    bilingualForDb(s)               — for I18nString → { title, title_he } DB write');
console.error('');
console.error('  See docs/INTEGRATION_LEARNINGS.md IN-2026-05-27-04 for the regression history.');
console.error('');
console.error('  Violations:');
for (const v of violations) {
  console.error(`    ${v.file}:${v.line}  ${v.text}`);
}
process.exit(1);
