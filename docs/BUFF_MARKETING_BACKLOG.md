# BUFF — Marketing Backlog

> Top-level inventory of free / bootstrap-friendly marketing work.
> Sister to [BUFF_GO_TO_MARKET.md](BUFF_GO_TO_MARKET.md) — GTM is the *strategy*, this is the *backlog* of specific tracks under it.

**עודכן:** 2026-07-24
**מקור:** marketing strategy session 2026-05-13 + scan of brand family (BRAND, PERSONAS, MESSAGING, COMPETITORS, FAQ, FOUNDER_STORY, TESTIMONIALS) + GO_TO_MARKET phase plan. תוספת 2026-05-23: Track G (founder-voice HE FB posts) נוסף לאחר צפייה ב-indirect challenger בעברית (ראי [COMPETITORS §3.8](BUFF_COMPETITORS.md)). תוספת 2026-07-24: Track H (group reputation + profile-as-landing-page) נוסף לאחר צפייה ב-top-contributor mechanic בקבוצת יעד (ראי [§6.6](#66-track-h--group-reputation--profile-as-landing-page-brief)).
**שפה:** הסברים בעברית, action items באנגלית.

---

## למה המסמך הזה קיים

[BUFF_GO_TO_MARKET.md](BUFF_GO_TO_MARKET.md) מגדיר את ה-3-phase plan (Ship → Founding 100 → Free Authority → Paid). זה *מה* האסטרטגיה.

המסמך הזה מפרט את ה-**tracks הספציפיים** של marketing work בתוך אותם פאזות, כל אחד עם: מה הוא, איזו פאזה, מסמך-בת אם יש (kit מפורט), ומה תוצר ה-shipping שלו.

הקנס: GTM אומר *"Phase 2 = Free Authority Build"*. הוא לא אומר *"בנו blog עם 30 posts על SEO targeted ל-P3 personas"*. המסמך הזה אומר.

---

## 1. The Marketing Tracks — Inventory

חמישה tracks הזוהו ב-2026-05-13. כולם 🆓 (founder time, ללא הוצאה).

| # | Track | Phase | Deep doc | Status |
|---|---|---|---|---|
| **A** | ADHD parenting groups outreach (FB / Reddit / WhatsApp / forums) | 1 | Templates ב-[MESSAGING §3](BUFF_MESSAGING.md), reply ב-[FOUNDING_100_KIT §3](BUFF_FOUNDING_100_KIT.md) | Templates ready, execution not started |
| **B** | In-app marketing prompts (rating ask, share, referral) | 1.5 (engineering ticket) | פיצ'ר הנדסי — נדרש SPEC (Package Design mode) | Not started, needs Values Check before SPEC |
| **C** | Blog content for SEO + persona reach | 2 | [BUFF_BLOG_CONTENT_MAP.md](BUFF_BLOG_CONTENT_MAP.md) | 30-post plan saved, infra not built |
| **D** | Meta data + technical SEO for buffadhd.com (T6 title, D6 description, Schema.org JSON-LD, canonical fix) | 2 | בקצרה ב-§5 פה. אין deep doc. | ✅ **Wave 1 PR opened 2026-05-14** — same PR as Track E (`pkg/philosophy-pillars-and-meta-fixes`). Awaits merge + deploy. |
| **E** | `/philosophy` page on buffadhd.com — 3-Principles hero (WHY/WHAT framing) | 2 | [GO_TO_MARKET §2.3](BUFF_GO_TO_MARKET.md) | ✅ **Wave 1 PR opened 2026-05-14** — `pkg/philosophy-pillars-and-meta-fixes` in `adielgarat-pm/buff`. Awaits merge + deploy. |
| **F** | Clinician / coach / podcast advisor outreach | 2 | [BUFF_ADVISOR_OUTREACH_KIT.md](BUFF_ADVISOR_OUTREACH_KIT.md) | 10-name target list + 3 personalized pitches drafted |
| **G** | Founder-voice HE FB posts (privacy-first lead hook) | 1 | §6.5 below + [COMPETITORS §3.8](BUFF_COMPETITORS.md) + [FOUNDING_100_KIT](BUFF_FOUNDING_100_KIT.md) | Observation captured 2026-05-23. Kit not started — Adi deferring copy-writing to a dedicated session. |
| **H** | Group reputation + profile-as-landing-page (FB "top contributor" mechanic) | 1 | §6.6 below | Observation captured 2026-07-24. Two concrete actions defined (profile refurbish + flagship group). |

**Track F (advisor outreach) was previously mapped only as bullet items in [GO_TO_MARKET §2.4–2.5](BUFF_GO_TO_MARKET.md). The kit doc operationalizes it — same pattern as FOUNDING_100_KIT operationalizes Phase 1.**

**Track G (founder-voice HE FB posts) was added 2026-05-23 after Adi observed an indirect competitor (Hebrew chore-tracker, organic FB post, privacy-first lead hook) succeed with a positioning move BUFF holds only defensively. See [§6.5](#65-track-g--founder-voice-he-fb-posts-brief) and [COMPETITORS §3.8](BUFF_COMPETITORS.md).**

**Track H (group reputation + profile-as-landing-page) was added 2026-07-24 after Adi observed a non-ADHD service-seller earn a Facebook "all-star contributor" badge in ~6 weeks inside a target ADHD parenting group, using her profile (not her comments) as the conversion funnel. The mechanic is directly reusable for Track A execution — with authentic standing instead of an extractive one. See [§6.6](#66-track-h--group-reputation--profile-as-landing-page-brief).**

---

## 2. Recommended Execution Order

לא לפתוח כל ה-tracks במקביל. סדר מומלץ לפי impact × dependency × effort:

### Wave 1 — *unblockers + quick wins* (week 1)
1. **Track E — `/philosophy` page** — ~2 hr work, unlocks every advisor pitch in Track F (the pitches reference it). Ship before sending any outreach.
2. **Track D — Meta data audit + fix** — ~2 hr work. Biggest organic-search ROI per hour. Once shipped, every subsequent post (Track C) inherits good baseline.

### Wave 2 — *outreach foundation* (weeks 2–4)
3. **Track F — Advisor outreach** — start with 3 pitches from kit (Brendan / Penny / Sharon). One per week, not all at once.
4. **Track H (step 1) — Profile refurbish** — ~30 min, do this *before* the first Track A reply. Every helpful comment drives profile clicks; the profile must convert. Prerequisite to Track A, not a parallel track.
5. **Track A + Track H (step 2) — ADHD groups outreach with flagship-group focus** — start once you have 1–2 advisor responses you can reference (even informally). Run Track A cadence, but concentrate on one flagship group to chase the top-contributor badge (see §6.6).

### Wave 3 — *content compounding* (weeks 4–16)
5. **Track C — Blog launch burst** — ship 5 launch posts (see [BLOG_CONTENT_MAP §6](BUFF_BLOG_CONTENT_MAP.md) starter set). Then 2/week steady-state.

### Wave 4 — *post-Play-Store-live*
6. **Track B — In-app rating + share prompts** — requires SPEC + Values Check. Defer until Play Store live AND first 50 users converted. Premature rating asks waste your once-per-year Play Store quota.

---

## 3. Why This Order

**Wave 1 unblocks everything else:**
- Every advisor pitch in Track F links to `/philosophy` → that page must exist
- Every blog post in Track C ranks better with proper meta tags → meta data first

**Wave 2 generates the social proof that Wave 3 amplifies:**
- A blog post saying *"as Dr. Saline wrote in her 5C's framework…"* lands harder if Saline has actually engaged
- ADHD groups outreach with one named clinical voice in your back pocket converts radically better than cold

**Wave 3 is where SEO compounds — but it compounds slowly.** 12 weeks of consistent posting beats 4 weeks of bursting then silence. Don't start until you have the cadence in you.

**Wave 4 (in-app prompts) is gated on actual users.** Asking for a Play Store review with N=10 users wastes Google's annual ask quota. Wait for ~50 active families.

---

## 4. Track A — ADHD groups outreach (brief)

**Source materials, all already written:**
- 10 forum reply templates: [MESSAGING §3](BUFF_MESSAGING.md) (T1–T10)
- 10 hooks mapped to persona × channel: [MESSAGING §2](BUFF_MESSAGING.md)
- Channel-specific guidelines: [MESSAGING §8](BUFF_MESSAGING.md)
- Founding 100 reply variants: [FOUNDING_100_KIT §3](BUFF_FOUNDING_100_KIT.md)

**What's missing:** a **target list of specific groups** with admin contact + posting rules. Adi: please list 3 FB groups + 2 subreddits + 2 Hebrew WhatsApp groups when ready, and I'll build the tracker.

**Cadence:** [MESSAGING §8.1](BUFF_MESSAGING.md) caps at 2–3 replies/week per group. 5 groups × 2 = 10 organic touchpoints/week.

---

## 5. Track D — Meta data audit (brief, no separate doc yet)

This is buff-main repo (separate worktree), not buff-mobile. Audit checklist:

- [ ] **Per-page `<title>`** (currently likely site-wide default — verify via WebFetch on buffadhd.com)
- [ ] **Per-page `<meta name="description">`** (~150–160 chars, persona-targeted)
- [ ] **Open Graph tags** — `og:title`, `og:description`, `og:image` (BUFF logo or per-page image), `og:url`, `og:type`
- [ ] **Twitter cards** — `twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`, `twitter:image`
- [ ] **Schema.org JSON-LD** — `MobileApplication` schema (BUFF Android app), eligibility for app rich-results in Google
- [ ] **`hreflang`** — bilingual EN/HE pages should declare alternates so Google serves the right language
- [ ] **Canonical tags** on every page
- [ ] **`sitemap.xml`** + `robots.txt` checked
- [ ] **No `noindex`** accidentally set anywhere

**Output:** an audit report + a PR to buff-main. Becomes a SPEC in a buff-main worktree session when you're ready.

---

## 6. Track B — In-app prompts (Future Package, needs SPEC + Values Check)

Three candidates, **not built**. Requires its own session SPEC with Values Check before engineering.

| Prompt | Trigger candidate | Risk to flag in Values Check |
|---|---|---|
| **Play Store rating ask** (`expo-store-review`) | 7th task completion + 70%+ rate (interim, doesn't require AHA detection) | Pillar 2 — does asking parent for review feel pressure-y? |
| **"Tell another parent" share** | After 3rd reward redeemed by kid | Pillar 1 — does it create extrinsic motivation for *parent* to share? Probably fine, but ask. |
| **Referral code** | Settings screen, evergreen, post-RevenueCat | Defer per existing 🚩 FLAG (Invite Link Option B is post-RevenueCat per CLAUDE.md) |

**Constraints:**
- Google permits 1 review ask per year per user — burning it on day 2 = no review ever
- Per [BUFF_VALUES.md Pillar 2](BUFF_VALUES.md), no "missed", "failed", or pressure framing
- Per CLAUDE.md, AHA event detection isn't built yet (4 engineering tickets per [BRAND §4.5](BUFF_BRAND.md)) — interim trigger needed

---

## 6.5 Track G — Founder-Voice HE FB Posts (brief)

**Source observation (2026-05-23):** פוסט פייסבוק עברי אורגני מאת "David Ohana" בקבוצה ישראלית, מפרסם chore-tracker גנרי לילדים. הצליח לתפוס positioning של *"privacy-first / no ads / no analytics / no strangers"* כ-**lead hook** — דפוס ש-BUFF מחזיקה defensive בלבד ([FAQ §E](BUFF_FAQ.md), [BRAND §6](BUFF_BRAND.md), Forum Reply T5). **ניתוח מלא:** [COMPETITORS §3.8](BUFF_COMPETITORS.md).

**Goal of this track:** לתרגם את הדפוסים ש-Ohana הוכיח לסדרת פוסטים בעברית בקול-מייסדת של Adi, ספציפיים ל-ADHD — *מבלי* להעתיק את ה-framing שלו ומבלי לאבד את ה-ADHD wedge.

### Patterns to ADOPT

1. **Personal mom-to-mom voice** — לא promoter. כלל הטון של [MESSAGING §8.1](BUFF_MESSAGING.md) ("if copy reads like an ad — blocks the action").
2. **Pain hook first** — בוקר, צחצוח שיניים, "תתלבש כבר" — לפני שמזכירים את המוצר.
3. **❌ list before ✅ list as lead** — מעבר ה-positioning הזה מ-defensive (FAQ) ל-offensive (פוסט פתיחה). זה מהלך **חדש** ל-BUFF — לא תיעדנו אותו כ-rhetorical device.
4. **Social proof via founder's own kids** — Itay (15, co-designer): OK by name per [FOUNDER_STORY §3.2](BUFF_FOUNDER_STORY.md). **אמי (9): privacy-gated** — לא להעמיד בפוסט פומבי.
5. **DM-for-invite mechanic** — peer-viral. דגם הפצה לא מתועד ב-[FOUNDING_100_KIT](BUFF_FOUNDING_100_KIT.md) שהוא email→landing. צריך החלטה האם זה משלים או מחליף.

### Patterns to AVOID copying

- ❌ Generic *"chore tracker for all kids"* framing. **BUFF wedge = ADHD-specific executive function scaffolding.** חידוד, לא הרחבה. (Anchored in [COMPETITORS §2](BUFF_COMPETITORS.md) — Territory We Own.)
- ❌ Friend leaderboard / "Hall of Legends" — social pressure שיכולה להחריף אצל ADHD kids. Anti-Pillar-2.
- ❌ *"Free for everyone forever"* — לא תואם את ה-Founding 100 + paid model של [GO_TO_MARKET](BUFF_GO_TO_MARKET.md) Phase 1.

### Personas to target

- ✅ **P5 (Coach-Curious)** — כבר בעולם הזה. privacy-first hook resonates.
- ✅ **P2 (Post-Diagnosis, cautious)** — פוחדת מעוד screen-time tool. פרטיות = ביטחון כניסה.
- ❌ **לא P1 (Exhausted Morning)** — כאב שונה (operational chaos, לא safety anxiety). פוסט נפרד.

### Channels (when activated)

- **Israeli FB parenting groups (Hebrew)** — primary. דורש target list (Open Decision #4 ב-§7 - הרחבה ל-HE).
- **WhatsApp parent groups (Hebrew)** — secondary, peer-forwarding model.
- **Not** English-speaking groups עבור פוסט בפורמט הזה — קהל לא תואם.

### Status / why deferred

- **Observation captured:** 2026-05-23 (this entry).
- **Kit drafted:** ⏸ **Deferred.** Adi explicitly chose 2026-05-23 לא לטייט copy עכשיו — רוצה את ה-input מוכן לכשתפתח session כתיבה אישית.
- **Next checkpoint:** כש-Adi פותחת session "founder post drafting" — Track G עובר ל-active. עד אז: cold input מתועד.

### Why founder writes, not Claude

Founder voice הוא ייחודי ל-Adi. Brand family מספיק לי כדי לנסח פוסט "תקני" — אבל ה-**authenticity moat** שאיפשר ל-Ohana להתפשט (mom-to-mom בקול אמיתי) דורש את Adi עצמה. Pre-drafting מסכן את האותנטיות.

### Cross-links

- [BUFF_COMPETITORS.md §3.8](BUFF_COMPETITORS.md) — ה-observation המקורי וניתוחו המלא.
- [BUFF_FOUNDER_STORY.md §3.2](BUFF_FOUNDER_STORY.md) — מדיניות הזכרה-בשם של ילדי Adi.
- [BUFF_MESSAGING.md §8.1](BUFF_MESSAGING.md) — channel guidelines קיימים ל-FB ADHD groups.
- [BUFF_FAQ.md §E](BUFF_FAQ.md) — תשובות פרטיות ready-to-quote.
- [BUFF_FOUNDING_100_KIT.md](BUFF_FOUNDING_100_KIT.md) — email-led model להשלמה / השוואה עם DM-led.
- [BUFF_PERSONAS.md](BUFF_PERSONAS.md) P5, P2.

---

## 6.6 Track H — Group Reputation + Profile-as-Landing-Page (brief)

**Source observation (2026-07-24):** בקבוצת "ADHD Parents Support Group" (אנגלית, קבוצת יעד לפרסונות P1–P3), חברה בשם Desire Ifebuche Uways הצטרפה ב-9 ביוני 2026 וכבר ~6 שבועות אחר-כך נושאת תג **"all-star content contributor"** עם 21,567 נקודות. הנקודה החדה: **היא לא הורה ל-ADHD ולא מוכרת פתרון ל-ADHD.** היא נותנת שירותי כתיבה ("DISTINCT DEE" — ghostwriting / storytelling / audio-to-text / "turn knowledge into income using AI"). הקבוצה היא בשבילה *ערוץ הפצה*: היא תורמת תוכן בעקביות, קטפה את התג, וכל צפייה בפרופיל שלה = דף נחיתה (bio ברור + באנר עם value-prop + CTA + טלפון).

**Why it matters to BUFF:** זו בדיוק ה-Track A mechanic ([§4](#4-track-a--adhd-groups-outreach-brief)) — מבוצעת טוב יותר ממה שאנחנו מריצים כרגע. שני מנופים חינמיים שלא תיעדנו:
1. **הפרופיל הוא דף הנחיתה — לא התגובה.** המשקל המסחרי מוסט מהתוכן (שנשאר מועיל) אל הפרופיל. זה מה שמאפשר נפח בלי להיבעט ע"י אדמינים — ותואם לחלוטין את [FOUNDING_100_KIT §3](BUFF_FOUNDING_100_KIT.md) ("reply first, BUFF as a side note").
2. **תג "top contributor" כ-social proof חינמי.** פייסבוק מעניקה אותו תוך שבועות למי שמתרים בעקביות. התג הופך כל פוסט עתידי לאמין יותר — בדיוק בקבוצות שבהן חיות הפרסונות שלנו. שייך ל-Phase 2 (Free Authority) אבל מתחיל ב-Phase 1.

### Patterns to ADOPT

1. **Profile-as-funnel** — פרופיל הפייסבוק של Adi צריך לתפקד כדף נחיתה: שורת bio ("Founder, BUFF — the ADHD app your kid outgrows"), באנר עם 3 העמודים + CTA, לינק ל-`/founding-100`. כרגע ה-CTA שלנו חי רק *בתוך* התגובה; שלה חי בפרופיל וזה חזק יותר.
2. **Consistency > bursts** — תרומה יומית מועילה קונה את התג תוך חודש-חודש וחצי. Track A מוגדר כ-"~3/week per group"; להוסיף **מיקוד בקבוצת דגל אחת** בקצב גבוה יותר כדי לרדוף אחרי התג.
3. **Value-first, sell-in-bio** — כבר מעוגן ב-[MESSAGING §8.1](BUFF_MESSAGING.md) ("if copy reads like an ad — blocks the action"). ההוכחה החיצונית מחזקת את הכלל: הנפח בטוח *כי* המכירה בפרופיל, לא בתגובה.

### Patterns to AVOID copying

- ❌ **היציבה החולבת (extractive posture).** Desire נכנסת לקהילת הורים כואבת כדי לחלוב אודיינס למשהו לא-קשור. אסור להעתיק — מתנגש עם Pillar 1 (אותנטיות), ובסוף אדמינים בועטים אנשים כאלה. **היתרון שלנו שהיא לא יכולה לזייף:** Adi היא הדבר האמיתי (הורה ל-ADHD + מייסדת + Itay שעיצב את מצב הטין). לאמץ את המכניקה על גבי מעמד אותנטי = הרבה יותר עמיד.
- ❌ **Volume ללא ערך.** התג בלי תוכן באמת-מועיל הופך לספאם גלוי. הנפח לגיטימי רק כשכל תרומה עומדת בפני עצמה.

### The two concrete actions

| # | Action | Effort | Depends on |
|---|---|---|---|
| **H-1** | Refurbish Adi's FB profile as a landing page: bio line, cover photo + CTA, link to `/founding-100` (or buffadhd.com until landing is live). Cover asset ready: [`marketing-assets/fb-cover-founder-2026-07-24.png`](marketing-assets/fb-cover-founder-2026-07-24.png). Bio copy drafted 2026-07-24 (in chat, pending Adi's pick). | ~30 min | `/founding-100` landing (fallback: buffadhd.com) |
| **H-2** | Pick **one flagship group** from the Track A target list; commit to daily helpful contribution (via [FOUNDING_100_KIT §3](BUFF_FOUNDING_100_KIT.md) templates) to chase the top-contributor badge | Ongoing, ~10 min/day | Track A target list (Open Decision §7 #4) |

### Personas to target

- ✅ **P1 / P2 / P3** — כל מי שנמצא בקבוצות ההורים ל-ADHD. התג משרת את כולם (אמינות רוחבית).

### Status / why sequenced this way

- **Observation captured:** 2026-07-24 (this entry).
- **H-1 (profile refurbish):** ready to execute — quick win, no dependency beyond a live link. Slotted into [§2 Wave 2 step 4](#2-recommended-execution-order) *before* first Track A reply.
- **H-2 (flagship group):** gated on the Track A target list (Open Decision §7 #4). Once the list exists, pick one group to concentrate on.

### Why founder executes, not Claude

זהה ל-Track G: הפרופיל, הנוכחות בקבוצה, והקול הם של Adi. אני יכול לנסח את שורת ה-bio ואת copy הבאנר לאישורה, אבל התרומה היומית והמעמד האותנטי דורשים את Adi עצמה.

### Cross-links

- [§4 Track A](#4-track-a--adhd-groups-outreach-brief) — same channel; H is the execution upgrade.
- [BUFF_FOUNDING_100_KIT.md §3](BUFF_FOUNDING_100_KIT.md) — the reply templates H-2 uses.
- [BUFF_MESSAGING.md §8.1](BUFF_MESSAGING.md) — channel guidelines (value-first rule).
- [BUFF_VALUES.md Pillar 1](BUFF_VALUES.md) — the authenticity guardrail against the extractive posture.
- [BUFF_PERSONAS.md](BUFF_PERSONAS.md) P1, P2, P3.

---

## 7. Open Decisions for Adi

To unblock Wave 1 and Wave 2:

1. **Approve `/philosophy` page work** — buff-main worktree session. Wraps [BUFF_VALUES.md](BUFF_VALUES.md) into web format.
2. **Approve meta data audit** — buff-main worktree session. Audit + fix in same package.
3. **Choose Track F starter pitch** — Brendan, Penny, Sharon, or all three sequenced? (See [BUFF_ADVISOR_OUTREACH_KIT.md](BUFF_ADVISOR_OUTREACH_KIT.md) §5.)
4. **List ADHD groups for Track A tracker** — 3 FB + 2 subreddits + 2 WhatsApp.
5. **Approve `is_lifetime_founding` flag + Stripe SKUs** for Phase 1 (separate from this backlog — see [GO_TO_MARKET §1.3](BUFF_GO_TO_MARKET.md)).

---

## 8. How to Use

### עבור Adi
זה ה-index של כל ה-marketing work שעל הצלחת כרגע. כל יום ראשון, סקירה — איזה track בתנועה, איזה תקוע, איזה מוכן ל-pickup.

### עבור Claude.ai (web)
לפני marketing session — לקרוא את המסמך הזה ולוודא שהבקשה לא חורגת מהפאזה הנוכחית של GTM.

### עבור Claude Code (אני)
כשמתבקש לעבוד על marketing item — לוודא שהוא משויך ל-track ב-§1, ולעדכן Status שם אחרי shipping.

---

## 9. מתי המסמך הזה מתעדכן

| תרחיש | פעולה |
|---|---|
| Track נסגר (shipped) | עדכן Status ב-§1 |
| Track חדש מתווסף | הוסיפי שורה ב-§1 + ראשי פרקים בסעיף ייעודי |
| סדר ההפעלה משתנה | עדכן §2 + נימוק |
| GTM phase מתקדמת | סקירה האם tracks עדיין רלוונטיים לפאזה החדשה |

זה מסמך **חי, מתעדכן שבועית** במהלך ה-marketing ramp.

---

**סוף מסמך.**
