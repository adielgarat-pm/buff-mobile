# Marketing Scout — TARGETS (config)

> **Adi edits this file (on `main`). The scout job only reads it.**
> Procedure lives in `.claude/skills/buff-marketing-scout/SKILL.md`. Change numbers here, not there.
> Last reviewed: 2026-09-04 (created from the agency review panel — see `docs/sessions/marketing-scout/REVIEW.md`).

## Budgets (numbers the skill obeys)

```yaml
time_budget_min: 15
max_searches: 12          # WebSearch calls per run
max_fetches: 8            # only when fetch_enabled
fetch_enabled: false      # flip to true after widening the environment network allowlist
max_scored: 10
max_drafts: 5
max_post_ideas: 1
max_amplify: 3
report_max_lines: 250
retention_days: 90
scorecard_day: Saturday   # no scan; weekly scorecard only (IL week ends Fri)
weekly_product_mention_budget: 1   # across ALL Reddit + FB, "really gently" (Adi 2026-09-04). Raise to 3 after month 2.
reddit_phase: listen-only          # listen-only | help-only | mention-ok  — Month 1 = listen-only
goodwill_ratio_target: "10:1"      # value comments : product-adjacent
founding_100_live: false           # never mention Founding 100 in drafts until true
```

## Readiness (printed in every report header — update as items ship)

```yaml
media_kit:            # n/8
  press_page: false
  approved_bio: false          # FOUNDER_STORY §3.1 [NEEDS INPUT]
  headshots_2: false
  screenshots_6: true          # docs/marketing-assets/play-store-listing/screenshots/
  feature_graphic: true        # docs/marketing-assets/feature-graphics/
  one_liner: true              # FOUNDER_STORY §2.1
  data_points_3: false         # beta families / age range 6–18 / founding year — confirm numbers
  logo_pack: false
lifecycle:            # n/4 — while < 3, cap help-venue replies at 1/day
  promise_matching_page: true  # buffadhd.com/philosophy
  founding_100_visible: false
  email_capture: false
  day1_day3_nudge: false
itay_ladder_rung: 2   # FOUNDER_STORY §3.2 — 2 = "a 15-year-old with ADHD" (no name). Set 3 only with Itay's written consent recorded.
public_status_line: "BUFF is on Google Play (Android) and on the web; iOS planned."
```

## Brand terms (Bucket 0 — every run, every term)

`"BUFF ADHD"` · `buffadhd` · `"buffadhd.com"` · `"BUFF app" ADHD` · `"BUFF" Joon` · `"buff" adhd kids app` · misspellings: `"buf adhd"`, `"buff add app"` · founder: `"Adi Elgarat"` · Play: `com.buffapp.mobile` reviews (search `"BUFF" site:play.google.com` — fetch blocked, snippet only)

## Competitor pain queries (Bucket 1 — highest-converting intent; rotate ≥4/run)

- `joon app cancel subscription` · `joon app not working teenager` · `joon app review reddit` · `joon alternative adhd` · `joon vs goally`
- `goally worth it` · `goally tablet broke` · `goally alternative`
- `brili routines discontinued kids` · `tiimo for kids adhd` · `savvy kid app review`
- `best adhd app for kids 2026` · `adhd chore app teen won't use`
- **Triggers → riposte** (ingredient bank, never pasted): "Joon pet burned out" → COMPETITORS §4.1 · "Joon caps at 12" → §4.2 · "tried everything, nothing sticks" → §4.3 · "screen-time tool for a screen-time problem" → §4.4 · privacy/"strangers" → §4.5 + FAQ §E

## Keyword clusters (Bucket 1 — 2 clusters/day by weekday)

| Day | Cluster | Queries | Persona |
|---|---|---|---|
| Sun/Wed | C pain-point | `adhd morning routine kids` · `adhd homework battles` · `back to school adhd kids routine` · `adhd teen exams` | P1/P2 |
| Mon/Thu | A comparison | `joon alternatives` · `best adhd app for kids` · `adhd chore app` · `goally cost` | P3 |
| Tue/Fri | B+D teen & new dx | `adhd app for teenagers` · `adhd teen won't use app` · `child diagnosed with adhd now what` · `newly diagnosed adhd parent first week` | P4/P2 |
| Any | evergreen hunt | `"joon" "alternative" forum` · `adhd kids app "does anyone use"` — Google-ranked threads → watchlist | P3 |

## Venues rulebook (fit = 0 on violation)

| Venue | Track | Link | Self-promo | Founder mention | Status (now) | Notes |
|---|---|---|---|---|---|---|
| r/ParentingADHD | A | never | banned | only if OP asks + disclosure | **listen-only** (Month 1) → help-only | phone-only; mods open profile history |
| r/ADHD_parenting | A | never | banned | only if OP asks + disclosure | **listen-only** (Month 1) → help-only | phone-only |
| r/ADHD | A | never | banned (even without link) | no | **listen-only** (permanent) | not a parenting sub |
| r/Parenting | A | never | banned | no | listen-only | AI-content rule |
| r/SideProject · r/indiehackers · r/Entrepreneur · r/SaaS | B | end of post | welcomed | yes | mention-ok (Adi's own posts) | founder story + link at end; not reachable by scout, phone-only |
| Indie Hackers · Hacker News · Product Hunt | B | yes | welcomed | yes | mention-ok | searchable |
| FB ADHD parenting groups (EN) — *names in Adi's phone list* | A | never | admin-dependent | disclosure-first, after weeks of membership | help-only, 1/week product-adjacent max (first 2 months) | admins share spammer lists |
| FB Israeli parenting groups (HE) | A/G | never | admin-dependent | founder voice, Adi writes | help-only | Track G — Adi writes, scout briefs |
| WhatsApp groups | A | — | — | — | manual only | never in repo |
| LinkedIn (Adi) · FB page · newsletter | owned | yes | n/a | yes | **amplify target** | only place "Amplify" items go |
| ADDitude · Understood · Verywell · Choosing Therapy · Healthline · Parents.com | PR | n/a | n/a | n/a | listicle/pitch targets | fetch blocked; snippet + manual |

## Personas (tag every item)

P1 Exhausted Morning · P2 Post-Diagnosis (cautious, 6–10) · P3 Tried Everything (8–14, lurks & reads) · P4 Teen Lost Control (13–18) · P5 Coach-Curious. Lead emotion per persona: `BUFF_PERSONAS.md` L65-71. September lead = **P1 / Calm**.

## Campaign calendar (scout biases Bucket 1–2 toward the live campaign)

| Window | Campaign | Persona / emotion | Lead message | Notes |
|---|---|---|---|---|
| Sep | Back-to-school | P1 / Calm | H3 "Stop being the alarm clock" | proof = AHA "first morning the kid is ready before parent asked"; CTA none in help venues |
| **Oct** | **ADHD Awareness Month** | P2/P5 / Capable–Hope | "until they don't need us" | short-lead pitch window **Sep 4–15**; advisor/podcast outreach peaks; Oct 10 World Mental Health Day |
| Nov | CHADD conference · Thanksgiving/travel | P1 / Calm | Pause Mode (T4) | |
| Dec–Jan | Holiday disruption → "new system" | P3 / Hope | Pause Mode → fresh start | Jan = P3 comparison content |
| May | Mental Health Awareness Month (US) | P2 | | |
| Jun | End-of-year + summer routine collapse | P1/P3 | Off-routine day | pitch back-to-school in **July** |

## Newsjack triggers (Bucket 2)

`new ADHD study children` (JAMA Pediatrics, Lancet Psychiatry) · `stimulant shortage update` (FDA/DEA) · `screen time kids legislation` (KOSA, UK Online Safety Act, EU DSA minors) · `Joon funding` / `Joon price` · `Goally` news · `ADHD awareness month 2026 call for stories` · `engagement optimized apps kids harm` (heresy-essay angle: `docs/founder-content/linkedin-essay-001-outgrown-heresy.md`)

## Listicle refresh terms (Bucket 2)

`best ADHD apps for kids 2026` · `best apps for kids with ADHD site:additudemag.com` · `… site:understood.org` · `… site:verywellmind.com` · `… site:choosingtherapy.com` · `… site:healthline.com` · `… site:parents.com` → resolve the byline by search; factsheet ask = 5 lines + press-kit link, "we launched since your last update, no obligation".

## Advisor pulse (Bucket 2 — rotate 3 names/day)

Names + tiers: `docs/BUFF_ADVISOR_OUTREACH_KIT.md` §3. Query `"<name>" ADHD` for the last 7 days. Output = warm-touch comment ≤2 sentences, non-promotional. Flag if a target mentions a competitor (opening, not loss).

## Amplify sources (Bucket 3 — owned channels only)

ADDitude · Understood · CHADD · Child Mind Institute · Verywell Family · ADHD Dude / How to ADHD (video) · Israeli: Geektime, Ynet הורים. Query `<outlet> ADHD kids` recent.

## Source-request feeds (manual — login/email-gated; scout pre-drafts responses when a theme matches)

Qwoted · Featured.com · Help a B2B Writer · SourceBottle · `#journorequest` (X/Bluesky) · PodMatch / MatchMaker.fm profiles (one-liner: "senior PM builds an app designed to be uninstalled")

## Disclosure lines (auto-inserted whenever BUFF is named)

- EN default: `(Disclosure: I'm the founder of BUFF — and mom of a teen with ADHD, which is why it exists.)`
- EN short: `(I built BUFF, so take this with that in mind.)`
- HE: `(גילוי נאות: אני המייסדת של BUFF — ואמא לנער עם ADHD.)`
- Help venues: line + **no link**. Track B / owned: line + link allowed.

## Claims — blocklist (hard) / allowlist (safe)

**Block (regex, case-insensitive):** `treat|cure|therapy replacement|replaces (therapy|medication)|clinically (proven|tested)|proven to|scientifically|doctor-recommended|reduces symptoms|improves ADHD|fixes|works for every|guaranteed|the only app|#1|best ADHD app|(COPPA|HIPAA|GDPR) compliant|certified|FDA|medical device|diagnos(e|is) your|70%|streaks?|lazy|behavior problem|surveillance|monitoring|disorder` · any `\d+%` or `\d{1,3}(,\d{3})+` without a source link · `\$\d`
**Hedge only:** `dopamine|brain needs|habituate` → "a common explanation is…" / "many families find…". Dodson "20,000 corrections" → attribute (Dodson, ADDitude) or drop.
**Allow:** "designed for kids/teens with ADHD" · "built with families" · "built on positive-coaching / executive-function principles (Barkley, *Smart but Scattered*)" · "supports routines / independence" · "complements, does not replace, therapy or medication" · "works with or without medication" · "follows COPPA principles for under-13s" (verbatim FAQ Q25) · "~3 tasks done = an active day, not 100%" (count rule, D-2026-06-14) · comparative facts only **dated + sourced** ("as of Sep 2026 Joon's site lists ages 6–12").

## Minors filter (hard block)

Block: `Emi|אמי|my 9-year-old|my 9 year old|daughter|בת 9|my younger (kid|child)` · any school, city/neighbourhood, medication status, diagnosis details beyond "ADHD", photos, last names, daily schedules — for **any** minor incl. beta families' kids (names only with recorded ✅ FULL CONSENT for that channel, `BUFF_TESTIMONIALS.md` §4.4).
Allow: `Itay|איתי` only when `itay_ladder_rung >= 3`; otherwise "a 15-year-old with ADHD who co-designed the teen UI".

## Register markers

`US-Reddit`: 4th grade, IEP/504, pediatrician, "y'all" never · `US-FB-mom`: warmer, first-person, "mama" ok, emojis sparse · `UK`: Year 4, SENCO, GP, CAMHS, "mum" · `IL-HE`: Adi writes; scout briefs in English, Hebrew phrase suggestions ok

## Fetch allowlist (used only when fetch_enabled: true — Adi widens the environment network policy first)

additudemag.com · understood.org · chadd.org · childmind.org · verywellmind.com · verywellfamily.com · choosingtherapy.com · healthline.com · parents.com · joonapp.io · getgoally.com · kikaroo.app · timily.app · alternativeto.net · qwoted.com · featured.com · indiehackers.com · news.ycombinator.com · producthunt.com

## Phone-side listening (Adi's devices — outside the sandbox; see PHONE_CHECKLIST.md)

Reddit app notifications on r/ParentingADHD + r/ADHD_parenting new posts · F5Bot: `joon adhd`, `buff adhd`, `buffadhd`, `goally` · Google Alerts + Talkwalker Alerts: `"BUFF ADHD"`, `buffadhd`, `"Adi Elgarat"`
