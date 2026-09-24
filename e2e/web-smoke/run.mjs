#!/usr/bin/env node
/**
 * BUFF web smoke — auth / onboarding / child-join flows against a local
 * `expo export -p web` build with a mocked Supabase. See README.md.
 *
 *   node e2e/web-smoke/run.mjs --dist <webdist> [--out <dir>]
 *        [--flows A1,B4] [--vp m360,m390,desk] [--lang en,he]
 */
import path from 'node:path';
import fs from 'node:fs';
import { serve } from './lib/serve.mjs';
import { chromium, Case, ensureDir } from './lib/harness.mjs';
import { flows, childCreds } from './flows.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
  return acc;
}, []));
const dist = path.resolve(args.dist ?? 'dist');
const out = ensureDir(path.resolve(args.out ?? 'e2e/web-smoke/.out'));
const port = Number(args.port ?? 8099);
const pick = (s, all) => (s ? s.split(',') : all);
const flowNames = Object.keys(flows).filter((f) => !args.flows || pick(args.flows).some((p) => f.startsWith(p)));
const vps = pick(args.vp, ['m360', 'm390', 'desk']);
const langs = pick(args.lang, ['en', 'he']);

// Same derivation as src/utils/childAuth.ts stableChildCreds (kept in sync by
// src/utils/__tests__ — the smoke only needs it to seed a linked child).
childCreds.stableEmail = (id) => `child_${id.replace(/-/g, '')}@buff.app`;
childCreds.stablePassword = (id) => `${id}_buff_stable_2026`;

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`No web build at ${dist}. Run: npx expo export -p web --output-dir ${dist}`);
  process.exit(2);
}

const server = await serve(dist, port);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const results = [];
const t0 = Date.now();
for (const flow of flowNames) {
  for (const vpKey of vps) {
    for (const lang of langs) {
      const c = new Case({ browser, baseUrl: `http://localhost:${port}`, outDir: out, vpKey, lang, name: flow });
      let error = null;
      try { await flows[flow](c); } catch (e) { error = e.message.split('\n')[0]; }
      const ok = !error && c.checks.every((k) => k.ok);
      const endShot = await c.shot('end');
      results.push({ flow, vpKey, lang, ok, error, checks: c.checks, notes: c.notes, endShot, unhandled: [...new Set(c.db.unhandled)], logs: c.logs.slice(-15) });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${flow}  ${vpKey}  ${lang}${ok ? '' : '  → ' + (c.checks.find((k) => !k.ok)?.label ?? error)}`);
      await c.close();
    }
  }
}
await browser.close();
server.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(0)}s — details: ${path.join(out, 'results.json')}`);
process.exit(failed.length ? 1 : 0);
