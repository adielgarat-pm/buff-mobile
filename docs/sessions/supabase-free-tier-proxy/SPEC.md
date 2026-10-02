# SPEC — Supabase Pro → Free, keeping `api.buffadhd.com` alive via a Cloudflare Worker proxy

> **Status:** DESIGN ONLY — awaiting Adi `approved, proceed` + decisions D1–D4 (§6).
> **Type:** Cost-reduction / infra. No app code change, no new build, no OTA, no schema change.
> **Created:** 2026-10-02

## 1. Problem & Goal

### 1.1 Problem
BUFF has no revenue yet and Adi is cutting fixed costs. Supabase is the largest infra line:
**Pro plan (~$25/mo) + Custom Domain add-on (~$10/mo) ≈ $35/mo ≈ $420/yr.**

Actual usage (read-only SQL, 2026-10-02, project `gfrongfnyigxsexuofrg`):

| Metric | Value | Free-tier limit |
|---|---|---|
| DB size | 34 MB | 500 MB |
| Storage objects | 0 bytes | 1 GB |
| Auth users (total) | 96 | 50,000 MAU |
| Users signed in, last 30 days | 10 | — |
| Org plan | `pro` | — |

On volume alone, Free is sufficient by orders of magnitude.

### 1.2 Why we can't just click "downgrade"
Every shipped Android build and the web build have `EXPO_PUBLIC_SUPABASE_URL=https://api.buffadhd.com` baked in at build time (`eas.json`, all 3 profiles; #290, 2026-06-26). That hostname exists only because of the **Custom Domain add-on, which requires Pro**. Downgrading removes it →
1. **Every installed app loses its backend** until a new build is installed (store builds are not OTA-fixable for a build-time env).
2. The original reason for #290 returns: some Israeli cellular carriers SNI-reset `*.supabase.co` (`docs/RELEASE_QUEUE.md` row #290).
3. The supabase-js `storageKey` is pinned (#295), so the URL host must stay stable or sessions are lost.

### 1.3 Goal
Serve `api.buffadhd.com` from a **free Cloudflare Worker** that transparently proxies to `gfrongfnyigxsexuofrg.supabase.co`, then remove the add-on and drop to Free — with **zero change on the client** (same hostname, same keys, same storage key, no rebuild).

**Success metric:** Supabase invoice = $0 for the first full month after downgrade, with no increase in Sentry errors / auth failures vs the 7 days before cutover.
**Guardrail:** no installed Android build or web session loses connectivity at any phase.

## 2. Solution overview

```
before:  app ──TLS(api.buffadhd.com)──▶ Supabase Custom Domain (Pro add-on) ──▶ project
after:   app ──TLS(api.buffadhd.com)──▶ Cloudflare Worker (free) ──fetch──▶ gfrongfnyigxsexuofrg.supabase.co
```

- The Worker rewrites only the hostname and forwards method, headers, body (streamed) and WebSocket upgrades. The client cannot tell the difference.
- Cloudflare Workers custom domains require the **zone to be on Cloudflare**. DNS for `buffadhd.com` is currently at **Namecheap** (`docs/sessions/admin-dashboard-port/DEPLOYMENT.md` §2.1) → the nameservers move to Cloudflare (free plan). Registration can stay at Namecheap.
- The same Worker gets a free **Cron Trigger** (daily keep-alive request), because Free projects pause after ~7 days without activity.

### 2.1 Surfaces the proxy must carry (verified in code)
| Surface | Used by | Proxy note |
|---|---|---|
| PostgREST `/rest/v1` | everything | plain HTTP |
| Auth `/auth/v1` | email/password, refresh, Google OAuth (`AuthContext.tsx:437-500`), Apple id-token | see §5 R1 (OAuth callback host) |
| Realtime `/realtime/v1` (WebSocket) | `useAppSettings.ts:110`, `useActivities.ts:127`, `useFamilyMembers.ts:74`, `useParentNotifications` | Worker must pass `Upgrade: websocket` through (supported by `fetch`) |
| Edge Functions `/functions/v1` | `parse-capture`, `parse-schedule`, `generate-child-insights`, `track-referral-click`, `push-notification-fanout` (DB webhook — server-side, not via domain) | long AI calls: Workers don't bill I/O wait, no wall-clock issue |
| Storage `/storage/v1` | 0 objects today | pass-through anyway |

### 2.2 Worker sketch (implemented in Phase 1, not now)
```js
const ORIGIN = 'gfrongfnyigxsexuofrg.supabase.co';
export default {
  async fetch(req) {
    const url = new URL(req.url);
    url.hostname = ORIGIN;
    return fetch(new Request(url, req)); // streams body, keeps method/headers, passes WS upgrade
  },
  async scheduled(_evt, env) {           // daily keep-alive (Free-tier pause guard)
    await fetch(`https://${ORIGIN}/auth/v1/health`, { headers: { apikey: env.ANON_KEY } });
  },
};
```
No request/response bodies are logged (Pillar 2 — children's data). Workers observability logging stays off or headers-only.

## 3. Out of scope
- Any app code / `eas.json` / env change. (If needed, the package has failed its premise — stop.)
- Moving domain **registration** off Namecheap.
- Google Workspace → Zoho/Cloudflare Email Routing (separate cost item; this package must not touch MX/email records beyond copying them 1:1).
- Expo, Vercel, Claude-plan downgrades (separate, no-code decisions for Adi).
- Lovable Supabase project (not in this org; out of MCP reach).

## 4. Phases (detail in ROADMAP.md)
0. Prep & decisions — backups, DNS inventory, Cloudflare account. **No prod change.**
1. Build + deploy Worker on a `*.workers.dev` test URL; run the proxy test suite against it. **No prod change.**
2. Move `buffadhd.com` nameservers Namecheap → Cloudflare, all records copied 1:1, `api` still CNAME → Supabase (DNS-only). Reversible.
3. Cutover: attach Worker as custom domain `api.buffadhd.com`. Rollback = restore the CNAME (add-on still active) — minutes.
4. Soak 7 days on Pro behind the proxy.
5. Remove Custom Domain add-on → verify → downgrade org to Free at a low-traffic hour → verify.
6. Closeout docs.

## 5. Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | After the add-on is removed, Supabase Auth's external URL reverts to `*.supabase.co`. **Google OAuth's callback hop and auth email links (reset password / magic link) then pass through `supabase.co`** in the user's browser. The Worker can't rewrite this: Google's token exchange requires the `redirect_uri` to match GoTrue's own external URL. | On an SNI-blocking IL cellular network only: Google sign-in and email links fail. WiFi, other carriers, email/password sign-in, and all data traffic are unaffected. This was the situation before 2026-06-26. | D1 (accept). Optional D4: custom email templates that build links on `api.buffadhd.com/auth/v1/verify?token_hash=…` so email flows go through the proxy. |
| R2 | Free projects pause after ~7 days with no activity | App down until manual restore | Worker Cron keep-alive (daily) + Supabase pause-warning emails go to Adi |
| R3 | Free has no downloadable daily backups | Data loss on accident | Full `pg_dump` before downgrade (Phase 0) + D2 cadence |
| R4 | Nameserver move drops a record (MX, DKIM, Vercel, Resend) | Email or site outage | Phase 2 record-by-record diff before switching NS; NS switch is reversible; low TTL first |
| R5 | GoTrue per-IP rate limits see Cloudflare egress IPs instead of users | Auth 429s under burst | 10 MAU → negligible; monitor auth logs in Phase 4; Worker forwards `X-Forwarded-For` |
| R6 | Free compute (Nano) slower than Pro Micro | Slower queries | 34 MB DB / 10 MAU; verify p95 in Phase 5 |
| R7 | Worker free quota (100k req/day) | 429 from Worker | Current traffic is far below; check Cloudflare analytics in Phase 4 |
| R8 | `iss` claim on access tokens changes host after add-on removal | Tokens rejected? | GoTrue/PostgREST validate signature, not host; tokens live 1h; verified explicitly in Phase 5 (sign-in survives) |

Rollback after Phase 5: upgrade back to Pro and re-add Custom Domain (TXT verification in Cloudflare DNS), ~1h.

## 6. Decisions needed from Adi (before Phase 0)
- **D1 — Accept R1?** Google sign-in / email links may fail on blocked IL cellular networks (as before June). Yes → proceed. No → stop the package and keep Pro.
- **D2 — Backups on Free:** (a) CC runs `pg_dump` monthly to your local machine (not GitHub — children's data); (b) one-off dump only. *Recommended: (a).*
- **D3 — Worker deploy method:** (a) you paste the Worker into the Cloudflare dashboard (no tooling); (b) CC deploys with `npx wrangler` using a scoped Cloudflare API token stored as a secret. Wrangler is **not** added to `package.json`. *Recommended: (b), per CC-first delegation.*
- **D4 — Auth email templates through the proxy (R1 mitigation for email flows):** yes / later.

## 7. Values Check (infra — no user-facing behavior change)
**Pillar 1 — Intrinsic Motivation:** Q1–Q3 N/A. No reward, flow, or copy changes.
**Pillar 2 — Positive Coaching:** Q1–Q3 N/A for copy. Privacy angle: a new processor (Cloudflare) terminates TLS for app traffic. The Custom Domain add-on is already served via Cloudflare for SaaS, so the processor class is unchanged. The Worker logs no bodies. `landing-web/src/pages/Privacy.tsx` names no infra processors → no policy text change required.
**Pillar 3 — Independence-Building:** Q1–Q3 N/A.
**Indirect benefit:** lower burn keeps BUFF alive longer for the families using it.
Re-verify at exit against implemented behavior (Worker code + logging config).

## 8. Platform parity
Android and Web both use the same `api.buffadhd.com` → one change covers both. Each phase is verified on **Android (installed store build, no rebuild)** and **Web (buffadhd.com, logged-in parent + child)**.
