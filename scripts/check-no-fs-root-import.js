#!/usr/bin/env node
/**
 * check-no-fs-root-import.js
 *
 * Guardrail for the SDK-54 legacy-API regression class: `expo-file-system@19`
 * moved the classic API (readAsStringAsync, writeAsStringAsync, documentDirectory,
 * …) to `expo-file-system/legacy`. The ROOT package still exports the old names
 * so tsc passes — but they THROW at runtime. That shipped a dead Android file
 * path in Capture + Timetable (Lesson 2026-07-22, docs/INTEGRATION_LEARNINGS.md).
 *
 * Rule: import from `expo-file-system/legacy` (classic API) or use the new
 * File/Directory classes deliberately — never import the bare root package.
 *
 * Run: `npm run check:no-fs-root-import` (or `node scripts/check-no-fs-root-import.js`)
 * Exit code 0 = clean, 1 = violations.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

// Files allowed to import the root package (new File/Directory API), reviewed
// case by case. Empty today — the codebase uses only the classic API.
const ALLOWED_RELATIVE = [];

// Any import/require whose source is exactly 'expo-file-system' (root entry).
// 'expo-file-system/legacy' and other subpaths do not match.
const ROOT_IMPORT_RE = /(?:from\s*|require\s*\(\s*)['"]expo-file-system['"]/;

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

const files = walk(SRC);
const violations = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (ALLOWED_RELATIVE.includes(rel)) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (ROOT_IMPORT_RE.test(content)) violations.push(rel);
}

if (violations.length === 0) {
  console.log(`✓ check-no-fs-root-import: clean (${files.length} files scanned).`);
  console.log('  No root `expo-file-system` import (classic API must come from /legacy).');
  process.exit(0);
}

console.error('✗ check-no-fs-root-import: root `expo-file-system` import detected.');
console.error('');
console.error('  SDK 54: the classic API on the root entry typechecks but THROWS at');
console.error('  runtime. Import the legacy entry instead:');
console.error('');
console.error("    import * as FileSystem from 'expo-file-system/legacy';");
console.error('');
console.error('  (Deliberate use of the new File/Directory API → add the file to');
console.error('  ALLOWED_RELATIVE in scripts/check-no-fs-root-import.js.)');
console.error('');
console.error('  Violations:');
for (const v of violations) {
  console.error(`    ${v}`);
}
process.exit(1);
