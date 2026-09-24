/**
 * Harness: one fresh browser context per case, the Supabase mock installed,
 * optional pre-existing session + language injected before the bundle boots.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { installMocks, createDb, sessionFor, AUTH_STORAGE_KEY } from './mockSupabase.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    '/opt/node22/lib/node_modules/playwright/index.js',
    'playwright',
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch { /* next */ }
  }
  throw new Error('playwright not found — set PLAYWRIGHT_MODULE to its index.js');
}
export const { chromium } = loadPlaywright();

export const VIEWPORTS = {
  m360:  { viewport: { width: 360, height: 560 },  isMobile: true, hasTouch: true },
  m390:  { viewport: { width: 390, height: 664 },  isMobile: true, hasTouch: true },
  desk:  { viewport: { width: 1280, height: 800 } },
};

export const STR = {
  en: {
    iAmParent: "I'm a Parent", iAmChild: "I'm a Child", haveAccount: 'Already have an account? Log in',
    displayName: 'Display Name', email: 'Email', password: 'Password', createAccount: 'Create Account',
    login: 'Log In', signup: 'Sign Up', invalidCreds: 'Invalid email or password',
    codePh: 'e.g. ABC123', continue: 'Continue', notNow: 'Not right now', google: 'Sign in with Google',
    googleUp: 'Sign up with Google', username: 'Username', teen: 'Teen', codeNotFound: 'Code not found',
  },
  he: {
    iAmParent: 'אני הורה', iAmChild: 'אני ילד/ה', haveAccount: 'כבר יש לך חשבון? התחברות',
    displayName: 'שם תצוגה', email: 'אימייל', password: 'סיסמה', createAccount: 'צור חשבון',
    login: 'התחברות', signup: 'הרשמה', invalidCreds: 'אימייל או סיסמה שגויים',
    codePh: 'לדוגמה ABC123', continue: 'המשך', notNow: 'לא כרגע', google: 'התחבר עם גוגל',
    googleUp: 'הירשם עם גוגל', username: 'שם משתמש', teen: 'נער/ה', codeNotFound: 'הקוד לא נמצא',
  },
};

export class Case {
  constructor({ browser, baseUrl, outDir, vpKey, lang, name }) {
    Object.assign(this, { browser, baseUrl, outDir, vpKey, lang, name });
    this.db = createDb();
    this.s = STR[lang];
    this.checks = [];
    this.notes = [];
    this.logs = [];
  }

  async open({ sessionUser = null, extraStorage = {} } = {}) {
    const vp = VIEWPORTS[this.vpKey];
    this.ctx = await this.browser.newContext({ ...vp, serviceWorkers: 'block', locale: this.lang === 'he' ? 'he-IL' : 'en-US' });
    await installMocks(this.ctx, this.db);
    const storage = { buff_language: this.lang, ...extraStorage };
    if (sessionUser) storage[AUTH_STORAGE_KEY] = JSON.stringify(sessionFor(sessionUser));
    await this.ctx.addInitScript((kv) => {
      if (sessionStorage.getItem('__smoke_seeded')) return; // only before the first load
      sessionStorage.setItem('__smoke_seeded', '1');
      for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v);
    }, storage);
    // Never leave the sandbox (marketing redirect, Google, fonts CDN...).
    await this.ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)(?!.*supabase\.co)/, (r) =>
      r.request().resourceType() === 'document'
        ? r.fulfill({ status: 200, contentType: 'text/html', body: `<h1 id="external">${r.request().url()}</h1>` })
        : r.fulfill({ status: 200, contentType: r.request().resourceType() === 'script' ? 'application/javascript' : 'text/plain', body: '' }));
    this.page = await this.ctx.newPage();
    this.page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) this.logs.push(`[${m.type()}] ${m.text()}`.slice(0, 400)); });
    this.page.on('pageerror', (e) => this.logs.push(`[pageerror] ${e.message}`));
    return this.page;
  }

  async goto(p) { await this.page.goto(this.baseUrl + p, { waitUntil: 'domcontentloaded' }); }

  /** Client-side route change (keeps the in-memory session and nav tree). */
  async pushPath(p) {
    await this.page.evaluate((to) => { history.pushState({}, '', to); dispatchEvent(new PopStateEvent('popstate')); }, p);
  }

  tid(id) { return this.page.getByTestId(id); }
  text(t) { return this.page.getByText(t, { exact: false }).first(); }

  async check(label, fn) {
    try {
      const detail = await fn();
      this.checks.push({ label, ok: true, detail: detail ?? '' });
      return true;
    } catch (e) {
      const shot = await this.shot(`FAIL-${label}`);
      this.checks.push({ label, ok: false, detail: String(e.message).split('\n')[0].slice(0, 300), shot });
      return false;
    }
  }

  async visible(loc, timeout = 15000) { await loc.waitFor({ state: 'visible', timeout }); }

  /** The element's box must lie fully inside the viewport (bottom-pinned CTA check). */
  async inViewport(loc) {
    await this.visible(loc);
    const box = await loc.boundingBox();
    const { height, width } = this.page.viewportSize();
    if (!box) throw new Error('no bounding box');
    if (box.y < 0 || box.y + box.height > height + 0.5 || box.x < 0 || box.x + box.width > width + 0.5) {
      throw new Error(`out of viewport: box y=${box.y.toFixed(0)} h=${box.height.toFixed(0)} vs viewport ${width}x${height}`);
    }
    return `y=${box.y.toFixed(0)}+${box.height.toFixed(0)} ≤ ${height}`;
  }

  async shot(label) {
    if (!this.page) return null;
    const file = path.join(this.outDir, `${this.name}-${this.vpKey}-${this.lang}-${label}`.replace(/[^A-Za-z0-9_.-]+/g, '_') + '.png');
    try { await this.page.screenshot({ path: file }); return file; } catch { return null; }
  }

  async close() { await this.ctx?.close(); }
}

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); return d; }
