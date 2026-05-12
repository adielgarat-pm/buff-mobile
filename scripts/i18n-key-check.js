#!/usr/bin/env node
/**
 * i18n-key-check.js
 *
 * Scans src/**\/*.{ts,tsx} for `t('foo.bar')` (and `t("foo.bar")`) calls,
 * then verifies each key resolves in BOTH en.json and he.json.
 *
 * Skips:
 *   - dynamic keys (e.g. t(`pet.skin.${id}`)) — those are flagged as "dynamic"
 *   - keys with interpolation only in args
 *
 * Exit code 0 if all keys found, 1 otherwise.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = path.join(ROOT, 'src');

// ── load translation bundles ────────────────────────────────────────────────
const en = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n', 'en.json'), 'utf8'));
const he = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n', 'he.json'), 'utf8'));

function has(obj, dotted) {
  // BUFF i18n bundles are flat — keys are literal "pause.statusActive" strings,
  // not nested objects. Check direct membership first, then fall back to
  // nested walk for any future migration.
  if (Object.prototype.hasOwnProperty.call(obj, dotted) &&
      typeof obj[dotted] === 'string') {
    return true;
  }
  const parts = dotted.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return false;
    if (!Object.prototype.hasOwnProperty.call(cur, p)) return false;
    cur = cur[p];
  }
  return typeof cur === 'string';
}

// ── walk src ────────────────────────────────────────────────────────────────
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      yield* walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

// Match `t('foo.bar')` and `t("foo.bar")` — captures the key.
// Also matches things like `t('foo.bar', { count })`.
const T_CALL = /\bt\(\s*(['"])([a-zA-Z0-9_.]+)\1/g;
const T_DYNAMIC = /\bt\(\s*`/g;

const missingEn  = [];
const missingHe  = [];
const dynamicCalls = [];
let totalCalls = 0;
let uniqueKeys = new Set();

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  let m;

  // static keys
  T_CALL.lastIndex = 0;
  while ((m = T_CALL.exec(src)) !== null) {
    const key = m[2];
    totalCalls += 1;
    uniqueKeys.add(key);
    if (!has(en, key)) missingEn.push({ file: path.relative(ROOT, file), key });
    if (!has(he, key)) missingHe.push({ file: path.relative(ROOT, file), key });
  }

  // dynamic keys
  T_DYNAMIC.lastIndex = 0;
  while ((m = T_DYNAMIC.exec(src)) !== null) {
    dynamicCalls.push(path.relative(ROOT, file));
  }
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(`Scanned ${uniqueKeys.size} unique keys across ${totalCalls} t() calls.`);
console.log(`Dynamic t() calls (skipped, manual review needed): ${dynamicCalls.length}`);

if (missingEn.length) {
  console.log(`\n❌ Missing in en.json (${missingEn.length}):`);
  for (const { file, key } of missingEn.slice(0, 30)) {
    console.log(`   - ${key}   (${file})`);
  }
  if (missingEn.length > 30) console.log(`   ... and ${missingEn.length - 30} more`);
}

if (missingHe.length) {
  console.log(`\n❌ Missing in he.json (${missingHe.length}):`);
  for (const { file, key } of missingHe.slice(0, 30)) {
    console.log(`   - ${key}   (${file})`);
  }
  if (missingHe.length > 30) console.log(`   ... and ${missingHe.length - 30} more`);
}

if (!missingEn.length && !missingHe.length) {
  console.log('\n✅ All static i18n keys resolve in both en.json and he.json.');
  process.exit(0);
} else {
  process.exit(1);
}
