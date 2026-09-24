/**
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

// ── A. Parent resumes at UStep6 ─────────────────────────────────────────────
{
  const parent = { id: 'parent-1', email: 'p@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const writes = [];
  await mockSupabase(context, {
    __user: parent,
    profiles: [{ id: 'pp-1', user_id: 'parent-1', role: 'parent', family_id: 'fam-A', display_name: 'Dana', pro_settings: {}, language: 'en' }],
    families: [{ id: 'fam-A', short_code: 'ABC123', name: 'A', created_at: new Date().toISOString() }],
    tasks: [{ id: 't1', title: 'Drink water', time: '20:00' }],
  }, writes);
  await context.addInitScript(([k, s, snap]) => {
    localStorage.setItem(k, JSON.stringify(s));
    localStorage.setItem('buff_onboarding_nav_v1', JSON.stringify(snap));
  }, [AUTH_KEY, session(parent), {
    route: 'UStep6_FirstTask', t: Date.now(), uid: 'parent-1',
    params: { childName: 'Gal', childProfileId: 'child-A', ageGroup: '9-11', gender: 'boy', mainChallenge: 'morning_routine', additionalChallenges: [] },
  }]);
  const page = await context.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  await page.goto(BASE);
  const resume = page.getByTestId('welcome-resume');
  await resume.waitFor({ timeout: 20000 }).catch(() => {});
  check('A1 resume offer shown for a UStep6 snapshot (UStep6 now in ONBOARDING_ROUTES)', await resume.isVisible());
  if (await resume.isVisible()) await resume.click();
  const notNow = page.getByText(/not right now/i).first();
  await notNow.waitFor({ timeout: 15000 }).catch(() => {});
  check('A2 UStep6 presence screen rendered', await notNow.isVisible());
  if (await notNow.isVisible()) await notNow.click();
  await page.getByTestId('onb-access-home_device').waitFor({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  const ev = events(writes);
  const has = (f) => ev.some(e => Object.entries(f).every(([k, v]) => e?.[k] === v));
  check('A3 onboarding_step_reached 6_first_task', has({ event_type: 'onboarding_step_reached', variant: '6_first_task', family_id: 'fam-A' }), JSON.stringify(ev));
  check('A4 presence_answered not_now (phase presence, child id)', has({ event_type: 'presence_answered', method: 'not_now', variant: 'presence', child_id: 'child-A' }), JSON.stringify(ev));
  check('A5 onboarding_step_reached 7_access', has({ event_type: 'onboarding_step_reached', variant: '7_access' }), JSON.stringify(ev));
  check('A6 no daily_progress write on "not right now"', !writes.some(w => w.table === 'daily_progress'), JSON.stringify(writes.map(w => w.table)));
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'first-win-A-access.png') });
  await context.close();
}

// ── B. Child on own device: open + first completion ─────────────────────────
{
  const child = { id: 'child-user-1', email: 'kid@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
  const today = new Date(); const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const writes = [];
  await mockSupabase(context, {
    __user: child,
    profiles: [{ id: 'child-B', user_id: 'child-user-1', role: 'child', family_id: 'fam-B', display_name: 'Gal', age_group: '9-11', pro_settings: {}, language: 'en' }],
    families: [{ id: 'fam-B', short_code: 'XYZ789', name: 'B', created_at: new Date().toISOString() }],
    tasks: [{ id: 't1', title: 'Drink water', time: '20:00', credits: 20, assigned_to: 'child-B', family_id: 'fam-B', days_of_week: [0,1,2,3,4,5,6], is_active: true }],
    // vibe already done today, so the dashboard isn't behind the Vibe Check modal
    child_vibes: [{ id: 'v1', child_id: 'child-B', family_id: 'fam-B', date: key, mood: 'good', created_at: new Date().toISOString() }],
    daily_progress: [],
    credit_vault: [{ child_id: 'child-B', family_id: 'fam-B', total_balance: 0 }],
    'rpc:adjust_credit_vault': { ok: true, new_balance: 20 },
  }, writes);
  await context.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [AUTH_KEY, session(child)]);
  const page = await context.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  await page.goto(BASE);
  await page.waitForTimeout(6000);
  let ev = events(writes);
  check('B1 child_first_open{child_device}', ev.some(e => e.event_type === 'child_first_open' && e.source === 'child_device' && e.child_id === 'child-B'), JSON.stringify(ev));
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'first-win-B-child.png') });
  // Complete the task: tap its title/checkbox.
  const task = page.getByTestId('hq-next-task');
  await task.scrollIntoViewIfNeeded().catch(() => {});
  if (await task.isVisible().catch(() => false)) {
    await task.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'first-win-B-done.png') });
    // A second completion path must NOT log another first win (tap again = no-op transition).
    if (await task.isVisible().catch(() => false)) { await task.click(); await page.waitForTimeout(1000); }
  }
  ev = events(writes);
  const wrote = writes.some(w => w.table === 'daily_progress');
  check('B2 a daily_progress completion was written (task tap reached completeTask)', wrote, JSON.stringify(writes.map(w => `${w.method} ${w.table}`)));
  check('B3 first_task_complete{child_device} logged once', ev.filter(e => e.event_type === 'first_task_complete' && e.source === 'child_device').length === 1, JSON.stringify(ev));
  await context.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
