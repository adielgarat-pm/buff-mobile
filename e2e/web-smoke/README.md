# BUFF web smoke — auth, onboarding, child join (≈2–15 min)

Drives the **real web bundle** (`expo export -p web`) in Chromium against an
**in-memory Supabase mock**. No network, no production data, no new npm
dependency — it uses the globally installed `playwright` package (the Claude
Code cloud sandbox has it at `/opt/node22/lib/node_modules/playwright`; set
`PLAYWRIGHT_MODULE=/path/to/playwright/index.js` elsewhere).

Run it before merging anything that touches `src/navigation/**`,
`src/contexts/AuthContext.tsx`, `src/screens/auth/**` or
`src/screens/onboarding/**`.

```bash
npx expo export -p web --clear --output-dir /tmp/webdist   # ~1–2 min; --clear: Metro's cache keeps old EXPO_PUBLIC_* values (IN-2026-09-25-03)
node e2e/web-smoke/run.mjs --dist /tmp/webdist             # full matrix (~15 min)
node e2e/web-smoke/run.mjs --dist /tmp/webdist --vp m390 --lang en   # quick pass (~2 min)
node e2e/web-smoke/run.mjs --dist /tmp/webdist --flows B1,A6         # just some flows
node e2e/web-smoke/report.mjs e2e/web-smoke/.out/results.json         # markdown matrix
```

Output: one `PASS/FAIL flow viewport lang` line per case, `results.json` with
every check, the `fold:` notes and console errors, plus a screenshot per failure
and one at the end of every case, in `--out` (default `e2e/web-smoke/.out/`,
git-ignored). Exit code 1 if any case failed.

## CI (`.github/workflows/web-smoke.yml`)

Runs on every PR that touches `src/navigation/**`, `src/contexts/AuthContext.tsx`,
`src/screens/auth/**`, `src/screens/onboarding/**`, `src/lib/handBack.ts`,
`src/components/NotificationGate.tsx`, `e2e/web-smoke/**` or the workflow itself.
Quick matrix `--vp m390,m360 --lang en,he`. Playwright comes from the existing,
lockfile-pinned `@playwright/test` devDependency (no package.json change); only
Chromium is installed in the job, and `PLAYWRIGHT_MODULE` points the harness at
`node_modules/playwright`. On failure `e2e/web-smoke/.out` is uploaded as the
`web-smoke-out` artifact; the pass/fail matrix is always written to the job summary.

The harness pins `Notification.permission` to `'denied'`: its initial value
differs between Playwright/Chromium builds, and `'default'` opens the push
pre-prompt modal over the flow. The pre-prompt path itself is not covered here.

## Matrix

| axis | values |
|------|--------|
| viewport | `m360` 360×560 (touch), `m390` 390×664 (touch), `desk` 1280×800 |
| language | `en`, `he` (RTL) — via the `buff_language` storage key |
| session  | per flow: signed out / parent signed in / child signed in |

## Flows (`flows.mjs`)

| id | what it proves |
|----|----------------|
| A1 | RoleSelection → I'm a parent → Signup → Welcome → Steps 1–5 → first task → child access → Complete → ParentApp; every CTA reachable |
| A2 | same, starting with ANOTHER parent signed in on the device (#479) |
| A3 | child signed in → Child Settings "Grown-up sign-in" → "Back to BUFF" → parent login → ParentApp → "Hand back to {name}" → card picker → child again |
| A4 | Google buttons reachable; authorize redirect_to = origin/ |
| A5 | Google return (tokens in fragment, no profile) → picker (no "Teen", shows the account) → parent → Welcome |
| A6 | parent mid-wizard re-types an existing child's name → duplicate dialog "Open" continues |
| A7 | parent B signs up where parent A stopped mid-wizard → B is NOT offered A's flow |
| A8 | Google picker → "I have a family code" → ChildJoin → ChildApp, no profile for the Google account |
| A9 | Google picker → "Not you? Use a different account" → RoleSelection, signed out |
| A10 | child signed in → Grown-up sign-in → "Sign Up" → new parent account → Welcome |
| B1 | returning onboarded parent login → ParentApp (regression 2026-09-24) |
| B2 | parent who stopped at Step 3 logs in → Welcome offers resume → Step 3 |
| B3 | legacy parent (children, no onboarding_complete) → Welcome (documented gap) |
| B4 | wrong password → error, button usable |
| B5 | session restore → Settings → Sign out → Login again → ParentApp |
| B6 | parent session still present on /Login → signs in again as the same account → ParentApp (B5's race, deterministic) |
| C1 | /join/CODE → prefilled → pick unlinked child → ChildApp, linked, no duplicate; reload stays signed in |
| C2 | RoleSelection → I'm a child → code → pick linked child → ChildApp |
| C3 | wrong family code → error |
| C4 | teen signup with username + family code → ChildApp in that family |
| C5 | /join/CODE with a PARENT signed in → child replaces session → ChildApp |
| C6 | Welcome "child join" link (parent mid-onboarding) → ChildJoin |
| D1 | A1 with a browser reload on Step 4 → resume → finish |
| D2 | cold deep links signed out: /RoleSelection /Login /Signup /join/:code /founding-100 |
| D3 | same links with a parent signed in, then / → ParentApp |

## CTA checks

* **pinned** CTAs (footers — Welcome, Steps 1/3/4/5, Complete — and RoleSelection's
  returning-user login): must be fully inside the viewport as rendered.
* every other CTA: must be **reachable** — scrolled into view it fits the
  viewport. Whether it starts below the fold is logged as a `fold:` note.

## The mock (`lib/mockSupabase.mjs`)

GoTrue (signup / password + refresh token / user / logout / authorize stub) and a
PostgREST subset (eq/in/is/neq filters, insert/upsert/update/delete, object vs
array by `Accept`), plus the RPCs of these paths (`lookup_family_by_code`,
`list_family_children`, `link_child_profile`, `preflight_claim_orphan`,
`claim_orphan_profile`, `create_child_profile`, …). Unknown tables return `[]`,
unknown RPCs `null`; both are listed under `unhandled` in `results.json`.
It is a **contract stand-in, not the backend** — RLS and triggers are verified
separately (Supabase MCP, rolled-back transactions).

Gotchas learned building it:
* the exported app registers a **service worker**; its fetches bypass
  `context.route`, so the context blocks service workers.
* `access-control-allow-headers: *` does not cover `Authorization` — the CORS
  preflight needs the header list spelled out, or every POST fails as
  `net::ERR_FAILED`.
