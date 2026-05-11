# BUFF Founding 100 — Outreach Kit

> Ready-to-send templates for Phase 1 lifetime deal outreach.
> Defensible defaults applied 2026-05-11 per Adi's "decide for me" — override anytime by editing this doc, but **consistency across channels matters** (different price across channels = trust loss).

**עודכן:** 2026-05-11
**מקור:** [BUFF_GO_TO_MARKET.md](BUFF_GO_TO_MARKET.md) §1 + BUFF_MESSAGING T-templates + Adi's bootstrap plan
**שפה:** טמפלייטים EN ראשי + HE לישראל. הסברים בעברית.

---

## ⚠ Before You Send Anything

זה checklist קצר לפני שמשתמשים בקובץ הזה:

- [ ] **אישור Offer Spec** (§1) — האם הברירות מחדל מתאימות? אם לא — לערוך עכשיו, לפני שמעתיקים טמפלייטים
- [ ] **Stripe SKUs ready** — $99 ו-$149 lifetime SKUs מוגדרים
- [ ] **/founding-100 landing page live** — אחרת ה-CTA-ים מוליכים ל-404
- [ ] **Engineering: `is_lifetime_founding` flag + "Founding Member" badge** — לפחות ה-flag, badge יכול לחכות
- [ ] **email לזה אישי שלך** — לא noreply@. Founder voice = founder address. הצעה: `adi@buffadhd.com`
- [ ] **קישור Launch Date מוכן** — אם עוד לא יודעים תאריך, להחליף את `[LAUNCH_DATE]` ב-"the coming weeks"
- [ ] **לבדוק שאין conflict commitments** ל-47 משתמשי ה-Lovable POC (האם הובטח להם משהו אחר?)

---

## 1. The Offer Spec — Canonical

זה ה-canonical reference לכל copy ב-Phase 1. אם משנים פה — לעדכן בכל מקום אחר באותו זמן.

| Item | Value |
|---|---|
| **Price (1–50 sales)** | **$99** lifetime |
| **Price (51–100 sales)** | **$149** lifetime |
| **Cap** | Hard 100 — after sale #100, pricing reverts to standard subscription |
| **What they get** | Family Plan equivalent (3 kids, unlimited tasks, full features) — **lifetime, forever** |
| **In-app badge** | "Founding Member" — visible on profile + dashboard |
| **Priority feedback channel** | Direct email to Adi — SLA 48h response |
| **Future features** | All future features included free — no future tier upsells |
| **Price lock** | Permanent immunity to future price increases |
| **Family scope** | Single household — not transferable, not gift-able |
| **Refund policy** | 30-day satisfaction guarantee (one-time refund window) |
| **Tax / VAT** | Standard Stripe handling per geography |

**Engineering tickets unlocked by this spec:**
1. `users.is_lifetime_founding` boolean (Phase 0 — must ship before first sale)
2. Stripe one-time SKUs at $99 + $149 with `lifetime_founding` metadata
3. "Founding Member" badge UI in profile (Phase 0 nice-to-have; can ship in v1.1)
4. `priority_email_channel` routing — when a Founding Member emails support, prioritize

**Pricing rationale:** $99 anchored against $9/mo Family Plan = ~11 months equivalent. Cheap signal that this is a "thanks for early support" not "premium tier." The $149 second-tier creates scarcity ("first 50 spots are gone in 2 weeks") and price-anchored social proof.

---

## 2. Email — 47 Lovable POC Users

### Why this list first
ה-47 הזה הם ה-warmest list בעולם — כבר ניסו BUFF, יודעים מה זה. ההמרה הצפויה ~15-25%, פי 5-10 מ-cold list. **שולחים אישית, לא ב-mailmerge רגיל.** עדי כותבת מ-Gmail/email-שלה, לא מ-marketing automation. זה עושה את ההבדל.

### 2.1 Subject lines (A/B if Adi wants — otherwise pick one)

**English options:**
- Primary: *"Adi here. Remember BUFF? It's coming back — and you're the first 47."*
- Alternative: *"You tried BUFF a year ago. Here's what's next (and an offer just for the 47)."*
- Shorter: *"BUFF is coming back. You were there first."*

**Hebrew options:**
- Primary: *"זאת עדי. זוכרים את BUFF? היא חוזרת — ואתם ה-47 הראשונים."*
- Alternative: *"ניסיתם את BUFF לפני שנה. הנה מה הלאה (והצעה רק לכם 47)."*

### 2.2 Body — English (ready to copy)

```
Hi [first name],

It's Adi — you tried the original BUFF on Lovable about a year ago.
I'm writing personally to the 47 of you who were there from the start.

A quick update: the original BUFF was a proof of concept. It taught me
what worked, what didn't, and most importantly — what wasn't there yet.
ADHD apps stop at age 12 (Joon, Goally). Tiimo is for adults. Nothing
followed a family through the years where ADHD makes daily life hardest.

So I built the real one. It's coming to Google Play in [LAUNCH_DATE].
Two interfaces — Pastel for the younger kids, Gamer for the older ones
(co-designed by my 15-year-old, who has ADHD himself). Real-life rewards
your kid chooses — not virtual coins. And it's explicitly built to be
outgrown.

Here's the offer just for the 47 of you, before public launch:

→ $99 Founding Member lifetime access
→ Family Plan equivalent — 3 kids, unlimited tasks — forever
→ Priority email channel direct to me
→ All future features included free
→ Permanent immunity to future price increases

If 100 people grab this, I close the offer. The first 50 spots are
$99; after that it goes to $149.

If you want in: [LINK_TO_FOUNDING_100_LANDING]

If you're not interested but have feedback on what would make BUFF
actually useful for your family — reply to this email. I read every
one.

Either way, thanks for being there at the start.

— Adi
Founder, BUFF
https://www.linkedin.com/in/adi-elgarat-german

P.S. The original BUFF on Lovable will sunset when the mobile app
launches. If you have data you want to export, reply and I'll help.
```

### 2.3 Body — Hebrew (ready to copy)

```
היי [שם פרטי],

זאת עדי — ניסית את BUFF המקורית ב-Lovable לפני בערך שנה. אני כותבת
אישית ל-47 מכם שהייתם שם מההתחלה.

עדכון קצר: BUFF המקורית הייתה proof of concept. היא לימדה אותי מה
עובד, מה לא, ובעיקר — מה עוד לא היה שם. אפליקציות ADHD נעצרות בגיל
12 (Joon, Goally). Tiimo היא למבוגרים. אף אחת לא ליוותה משפחה דרך
השנים שבהן ADHD הופך את החיים היומיומיים לקשים ביותר.

אז בניתי את הגרסה האמיתית. היא מגיעה ל-Google Play ב-[תאריך השקה].
שני ממשקים — Pastel לילדים הצעירים, Gamer למבוגרים יותר (עוצב יחד
עם בני בן ה-15, שיש לו ADHD). פרסים אמיתיים מהחיים שהילד בוחר — לא
מטבעות וירטואליים. והיא בנויה במפורש כדי שיוכלו לעזוב אותה.

הנה ההצעה רק ל-47 מכם, לפני ההשקה הפומבית:

← $99 גישה Lifetime כ-Founding Member
← Family Plan — 3 ילדים, משימות ללא הגבלה — לתמיד
← ערוץ priority email ישיר אליי
← כל הפיצ'רים העתידיים כלולים בחינם
← נעילת מחיר קבועה — לא משלמים יותר בעתיד

אם 100 אנשים תופסים את ההצעה, אני סוגרת אותה. ה-50 הראשונים ב-$99;
אחר כך זה עולה ל-$149.

אם את/ה רוצה להיכנס: [קישור_ל-FOUNDING_100_LANDING]

אם לא רלוונטי אבל יש לכם משוב על מה היה הופך את BUFF לבאמת שימושית
למשפחה שלכם — תענו לאמייל הזה. אני קוראת כל אחד.

בכל מקרה, תודה שהייתם שם מההתחלה.

— עדי
מייסדת, BUFF
https://www.linkedin.com/in/adi-elgarat-german

נ.ב. BUFF המקורית ב-Lovable תעבור sunset כשהמובייל יעלה. אם יש לכם
נתונים שאתם רוצים לייצא, תענו ואני אעזור.
```

### 2.4 Sending logistics

- **From:** adi@buffadhd.com (or her personal Gmail if domain email isn't ready)
- **Send timing:** Tuesday or Wednesday 9–11am recipient's local time = best open rate
- **Tool:** Gmail mail-merge add-on (free, personal feel), OR manually paste 47 times (47 is small enough). **Do NOT** use Mailchimp/ConvertKit — those flag "marketing" and kill open rates for this audience
- **Track:** simple sheet — date sent / opened / clicked / converted. No fancy tools needed for 47 emails.
- **Follow-up:** if no response after 7 days → ONE follow-up email at day 7. After that, no more (respects their attention)

### 2.5 Follow-up email template (day 7, EN)

```
Hi [first name],

Quick follow-up on the Founding 100 offer for original BUFF users.
The first 14 sales are in (so 36 founding spots left at $99 before
it goes to $149).

If BUFF isn't a fit, no worries — just hit reply and tell me why.
That's more useful to me than silence.

If it IS a fit but you've been busy: [LINK_TO_FOUNDING_100_LANDING]

— Adi
```

---

## 3. Facebook Group Reply Template — Peer Voice

### Use when
Someone in an ADHD parenting Facebook group asks a question that BUFF directly answers. **Reply to their question first**, mention BUFF as a side note. Promotional-feeling replies get muted by group admins.

### Template structure

```
[3-5 sentences directly answering their question — use BUFF_MESSAGING T1-T10 
templates adapted to their specific situation. Lead with the substance, 
not the pitch.]

A side note in case it's useful — I'm building a routine app called BUFF
that addresses [the specific pain they mentioned]. It's built for ages
6–18 with two child interfaces (one for younger kids with a buddy character,
one for teens that's more dashboard-style — my own 15-year-old with ADHD
co-designed that one). We're doing a "Founding 100" lifetime deal at $99
before public launch.

Happy to send the link if you want it. No worries either way — and your
question above is the important part.
```

### Specific examples by question type

**If they ask: "What apps work for teens with ADHD?"**
> *"This is exactly the gap I felt with my own son. Joon caps at 12. Goally is even younger. Tiimo is built for adults. The teen-shaped void in this market is real. I'm actually building something for it called BUFF — my 15-year-old with ADHD co-designed the teen interface (dashboard-style, no buddy character, dark theme). We're doing a $99 lifetime founding deal before public launch. DM me if you want the link — and either way, sorry I don't have a clean third-party recommendation. The category itself is broken at age 13+."*

**If they ask: "Joon worked for 6 weeks then my kid lost interest. What now?"**
> *"That's the dopamine pattern with virtual rewards — they habituate fast, especially for ADHD brains. The fix that actually works is tying tasks to real-life rewards your kid actually wants: the concert ticket, the gaming console, the trip they're saving up to. I'm building BUFF specifically around that mechanic ($99 founding lifetime deal active right now if useful). But the deeper principle holds regardless of which app you use: virtual coins → real-world rewards is the move."*

**If they ask: "Anyone tried [non-BUFF app]?"**
> *"Haven't used [X] personally. Worth checking whether it (1) has a teen mode that doesn't feel babyish, (2) ties rewards to real-life things your kid actually wants, (3) handles disruption (pause mode for sick days / vacations / hard weeks). Those three together are rare. I'm building one called BUFF around those exact gaps — happy to share the link if useful. But genuinely curious to hear if [X] worked for you, drop a comment with what you tried."*

---

## 4. LinkedIn Inaugural Essay — Outline

זה outline, לא draft מלא. עדי כותבת בקול שלה. הוא צריך להישמע כמוה, לא כמוני.

### Title
**"Why I'm building BUFF to be outgrown — a senior PM's heresy"**

### Length & format
- ~800 words, ~5 minute read
- LinkedIn long-form post (not article — long-form posts get more reach)
- Plain text, no images in body (one image at top: BUFF logo or 3-pillars graphic)
- Schedule: Tuesday or Wednesday 8–10am Israel time = best LinkedIn engagement

### 5-section structure

**Section 1 — Hook (80 words)**
Open with the contradiction. "I've spent 10+ years as a senior PM making products that win on engagement. DAU. Retention. Time-in-app. Then I had to build something for my own ADHD kid — and I realized the most important metric is whether he doesn't need the product anymore."

**Section 2 — The contradiction (150 words)**
Story arc: Tried Joon for my son. Worked for 6 weeks. Then he saw through it. The Doter pet wasn't his — it was the app's tool. The reward wasn't his — it was the app's currency. He moved on. **Insight:** *ADHD apps that win on engagement lose on outcome. The kid graduates from a virtual pet to executive function, or to nothing.*

**Section 3 — The heresy (200 words)**
Lead with: "Most PMs would never say this in a board meeting: *I want my users to outgrow the product.* It contradicts every metric we're trained to optimize for."

Then the BUFF pivot from PRD §6.1:
- Phase 1: parent + app remind
- Phase 2: app reminds, parent backs off
- Phase 3: kid self-initiates
- Phase 4: kid doesn't need the app

Close with: "If a kid is still using BUFF at 18, we failed. If a kid stopped at 14 because they had the executive function to run their own routine — we won. This is why Joon's model can't bridge to teens. Letting them go means giving up DAU."

**Section 4 — The PM craft (200 words)**
Pivot to the PM-craft angle (this is the part the PM community shares). The inversions:
- Don't optimize for time-in-app. Optimize for **time-not-needing-app.**
- Don't reward streaks. Reward **70% completion** (BUFF doesn't have penalty-streaks at all).
- Don't gate features behind levels. **Real-life rewards** unlock real-life experiences.
- Don't make the buddy character "need" the kid. The buddy gives, never demands.
- Don't have a "sad" state for the character — ADHD shame mechanics are anti-therapeutic.

Close: *"When you remove all the engagement scaffolding most apps depend on, you have to ask: what's actually making this work? The answer: **the kid is the client. The parent is the coach. The app is the scaffolding. And scaffolding is supposed to fade.**"*

**Section 5 — The ask (100 words)**
- BUFF launches publicly later this year
- Running "Founding 100" — $99 lifetime for the first 50, $149 for the next 50
- "If you're a PM, a parent of an ADHD kid, or both — I'd love to send you the link. DM me here, or visit buffadhd.com."
- Soft close: *"And if you're a PM who's ever quietly thought 'my engagement metrics are making the world worse' — let's talk. There's a whole product category to build for the outgrow-as-success thesis."*

### Cross-posting

After LinkedIn post lands:
1. **Substack** — same essay, same day
2. **Twitter thread** — extract Section 3 (the heresy) as 8-tweet thread
3. **PM Slack communities** — Adi shares in 2-3 (Mind the Product, ProductCraft, others she's in) with brief intro: *"Wrote this piece for fellow PMs who'd quietly thought the same thing. Curious to hear pushback."*
4. **Hebrew translation** — adapt for Israeli ADHD parent groups + Israeli PM community (Geektime, ProductLed Israel)

### Engagement strategy

Don't post and ghost. Reply to every comment within 4 hours for the first 48 hours. LinkedIn algorithm rewards founder engagement. Every reply is a signal.

If a senior name in PM (Lenny, Shreyas, etc.) comments — reply substantively, NOT promotionally. The thread becomes its own piece of distribution.

---

## What Adi Does Next (sequenced)

1. **Today (60 min):** Read this kit. Adjust offer spec if needed. Confirm `adi@buffadhd.com` exists or set up a personal-feel address.
2. **This week:** Open Stripe + define the two SKUs ($99, $149) with `lifetime_founding` metadata. Build minimal `/founding-100` landing page on buffadhd.com (one section, the offer table, Stripe button). Verify Phase 0 ship date.
3. **Phase 0 ship (when Play Console is live):** Send email to 47 Lovable POC users — Tuesday/Wednesday morning their time.
4. **Day 7 after first email:** Send follow-up to non-responders.
5. **Once first 5 sales land:** Post LinkedIn inaugural essay. Use first 5 sales as social proof in the essay's P.S.
6. **Week 2 after launch:** Start Facebook group replies using the §3 template. ~3 replies/week per group. 5 groups = ~15 organic touchpoints/week.
7. **Track everything** in a Google Sheet: date, source, persona, email/conversion, $ collected. Update weekly during ramp.

---

## Update Cadence

**Daily** during the active outreach window:
- Update sales count
- Log responses requiring follow-up
- Adjust price tier if first 50 cap is hit

**Weekly** (Sundays):
- Tally Sources → Conversions
- Update BUFF_GO_TO_MARKET.md Phase 1 action items
- Adjust outreach mix (double-down on highest-converting channels)

---

**סוף מסמך.**

זה ה-Phase 1 toolkit המלא. כל מה שצריך כדי להתחיל הוא ה-checklist בראש המסמך. אין כאן ספק על מה לעשות; יש רק את ההחלטה מתי לשלוח.
