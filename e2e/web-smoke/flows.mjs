/**
 * Flow definitions for the web smoke suite. Each flow receives a `Case`
 * (harness.mjs) and records named checks; a failed check screenshots itself.
 * Flows stop at the first failed *gating* check (a later step can't run), but
 * viewport checks are non-gating so one bad CTA doesn't hide the rest.
 */
import { addUser, addFamily, addProfile, AUTH_STORAGE_KEY } from './lib/mockSupabase.mjs';

const PW = 'Passw0rd!';

// ── seeds ──────────────────────────────────────────────────────────────────
export function seedOnboardedParent(db, { email = 'adi.elgarat+e2e-returning@gmail.com', onboarded = true, withChild = true } = {}) {
  const fam = addFamily(db, { name: 'Test Returning Family', short_code: 'TSTFAM' });
  const user = addUser(db, { email, password: PW });
  const parent = addProfile(db, {
    user_id: user.id, family_id: fam.id, display_name: 'Test Parent', role: 'parent',
    marketing_consent: true, // already answered — keeps the one-time consent sheet out of the way
    pro_settings: onboarded ? { onboarding_complete: true } : {},
  });
  const child = withChild
    ? addProfile(db, { family_id: fam.id, display_name: 'TestKid', role: 'child', pro_settings: { age_group: '9-11' } })
    : null;
  db.tables.app_settings.push({ id: 'as-' + fam.id, family_id: fam.id, friday_enabled: false });
  return { fam, user, parent, child };
}

export function seedChildLinked(db, fam) {
  const { stableEmail } = childCreds;
  const child = addProfile(db, { family_id: fam.id, display_name: 'TestLinked', role: 'child', pro_settings: { age_group: '9-11' } });
  const user = addUser(db, { email: stableEmail(child.id), password: childCreds.stablePassword(child.id) });
  child.user_id = user.id;
  return { child, user };
}

// Mirror of src/utils/childAuth stableChildCreds — filled in by run.mjs at boot.
export const childCreds = { stableEmail: null, stablePassword: null };

// ── shared walkers ─────────────────────────────────────────────────────────
/** Child app greets with the Vibe Check (and other one-time sheets): answer "later". */
async function dismissChildSheets(c) {
  const later = c.page.getByText(c.lang === 'he' ? 'אולי אחר כך' : 'Maybe later', { exact: true });
  for (let i = 0; i < 3; i++) {
    if (!(await later.first().isVisible().catch(() => false))) {
      await c.page.waitForTimeout(800);
      if (!(await later.first().isVisible().catch(() => false))) return;
    }
    await later.first().click().catch(() => {});
  }
}

async function gate(c, label, fn) {
  const ok = await c.check(label, fn);
  if (!ok) throw new Error(`gate failed: ${label}`);
}

/**
 * Pinned CTAs (footer outside the ScrollView) must be on screen as rendered.
 * Scroll-content CTAs must be reachable: scrolled into view they must fit the
 * viewport. Whether a scroll-content CTA starts below the fold is recorded as
 * an informational `fold:` note, not a failure.
 */
// Must be on screen as rendered: footer CTAs (steps 1–5, Welcome, Complete) and
// RoleSelection's returning-user login (UX review 2026-09-24).
const PINNED = new Set(['onb1-next', 'onb3-next', 'onb4-continue', 'onb5-continue', 'welcome-cta', 'welcome-resume', 'onb8-cta', 'rolesel-login']);
async function ctaInView(c, testIdOrLoc, label) {
  const loc = typeof testIdOrLoc === 'string' ? c.tid(testIdOrLoc) : testIdOrLoc;
  if (typeof testIdOrLoc === 'string' && PINNED.has(testIdOrLoc)) {
    await c.check(`viewport:${label} (pinned)`, () => c.inViewport(loc));
    return;
  }
  let fold = 'above fold';
  try { await c.inViewport(loc); } catch { fold = 'BELOW FOLD (scroll needed)'; }
  c.notes.push(`fold:${label} → ${fold}`);
  await c.check(`reachable:${label}`, async () => {
    await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
    return c.inViewport(loc);
  });
}

/** From a Signup screen (parent role preselected), create an account. */
async function fillSignup(c, email) {
  // visible=true: when Signup is pushed over Login, both screens' fields are in the DOM.
  const field = (ph) => c.page.getByPlaceholder(ph, { exact: true }).locator('visible=true').first();
  await gate(c, 'signup screen shown', () => c.visible(field(c.s.displayName)));
  await field(c.s.displayName).fill('Test Parent');
  await field(c.s.email).fill(email);
  await field(c.s.password).fill(PW);
  const btn = c.page.getByText(c.s.createAccount, { exact: true }).locator('visible=true').last();
  await ctaInView(c, btn, 'signup-create');
  await btn.click();
}

/** Welcome → UStep1…UStep8 → ParentApp. Assumes a fresh parent on Welcome. */
export async function walkOnboarding(c, { reloadAt = null, broadcastAt = null } = {}) {
  await gate(c, 'Welcome shown', () => c.visible(c.tid('welcome-cta'), 20000));
  await ctaInView(c, 'welcome-cta', 'welcome');
  await c.tid('welcome-cta').click();

  await gate(c, 'Step1 shown', () => c.visible(c.tid('onb1-child-name')));
  if (await c.tid('onb1-parent-name').isVisible().catch(() => false)) await c.tid('onb1-parent-name').fill('Test Parent');
  await c.tid('onb1-child-name').fill('TestKid');
  await c.tid('onb1-age-9-11').click();
  await ctaInView(c, 'onb1-next', 'step1');
  await c.tid('onb1-next').click();

  await gate(c, 'Step2 shown', () => c.visible(c.tid('onb2-goal-homework_focus')));
  await c.tid('onb2-goal-homework_focus').click();

  await gate(c, 'Step3 shown', () => c.visible(c.tid('onb3-next')));
  await ctaInView(c, 'onb3-next', 'step3');
  await c.tid('onb3-next').click();

  await gate(c, 'Step4 shown', () => c.visible(c.tid('onb4-continue')));
  for (const m of ['gaming', 'sports', 'creative', 'social', 'privileges']) await c.tid(`onb4-motivator-${m}`).click();
  await ctaInView(c, 'onb4-continue', 'step4-5-motivators');

  if (reloadAt === 'step4') {
    // The app writes the onboarding snapshot debounced (400ms); reloading the
    // instant Step 4 renders can beat the write (D1 flaked once, 2026-09-26).
    await c.page.waitForFunction(() => /"route":"UStep4_/.test(localStorage.getItem('buff_onboarding_nav_v1') || ''), null, { timeout: 5000 })
      .catch(() => c.notes.push('snapshot naming Step 4 not seen before reload'));
    await c.page.reload({ waitUntil: 'domcontentloaded' });
    await gate(c, 'reload@step4 → Welcome resume offered', () => c.visible(c.tid('welcome-resume'), 20000));
    await c.tid('welcome-resume').click();
    await gate(c, 'resume lands on Step4', () => c.visible(c.tid('onb4-continue')));
    for (const m of ['gaming']) {
      // selection is route-param state; re-pick is fine if it was not persisted
      const sel = await c.tid(`onb4-motivator-${m}`).getAttribute('aria-selected').catch(() => null);
      if (sel !== 'true') await c.tid(`onb4-motivator-${m}`).click();
    }
  }
  await c.tid('onb4-continue').click();

  await gate(c, 'Step5 preview (saved)', () => c.visible(c.tid('onb5-continue'), 20000));
  if (broadcastAt) {
    // Another tab of the app (same user) emits SIGNED_IN; supabase-js relays it
    // to this tab over BroadcastChannel(storageKey). Adi's web run 2026-09-26:
    // the parent was thrown back to the first onboarding screen at this point.
    // 'step5' relays the session this tab holds; 'step5-newtoken' a session
    // with another access token (the other tab signed in / refreshed itself).
    await c.page.evaluate(([k, newToken]) => {
      const session = JSON.parse(localStorage.getItem(k) || 'null');
      if (newToken) session.access_token = `${session.access_token}.othertab`;
      new BroadcastChannel(k).postMessage({ event: 'SIGNED_IN', session });
    }, [AUTH_STORAGE_KEY, broadcastAt === 'step5-newtoken']);
    await c.page.waitForTimeout(2500);
    await gate(c, 'same-user SIGNED_IN from another tab keeps the parent on Step5', async () => {
      if (await c.tid('welcome-cta').or(c.tid('welcome-resume')).first().isVisible().catch(() => false)) throw new Error('thrown back to Welcome');
      await c.visible(c.tid('onb5-continue'), 5000);
    });
  }
  await ctaInView(c, 'onb5-continue', 'step5');
  await gate(c, 'child profile created', async () => {
    const parent = c.db.tables.profiles.filter((p) => p.role === 'parent').at(-1);
    const kids = c.db.tables.profiles.filter((p) => p.role === 'child' && p.display_name === 'TestKid' && p.family_id === parent.family_id);
    if (kids.length !== 1) throw new Error(`expected 1 TestKid, got ${kids.length}`);
  });
  await c.tid('onb5-continue').click();

  await gate(c, 'Step6 first-task shown', () => c.visible(c.text(c.s.notNow)));
  await ctaInView(c, c.text(c.s.notNow), 'step6-not-now');
  await c.text(c.s.notNow).click();

  await gate(c, 'ChildAccess step shown', () => c.visible(c.tid('onb-access-own_phone')));
  await ctaInView(c, 'onb-access-shared_device', 'access-last-option');
  await c.tid('onb-access-own_phone-secondary').click().catch(async () => c.tid('onb-access-own_phone').click());

  await gate(c, 'Complete shown', () => c.visible(c.tid('onb8-cta'), 20000));
  await ctaInView(c, 'onb8-cta', 'step8-dashboard');
  await gate(c, 'onboarding_complete persisted', async () => {
    const p = c.db.tables.profiles.filter((x) => x.role === 'parent').at(-1);
    if (!p?.pro_settings?.onboarding_complete) throw new Error('parent pro_settings.onboarding_complete not set');
  });
  await c.tid('onb8-cta').click();
  await gate(c, 'lands on ParentApp', () => assertParentApp(c));
}

export async function assertParentApp(c) {
  // ParentTabs renders the tab bar; the Welcome / Step screens must be gone.
  await c.page.waitForFunction(() => !document.querySelector('[data-testid="welcome-cta"],[data-testid="onb8-cta"]'), null, { timeout: 15000 });
  await c.visible(c.page.locator('[role="tablist"]').first(), 15000);
}

async function assertChildApp(c) {
  await c.page.waitForFunction(() => !document.querySelector('input[placeholder]') , null, { timeout: 15000 });
  await c.visible(c.page.locator('[role="tablist"]').first(), 15000);
  const url = c.page.url();
  return url;
}

// ── A. new parent signup ───────────────────────────────────────────────────
export const flows = {
  async A1_signup_signedOut(c) {
    await c.open();
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.text(c.s.iAmParent), 20000));
    await ctaInView(c, c.tid('rolesel-login'), 'rolesel-login');
    await c.text(c.s.iAmParent).click();
    await fillSignup(c, 'adi.elgarat+e2e-signup@gmail.com');
    await walkOnboarding(c);
  },

  async A2_signup_withParentSession(c) {
    const { user } = seedOnboardedParent(c.db, { email: 'adi.elgarat+e2e-other@gmail.com' });
    await c.open({ sessionUser: user });
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection reachable while signed in', () => c.visible(c.text(c.s.iAmParent), 20000));
    await c.text(c.s.iAmParent).click();
    await fillSignup(c, 'adi.elgarat+e2e-signup2@gmail.com');
    await walkOnboarding(c);
  },

  async A3_grownUpSignIn_fromChildSession(c) {
    // Shared device, kid signed in last. The child UI has no logout by design;
    // the parent gets in via Child Settings → "Grown-up sign-in", then gives the
    // device back with Settings → "Hand back to {name}".
    const { fam } = seedOnboardedParent(c.db);
    const { user, child } = seedChildLinked(c.db, fam);
    await c.open({ sessionUser: user });
    await c.goto('/');
    await gate(c, 'child session → ChildApp', () => c.visible(c.page.locator('[role="tablist"]').first(), 20000));
    await dismissChildSheets(c);
    await c.page.getByRole('tab').last().click();
    const row = c.tid('child-grownup-signin');
    await gate(c, '"Grown-up sign-in" row in Child Settings', async () => { await row.scrollIntoViewIfNeeded({ timeout: 10000 }); await c.visible(row, 5000); });
    await row.click();
    await gate(c, 'grown-up Login shown', () => c.visible(c.text(c.lang === 'he' ? 'היי! כניסה של מבוגר' : 'Hi! Sign in as a grown-up'), 10000));
    // A curious tap loses nothing: "Back to BUFF" returns to the child app.
    await c.tid('login-grownup-back').click();
    await gate(c, '"Back to BUFF" → still the child', async () => { await dismissChildSheets(c); await c.visible(c.tid('child-grownup-signin'), 10000); });
    await c.tid('child-grownup-signin').click();
    await loginAs(c, 'adi.elgarat+e2e-returning@gmail.com', PW);
    await gate(c, 'parent signs in → ParentApp', () => assertParentApp(c));
    await c.page.getByRole('tab').last().click();
    const hb = c.page.getByText(c.lang === 'he' ? `החזרה ל${child.display_name}` : `Hand back to ${child.display_name}`, { exact: true });
    await gate(c, '"Hand back to TestLinked" in parent Settings', async () => { await hb.scrollIntoViewIfNeeded({ timeout: 10000 }); await c.visible(hb, 5000); });
    await hb.click();
    const card = c.page.locator(`text="${child.display_name}" >> visible=true`).first(); // screens behind the picker also carry the name
    await gate(c, 'hand back → card picker (code pre-filled, found)', () => c.visible(card, 10000));
    await card.click();
    await gate(c, 'child back in → ChildApp', () => c.visible(c.tid('child-grownup-signin').or(c.page.locator('[role="tablist"]')).first(), 15000));
    await c.check('child is the signed-in user again', async () => {
      const tok = await c.page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}').user?.id, 'sb-gfrongfnyigxsexuofrg-auth-token');
      if (tok !== user.id) throw new Error(`session user ${tok}`);
    });
  },

  async A4_google_button(c) {
    await c.open();
    await c.goto('/Signup');
    await gate(c, 'Signup deep link resolves', () => c.visible(c.page.getByPlaceholder(c.s.email), 20000));
    const g = c.text(c.s.googleUp);
    await ctaInView(c, g, 'signup-google');
    await c.goto('/Login');
    await gate(c, 'Login deep link resolves', () => c.visible(c.text(c.s.google), 20000));
    await ctaInView(c, c.text(c.s.google), 'login-google');
    const [req] = await Promise.all([
      c.page.waitForRequest(/\/auth\/v1\/authorize/, { timeout: 10000 }),
      c.text(c.s.google).click(),
    ]);
    await c.check('google authorize redirect_to = origin/', () => {
      const r = new URL(req.url()).searchParams.get('redirect_to');
      if (r !== c.baseUrl + '/') throw new Error(`redirect_to=${r}`);
      return r;
    });
    await c.check('google authorize asks for the account chooser (prompt=select_account)', () => {
      const p = new URL(req.url()).searchParams.get('prompt');
      if (p !== 'select_account') throw new Error(`prompt=${p}`);
      return p;
    });
  },

  async A10_grownUp_signUp_fromChildSession(c) {
    // Android run 2026-09-24 finding: Grown-up sign-in → "Sign Up" → Create
    // Account did nothing. A NEW parent on a shared device (kid signed in) must
    // be able to create an account from here.
    const { fam } = seedOnboardedParent(c.db);
    const { user } = seedChildLinked(c.db, fam);
    await c.open({ sessionUser: user });
    await c.goto('/');
    await gate(c, 'child session → ChildApp', () => c.visible(c.page.locator('[role="tablist"]').first(), 20000));
    await dismissChildSheets(c);
    await c.page.getByRole('tab').last().click();
    const row = c.tid('child-grownup-signin');
    await row.scrollIntoViewIfNeeded({ timeout: 10000 });
    await row.click();
    await gate(c, 'grown-up Login shown', () => c.visible(c.page.getByPlaceholder(c.s.email), 10000));
    await c.page.getByText(c.s.signup, { exact: true }).last().click();
    await fillSignup(c, 'adi.elgarat+e2e-signup-from-child@gmail.com');
    await gate(c, 'new parent → Welcome (not stuck on Signup)', () => c.visible(c.tid('welcome-cta'), 20000));
    await c.check('new parent account created', () => {
      if (!c.db.users.some((u) => u.email === 'adi.elgarat+e2e-signup-from-child@gmail.com')) throw new Error('no auth user');
    });
  },

  async A5_google_callback_newUser(c) {
    // Simulates the return from Google: tokens in the URL fragment, no profile yet.
    const u = addUser(c.db, { email: 'adi.elgarat+e2e-google@gmail.com', meta: { full_name: 'Test Google' } });
    await c.open();
    const { sessionFor } = await import('./lib/mockSupabase.mjs');
    const s = sessionFor(u);
    await c.goto(`/#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer&type=signup`);
    await gate(c, 'AuthCallback picker shown', () => c.visible(c.tid('authcb-parent'), 20000));
    await c.check('no "Teen" (no-family child) option', async () => {
      if (await c.page.getByText(c.s.teen, { exact: true }).count()) throw new Error('Teen option still shown');
    });
    await c.check('shows which Google account is signed in', () => c.visible(c.text('adi.elgarat+e2e-google@gmail.com'), 5000));
    await c.tid('authcb-parent').click();
    await gate(c, 'Google parent → Welcome', () => c.visible(c.tid('welcome-cta'), 20000));
  },

  async A8_google_familyCodeExit(c) {
    // A kid who tapped Google by mistake: "I have a family code" → ChildJoin.
    const { fam } = seedOnboardedParent(c.db);
    void fam;
    const u = addUser(c.db, { email: 'adi.elgarat+e2e-google-kid@gmail.com' });
    await c.open();
    const s = (await import('./lib/mockSupabase.mjs')).sessionFor(u);
    await c.goto(`/#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer`);
    await gate(c, 'AuthCallback picker shown', () => c.visible(c.tid('authcb-family-code'), 20000));
    await c.tid('authcb-family-code').click();
    await gate(c, 'ChildJoin shown', () => c.visible(c.page.getByPlaceholder(c.s.codePh), 10000));
    await c.page.getByPlaceholder(c.s.codePh).fill('TSTFAM');
    await c.page.getByText(c.s.continue, { exact: true }).last().click();
    await c.text('TestKid').click();
    await gate(c, 'child → ChildApp', () => c.visible(c.page.locator('[role="tablist"]').first(), 15000));
    await c.check('no profile created for the Google account', () => {
      if (c.db.tables.profiles.some((p) => p.user_id === u.id)) throw new Error('profile created for Google user');
    });
  },

  async A9_google_differentAccountExit(c) {
    const u = addUser(c.db, { email: 'adi.elgarat+e2e-google-wrong@gmail.com' });
    await c.open();
    const s = (await import('./lib/mockSupabase.mjs')).sessionFor(u);
    await c.goto(`/#access_token=${s.access_token}&refresh_token=${s.refresh_token}&expires_in=3600&token_type=bearer`);
    await gate(c, 'AuthCallback picker shown', () => c.visible(c.tid('authcb-other-account'), 20000));
    await ctaInView(c, 'authcb-other-account', 'authcb-other-account');
    await c.tid('authcb-other-account').click();
    await gate(c, '"Use a different account" → RoleSelection, signed out', async () => {
      await c.visible(c.text(c.s.iAmParent), 15000);
      const tok = await c.page.evaluate((k) => localStorage.getItem(k), 'sb-gfrongfnyigxsexuofrg-auth-token');
      if (tok) throw new Error('session still stored');
    });
  },

  async A6_restart_sameChildName_duplicate(c) {
    // Parent whose first pass already created TestKid (reload / "start fresh" /
    // legacy account) and who types the same name again. The duplicate dialog's
    // "Open" and "Cancel" must lead somewhere — the parent is still in the
    // onboarding branch, where ParentApp is not registered.
    const { user } = seedOnboardedParent(c.db, { onboarded: false, withChild: true });
    await c.open({ sessionUser: user });
    await c.goto('/');
    await gate(c, 'Welcome shown', () => c.visible(c.tid('welcome-cta'), 20000));
    await c.tid('welcome-cta').click();
    await gate(c, 'Step1 shown', () => c.visible(c.tid('onb1-child-name')));
    await c.tid('onb1-child-name').fill('TestKid');
    await c.tid('onb1-age-9-11').click();
    await c.tid('onb1-next').click();
    await c.tid('onb2-goal-homework_focus').click();
    await c.tid('onb3-next').click();
    await c.tid('onb4-motivator-gaming').click();
    await c.tid('onb4-continue').click();
    const open = c.lang === 'he' ? 'פתח/י את TestKid' : 'Open TestKid';
    await gate(c, 'duplicate dialog shown', () => c.visible(c.page.getByText(open, { exact: true }), 20000));
    await c.page.getByText(open, { exact: true }).click();
    await gate(c, '"Open TestKid" closes the dialog and keeps the wizard going', async () => {
      await c.page.getByText(open, { exact: true }).waitFor({ state: 'hidden', timeout: 5000 });
      await c.tid('onb5-continue').click();
      await c.visible(c.text(c.s.notNow), 8000);
    });
    await c.check('no duplicate child created', () => {
      const n = c.db.tables.profiles.filter((p) => p.role === 'child' && p.display_name === 'TestKid').length;
      if (n !== 1) throw new Error(`${n} TestKid profiles`);
    });
  },

  async A7_signup_afterOtherParentMidOnboarding(c) {
    // Parent A stopped at Step 3 on this browser (snapshot names A's child);
    // parent B then creates an account here. B must not be offered A's flow.
    const { user } = seedOnboardedParent(c.db, { email: 'adi.elgarat+e2e-otherA@gmail.com', onboarded: false, withChild: false });
    const snap = { route: 'UStep3_Challenges', params: { childName: 'OtherKidA', ageGroup: '9-11', mainChallenge: 'homework_focus' }, t: Date.now() };
    await c.open({ sessionUser: user, extraStorage: { buff_onboarding_nav_v1: JSON.stringify(snap) } });
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.text(c.s.iAmParent), 20000));
    await c.text(c.s.iAmParent).click();
    await fillSignup(c, 'adi.elgarat+e2e-signupB@gmail.com');
    await gate(c, 'new parent B lands on Welcome', () => c.visible(c.tid('welcome-cta').or(c.tid('welcome-resume')).first(), 20000));
    await c.check("B is not offered parent A's unfinished flow", async () => {
      if (await c.tid('welcome-resume').isVisible()) throw new Error(`resume offered: "${(await c.page.innerText('body')).match(/[^\n]*OtherKidA[^\n]*/)?.[0] ?? 'resume'}"`);
    });
  },

  // ── B. returning parent ──────────────────────────────────────────────────
  async B1_login_onboarded(c) {
    seedOnboardedParent(c.db);
    await c.open();
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.tid('rolesel-login'), 20000));
    await c.tid('rolesel-login').click();
    await loginAs(c, 'adi.elgarat+e2e-returning@gmail.com', PW);
    await gate(c, 'onboarded parent → ParentApp (not onboarding)', () => assertParentApp(c));
  },

  async B2_login_midOnboarding_resume(c) {
    const { user, fam } = seedOnboardedParent(c.db, { onboarded: false, withChild: false });
    // Snapshot the web persistence would have written at Step 3.
    // `uid` = owner stamp (snapshots are offered back only to the parent who wrote them).
    const snap = { route: 'UStep3_Challenges', params: { childName: 'TestKid', ageGroup: '9-11', mainChallenge: 'homework_focus' }, t: Date.now(), uid: user.id };
    await c.open({ extraStorage: { buff_onboarding_nav_v1: JSON.stringify(snap) } });
    void fam;
    await c.goto('/Login');
    await loginAs(c, 'adi.elgarat+e2e-returning@gmail.com', PW);
    await gate(c, 'mid-onboarding parent → Welcome with resume offer', () => c.visible(c.tid('welcome-resume'), 20000));
    await ctaInView(c, 'welcome-resume', 'welcome-resume');
    await c.tid('welcome-resume').click();
    await gate(c, 'resume lands on Step3 (where they left off)', () => c.visible(c.tid('onb3-next'), 10000));
  },

  async B3_login_legacyParent(c) {
    // KNOWN GAP (parentRouting.ts): a parent with children but no
    // onboarding_complete is routed to Welcome, not ParentApp — there is no
    // client signal to tell them from a parent mid-wizard. Asserted as the
    // documented behaviour; the duplicate-name dialog (A6) is their way through.
    seedOnboardedParent(c.db, { onboarded: false, withChild: true });
    await c.open();
    await c.goto('/Login');
    await loginAs(c, 'adi.elgarat+e2e-returning@gmail.com', PW);
    await gate(c, 'legacy parent → Welcome (documented gap, not ParentApp)', () => c.visible(c.tid('welcome-cta'), 20000));
  },

  async B4_wrongPassword(c) {
    seedOnboardedParent(c.db);
    await c.open();
    await c.goto('/Login');
    await loginAs(c, 'adi.elgarat+e2e-returning@gmail.com', 'wrong-pass');
    await gate(c, 'error shown', () => c.visible(c.text(c.s.invalidCreds), 10000));
    await c.check('button not stuck loading', async () => {
      await c.page.keyboard.press('Escape').catch(() => {});
      const ok = c.page.getByText(c.lang === 'he' ? 'אישור' : 'OK', { exact: true });
      if (await ok.isVisible().catch(() => false)) await ok.click();
      await c.visible(c.page.getByText(c.s.login, { exact: true }).last(), 5000);
    });
  },

  async B5_logout_login(c) {
    seedOnboardedParent(c.db);
    const u = c.db.users[0];
    await c.open({ sessionUser: u });
    await c.goto('/');
    await gate(c, 'session restore → ParentApp', () => assertParentApp(c));
    // Settings tab → sign out
    const settingsTab = c.page.getByRole('tab').last();
    await settingsTab.click();
    const so = c.page.getByText(c.lang === 'he' ? /התנתק|יציאה/ : /Sign out|Log out/i).first();
    await gate(c, 'sign-out row visible', () => c.visible(so, 10000));
    await so.scrollIntoViewIfNeeded();
    await so.click();
    const confirm = c.page.getByText(c.lang === 'he' ? /התנתק|יציאה/ : /Sign out|Log out/i).last();
    if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {});
    await gate(c, 'after sign-out: signed-out surface (external marketing redirect or RoleSelection)', async () => {
      await c.page.waitForFunction(() => document.querySelector('#external') || /RoleSelection|Login/.test(location.pathname) || document.body.innerText.includes('BUFF'), null, { timeout: 15000 });
      return c.page.url();
    });
    await c.goto('/Login');
    await loginAs(c, 'adi.elgarat+e2e-returning@gmail.com', PW);
    await gate(c, 're-login → ParentApp', () => assertParentApp(c));
  },

  // B5's intermittent CI failure, made deterministic (2026-09-25): the parent's
  // session is still there when /Login loads (in B5, the reload raced the
  // sign-out), so Login shows over the parent branch (shared-device screens).
  // Signing in again as the SAME account must still leave the spent /Login.
  async B6_signedIn_loginAgain_sameAccount(c) {
    const { user } = seedOnboardedParent(c.db);
    await c.open({ sessionUser: user });
    await c.goto('/Login');
    await loginAs(c, user.email, PW);
    await gate(c, 'same account again → ParentApp (not the Login form)', () => assertParentApp(c));
  },

  // ── C. child ─────────────────────────────────────────────────────────────
  async C1_joinLink_unlinkedChild(c) {
    seedOnboardedParent(c.db);
    await c.open();
    await c.goto('/join/TSTFAM');
    await gate(c, 'join link → ChildJoin prefilled', async () => {
      await c.visible(c.page.getByPlaceholder(c.s.codePh), 20000);
      const v = await c.page.getByPlaceholder(c.s.codePh).inputValue();
      if (v !== 'TSTFAM') throw new Error(`code=${v}`);
    });
    const cont = c.page.getByText(c.s.continue, { exact: true }).last();
    await ctaInView(c, cont, 'childjoin-continue');
    await cont.click();
    await gate(c, 'child card shown', () => c.visible(c.text('TestKid')));
    await c.text('TestKid').click();
    await gate(c, 'unlinked child → ChildApp', () => assertChildApp(c));
    await c.check('profile linked, no duplicate', () => {
      const kids = c.db.tables.profiles.filter((p) => p.role === 'child');
      if (kids.length !== 1 || !kids[0].user_id) throw new Error(JSON.stringify(kids.map((k) => [k.display_name, !!k.user_id])));
    });
    await c.page.reload({ waitUntil: 'domcontentloaded' });
    await gate(c, 'reload keeps child signed in', () => assertChildApp(c));
  },

  async C2_roleSelection_childJoin_linked(c) {
    const { fam } = seedOnboardedParent(c.db);
    seedChildLinked(c.db, fam);
    await c.open();
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.text(c.s.iAmChild), 20000));
    await c.text(c.s.iAmChild).click();
    await gate(c, 'ChildJoin shown', () => c.visible(c.page.getByPlaceholder(c.s.codePh)));
    await c.page.getByPlaceholder(c.s.codePh).fill('tstfam');
    await c.page.getByText(c.s.continue, { exact: true }).last().click();
    await gate(c, 'child card shown', () => c.visible(c.text('TestLinked')));
    await c.text('TestLinked').click();
    await gate(c, 'linked child → ChildApp', () => assertChildApp(c));
  },

  async C3_wrongFamilyCode(c) {
    seedOnboardedParent(c.db);
    await c.open();
    await c.goto('/join/ZZZZZZ');
    await gate(c, 'ChildJoin shown', () => c.visible(c.page.getByPlaceholder(c.s.codePh), 20000));
    await c.page.getByText(c.s.continue, { exact: true }).last().click();
    await gate(c, 'code-not-found error', () => c.visible(c.text(c.s.codeNotFound), 10000));
  },

  async C4_teenSignup_username(c) {
    seedOnboardedParent(c.db);
    await c.open();
    await c.goto('/Signup');
    await gate(c, 'Signup shown', () => c.visible(c.page.getByText(c.s.teen, { exact: true }), 20000));
    await c.page.getByText(c.s.teen, { exact: true }).click();
    await c.page.getByPlaceholder(c.s.displayName).fill('TestTeen');
    await gate(c, 'username field', () => c.visible(c.page.getByPlaceholder(c.s.username)));
    await c.page.getByPlaceholder(c.s.username).fill('testteen' + Date.now() % 10000);
    await c.page.getByPlaceholder(c.s.password, { exact: true }).fill(PW);
    await c.page.getByPlaceholder(c.s.codePh).fill('TSTFAM');
    const btn = c.page.getByText(c.s.createAccount, { exact: true }).last();
    await ctaInView(c, btn, 'teen-create');
    await btn.click();
    await gate(c, 'teen → ChildApp', () => assertChildApp(c));
    await c.check('teen profile in family', () => {
      const t = c.db.tables.profiles.find((p) => p.display_name === 'TestTeen');
      if (!t || t.family_id !== c.db.tables.families[0].id || t.role !== 'child') throw new Error(JSON.stringify(t));
    });
  },

  async C5_join_sharedDevice_parentSignedIn(c) {
    const { user } = seedOnboardedParent(c.db);
    await c.open({ sessionUser: user });
    await c.goto('/join/TSTFAM');
    await gate(c, 'join link resolves with parent signed in', () => c.visible(c.page.getByPlaceholder(c.s.codePh), 20000));
    await c.page.getByText(c.s.continue, { exact: true }).last().click();
    await gate(c, 'child card shown', () => c.visible(c.text('TestKid')));
    await c.text('TestKid').click();
    await gate(c, 'child replaces parent session → ChildApp', () => assertChildApp(c));
    await c.check('parent profile untouched', () => {
      const p = c.db.tables.profiles.find((x) => x.role === 'parent');
      if (p.user_id !== user.id) throw new Error('parent profile relinked!');
    });
  },

  async C6_welcome_childJoin_midOnboarding(c) {
    const { user } = seedOnboardedParent(c.db, { onboarded: false, withChild: false });
    await c.open({ sessionUser: user });
    await c.goto('/');
    await gate(c, 'Welcome shown', () => c.visible(c.tid('welcome-child-join'), 20000));
    await ctaInView(c, 'welcome-child-join', 'welcome-child-join');
    await c.tid('welcome-child-join').click();
    await gate(c, 'ChildJoin from Welcome', () => c.visible(c.page.getByPlaceholder(c.s.codePh)));
  },

  // ── D. cross-cutting ─────────────────────────────────────────────────────
  async D4_otherTabSignedIn_midOnboarding(c) {
    await c.open();
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.text(c.s.iAmParent), 20000));
    await c.text(c.s.iAmParent).click();
    await fillSignup(c, 'adi.elgarat+e2e-othertab@gmail.com');
    await walkOnboarding(c, { broadcastAt: 'step5' });
  },

  async D5_otherTabNewSession_midOnboarding(c) {
    await c.open();
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.text(c.s.iAmParent), 20000));
    await c.text(c.s.iAmParent).click();
    await fillSignup(c, 'adi.elgarat+e2e-othertab2@gmail.com');
    await walkOnboarding(c, { broadcastAt: 'step5-newtoken' });
  },

  async D1_reload_midOnboarding(c) {
    await c.open();
    await c.goto('/RoleSelection');
    await gate(c, 'RoleSelection shown', () => c.visible(c.text(c.s.iAmParent), 20000));
    await c.text(c.s.iAmParent).click();
    await fillSignup(c, 'adi.elgarat+e2e-reload@gmail.com');
    await walkOnboarding(c, { reloadAt: 'step4' });
  },

  async D2_deepLinks_signedOut(c) {
    await c.open();
    for (const [p, loc] of [
      ['/RoleSelection', () => c.text(c.s.iAmParent)],
      ['/Login', () => c.text(c.s.google)],
      ['/Signup', () => c.page.getByPlaceholder(c.s.email)],
      ['/join/abc123', () => c.page.getByPlaceholder(c.s.codePh)],
    ]) {
      await c.goto(p);
      await c.check(`deep link ${p}`, () => c.visible(loc(), 20000));
    }
    await c.goto('/founding-100');
    await c.check('deep link /founding-100 signed-out → does not crash', async () => {
      await c.page.waitForTimeout(3000);
      if (c.logs.some((l) => l.startsWith('[pageerror]'))) throw new Error(c.logs.find((l) => l.startsWith('[pageerror]')));
      return c.page.url();
    });
  },

  async D3_deepLinks_parentSignedIn(c) {
    const { user } = seedOnboardedParent(c.db);
    await c.open({ sessionUser: user });
    for (const [p, loc] of [
      ['/RoleSelection', () => c.text(c.s.iAmParent)],
      ['/Login', () => c.text(c.s.google)],
      ['/Signup', () => c.page.getByPlaceholder(c.s.email)],
      ['/join/TSTFAM', () => c.page.getByPlaceholder(c.s.codePh)],
    ]) {
      await c.goto(p);
      await c.check(`deep link ${p} with parent session`, () => c.visible(loc(), 20000));
    }
    await c.goto('/');
    await c.check('/ with parent session → ParentApp', () => assertParentApp(c));
  },
};

async function loginAs(c, email, pw) {
  await gate(c, 'Login shown', () => c.visible(c.page.getByPlaceholder(c.s.email), 20000));
  await c.page.getByPlaceholder(c.s.email).fill(email);
  await c.page.getByPlaceholder(c.s.password, { exact: true }).fill(pw);
  const btn = c.page.getByText(c.s.login, { exact: true }).last();
  await ctaInView(c, btn, 'login-submit');
  await btn.click();
}
