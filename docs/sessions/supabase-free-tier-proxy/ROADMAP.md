# Supabase Free-Tier Proxy — Roadmap

> Each phase = one chunk. Show result → Adi approves → next. Phases 2, 3 and 5 touch production and need an explicit go each time.

## Phase 0 — Prep (no prod change)
- [ ] Adi: decisions D1–D4 (SPEC §6)
- [ ] Adi: create a Cloudflare account (free)
- [ ] Adi: screenshot Namecheap → Advanced DNS (all records) + Vercel → Domains list. CC turns them into `DNS_INVENTORY.md`
- [ ] CC: full `pg_dump` (schema + data + `auth` schema) → stored on Adi's machine only; document restore command
- [ ] CC (MCP read-only): record Auth config: Site URL, redirect allow-list, SMTP provider, email templates
- [ ] Adi: confirm the Google Cloud OAuth client still lists `https://gfrongfnyigxsexuofrg.supabase.co/auth/v1/callback` as an authorized redirect URI (needed after Phase 5)

## Phase 1 — Worker on a test URL (no prod change)
- [ ] CC: `infra/api-proxy/worker.js` + `wrangler.toml` + `README.md` (no `package.json` change)
- [ ] Deploy to `buff-api-proxy.<acct>.workers.dev` (per D3)
- [ ] Run TESTS.md §P1 against the test URL (REST, auth, realtime WS, functions, CORS preflight)
- [ ] Cron trigger configured; first run observed

## Phase 2 — Nameservers to Cloudflare (reversible)
- [ ] Add zone in Cloudflare; compare its auto-scan against `DNS_INVENTORY.md` record-by-record; add anything missing
- [ ] Every record **DNS-only (grey cloud)**, `api` stays CNAME → Supabase custom-domain target
- [ ] Adi: disable DNSSEC at Namecheap if on; switch nameservers
- [ ] TESTS.md §P2 (site, admin, Vercel certs, email send+receive, DKIM/DMARC pass, `api` still served by Supabase)
- [ ] Wait ≥ 24h stable

## Phase 3 — Cutover `api.buffadhd.com` → Worker
- [ ] Low-traffic hour (IL night). Attach Worker custom domain `api.buffadhd.com` (replaces CNAME)
- [ ] TESTS.md §P3 on installed Android build + Web
- [ ] Rollback ready: remove Worker domain, restore CNAME (add-on still active)

## Phase 4 — Soak (7 days, still on Pro)
- [ ] Daily: Sentry new issues, Supabase auth logs (429/401), `capture_runs` errors, Cloudflare Worker errors/req count
- [ ] Gate: no regression vs the 7 days before cutover

## Phase 5 — Remove add-on, downgrade to Free
- [ ] Remove Custom Domain add-on → TESTS.md §P5a (incl. Google sign-in Android + Web, existing session survives)
- [ ] (if D4=yes) update auth email templates → test reset-password email
- [ ] Downgrade org to Free at a low-traffic hour → TESTS.md §P5b
- [ ] Confirm next invoice preview = $0

## Phase 6 — Closeout
- [ ] SPEC_SYNC docs, STATUS.md, INTEGRATION_LEARNINGS entry, RELEASE_QUEUE row (Server lane, no build)
- [ ] Propose DECISIONS_LOG entry to Adi (her doc — not written by CC)
