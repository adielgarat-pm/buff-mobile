/**
 * In-memory Supabase mock for the web smoke suite.
 *
 * Intercepts every request to *.supabase.co from the page (Playwright
 * context.route) and answers from a tiny stateful store: GoTrue auth
 * (signup / password token / user / logout) + a PostgREST subset (eq/in/is/neq
 * filters, insert/update/upsert/delete, object-vs-array by Accept header) + the
 * RPCs the auth/onboarding/join paths call. Unknown tables return [] and
 * unknown RPCs return null; both are recorded in `db.unhandled` so a new call
 * shows up in the report instead of silently passing.
 *
 * Nothing here reaches the network — the sandbox cannot, and production data
 * must never be touched from a test.
 */
import { randomUUID } from 'node:crypto';

export const PROJECT_REF = 'gfrongfnyigxsexuofrg';
export const AUTH_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer, accept, accept-profile, content-profile, range, x-client-info, x-supabase-api-version, x-retry-count',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-range,x-supabase-api-version',
};

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function fakeJwt(user) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600 * 24 * 365;
  // Like real GoTrue, every session gets its own token (session_id): the app
  // tells a fresh sign-in from a re-emit of the held session by the token
  // (isFreshSignIn), and two sessions minted in the same second used to be
  // byte-identical here (B6 flaked in CI, 2026-09-25).
  return `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({
    sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', iat, exp,
    session_id: randomUUID(),
  })}.sig`;
}

export function sessionFor(user) {
  const access_token = fakeJwt(user);
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    refresh_token: `rt-${user.id}`,
    user: authUserJson(user),
  };
}

function authUserJson(u) {
  return {
    id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email,
    email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email' },
    user_metadata: u.meta ?? {}, created_at: '2026-01-01T00:00:00Z',
  };
}

/** Fresh store. Seed helpers below add families / parents / children. */
export function createDb() {
  return {
    users: [],               // { id, email, password, meta }
    tables: {
      profiles: [], families: [], app_settings: [], tasks: [], daily_progress: [],
      credit_vault: [], store_rewards: [], onboarding_events: [],
    },
    calls: [],               // every request: `${method} ${path}`
    unhandled: [],
    failNext: {},            // e.g. { 'POST /auth/v1/token': 1 } → next N calls 500
  };
}

export function addUser(db, { email, password = 'Passw0rd!', meta } = {}) {
  const u = { id: randomUUID(), email, password, meta };
  db.users.push(u);
  return u;
}

export function addFamily(db, { name = 'Test Family', short_code } = {}) {
  const f = {
    id: randomUUID(), name, short_code: short_code ?? randomCode(), preferred_language: 'en',
    created_at: new Date().toISOString(),
  };
  db.tables.families.push(f);
  return f;
}

export function addProfile(db, row) {
  const p = {
    id: randomUUID(), user_id: null, family_id: null, display_name: 'Test', role: 'parent',
    is_pro: false, is_lifetime_access: false, is_lifetime_founding: false,
    founding_member_number: null, pro_settings: {}, premium_until: null,
    marketing_consent: false, is_deleted: false, avatar: null, access_mode: null,
    off_routine_until: null, created_at: new Date().toISOString(),
    ...row,
  };
  db.tables.profiles.push(p);
  return p;
}

function randomCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join('');
}

// ── PostgREST helpers ──────────────────────────────────────────────────────
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns', 'or', 'and']);

function coerce(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  return v;
}

function matches(row, params) {
  for (const [k, raw] of params) {
    if (RESERVED.has(k)) continue;
    const dot = raw.indexOf('.');
    const op = raw.slice(0, dot);
    const val = raw.slice(dot + 1);
    const cell = row[k];
    switch (op) {
      case 'eq':  if (String(cell) !== String(coerce(val)) && cell !== coerce(val)) return false; break;
      case 'neq': if (String(cell) === String(coerce(val))) return false; break;
      case 'is':  if (val === 'null' ? cell != null : cell !== coerce(val)) return false; break;
      case 'in': {
        const set = val.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, ''));
        if (!set.includes(String(cell))) return false; break;
      }
      case 'gte': if (!(cell >= val)) return false; break;
      case 'lte': if (!(cell <= val)) return false; break;
      case 'gt':  if (!(cell > val)) return false; break;
      case 'lt':  if (!(cell < val)) return false; break;
      default: break; // unsupported ops are permissive
    }
  }
  return true;
}

function json(route, status, body, extra = {}) {
  return route.fulfill({
    status,
    headers: { 'content-type': 'application/json', ...CORS, ...extra },
    body: body === undefined ? '' : JSON.stringify(body),
  });
}

function userFromAuth(db, headers) {
  const h = headers['authorization'] || '';
  const tok = h.replace(/^Bearer /i, '');
  const parts = tok.split('.');
  if (parts.length !== 3) return null;
  try {
    const { sub } = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return db.users.find((u) => u.id === sub) ?? null;
  } catch { return null; }
}

// ── RPCs ────────────────────────────────────────────────────────────────────
function rpc(db, name, args, me) {
  const T = db.tables;
  const myProfile = me ? T.profiles.find((p) => p.user_id === me.id) : null;
  const famByCode = (c) => T.families.find((f) => f.short_code === String(c ?? '').trim().toUpperCase());
  switch (name) {
    case 'lookup_family_by_code': return famByCode(args.p_short_code)?.id ?? null;
    case 'get_my_family_id': return myProfile?.family_id ?? null;
    case 'list_family_children': {
      const f = famByCode(args.p_family_code);
      if (!f) return { found: false, reason: 'family_not_found' };
      return {
        found: true,
        children: T.profiles
          .filter((p) => p.family_id === f.id && p.role === 'child' && !p.is_deleted)
          .map((p) => ({ id: p.id, display_name: p.display_name, avatar: p.avatar, linked: !!p.user_id })),
      };
    }
    case 'link_child_profile': {
      const f = famByCode(args.p_family_code);
      const p = T.profiles.find((x) => x.id === args.p_profile_id && x.family_id === f?.id);
      if (!p || !me) return { linked: false };
      p.user_id = me.id;
      return { linked: true };
    }
    case 'preflight_claim_orphan': {
      const f = famByCode(args.p_family_code);
      if (!f) return { reason: 'family_not_found' };
      const m = T.profiles.filter((p) => p.family_id === f.id && p.role === 'child' && !p.user_id
        && p.display_name.toLowerCase() === String(args.p_display_name).toLowerCase());
      return { reason: m.length === 1 ? 'match_found' : m.length > 1 ? 'ambiguous_match' : 'no_orphan_match' };
    }
    case 'claim_orphan_profile': {
      const f = famByCode(args.p_family_code);
      const p = T.profiles.find((x) => x.family_id === f?.id && x.role === 'child' && !x.user_id
        && x.display_name.toLowerCase() === String(args.p_display_name).toLowerCase());
      if (!p || !me) return { claimed: false };
      p.user_id = me.id;
      return { claimed: true };
    }
    case 'create_child_profile': {
      if (!myProfile?.family_id) return { status: 'error', reason: 'no_family' };
      const dup = T.profiles.find((p) => p.family_id === myProfile.family_id && p.role === 'child'
        && !p.is_deleted && p.display_name === args.p_display_name);
      if (dup && !args.p_force) return { status: 'duplicate', existing_child_id: dup.id, existing_child_name: dup.display_name };
      const c = addProfile(db, {
        family_id: myProfile.family_id, display_name: args.p_display_name, role: 'child',
        pro_settings: args.p_pro_settings ?? {},
      });
      return { status: 'created', child_id: c.id };
    }
    case 'redeem_referral': return { success: false, reason: 'invalid_code' };
    default:
      db.unhandled.push(`rpc ${name}`);
      return null;
  }
}

/** Install the mock on a Playwright BrowserContext. */
export async function installMocks(context, db) {
  await context.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const path = url.pathname;
    const key = `${method} ${path}`;
    db.calls.push(key + (url.search ? url.search.slice(0, 120) : ''));

    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    if (db.failNext[key] > 0) {
      db.failNext[key] -= 1;
      return json(route, 500, { message: 'mock forced failure' });
    }

    const headers = req.headers();
    let body = null;
    try { body = req.postDataJSON(); } catch { body = null; }
    const me = userFromAuth(db, headers);

    // ── GoTrue ──
    if (path === '/auth/v1/signup') {
      if (db.users.some((u) => u.email === body.email)) {
        return json(route, 422, { code: 'user_already_exists', msg: 'User already registered', error_code: 'user_already_exists' });
      }
      const u = addUser(db, { email: body.email, password: body.password, meta: body.data });
      const s = sessionFor(u);
      return json(route, 200, { ...s, user: s.user });
    }
    if (path === '/auth/v1/token') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const u = db.users.find((x) => x.email === body.email && x.password === body.password);
        if (!u) return json(route, 400, { code: 'invalid_credentials', error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        return json(route, 200, sessionFor(u));
      }
      if (grant === 'refresh_token') {
        const id = String(body.refresh_token).replace(/^rt-/, '');
        const u = db.users.find((x) => x.id === id);
        if (!u) return json(route, 400, { code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
        return json(route, 200, sessionFor(u));
      }
    }
    if (path === '/auth/v1/user') {
      if (!me) return json(route, 401, { code: 'bad_jwt', msg: 'invalid JWT' });
      return json(route, 200, authUserJson(me));
    }
    if (path === '/auth/v1/logout') return route.fulfill({ status: 204, headers: CORS });
    if (path.startsWith('/auth/v1/recover')) return json(route, 200, {});
    if (path.startsWith('/auth/v1/authorize')) {
      // Google OAuth: we never follow the provider; record and stop.
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/html', ...CORS }, body: '<h1>mock google</h1>' });
    }

    // ── PostgREST ──
    const rest = path.match(/^\/rest\/v1\/(rpc\/)?([A-Za-z0-9_]+)$/);
    if (rest) {
      const [, isRpc, name] = rest;
      if (isRpc) return json(route, 200, rpc(db, name, body ?? {}, me));

      const table = db.tables[name] ?? (db.tables[name] = (db.unhandled.push(`table ${name}`), []));
      const params = [...url.searchParams.entries()];
      const wantsObject = (headers['accept'] || '').includes('vnd.pgrst.object');
      const prefer = headers['prefer'] || '';
      const reply = (rows) => {
        if (wantsObject) {
          if (rows.length === 1) return json(route, 200, rows[0]);
          return json(route, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows` });
        }
        return json(route, 200, rows, { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
      };

      if (method === 'GET' || method === 'HEAD') return reply(table.filter((r) => matches(r, params)));
      if (method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        const upsert = prefer.includes('resolution=');
        const out = [];
        for (const r of rows) {
          const conflict = url.searchParams.get('on_conflict');
          const existing = upsert && conflict ? table.find((x) => conflict.split(',').every((c) => x[c] === r[c])) : null;
          if (existing) {
            if (!prefer.includes('ignore-duplicates')) Object.assign(existing, r);
            out.push(existing);
          } else {
            const row = { id: randomUUID(), created_at: new Date().toISOString(), ...r };
            if (name === 'families' && !row.short_code) row.short_code = randomCode();
            if (name === 'profiles') Object.assign(row, { pro_settings: {}, is_deleted: false, ...row });
            table.push(row);
            out.push(row);
          }
        }
        return prefer.includes('return=representation') ? reply(out) : json(route, 201, undefined);
      }
      if (method === 'PATCH') {
        const hit = table.filter((r) => matches(r, params));
        hit.forEach((r) => Object.assign(r, body));
        return prefer.includes('return=representation') ? reply(hit) : json(route, 204, undefined);
      }
      if (method === 'DELETE') {
        const keep = table.filter((r) => !matches(r, params));
        table.length = 0; table.push(...keep);
        return json(route, 204, undefined);
      }
    }

    // Storage / functions / realtime etc. — answer empty, record.
    db.unhandled.push(key);
    return json(route, 200, {});
  });

  // Realtime websocket: refuse quietly (the app tolerates it).
  await context.routeWebSocket?.(/supabase\.co/, (ws) => ws.close()).catch?.(() => {});
}
