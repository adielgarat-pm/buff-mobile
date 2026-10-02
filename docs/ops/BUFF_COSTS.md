# BUFF — Costs & Subscriptions

> Every recurring payment that keeps BUFF running, with plan, cost and why we keep it.
> **Update this file whenever a plan changes.** Last updated: **2026-10-02** (cost-reduction session).
>
> Source legend: **Adi** = Adi confirmed it in session · **MCP** = verified via Supabase MCP · **Repo** = taken from repo docs/code · **Est.** = list-price estimate, verify against the invoice.

---

## 1. Monthly recurring

| Service | What it's for | Plan | Cost / month | Source | Status |
|---|---|---|---|---|---|
| **Supabase** | DB, Auth, Realtime, Edge Functions (`buff-production`, `gfrongfnyigxsexuofrg`) | **Pro** | ~$25 | MCP (plan=`pro`), Est. (price) | Keep. See §5 for the Free-tier option |
| **Supabase Custom Domain add-on** | `api.buffadhd.com`, which bypasses the IL-carrier block on `*.supabase.co` (#290). **Baked into every installed build: do NOT remove** | Add-on on Pro | ~$10 | Repo (`eas.json`, RELEASE_QUEUE #290), Est. | Keep |
| **Claude** (claude.ai / Claude Code) | Dev + design work | **Pro** | $20 | Adi (downgraded 2026-10-02, −$80/mo) | Keep |
| **Google Workspace** | `adi@buffadhd.com` mailbox | Business Starter | ~$7 | Repo (INTEGRATION_LEARNINGS, 2026-05-14: $6), Est. | Keep (moving email = risk, little saving) |
| **Lovable** | Legacy web POC (retired) | Paid | $5 | Adi | Keep (Adi's choice) |
| **Anthropic API** | `parse-schedule` (schedule import from photo) + fallback for `generate-child-insights` | Pay-as-you-go | ≈ $0 (cents) | MCP (usage: 2 insights / 0 captures in 30d) | Spend limit: _not yet set_ (recommended $10) |
| **Google Gemini API** | `parse-capture` (smart capture) + primary for `generate-child-insights` | Pay-as-you-go | ₪0 so far | Adi | **Budget alert ₪20** set 2026-10-02 (alert only, not a hard stop) |

**Estimated total ≈ $67 + AI usage (≈ $0) / month**

## 2. Annual / one-time

| Service | What it's for | Cost | Source | Notes |
|---|---|---|---|---|
| **buffadhd.com domain** | Site, app web, API, email | ~$10–20 / year | Repo (registrar + DNS = **Namecheap**), Est. | Must keep. Check for paid add-ons (PremiumDNS etc.) |
| **Google Play Developer** | Android publishing | $25 one-time (paid) | Repo (app is live on Play) | Nothing recurring |
| **Apple Developer** | iOS publishing | $99 / year | Repo (fcm-push-notifications SPEC) | **Not active.** Don't enroll until iOS is a real phase |

## 3. Free tier (no payment)

| Service | What it's for | Plan | Source | Watch-out |
|---|---|---|---|---|
| **Expo / EAS** | Builds, OTA updates, store submit | **Free** | Adi (downgraded 2026-10-02, −$19/mo) | ~15 Android builds/mo (we use ~3–4), slower build queue, OTA up to 1,000 MAU |
| **Vercel** | App web, landing (`buffadhd.com`), admin | **Hobby** | Adi | Hobby is officially non-commercial. Revisit when revenue starts |
| **Canva** | Design mockups / marketing visuals | **Free** | Adi (downgraded 2026-10-02, −₪65/mo) | No background remover / brand kit / premium assets |
| **Sentry** | Crash monitoring (`buffadhd/react-native`) | Free (Developer) | Adi | 5K errors/mo quota; dev profile is DSN-less to save it |
| **Firebase** | FCM push (`buff-mobile-prod`) | Free | Repo | — |
| **RevenueCat** | In-app subscriptions | Free up to $2,500 MRR | Repo (FEATURE_PRIORITIZATION F-069) | Starts charging only after real revenue |
| **GitHub** | Repo + Actions CI | Free | Est. | — |

## 4. Change log

| Date | Change | Saving |
|---|---|---|
| 2026-10-02 | Claude plan downgraded to Pro ($20) | −$80 / mo |
| 2026-10-02 | Expo downgraded to Free | −$19 / mo |
| 2026-10-02 | Canva Pro cancelled | −₪65 / mo (~$17) |
| 2026-10-02 | Gemini (Google Cloud) budget alert ₪20 | — (protection) |
| 2026-10-02 | Claude Routine "marketing scout daily reminder" **paused** (not deleted; `trig_012Fd1JkBok8wNrT7WNKrgLd`) | — (subscription usage) |
| 2026-10-02 | Decision: AI entitlement left as-is (lifetime/founding keep AI, free tastes stay). Cost ≈ $0, budget protects | — |
| | **Total saved** | **≈ $116 / mo (~$1,400 / yr)** |

## 5. Open options (not done, by choice)

- **Supabase Pro → Free (~−$35/mo):** a Cloudflare Worker proxy keeps `api.buffadhd.com` alive with no app rebuild. Fully designed in `docs/sessions/supabase-free-tier-proxy/`. Trade-off: Google sign-in on blocked IL cellular networks, plus moving DNS off Namecheap. **Parked, Adi 2026-10-02: no functionality risk for now.**
- **Supabase billing check:** confirm no add-ons beyond Custom Domain (compute upgrade / PITR / IPv4). Not needed at 10 MAU.
- **Anthropic Console spend limit:** set a monthly limit (recommended $10).
- **Google Workspace → Zoho Free / Cloudflare Email Routing (~−$7/mo):** parked. Email-record change = risk.

## 6. Cost-free background jobs (for reference, not billable)

Supabase `pg_cron` jobs run inside the DB and make **no** AI or HTTP calls (verified via MCP 2026-10-02): `weekly-keepalive`, `buddy-eod-run`, `scan_disengaged_users_daily`, `scan_for_anchor_recovery_daily`, `scan_for_activation_nudge_daily`, `refresh-basic-insights-friday`, `cleanup-expired-premium-until`, `scan_for_child_invite_reminder`. They are product features. Don't disable them to save money; they cost nothing.
