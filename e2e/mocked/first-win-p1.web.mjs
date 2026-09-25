/**
 * first-win P1 — web verification (View-as-Child strip + exit confirmation).
 * Harness identical to first-win-p0.web.mjs (see there for build/run).
 *
 * Scenario C. Onboarded parent → dashboard → "View as child" → the ChildTabs
 * strip shows the CHILD's name (not the parent's), the dashboard no longer
 * stacks a second banner, tapping the strip asks first ("Stay" keeps the
 * preview, "Yes, exit" leaves it).
 *
 * (P0 header kept below for reference.)
 * first-win P0 — web verification against a LOCAL web export with the whole
 * Supabase boundary mocked via context.route (no network, no prod writes).
 *
 * Build:  EXPO_PUBLIC_SUPABASE_URL=http://mock.supabase.local \
 *         EXPO_PUBLIC_SUPABASE_ANON_KEY=mock npx expo export --platform web --output-dir <dist>
 * Run:    DIST=<dist> PLAYWRIGHT=<path to playwright/index.mjs> node e2e/mocked/first-win-p0.web.mjs
 *
 * Scenarios
 *   A. Parent resumes onboarding at UStep6 → "Not right now" → ChildAccessStep.
 *      Expect onboarding_events: step 6_first_task, presence_answered{not_now}, step 7_access.
 *   B. Child signed in on their own device → ChildTabs → completes a task.
 *      Expect onboarding_events: child_first_open{child_device}, first_task_complete{child_device}.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const DIST = process.env.DIST;
if (!DIST) throw new Error('DIST not set');
const SB = 'http://mock.supabase.local';
const AUTH_KEY = 'sb-gfrongfnyigxsexuofrg-auth-token';

// ── static server with SPA fallback ─────────────────────────────────────────
const TYPES = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(DIST) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}`;

function b64url(o) { return Buffer.from(JSON.stringify(o)).toString('base64url'); }
function fakeJwt(sub) {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 * 24 })}.sig`;
}
function session(user) {
  return { access_token: fakeJwt(user.id), refresh_token: 'r', token_type: 'bearer', expires_in: 86400,
           expires_at: Math.floor(Date.now() / 1000) + 86400, user };
}

/** Mock PostgREST/auth. `tables` maps table → rows (GET). Records every write. */
async function mockSupabase(context, tables, writes) {
  const CORS = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS',
    'access-control-expose-headers': 'content-range',
  };
  await context.route(`${SB}/**`, async (route) => {
    try { await handle(route); } catch (e) { console.log('  [mock error]', e.message); await route.fulfill({ status: 500, headers: CORS, body: '' }); }
  });
  async function handle(route) {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' });
    const url = new URL(req.url());
    const m = url.pathname.match(/^\/rest\/v1\/(?:rpc\/)?([^/]+)/);
    const name = m?.[1];
    if (url.pathname.startsWith('/auth/v1/user')) {
      return route.fulfill({ headers: CORS, json: tables.__user });
    }
    if (url.pathname.startsWith('/auth/v1/')) return route.fulfill({ headers: CORS, json: {} });
    if (req.method() !== 'GET' && req.method() !== 'HEAD') {
      let body = null; try { body = req.postDataJSON(); } catch { /* none */ }
      writes.push({ method: req.method(), table: name, body });
      if (url.pathname.includes('/rpc/')) return route.fulfill({ headers: CORS, json: tables[`rpc:${name}`] ?? null });
      return route.fulfill({ status: 201, headers: CORS, json: Array.isArray(body) ? body : [body ?? {}] });
    }
    const rows = typeof tables[name] === 'function' ? tables[name](url) : (tables[name] ?? []);
    const single = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
    const headers = { ...CORS, 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` };
    if (req.method() === 'HEAD') return route.fulfill({ status: 200, headers, body: '' });
    return route.fulfill({ headers, json: single ? (rows[0] ?? null) : rows });
  }
}

const events = (writes) => writes.filter(w => w.table === 'onboarding_events').map(w => w.body);
const results = [];
function check(name, ok, detail) { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      ${detail}`}`); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

// ── C. View-as-Child strip + exit confirmation ─────────────────────────────
{
  const parent = { id: 'parent-C', email: 'p@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
  const parentRow = { id: 'pp-C', user_id: 'parent-C', role: 'parent', family_id: 'fam-C', display_name: 'Dana', language: 'en',
                      pro_settings: { onboarding_complete: true } };
  const childRow = { id: 'child-C', user_id: null, role: 'child', family_id: 'fam-C', display_name: 'Noa', age_group: '9-11',
                     created_at: new Date().toISOString(), access_mode: 'shared_device', pro_settings: {} };
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const writes = [];
  await mockSupabase(context, {
    __user: parent,
    profiles: (url) => {
      const q = url.search;
      if (q.includes('role=eq.child')) return [childRow];
      if (q.includes('id=eq.child-C')) return [childRow];
      return [parentRow];
    },
    families: [{ id: 'fam-C', short_code: 'NOA123', name: 'C', created_at: new Date().toISOString() }],
    tasks: [{ id: 't1', title: 'Drink water', time: '20:00', credits: 20, assigned_to: 'child-C', family_id: 'fam-C', is_active: true }],
  }, writes);
  await context.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [AUTH_KEY, session(parent)]);
  const page = await context.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  await page.goto(BASE);
  const vac = page.getByText(/View as child/i).first();
  await vac.waitFor({ timeout: 20000 }).catch(() => {});
  // The one-time marketing-consent ask can cover the dashboard; answer it.
  const noThanks = page.getByText('No, thanks', { exact: true }).first();
  if (await noThanks.isVisible().catch(() => false)) { await noThanks.click(); await page.waitForTimeout(500); }
  check('C1 parent dashboard shows "View as child"', await vac.isVisible());
  if (await vac.isVisible()) await vac.click();
  const strip = page.getByText("👁 ⁨Noa⁩'s screen").first();
  await strip.waitFor({ timeout: 15000 }).catch(() => {});
  check("C2 strip shows the CHILD's name (Noa), isolated", await strip.isVisible());
  check("C3 strip does not show the parent's name", !(await page.getByText(/Viewing as parent|Dana/).first().isVisible().catch(() => false)));
  check('C4 no second (dashboard) preview banner', (await page.getByText(/screen — tap to exit/).count()) === 0);
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'first-win-C-strip.png') });
  // The daily Vibe Check opens as a full-screen modal on the child's first
  // screen (existing behaviour, REVIEW F18). Skip it like a child would.
  const later = page.getByText('Maybe later', { exact: true }).first();
  await later.waitFor({ timeout: 5000 }).catch(() => {});
  if (await later.isVisible().catch(() => false)) { await later.click(); await page.waitForTimeout(800); }
  if (await strip.isVisible()) await strip.click({ timeout: 5000 }).catch(e => console.log('  [click]', e.message.split('\n')[0]));
  const title = page.getByText("Leave ⁨Noa⁩'s screen?").first();
  await title.waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'first-win-C-dialog-open.png') });
  check('C5 tapping the strip asks first (dialog title)', await title.isVisible());
  check('C6 dialog body uses the approved copy', await page.getByText('This switches to the grown-up side of BUFF.').first().isVisible().catch(() => false));
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'first-win-C-dialog.png') });
  await page.getByText('Stay', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(600);
  check('C7 "Stay" keeps the preview', await strip.isVisible());
  await strip.click().catch(() => {});
  await page.getByText('Yes, exit', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(1500);
  check('C8 "Yes, exit" leaves the preview (strip gone)', !(await strip.isVisible().catch(() => false)));
  await context.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
