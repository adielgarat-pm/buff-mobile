# Supabase Free-Tier Proxy — Tests

`$H` = host under test (`*.workers.dev` in P1, `api.buffadhd.com` after). `$ANON` = anon key from `eas.json`.

## §P1 — Proxy parity (test URL)
- [ ] `GET $H/auth/v1/health` (apikey) → 200
- [ ] `GET $H/rest/v1/<public table>?select=id&limit=1` with anon key → same status/shape as direct `supabase.co`
- [ ] `OPTIONS $H/functions/v1/parse-capture` with Origin `https://buffadhd.com` → CORS headers identical to direct
- [ ] WebSocket `wss://$H/realtime/v1/websocket?apikey=$ANON&vsn=1.0.0` → 101 + `phx_reply ok` on join
- [ ] `GET $H/auth/v1/authorize?provider=google` → 302 to accounts.google.com
- [ ] Large-ish POST (~1 MB body) passes intact
- [ ] Cron run logged; no request bodies in Worker logs

## §P2 — After nameserver move
- [ ] `buffadhd.com`, `www`, `admin` (and every Vercel host) → 200 with valid cert
- [ ] Email to `adi@buffadhd.com` received; email sent from it passes SPF/DKIM/DMARC
- [ ] Resend/lifecycle sender domain still verified
- [ ] `api.buffadhd.com/auth/v1/health` → 200, cert still `CN=api.buffadhd.com` (Supabase)

## §P3 — After cutover (installed store build, NO rebuild)
Android (Hat-4, Adi device) **and** Web:
- [ ] Already-logged-in parent: app opens, dashboard loads, no logout (storageKey pinned)
- [ ] Email/password sign-out → sign-in
- [ ] Google sign-in (still via custom domain at this phase)
- [ ] Child completes task → parent sees it **live** (Realtime)
- [ ] Pause toggle on one parent → other device updates live (`useAppSettings` realtime)
- [ ] Smart capture (photo/text) → tasks created (Edge Function + AI)
- [ ] Insights generate (Edge Function, long call)
- [ ] Push notification still arrives (DB webhook path)
- [ ] Response served by Worker (`cf-ray` from Worker; Cloudflare analytics shows the requests)
- [ ] IL cellular, WiFi off: `https://api.buffadhd.com/auth/v1/health` opens

## §P5a — After add-on removal
- [ ] All §P3 again
- [ ] Google sign-in Android + Web (now via `supabase.co` callback) — on WiFi
- [ ] (document, don't block) Google sign-in on blocked IL cellular → expected per D1
- [ ] Session issued **before** removal still refreshes after > 1h (R8)

## §P5b — After downgrade to Free
- [ ] All §P3 again
- [ ] Supabase dashboard: plan Free, no add-ons, no pause warning
- [ ] Keep-alive cron hits logged daily for 3 days
- [ ] Values Check re-verified against implemented Worker (no body logging)
- [ ] Docs updated per SPEC_SYNC
