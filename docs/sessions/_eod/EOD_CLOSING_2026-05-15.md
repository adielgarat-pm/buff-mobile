# EOD — 2026-05-15

> Marketing strategy + Wave 1 polish session, day 2.
> Outreach prep is fully done; SEND deferred until app ships per Adi's confidence threshold.

---

## What was done today

### Morning — Wave 1 polish + Lovable workflow learning
- ✅ **Wave 1 fully shipped to live site** (3-Principles hero, language toggle, web/print split, full clinical guide internal-only)
- ✅ Discovered Lovable architecture: Lovable editor is **source of truth** for `buff` repo; GitHub PRs sync into editor but require manual **Publish → Update** click in Lovable to deploy live
- ✅ Saved that as memory + as `feedback_lovable_publish_reminder.md` so future sessions auto-remind Adi of the Publish step
- ✅ Domain email `adi@buffadhd.com` set up via Workspace; SPF + DKIM + DMARC all PASS; mail-tester score 10/10

### Mid-day — Testimonials cleanup + content plan
- ✅ T002 (Shani) and T003 (Noa long-form) imported from Lovable beta reviews
- ✅ T004 (Kelly) **removed** — Adi disclosed it was a family review submitted under pseudonym, not a real third-party testimonial. Per BUFF_TESTIMONIALS §6 anti-patterns, removed from doc + flagged in INTEGRATION_LEARNINGS so future Lovable syncs skip it. **Adi to also delete the row from Lovable's `reviews` table** (separate Lovable Admin task).

### Afternoon — Strategic pivot on outreach + LinkedIn / Reddit content
- 🔑 **Strategic pivot:** Adi pushed back on sending Brendan/Penny/Sharon advisor pitches before the app is shippable. Her gut: *"i don't feel confidence reaching them without a working app."* This aligns with [BUFF_GO_TO_MARKET.md](../../BUFF_GO_TO_MARKET.md) Phase 0 → Phase 2 sequencing. **Saved as `feedback_outreach_confidence.md`** so I don't push for premature outreach next session.
- ✅ **LinkedIn post drafted** — original from Gemini, then refined together. Removed the "external brain" phrase (contradicts Pillar 3), tightened phrasing, fixed factual claims about kid count.
- ✅ **Reddit post structure** suggested for r/ProductManagement (skip r/ADHD_parenting until app shippable). Adi to draft in own voice when ready.

### Late afternoon — Philosophy page graphic work
- ✅ **PR #44 (marketing-assets folder)** merged — `docs/marketing-assets/` now exists in repo as long-term home for screenshots and brand visuals
- ✅ Took multiple LTR-fixed screenshots of `/philosophy` for Adi's LinkedIn post
- ⚠ Discovered **a real CSS bug on the live site:** `body` computed `direction: rtl` even when `html lang="en"` is set. This is why screenshots needed JS hacks to look LTR. Adi asked to fix in code, not just screenshot.
- ✅ **PR #?? open** (`pkg/philosophy-ltr-logo-footer` in `adielgarat-pm/buff` repo) — fixes:
  1. LTR alignment via `.philosophy-hero` CSS class + `html[lang="X"]` selectors that respect language
  2. Adds BUFF logo (`buff-logo-no-bg.png`) at top of hero
  3. Adds bilingual "Made by Adi · Founder, BUFF" / "נעשה על ידי עדי · מייסדת, BUFF" footer

---

## Open PRs (status as of EOD)

| Repo | PR | Branch | Status | Action needed |
|---|---|---|---|---|
| **buff** (web) | not yet opened | `pkg/philosophy-ltr-logo-footer` | Branch pushed, PR not created on GitHub | Click https://github.com/adielgarat-pm/buff/pull/new/pkg/philosophy-ltr-logo-footer → Create PR → Merge → **click Publish → Update in Lovable** to deploy |
| **buff-mobile** (docs) | this EOD | `docs/eod-2026-05-15` | Will be pushed at end of session | Adi to merge |

All other branches across both repos are merged + cleaned up.

---

## Pending action items — Adi's side (tomorrow or beyond)

### Tonight / before tomorrow
1. **Merge buff PR #?? + click Publish → Update in Lovable** so the live `/philosophy` page gets the LTR + logo + footer fixes
2. **Delete Kelly row from Lovable's `reviews` table** (Lovable Admin → reviews → find Kelly entry → delete) so the live `buff.lovable.app` Landing stops displaying it

### Tomorrow / this weekend
3. **Edit the LinkedIn post** I drafted into final voice. Decide on:
   - "my own teen with ADHD" (singular, accurate) vs. "kids and teens" (overclaim if Emi isn't diagnosed)
   - Final hashtag set (3–4 max — drop `#FamilyTech` and `#FounderJourney`)
   - Timing: Tuesday or Wednesday morning Israel time = LinkedIn algorithm peak
4. **Final image for LinkedIn:** crop the LTR screenshot in Snipping Tool, or do edits in Canva (logo top-left, "By Adi" footer, even margins). Per the new PR, the live page itself will look correct after deploy — so a fresh screenshot will work.
5. **Reddit post (optional):** draft in own voice for r/ProductManagement using the structure I suggested. Wait until app is more shippable if you'd rather not preempt the engagement-economy heresy framing.

### Whenever — not blocking
6. **Replace `buff-logo-no-bg.png`** in `C:\Users\adiel\buff\src\assets\` with Adi's cleaner version (no black outline on lightning bolt — addresses BRAND.md §7.9 action item #1)
7. **Cleanup `pkg/philosophy-ltr-logo-footer`** branch after merge (verification + cleanup approval needed per CLAUDE.md)

### Strategic — for after app ships
8. **Send Brendan / Penny / Sharon pitches** — drafted and ready in [BUFF_ADVISOR_OUTREACH_KIT.md §5](../../BUFF_ADVISOR_OUTREACH_KIT.md). Activate when Adi feels confident the app is real and trial-able.

---

## Key decisions captured today

1. **D-2026-05-15-XX (proposed):** Advisor / podcast outreach send-step is gated on Adi's confidence in app shippability, not on the matrix in `BUFF_ADVISOR_OUTREACH_KIT §1`. Founder confidence is part of the pitch. Drafts can be ready and waiting; SEND waits for app readiness. (See `feedback_outreach_confidence.md` memory.)
2. **D-2026-05-15-XX (proposed):** T004 (Kelly) excluded from BUFF_TESTIMONIALS as fabrication risk. Family-review-under-pseudonym = doesn't qualify as third-party testimonial per BUFF_TESTIMONIALS §6. Future Lovable syncs to skip Kelly entry.
3. **D-2026-05-15-XX (proposed):** Philosophy page web view is internal-IP-protected — full clinical guide accessible only via Ctrl+P (no public discovery via button or CTA). Public visitors see only the 3-Principles hero.

> ⚠ These are proposed D-entries; Adi to add to BUFF_DECISIONS_LOG when ready (per CLAUDE.md "don't update unilaterally" rule).

---

## Memories saved today (auto-loaded next session)

1. `feedback_marketing_why_what.md` — for BUFF user-facing copy lead with outcomes (intrinsic motivation, autonomy) and beliefs (until they don't need us), not mechanics (rewards, BUFFs, 70%, BUDDY)
2. `user_email.md` — primary `adi@buffadhd.com` (Workspace 2026-05-14); `buff.parenting@gmail.com` is backup
3. `project_lovable_source_of_truth.md` — buffadhd.com deploys from Lovable editor, not GitHub; manual "Publish → Update" needed
4. `feedback_lovable_publish_reminder.md` — every post-merge instruction for buff repo MUST end with "click Publish → Update in Lovable"
5. `feedback_outreach_confidence.md` — even if matrix says pre-launch outreach is fine, Adi's confidence threshold is the real constraint; draft + prep, but wait to send until app is shippable

---

## How to start tomorrow's session

Open Claude Code and paste this minimum starter:

```
Continuing the marketing strategy + philosophy page work.

Read first:
1. CLAUDE.md
2. docs/sessions/_eod/EOD_CLOSING_2026-05-15.md (yesterday's close)
3. docs/BUFF_MARKETING_BACKLOG.md (current state of marketing tracks)
4. docs/BUFF_ADVISOR_OUTREACH_KIT.md (advisor pitches ready, on hold per
   feedback_outreach_confidence.md memory)

Status: Wave 1 complete + deployed; Wave 2 outreach drafts ready
but on hold until app is shippable. Today's focus is X.
```

(Replace X with whatever's top-of-mind tomorrow.)

---

**End of session 2026-05-15. Solid day — Wave 1 fully shipped, philosophy page has logo + LTR fix + founder footer in flight, LinkedIn content ready, advisor outreach prepped and patiently waiting. Sleep well.**
