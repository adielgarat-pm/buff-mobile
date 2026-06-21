# BUFF Launch Kit — Android v1.6.1 (June 2026)

> **Purpose:** One place for everything needed to launch BUFF on Google Play with **zero budget**.
> Pulls together copy that already exists across `BUFF_MESSAGING.md`, `BUFF_BRAND.md`, `BUFF_FOUNDING_100_KIT.md`. Where this file restates copy, the source doc is cited. New copy written for this launch is marked **[NEW]**.
>
> **Two launch decisions (Adi, 2026-06-16):**
> 1. **Web = the full app** — the browser experience is positioned as equal to Android, not a teaser. Copy says "use BUFF on any device."
> 2. **Both audiences in parallel** — Hebrew warm circle (Day 3–4), English organic (Day 5+).
>
> ⚠️ **Verify before any public price quote:** pricing carries a FLAG in `BUFF_MESSAGING.md` (T8) — confirm against current PRD §5 + grace-period state before posting a number publicly.
> ⚠️ **Confidence gate:** per Adi's standing rule — prep everything, but do not fire broad outreach until the app *feels* shippable to her.

---

## 0. The 5-Day Plan (at a glance)

| Day | Action | Asset to use |
|---|---|---|
| **1–2** | Assemble this kit · make landing page device-aware · verify price | This doc + §3 snippet |
| **3** | Warm circle: WhatsApp/FB Hebrew message + email to real Lovable users | §2.3 (WhatsApp) · `FOUNDING_100_KIT §2` (email) |
| **4** | **Launch day** — app live → LinkedIn founder post + FB Hebrew post → all CTAs point to landing page | §2.1, §2.2 |
| **5+** | "Reply mode" — genuine helpful replies in ADHD groups (FB/Reddit) with a soft link | `BUFF_MESSAGING §3` (T1–T10) |

**Principle:** no-budget launch = depth over breadth. The goal of Day 1 is a small cohort of Founding families who forgive rough edges — not a viral spike.

---

## 1. Core copy (verbatim — ready to paste)

**One-liner / essence** — `BRAND §1`, `MESSAGING §1.1`
> BUFF — the ADHD routine app your kid grows out of.

**Taglines** — `BRAND §3`
- Mission: *Until they don't need us.* / *עד שהם כבר לא יזדקקו לנו.*
- Positioning: *Joon is for kids. BUFF is for your family.*
- Hero: *Stop fighting task time. Start coaching it.*

**Play Store short title (30):** `BUFF — ADHD Routine Coach`
**Play Store short description (80):** `Routine coaching for kids & teens with ADHD. Real rewards. Built to outgrow.`
**Full 4,000-char Play Store description:** lives verbatim in `BUFF_MESSAGING §5.3`.

**Brand palette (for landing page):** primary `#8b5cf6` (purple) · dark bg `#1a1636` (indigo). Source: `app.json`.

**Public Play Store URL (once live):**
`https://play.google.com/store/apps/details?id=com.buffapp.mobile`

---

## 2. Launch-day posts (Day 3–4)

### 2.1 LinkedIn — founder post [NEW — draft, edit in your own voice]

> I built BUFF for one reason: I was tired of being the alarm clock, the nag, and the bad guy in my own house.
>
> My kids have ADHD. The morning routine was a daily fight — not because they didn't care, but because "just remember" isn't a strategy when your brain works differently.
>
> So we built a coach, not a cop. BUFF helps kids and teens (6–18) run their own routines, choose real rewards that matter to them, and slowly need us less. There's even a separate teen interface my 15-year-old co-designed — because no teenager wants a "kids' app."
>
> The goal isn't engagement. It's the opposite: **until they don't need us.**
>
> Today BUFF is live on Android (and works in any browser). If you're parenting a kid with ADHD, I'd love for you to try it — and tell me where it falls short.
>
> 👉 [landing page link]

*Why this works (per `feedback_marketing_why_what`): leads with the outcome and belief (autonomy, "until they don't need us"), not mechanics. Mention rewards/teen-UI as proof, not as the pitch.*

### 2.2 Facebook — Hebrew founder post [NEW — draft]

> בניתי את BUFF כי נמאס לי להיות השעון המעורר, הנודניק, והרע בסיפור — בבית של עצמי.
>
> לילדים שלי יש ADHD, ובוקר של שגרה היה קרב יומיומי. לא כי לא אכפת להם — אלא כי "פשוט תזכור" זה לא אסטרטגיה כשהמוח עובד אחרת.
>
> אז בנינו מאמן, לא שוטר. BUFF עוזר לילדים ולנוער (6–18) לנהל את השגרה של עצמם, לבחור תגמולים אמיתיים שחשובים *להם*, ולאט-לאט להזדקק לנו פחות. יש אפילו ממשק נפרד לנוער שהבן שלי בן ה-15 עיצב יחד איתי.
>
> המטרה היא לא "להתמכר לאפליקציה". ההפך — **עד שהם כבר לא יזדקקו לנו.**
>
> מהיום BUFF באוויר באנדרואיד (ועובד גם בכל דפדפן). אם את/ה הורה לילד עם ADHD — אשמח שתנסו, ושתגידו לי איפה זה לא מספיק טוב.
>
> 👉 [קישור לדף הנחיתה]

### 2.3 WhatsApp — warm circle one-liner [NEW — draft]

> היי 🙂 השקנו היום את BUFF באנדרואיד — האפליקציה שעוזרת לילדים עם ADHD לנהל שגרה בעצמם בלי שנודניק כל בוקר. עובד גם בדפדפן בכל מכשיר. אשמח אם תנסו ותגידו לי מה חסר: [קישור]

*Keep it personal and 1:1 where possible — paste into individual chats, not a broadcast, for the warmest families.*

---

## 3. Device-aware landing page (Adi's idea — implemented cheaply)

**Decision applied:** web = the full app. So every non-Android visitor gets a confident "Open BUFF" — not a "coming soon" apology.

### 3.1 Hero copy by device [NEW]

**Headline (all devices):** *Stop fighting task time. Start coaching it.*
**Sub:** *The routine app for kids & teens with ADHD — built so they grow out of it.*

| Device | Primary button | Secondary line |
|---|---|---|
| **Android** | `Download on Google Play` → Play URL | *Or open BUFF in your browser →* |
| **iOS** | `Open BUFF` → web app | *iOS app coming soon — [notify me]* |
| **Desktop** | `Open BUFF` → web app | *Or send the link to your phone* |

### 3.2 Detection snippet (vanilla JS — drop into the existing buffadhd.com page)

> This is a **handoff snippet**, not a code change to a production repo. It edits the existing Lovable landing page only. No new app is built — "open BUFF" points at the web app that already runs.

```html
<a id="buff-cta" class="buff-btn" href="#">Open BUFF</a>
<p id="buff-cta-sub" class="buff-sub"></p>

<script>
(function () {
  var PLAY_URL = "https://play.google.com/store/apps/details?id=com.buffapp.mobile";
  var WEB_APP  = "https://buffadhd.com/app"; // TODO: confirm the actual web-app entry route
  var ua = navigator.userAgent || "";
  var isAndroid = /android/i.test(ua);
  var isiOS = /iphone|ipad|ipod/i.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);
  var cta = document.getElementById("buff-cta");
  var sub = document.getElementById("buff-cta-sub");

  if (isAndroid) {
    cta.textContent = "Download on Google Play";
    cta.href = PLAY_URL;
    sub.innerHTML = '<a href="' + WEB_APP + '">Or open BUFF in your browser →</a>';
  } else if (isiOS) {
    cta.textContent = "Open BUFF";
    cta.href = WEB_APP;
    sub.innerHTML = 'iOS app coming soon — <a href="#notify">notify me</a>';
  } else {
    cta.textContent = "Open BUFF";
    cta.href = WEB_APP;
    sub.textContent = "Or send the link to your phone.";
  }
})();
</script>
```

**Two TODOs before it goes live:**
1. Confirm the real web-app entry route (`WEB_APP` above is a guess — `buffadhd.com/app`).
2. Decide the iOS "notify me" target (mailto, a form, or just hide it for launch).

---

## 4. Reply-mode templates (Day 5+, organic)

Do **not** paste pitches into groups. Answer a real question helpfully, then add one soft line + link. Ten ready templates (T1–T10) live in `BUFF_MESSAGING §3`, mapped to persona × channel. FB-group peer-reply examples (Hebrew + English) live in `BUFF_FOUNDING_100_KIT §3`.

**Channels (all 🆓, from `BUFF_GO_TO_MARKET` / `BUFF_MARKETING_BACKLOG`):**
- Real Lovable users — warm email (`FOUNDING_100_KIT §2`)
- ADHD parenting FB groups (HE + EN)
- r/ADHD_parenting, r/ADHD
- WhatsApp Hebrew parent groups
- LinkedIn founder voice (2 posts/week)
- Clinical advisor outreach — equity, not cash (`BUFF_ADVISOR_OUTREACH_KIT`)

---

## 5. Gaps blocking a clean launch (short list)

| # | Gap | Owner | Notes |
|---|---|---|---|
| 1 | **Founder story (long form)** still `[NEEDS INPUT]` | **Adi** | Short version exists (`MESSAGING §1.4`); long version needs your input — can't be invented |
| 2 | Landing page made device-aware | CC (snippet ready, §3) + Adi (deploy on Lovable → **Publish → Update**) | Lovable deploy requires Adi to click Publish |
| 3 | Public price verified before quoting | Adi | FLAG in MESSAGING T8 |
| 4 | Web-app entry route confirmed | Adi | fills `WEB_APP` in snippet |

> **Lovable reminder:** any change to the buffadhd.com landing page must end with **clicking "Publish → Update" in the Lovable editor** — GitHub sync alone does not deploy it live.
