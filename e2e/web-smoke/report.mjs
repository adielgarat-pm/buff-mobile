#!/usr/bin/env node
/**
 * results.json → markdown matrix (flow × viewport × language) + below-fold
 * notes. Used to generate docs/qa/*.md from a smoke run.
 *
 *   node e2e/web-smoke/report.mjs <results.json> [shotPrefixToStrip]
 */
import fs from 'node:fs';

const [file, strip = ''] = process.argv.slice(2);
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const cols = [...new Set(r.map((x) => `${x.vpKey}/${x.lang}`))];
const flows = [...new Set(r.map((x) => x.flow))];

let out = `| flow | ${cols.join(' | ')} |\n|---|${cols.map(() => ':-:').join('|')}|\n`;
for (const f of flows) {
  out += `| ${f} | ${cols.map((c) => {
    const x = r.find((y) => y.flow === f && `${y.vpKey}/${y.lang}` === c);
    return !x ? '—' : x.ok ? '✅' : '❌';
  }).join(' | ')} |\n`;
}

const fails = r.filter((x) => !x.ok);
if (fails.length) {
  out += '\n**Failures (first failed check, screenshot):**\n\n';
  for (const x of fails) {
    const k = x.checks.find((c) => !c.ok);
    out += `- ${x.flow} ${x.vpKey}/${x.lang} — ${k ? `${k.label}: ${k.detail}` : x.error}${k?.shot ? ` — \`${k.shot.replace(strip, '')}\`` : ''}\n`;
  }
}

const below = {};
for (const x of r) for (const n of x.notes ?? []) {
  if (!n.includes('BELOW')) continue;
  const k = n.split(' →')[0].replace('fold:', '');
  (below[k] ??= new Set()).add(`${x.vpKey}/${x.lang}`);
}
if (Object.keys(below).length) {
  out += '\n**CTAs that start below the fold (reachable by scrolling — informational):**\n\n';
  for (const [k, v] of Object.entries(below)) out += `- \`${k}\`: ${[...v].sort().join(', ')}\n`;
}
const checks = r.reduce((n, x) => n + x.checks.length, 0);
out += `\n_${r.length - fails.length}/${r.length} cases passed · ${checks} checks · unmocked calls seen: ${[...new Set(r.flatMap((x) => x.unhandled))].join(', ') || 'none'}_\n`;
process.stdout.write(out);
