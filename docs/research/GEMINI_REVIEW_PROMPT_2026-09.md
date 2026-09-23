# Gemini prompt — adversarial review of the BUFF value-validation study

> Paste everything below the line into Gemini (a fresh chat, or a Gem with no BUFF context so it isn't primed to be nice). Optionally attach `VALUE_VALIDATION_2026-09.md` and the three interview guides; the prompt is self-contained without them.
> Paste Gemini's answer back to Claude Code with "review from Gemini" and CC will reconcile point by point.

---

You are a senior product researcher and a skeptical statistician. I am the founder of a small consumer app and I'm about to spend three weeks and my only free time on a validation study. Your job is to find every way this study could give me a false answer — in either direction. Be blunt. Do not praise. Do not soften. If something is fine, say "fine" in one word and move on.

## Context (facts, not claims)

BUFF is a mobile + web app for kids and teens (6–18) with ADHD. The **parent** signs up and sets up tasks; the **child** is meant to use the app daily (tasks, a buddy character, real-world rewards the parent defines). Launched on Google Play in June 2026. Zero paid acquisition. All signups organic. Founder is a mom of a 15-year-old with ADHD.

### Funnel since launch (families created 2026-06-01 → 2026-09-11, test accounts excluded)

| Step | Families |
|---|---|
| Signed up | 53 |
| Parent created ≥1 child + tasks | 40 |
| A child ever logged in | 10 |
| ≥1 task completed | 12 |
| ≥3 active days | 4 |
| ≥7 active days | 3 |
| ≥30 active days | 2 |

### Earlier product (web-only, Jan–Feb 2026, same founder, different codebase)

171 signups, 16 with any completion, 8 reached 7 active days. All heavy users stopped between mid-Feb and early April (a war started in March in the founder's country).

### Weekly active families (≥1 completion)
June: 5–8. July: 6–9. August: 0–4. September so far: 2–5. Signups continued through August (14 new).

### Who retains
6 real families reached ≥5 active days since April. **All 6 have free lifetime access (friends / early supporters of the founder); one is the founder's own family.** Among the 5 still active: 16–37 active days, dozens of mood check-ins, 9–21 real-reward redemptions, spanning 2–3 months. **Zero strangers (signups from US/GB/FR/PK with no personal connection) reached 3 active days.**

### Where churned families stop (25 real families who created a child and never had a completion)

| Pattern | Families |
|---|---|
| Parent created the child within 1–3 minutes of signup | 22 |
| Parent's last activity is the same day as signup | 18 |
| Parent came back 1–29 days later, still no child activity | 7 |
| Invite/child-access screen ever shown | 8 |
| Invite actually sent | 2 |
| Child profile got a login | 2 (then nothing) |

### Who taps (retained families, only on rows where the data exists)
3 of 4 non-founder retained families: completions come mostly from the child's device. 1 of 4: completions come mostly from the parent using "view as child" (78 vs 7). That one family is also the source of our best public testimonial.

### Win-back email
40 sent on 2026-09-03 to churned families. After 8 days: 3 reopened the app, 0 completed a task.

### Reviews
4 genuine 5-star store reviews with specifics, 1 in Hebrew. 6 thumbs-up / 1 thumbs-down on an AI insights feature, from 3 families.

## The hypotheses we wrote

- **H1 — Handoff is broken.** Parents want it; getting the child onto their own login/device is too hard or the parent never understood the child must use it.
- **H2 — Pain is real but not urgent.** Parents sign up on hope; daily life wins; the app never becomes the parent's tool for the morning/homework fight.
- **H3 — Value exists only with founder proximity.** Friends use it because the founder coaches them; strangers don't.
- **H4 — The child doesn't want it.** Parent sets it up, child tries once, doesn't return.

Our current read from the data: the parent leaves within the first session in 18 of 25 churned families, before ever reaching the invite step, so weight shifts from H1 toward H2 (or a first-session that doesn't create pull).

## The plan (3 weeks, development frozen)

- **Track A — churn interviews.** 10–12 of the 25 reachable parents who set up a child that never used the app. 15-min call or 5 voice-note questions. Questions in order: (1) what was going on at home the week you installed it; (2) what did you expect it to do; (3) after you finished setting up tasks, what happened next; (4) did your child see it, what did they say/do; (5) what are you doing about that pain now. Decision rule: ≥6 of 10 in the same answer bucket for Q3 decides the dominant hypothesis.
- **Track B — retained families.** The 4 active non-founder families + 1 heavy user who stopped in July. Questions: disappointment if it disappeared (very/somewhat/not); what you'd miss; who opens it and who marks tasks done; would you have started/continued if you didn't know me; what your child says / what changed at home; would you pay $60/yr or $10/mo; (stopped family) what changed in July. Decision rule: ≥3 non-founder families say "very disappointed" AND "the child opens it" → child-side value is real.
- **Track C — problem interviews with strangers.** 8–10 parents of ADHD kids 7–14 who have never heard of the product, recruited from parent groups with a no-product-mention post. Questions: walk me through yesterday morning; afternoon/homework/bag/bedtime; worst recurring moment of the week; what have you tried; what did each cost and which did you pay for; if a friend said "there's an app for this" what would you assume and would you believe her; who would need to want it for it to work at home. Decision rule: ≥6 of 10 name a pain in our scope in their top-2 AND have paid for something before → problem worth solving; real pain but no belief in apps and no spend → reposition; pain not top-2 → pause.
- **Concierge pilot (added).** The 2–3 newest signups get a personal 30-minute setup call from the founder plus a day-7 check-in, in exchange for feedback. Logged separately from Track A. Read: if hand-holding produces a child who holds a week, H1; if not even then, H2.

### Decision gate at end of week 3
| Outcome | Evidence pattern | Move |
|---|---|---|
| Continue, fix the handoff | A: parents wanted it; C: strangers have the pain and pay; B: retained kids open it themselves | one package: child-entry, measured by "% of families whose child completes a task within 48h of setup", target ≥40% |
| Reposition | C: pain real but no belief in apps, never showed the kid | stop code, change who we sell to and how |
| Pause / pivot | C: pain not top-2; B: use is founder-driven; A/H4: kids don't return | honest stop |

## The outreach email for the concierge pilot (draft)

Subject: A small thank-you from the mom who built BUFF
"Hi [Name], I'm Adi. I built BUFF because my son has ADHD and our mornings were a war. You signed up on [date], and I'd like to offer you something I only do with a handful of families: a personal 30-minute setup session, on a call, where we get BUFF working for your child together. Not a demo. We'll set it up around your actual routine, hand it to your child in a way that makes them want to open it, and I'll check in with you a week later. It's free. What I'd ask in return is honest input: what's confusing, what's useless, and what your child says about it. If you're up for it, reply with a couple of times that work this week or next, and whether your child is around for the last 10 minutes of the call. If BUFF isn't the right fit for your family, that's completely fine too, and I'd still love to hear one line about what you were hoping it would do."

## What I need from you

Answer in this exact structure. Number every point so I can reply to each one.

**1. Errors in reading the data.** Where have we drawn a conclusion the numbers don't support? Specifically challenge: (a) "the parent leaves within the first session" — could `last_seen` be unreliable, could the parent be using the app without leaving a trace, could same-day signup+bounce be bots/curiosity installs that don't belong in the denominator; (b) the claim that zero strangers retained, given tiny n; (c) treating 5 lifetime-access families as evidence of anything; (d) the win-back read after only 8 days.

**2. Hypotheses we missed.** Give at least three plausible explanations for the funnel that are not H1–H4 (e.g. wrong audience arriving, a first-session bug or dead-end, a pricing/paywall or trust signal, seasonality, the parent's own executive function, app-store listing mismatch). For each: what one cheap check would test it this week.

**3. Sampling bias.** Who will say yes to a Track A interview, and how does that skew the answer? Same for Track C recruited from Facebook/Reddit groups. Same for Track B (friends). What would you change in recruiting to reduce each bias?

**4. Leading and loaded questions.** Go through every interview question above and flag any that (a) leads the witness, (b) assumes the parent did something wrong, (c) assumes the child is the user, (d) invites a polite lie. Rewrite the worst three.

**5. Decision rules.** Are "6 of 10", "3 of 5", and "≥40% child completes within 48h" defensible thresholds, or arbitrary? What is the smallest sample that makes each rule mean anything? What result pattern would leave us with no decision, and what should we pre-commit to do in that case?

**6. The concierge pilot as a test.** Does a founder-delivered white-glove onboarding actually discriminate H1 from H2, or does it just reproduce H3 (founder proximity) on purpose? What control or comparison would make it informative? Is 2–3 families worth doing at all?

**7. The email.** Is the offer clear? Does anything in it pressure, guilt, or flatter? Would a skeptical parent in the US or France reply? Cut it by a third without losing the ask, and tell me what you cut and why.

**8. The freeze.** Argue the strongest case *against* freezing development for three weeks. Then tell me whether that case wins.

**9. If you had only 5 hours of founder time,** which single activity from this plan gives the most decision-relevant information, and which should be dropped entirely?

**10. One-line verdict:** is this study more likely to produce a true answer, a false "continue", or a false "stop"? Why?
