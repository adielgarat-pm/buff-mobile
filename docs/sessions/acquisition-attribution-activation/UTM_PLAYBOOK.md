# UTM Link-Tagging Playbook

> **This is the action that turns "organic" into real channels.** The capture code
> already runs (`src/lib/acquisitionCapture.web.ts` reads `utm_*` + referrer on
> first touch and writes `families.acquisition_source`). It has nothing to read
> until outbound links carry a `utm_source`. Tag every link below.

## The rule
Append `?utm_source=<channel>` (and optionally `&utm_campaign=<label>`) to **every
link you post that points at buffadhd.com**. First-touch wins and is stored per
browser session, so the tag on the very first click is what gets attributed.

Base URL: `https://buffadhd.com/`

## Canonical `utm_source` values
Use **exactly** these — they are the strings the app maps to a channel. Anything
else is stored but bucketed as `unknown` (still visible for triage).

| Channel | `utm_source` | Full example link |
|---|---|---|
| Facebook / Instagram / Meta | `fb` | `https://buffadhd.com/?utm_source=fb&utm_campaign=<post>` |
| Reels (IG/FB) | `reels` | `https://buffadhd.com/?utm_source=reels&utm_campaign=<clip>` |
| Reddit | `reddit` | `https://buffadhd.com/?utm_source=reddit&utm_campaign=<subreddit>` |
| WhatsApp community | `whatsapp` | `https://buffadhd.com/?utm_source=whatsapp` |
| SEO guide CTA | `guide` | `https://buffadhd.com/?utm_source=guide&utm_campaign=<guide-slug>` |
| Win-back email | `winback` | `https://buffadhd.com/?utm_source=winback&utm_campaign=<date>` |
| Family referral link | `referral` | `https://buffadhd.com/?utm_source=referral` |
| Google/Play paid (UAC) | `play_ads` | (Play listing / ad — see native install-referrer, deferred) |

`utm_campaign` is free text — use it to tell two posts of the same channel apart
(e.g. `utm_source=reddit&utm_campaign=r_adhd_parenting`). Country is captured
automatically from the device locale — don't add it.

## Where to paste the tagged link
- **Reddit replies / posts** → `?utm_source=reddit` (add `utm_campaign` = subreddit).
- **Facebook / IG posts & bio** → `?utm_source=fb`.
- **Reels caption / bio** → `?utm_source=reels`.
- **WhatsApp community messages** → `?utm_source=whatsapp`.
- **Guide/blog CTAs** → `?utm_source=guide`.
- **Win-back / lifecycle emails** → `?utm_source=winback&utm_campaign=<date>`.
- **Play Store listing** → paid attribution needs the native install-referrer
  (deferred, IN-2026-07-30-01); an organic Play install stays `organic`.

## How to verify it's working
After tagging, run `scripts/acquisition-by-source.sql` (or the query below).
Target: **≥80% of new families with `acquisition_source` not null/organic within
2 weeks.** If it stays ~0, the tags aren't reaching the first-touch capture.

```sql
select coalesce(acquisition_source,'(null)') src, count(*) families
from families
where created_at >= now() - interval '14 days'
group by 1 order by 2 desc;
```

## Not covered (by design)
- **Native Android organic** (`native_organic`) — no per-source data without the
  Google Play Install-Referrer API (native module, deferred).
- **Multi-touch** — first-touch only; a Reddit→FB journey attributes to Reddit.
