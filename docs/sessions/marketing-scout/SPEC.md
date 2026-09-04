# SPEC — marketing-scout

## Problem
BUFF has a mature messaging corpus but no eyes on the web: nobody watches for brand mentions, competitor-pain moments, PR windows, or articles worth amplifying, and the previous automation (4 Claude-desktop scheduled runs driving Chrome on Adi's PC) died silently for two days (HEARTBEAT.md). Adi's time is the bottleneck; the scout should hand her a one-screen brief each morning and never require her to understand the machinery.

## Target state (after the package closes)
1. A daily cloud Routine (≈07:30 Israel) spawns a fresh session that runs `.claude/skills/buff-marketing-scout`, commits `docs/marketing-scout/reports/YYYY-MM-DD.md` to branch `automation/marketing-scout`, and sends Adi a one-line push. A second Routine (≈12:00 Israel) is the watchdog: no START+END today → push "scout silent".
2. The report is one screen: 🛡 Reputation (always) · 🔥 Act today (≤3) · 💬 Queue · ✍️ owned-post brief · 📣 Amplify (owned channels only) · 🎤 PR radar · 🤝 Advisor pulse · 📒 Ledger · ⏭ Lurk · 📱 Phone checklist · ⚠ Flags.
3. **Never posts.** Drafts are talking points (help venues) or briefs (founder voice); every draft passes the Compliance Gate (disclosure auto-line, claims block/allow lists, minors hard filter, price freeze, no Founding 100 until live, ≤40% shared text, Values 9-questions).
4. **Reddit is phone-only and gentle** (Adi, 2026-09-04): Month 1 listen-only; then ≤1 product-adjacent mention/week across all Reddit+FB, only when OP asks for tools, always disclosed, never a link in help venues; 10:1 goodwill ratio tracked in `state/replied.log`.
5. State persists in the repo (`seen.jsonl`, `replied.log`, `objections.md`, `hooks.md`, `watchlist.md`, `heartbeat.log`, `RELATIONSHIPS.md`); reports retained 90 days, rolled into `INDEX.md`.
6. Config (`docs/marketing-scout/TARGETS.md`) is Adi's; the job never edits it. Weekly PR `automation/marketing-scout → main`; CI skips `docs/marketing-scout/**`.

## Out of scope (flagged, not built)
- Play-install attribution (forward UTMs into the Play `referrer`) — own small package (REVIEW § Growth).
- Widening the Routine environment's network allowlist (Adi's setting) — Phase 3 decision; v1 is snippet-only.
- Click counter (`buffadhd.com/r/<slug>`) — landing-web package.
- October pitch sprint — Phase 0, separate scope note in ROADMAP.

## Capabilities & Bottlenecks (verified 2026-09-04 in this environment)
| | |
|---|---|
| CC can | WebSearch (works); read the corpus; draft; commit/push to branches; create Routines + push notifications |
| CC cannot | WebFetch (EGRESS_BLOCKED by env policy) · see Reddit at all (search returns 0 reddit URLs; fetch refused) · reach F5Bot/Google Alerts/Reddit RSS from the sandbox · post anywhere |
| Adi must | phone-side listening (PHONE_CHECKLIST.md) · post · mark `replied.log` · merge the weekly PR · widen network policy if/when wanted · decide Itay's naming rung (default 2) |
| Bottleneck | Reddit real-time is structurally outside the cloud; the scout is radar + mining + PR + learning + brief |

## Values Check (brand-representation tool — how BUFF is spoken about publicly)
| Pillar | Q | Answer |
|---|---|---|
| 1 Intrinsic | Would a child want this without virtual reward? | n/a (not child-facing). Copy gate: allowlist sells *real rewards the child chose*; blocklist bans streaks/coins framing. ✅ |
| 1 | Moves toward a reward the child chose? | Drafts cite "reward the kid already wants" as the app-free advice. ✅ |
| 1 | "I want" vs "I must"? | Tone rules forbid "must/need" in any parent-facing draft. ✅ |
| 2 Positive | Ever shames/compares/shows failure? | Blocklist: lazy/behavior/disorder/failure counts; "no comparison between kids" explicit; hedged mechanism claims. ✅ |
| 2 | On failure — empathy or pressure? | Reply anatomy starts with mirror + app-free help; product mention optional and last. ✅ |
| 2 | Any suffer/lose/anger mechanic? | None; amplify/PR content must not frame ADHD as deficit. ✅ |
| 3 Independence | More capable without the app? | Advice must "stand without the app"; lead message "until they don't need us". ✅ |
| 3 | Child has a voice? | Itay credited as co-designer at rung 2 (no name) — his consent required for rung 3+. ✅ |
| 3 | Still necessary in 6 months? | The scout's success = fewer, better, disclosed touches and owned content — not engagement volume. ✅ |
**Extra guardrails:** never posts; founder voice is Adi's; minors filter; no reviews/astroturf; storage policy (no verbatim quotes/usernames/private groups).
