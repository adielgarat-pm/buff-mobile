/**
 * concierge-call — web verification (dashboard offer card).
 * Harness copied from first-win-p1.web.mjs (build/run identical).
 *
 * Scenario D. Onboarded parent, child created yesterday, no completions →
 * the card shows at the top of the dashboard; "Book a call" opens the Cal.com
 * page (new tab) and logs the tap; "No thanks" hides it and it stays hidden
 * after a reload. Scenario E. Same family with a completed task → no card.
 *
 * (first-win P1 header kept below for reference.)
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

function familyTables(hasWin) {
  const parent = { id: 'parent-D', email: 'p@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
  const parentRow = { id: 'pp-D', user_id: 'parent-D', role: 'parent', family_id: 'fam-D', display_name: 'Dana', language: 'en', pro_settings: { onboarding_complete: true } };
  const childRow = { id: 'child-D', user_id: null, role: 'child', family_id: 'fam-D', display_name: 'Noa', age_group: '9-11',
                     created_at: new Date(Date.now() - 86400000).toISOString(), access_mode: null, pro_settings: {} };
  return { parent, tables: {
    __user: parent,
    profiles: (url) => (url.search.includes('role=eq.child') || url.search.includes('id=eq.child-D')) ? [childRow] : [parentRow],
    families: [{ id: 'fam-D', short_code: 'NOA123', name: 'D', created_at: new Date(Date.now() - 86400000).toISOString() }],
    daily_progress: hasWin ? [{ id: 'dp1', family_id: 'fam-D', child_id: 'child-D', completed: true, source: 'child_device' }] : [],
  } };
}

// ── D. No-win family: card, book, dismiss ─────────────────────────────────
{
  const { parent, tables } = familyTables(false);
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const writes = [];
  await mockSupabase(context, tables, writes);
  // Stub the booking page (no network in the sandbox).
  await context.route('https://cal.com/**', r => r.fulfill({ contentType: 'text/html', body: '<h1>Cal.com stub</h1>' }));
  await context.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [AUTH_KEY, session(parent)]);
  const page = await context.newPage();
  page.on('pageerror', e => console.log('  [pageerror]', e.message));
  await page.goto(BASE);
  const noThanksConsent = page.getByText('No, thanks', { exact: true }).first();
  const card = page.getByTestId('concierge-card');
  await card.waitFor({ timeout: 20000 }).catch(() => {});
  if (await noThanksConsent.isVisible().catch(() => false)) { await noThanksConsent.click(); await page.waitForTimeout(400); }
  check('D1 no-win family sees the concierge card', await card.isVisible());
  check('D2 card copy', await page.getByText('Want a hand setting up BUFF?').first().isVisible().catch(() => false));
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'concierge-D-card.png') });
  const popupP = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
  await page.getByTestId('concierge-pick').click().catch(e => console.log('  [click]', e.message.split('\n')[0]));
  const popup = await popupP;
  if (popup) await popup.waitForLoadState('domcontentloaded').catch(() => {});
  const popupUrl = popup ? popup.url() : '';
  check('D3 "Book a call" opens the Cal.com page', popupUrl.startsWith('https://cal.com/adi-elgarat-german-buff'), popupUrl || 'no popup');
  await page.waitForTimeout(800);
  check('D3b the app tab stays in the app (did not navigate to Cal.com)', !page.url().includes('cal.com'), page.url());
  if (popup) await popup.close().catch(() => {});
  const ev = events(writes);
  check('D4 seen + tapped logged with placement dashboard',
    ev.some(e => e.event_type === 'concierge_offer_seen' && e.source === 'dashboard') &&
    ev.some(e => e.event_type === 'concierge_offer_tapped' && e.source === 'dashboard'), JSON.stringify(ev.map(e => e.event_type)));
  check('D4b card still visible before dismiss', await card.isVisible().catch(() => false));
  await page.getByTestId('concierge-dismiss').click({ timeout: 5000 }).catch(e => console.log('  [dismiss click]', e.message.split('\n')[0]));
  await page.waitForTimeout(500);
  check('D5 "No thanks" hides the card', !(await card.isVisible().catch(() => false)));
  await page.waitForTimeout(1000);
  check('D6 dismissal logged', events(writes).some(e => e.event_type === 'concierge_offer_dismissed'), JSON.stringify(events(writes).map(e => `${e.event_type}:${e.source}`)));
  await page.reload();
  await page.getByText(/View as child/i).first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(process.env.SHOTS ?? '.', 'concierge-D-after-reload.png') });
  check('D7 stays hidden after reload', (await page.getByTestId('concierge-card').count()) === 0);
  await context.close();
}

// ── E. Family with a first win: no card ───────────────────────────────────
{
  const { parent, tables } = familyTables(true);
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const writes = [];
  await mockSupabase(context, tables, writes);
  await context.addInitScript(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [AUTH_KEY, session(parent)]);
  const page = await context.newPage();
  await page.goto(BASE);
  await page.getByText(/View as child/i).first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  check('E1 family with a first win sees no card', (await page.getByTestId('concierge-card').count()) === 0);
  await context.close();
}

await browser.close();
server.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
