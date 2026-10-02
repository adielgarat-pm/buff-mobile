# Supabase Free-Tier Proxy — Spec Sync

| Doc | Phase | Change |
|---|---|---|
| `CLAUDE.md` § Tech Stack | 5 | Backend line: Supabase **Free** behind Cloudflare Worker proxy on `api.buffadhd.com`; keep-alive cron |
| `docs/RELEASE_QUEUE.md` | 3, 5 | Server-lane rows (no build, no OTA) |
| `docs/INTEGRATION_LEARNINGS.md` | any | Surprises; plus a standing note that `api.buffadhd.com` is now a Worker, not a Supabase add-on |
| `docs/sessions/admin-dashboard-port/DEPLOYMENT.md` | 2 | DNS management moved Namecheap → Cloudflare (registrar unchanged) |
| `docs/ops/EMAIL_AUTH_DMARC.md` | 2 | "DNS lives in Cloudflare" |
| `docs/BUFF_DECISIONS_LOG.md` | 6 | **Proposed to Adi only** — CC does not write it |

## Out of scope
- `docs/BUFF_PRD.md`, `BUFF_VALUES.md`, `BUFF_GAP_ANALYSIS.md` — no product change.
- `landing-web/src/pages/Privacy.tsx` — names no infra processors (checked 2026-10-02).
