# BUFF — SEO Content Plan

> Organic-search content strategy for buffadhd.com. Created 2026-07-08 (campaign-plan session).
> Companion to CAMPAIGN_PLAN_2026-07.md §6. Personas from BUFF_PERSONAS.md; competitor intel from BUFF_COMPETITORS.md + live SERP checks (2026-07-08).

---

## 0. The infrastructure truth (read first)

**Content can't rank if it has nowhere to live.** Current state:

1. **buffadhd.com (landing-web) is a client-rendered Vite SPA** — a single `index.html` for every route. Google can render JS, but ranking article-length content from an SPA shell is a losing setup. Guides need **static HTML pages** (pre-rendered at build, own `<title>`/meta per page, e.g. `buffadhd.com/guides/<slug>`).
2. **The summer guide lives on claude.ai as an Artifact and returns 403 to anonymous visitors** — zero SEO value, and the link can't even be shared in emails. The content (bilingual, keyword-rich meta already written) is exactly right — it's just on the wrong domain.
3. **No email capture on buffadhd.com** — even ranking content leaks visitors with no retention path (open item in ORGANIC_LAUNCH_KIT §6).

→ **Prerequisite package: `pkg/seo-guides`** — a static `/guides/*` section in landing-web (plain HTML pages or Vite multi-page build), starting by porting the existing summer guide from `docs/guides/summer-transition-guide.md`. Small, no schema, no deps beyond what's in the repo.

## 1. What the SERPs told us (2026-07-08 spot checks)

- **"Joon alternatives" is a winnable, high-intent lane.** Small indie apps already rank with single comparison pages — [Kikaroo's /joon-alternative](https://kikaroo.app/joon-alternative) and [Timily's Joon review guide](https://timily.app/guides/joon-app-review/) sit on page 1 alongside [Product Hunt](https://www.producthunt.com/products/joon/alternatives). BUFF is absent from a conversation it should own (P3 — "Tried Everything" — literally searches this).
- **The teen lane has no product owner.** "ADHD app for teenagers" returns listicles ([Understood](https://www.understood.org/en/articles/apps-to-help-teens-with-adhd-manage-challenges), [ADDitude](https://www.additudemag.com/time-management-apps-teens-adhd-productivity-focus/), [FLOWN](https://flown.com/blog/adhd/adhd-apps-find-focus-and-track-time)) and generic tools (Tiimo, RoutineFlow). No app that's *for parents of teens* ranks. BUFF's 13–18 Gamer Mode + teen co-designer story is the only credible claim to this lane.
- **ADDitude/Understood listicles dominate every query** → separate earned-media play: pitch BUFF for inclusion in their app roundups (founder-story angle). Long lead time; start early.

## 2. Topic clusters (persona × intent)

### Cluster A — Comparison / alternatives (P3, highest intent, first priority)
| Page | Target queries | Notes |
|---|---|---|
| "Joon vs BUFF: an honest comparison" | joon alternatives, joon app alternative, joon vs | Use T9 framing from MESSAGING §3 — honest, "Joon is fine if…", real rewards + 13–18 + outgrowing. Anti-hype tone (P3 smells marketing). |
| "Best ADHD apps for kids in 2026 — compared by a mom who tried them" | best adhd app for kids, adhd chore app | Include competitors honestly (Joon, Goally, Tiimo, RoutineFlow); BUFF's row wins on age range + real rewards. |
| "Goally alternative without the tablet" | goally alternatives, goally cost | Hardware-lock pain angle. |

### Cluster B — The empty teen lane (P4, BUFF's unique territory)
| Page | Target queries | Notes |
|---|---|---|
| "ADHD apps for teens: what actually works at 13–18" | adhd app for teenagers, adhd app teens | Lead with "Joon stops at 12" gap; Itay co-designer story = E-E-A-T gold. |
| "My teen says ADHD apps are babyish — he's right" | adhd teen won't use app | T2 template expanded to article; teen-voice quotes. |

### Cluster C — Pain-point guides (P1/P2, volume, the "guides family")
The summer guide's parked ideas are exactly this cluster — same design, same voice:
| Page | Target queries | Season |
|---|---|---|
| **Summer transition guide** (exists — port it) | adhd summer routine, adhd camp packing list, summer structure adhd kids | NOW (July) |
| **Back-to-school with ADHD** | back to school adhd, adhd school morning routine | **Write in July, publish early August** — the biggest seasonal window of the year (US/UK school year starts Aug–Sep) |
| Calm mornings guide | adhd morning routine kids, adhd child won't get ready | Evergreen |
| Homework without wars | adhd homework battles, child won't start homework | Sep–Oct |
| Exam season guide | adhd teen exams | Dec + May |

### Cluster D — Post-diagnosis (P2, trust-building, slower)
| Page | Target queries |
|---|---|
| "Your kid was just diagnosed with ADHD — a mom's field guide to the first 90 days" | child diagnosed with adhd now what, 8 year old adhd diagnosis |

## 3. Rules for every page

- **Brand voice per BUFF_BRAND §6** — coach not cop; no streaks/lazy/behavior/disorder; no vapor features; **no "70%" as a mechanic** (per GEMINI_CONTEXT_PACK — success moved to absolute count; say "an imperfect day still counts").
- **Founder E-E-A-T:** every guide signed "Adi — mom of two kids with ADHD, founder of BUFF"; real experience beats generic SEO content and is what Google's helpful-content system rewards.
- **Bilingual where it earns it:** HE versions for Cluster C guides (Israeli warm audience shares them in groups); Clusters A/B/D English-only (GTM market).
- **One soft CTA per page** → `www.buffadhd.com/download`; email-capture box once that exists.
- **Comparison pages must be honest** — "if your kid is under 10 and loves virtual pets, Joon is genuinely good" is what makes P3 trust the rest of the page.

## 4. Sequenced plan

| # | Item | Type | When |
|---|---|---|---|
| 1 | `pkg/seo-guides`: static /guides/* infra + port summer guide | Dev (small) | This week — the guide is time-sensitive |
| 2 | Back-to-school guide (EN+HE) | Content | Write now, publish ~Aug 1 |
| 3 | "Joon vs BUFF" comparison page | Content | Week 2–3 |
| 4 | "ADHD apps for teens" | Content | Week 3–4 |
| 5 | Email capture on guides + landing | Dev (small) | With #1 or right after |
| 6 | "Best ADHD apps for kids" mega-comparison | Content | Month 2 |
| 7 | Pitch ADDitude/Understood for listicle inclusion | Outreach | Start month 1 (long lead) |
| 8 | Calm-mornings + homework guides | Content | Month 2–3 |

## 5. Measurement

- Google Search Console on buffadhd.com (verify it's set up — prerequisite).
- Per page: impressions → clicks → /download clicks (track-install-cta edge function already exists for CTA instrumentation).
- Review monthly; SEO compounds — expect first meaningful impressions ~4–8 weeks after each page indexes.

## 6. Open items / decisions for Adi

- [ ] Approve `pkg/seo-guides` (dev package, landing-web only).
- [ ] Summer guide says "חגגו 70%" — conflicts with the no-70% rule (D-2026-06-14 moved success to absolute count). Decide: reword to "רוב הדברים קרו = יום מנצח" when porting.
- [ ] Play Store listing title is "BUFF: Habit Quest Kids & Teens" — differs from MESSAGING §5.1 ("BUFF — ADHD Routine Coach"). If ASO-intentional, update MESSAGING §5; if not, fix listing. (ASO and SEO should tell one story.)
- [ ] Google Search Console access confirmed?
