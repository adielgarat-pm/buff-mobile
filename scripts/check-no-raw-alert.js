#!/usr/bin/env node
/**
 * check-no-raw-alert.js
 *
 * Guardrail for the web-parity regression class: react-native-web's
 * `Alert.alert` is a NO-OP (`static alert() {}`), so any `Alert.alert(...)`
 * called from app code is silently swallowed on web — confirmations never
 * appear and validation feedback is invisible (verified 2026-06-26; RN-Web
 * 0.21.2).
 *
 * The fix is `crossAlert` in `src/platform/` (native → Alert.alert, web →
 * in-app modal). To keep the fix sticky, importing the raw `Alert` from
 * 'react-native' is banned everywhere EXCEPT the wrapper itself and tests.
 *
 * This script scans `src/**\/*.{ts,tsx}` for a named `Alert` import from
 * 'react-native' (handles multi-line import blocks) and exits non-zero if any
 * are found outside the allowed list.
 *
 * Run: `npm run check:no-raw-alert` (or `node scripts/check-no-raw-alert.js`)
 * Exit code 0 = clean, 1 = violations.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

// Files exempt from the rule.
const ALLOWED_RELATIVE = [
  // The native wrapper legitimately calls Alert.alert under the hood.
  'src/platform/crossAlert.tsx',
];

// Tests intentionally spy on Alert — exempt by path.
const isTest = (rel) => /(^|\/)__tests__\//.test(rel) || /\.test\.(ts|tsx)$/.test(rel);

// Match an `import { ... } from 'react-native'` block (possibly multi-line)
// whose destructured names include `Alert`.
const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]react-native['"]/g;
const importsAlert = (content) => {
  let m;
  while ((m = IMPORT_RE.exec(content)) !== null) {
    const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
    if (names.includes('Alert')) return true;
  }
  return false;
};

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
  if (ALLOWED_RELATIVE.includes(rel) || isTest(rel)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (importsAlert(content)) violations.push(rel);
}

// ── report ──────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log(`✓ check-no-raw-alert: clean (${files.length} files scanned).`);
  console.log('  No raw `Alert` import from react-native outside src/platform/crossAlert.tsx.');
  process.exit(0);
}

console.error('✗ check-no-raw-alert: raw `Alert` import from react-native detected.');
console.error('');
console.error("  `Alert.alert` is a no-op on web (react-native-web). Import `crossAlert`");
console.error('  from `src/platform` instead — same signature, works on both platforms:');
console.error('');
console.error("    import { crossAlert } from '<relative>/platform';");
console.error('    crossAlert(title, message?, buttons?, options?);');
console.error('');
console.error('  Violations:');
for (const v of violations) {
  console.error(`    ${v}`);
}
process.exit(1);
