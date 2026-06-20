# SPEC — pwa-install-nudge

**Status:** DESIGN (target state). No code until Adi says `approved, proceed`.
**Last updated:** 2026-06-20
**Branch (proposed):** `pkg/pwa-install-nudge`
**Owns:** the **Nudge Manager** — the single shared passive-nudge slot on the parent dashboard (§3.4). `pkg/rate-us-port` is a **consumer** of this contract; the rate nudge plugs in as a lowest-priority slot entry. This session defines the contract; rate-us does not edit any file here.

---

## 1. Problem statement (grounded)

BUFF's Expo Web build is **already a valid PWA** — it is installable today:
- [`public/manifest.json`](../../../public/manifest.json) — name, icons, `display: standalone`.
- [`public/service-worker.js`](../../../public/service-worker.js) — registered with a fetch handler (Chrome install requirement).
- [`src/lib/setupPwa.web.ts`](../../../src/lib/setupPwa.web.ts) — injects manifest link + apple-* meta tags at runtime; native is a no-op ([`setupPwa.ts`](../../../src/lib/setupPwa.ts)).

**The gap is discoverability, not capability.** Nothing in the app *tells* a web visitor they can install BUFF to their home screen, or *how* — and the "how" is different on every device:
- **Android Chrome / Edge / Samsung Internet** — the browser fires `beforeinstallprompt`; we can show a real **"Install" button** that triggers the native install sheet.
- **iOS Safari** — there is **no** `beforeinstallprompt` (Apple never implemented it). Install is **manual only**: Share → *Add to Home Screen*. The app must *show these steps*, it cannot trigger them.
- **iOS Chrome / Firefox / other iOS browsers** — cannot install a PWA at all (only Safari can on iOS). The right nudge is "open this page in Safari first."
- **Desktop Chrome / Edge** — `beforeinstallprompt` fires (install to taskbar/dock). Low priority but free.
- **Already installed** (running in `display-mode: standalone`) — show nothing.

This is the parity gap logged against Lovable: [MATRIX.md:175](../lovable-parity-audit/MATRIX.md) ("PWA install nudge — ✅ Lovable / absent mobile") and [:205](../lovable-parity-audit/MATRIX.md) ("Help & install video section — 🟥 none").

**Why it matters:** an installed PWA launches full-screen (no browser chrome), gets a home-screen icon, and dramatically improves return-rate vs a browser tab — which directly fights BUFF's known habit-fragility (memory `buff_war_non_return`). For the self-migrating Lovable users (memory `lovable`), "add BUFF to your home screen" is the bridge from web POC to the daily-use surface.

---

## 2. Target state

A single **device-aware install nudge** on the web build that detects how the current device can install and shows the matching path. Native (Android/iOS app) renders nothing — the native app *is* the installed app.

### Decision table (the core of this package)

The verb tracks what the OS itself shows, so our copy matches the sheet that appears (see §2.1). **Mobile is the only surface we actively nudge** — desktop is capability-only (§2.2, grounded in research §2.3).

| Detected environment | What we show | Action |
|---|---|---|
| **Android Chrome/Edge/Samsung** (`beforeinstallprompt` captured) | Active banner: "Add BUFF to your phone" + **[Install] button** (Android's own sheet says *Install*) | Button calls the saved `deferredPrompt.prompt()`; on `accepted` dismiss + remember. |
| **iOS Safari** (no event, installable manually) | Active banner → tapping opens an **instructions sheet**: "1. Tap **Share** ⬆️  2. **Add to Home Screen**  3. **Add**" (matches Safari's wording) | Pure instructional; no programmatic install on iOS. **iOS hides install under the Share menu — Apple's design, not a BUFF choice; that unintuitive placement is exactly why the illustrated card exists** (Android's "Install" button is self-explanatory; iOS isn't). |
| **iOS non-Safari** (Chrome/Firefox/in-app webview on iOS) | Active banner: "To add BUFF, open this page in **Safari** first" + how | Instructional. iOS PWA install is Safari-only — an **Apple platform constraint**, not a BUFF gap (see §2.3). |
| **Desktop Chrome/Edge** (`beforeinstallprompt` captured) | **No active banner.** Capability stays available via the Settings entry + the browser's own address-bar install icon. | Low value for a phone-first kids' app (§2.3). |
| **Already standalone** (installed, or running as native) | Nothing | — |
| **Unsupported / unknown browser** (e.g. Firefox Android with flag off) | Nothing (or the quiet Settings-only entry — §2.2) | Don't nag where install can't succeed. |

### 2.1 Verb is device-specific (not a uniform "install")

Match the word the system itself uses, so there's no disconnect between our banner and the native sheet that opens:
- **Android** → "**התקינו** את BUFF" / *Install* (Chrome's button literally says Install).
- **iOS Safari** → "**הוסיפו למסך הבית**" / *Add to Home Screen* (Safari's exact label).
- **Avoid "הורידו / Download"** everywhere — a PWA is not a store download (no APK, no progress bar); "download" sets a wrong expectation.

### 2.2 Where it appears (two surfaces, same component)

1. **Passive nudge — mobile web only** — a dismissible banner that appears once the visit looks "engaged" (see frequency rules), only on web, only on a **mobile** browser (Android or iOS), only when installable/instructable. Placement: bottom of the parent dashboard (non-blocking, above the tab bar). **Not** on a child-owned device mid-routine. **Not on desktop.** This banner is **not free-standing** — it is one entry in the shared **Nudge Manager** slot (§3.4), so it can never co-appear with the rate nudge or a care prompt.
2. **Always-available entry — all web (incl. desktop)** — a row in **Parent Settings → "Install BUFF on this device"** that opens the same device-aware sheet on demand. This covers the Lovable "Help & install" settings parity item, gives a path after the passive banner is dismissed, and is the *only* surface where desktop users meet install (no nag, opt-in).

### 2.3 Notifications & install — the per-platform reality (research, grounded)

Documented here so we don't re-litigate "should we push desktop install for notifications?" in two months.

- **Install does not, by itself, enable notifications.** Web Push is a separate pipeline (SW `push` handler + permission + VAPID/FCM-web). Today it is **not built**: [`public/service-worker.js`](../../../public/service-worker.js) is network-passthrough with no `push` handler, and [`src/lib/webPushRegistration.ts`](../../../src/lib/webPushRegistration.ts) is an explicit `not_implemented` stub (firebase web SDK not installed). So **web notifications work nowhere today**, installed or not. We must **never** sell "install to get notifications" — it would be a false promise.
- **On desktop + Android, Web Push works in a normal tab — no install required.** So desktop install adds *no* notification capability even once push ships.
- **On iOS Safari, Web Push works ONLY for an installed (home-screen) PWA** — a hard Apple rule. This is the one place where install is a genuine prerequisite for notifications, and it is **mobile iOS, not desktop**.
- **What desktop PWA install actually gives:** a standalone window, a taskbar/Start icon, a separate Alt-Tab entry, and (with push, which we don't have) an app badge. For a **phone-first kids' routine app**, the realistic desktop user is a parent on a laptop who will manage from their phone anyway. Value to the user and to BUFF: **marginal**.
- **Conclusion:** the install nudge's real payoff — home-screen habit anchor (fights `buff_war_non_return`) **and** the future iOS-push prerequisite — is concentrated on **mobile**. Desktop is capability-only, zero active nudge, ~zero build cost (the browser already offers an address-bar install icon).

### Frequency / non-annoyance rules
- Never show if already installed (`window.matchMedia('(display-mode: standalone)').matches` or `navigator.standalone` on iOS).
- Passive banner: mobile web only; show at most **once per N days**; on dismiss, persist a flag (localStorage) and don't re-show for a longer cooldown. Settings entry is always available regardless.
- Never block. Never show on a child-owned-device session (Pillar 2 — kids don't manage installs). Never show on desktop.

---

## 3. Proposed approach (for review — not self-approved)

### No new dependency
Everything is browser-native: `beforeinstallprompt`, `appinstalled`, `navigator.userAgent` / `display-mode` media query, and `localStorage`. **No npm install, no Adi dependency approval needed.** (Confirms the §1 "capability already exists" framing.)

### Platform-split, per the Parity rule (CLAUDE.md)
Unify the *signal* ("can this device install, and how?"), split the *action* by platform — same pattern as `useVersionGate` in the in-app-updates SPEC.

- `useInstallPrompt.web.ts` — captures `beforeinstallprompt` (preventDefault + stash the event), listens for `appinstalled`, runs UA/standalone detection, returns a typed state:
  `{ mode: 'install' | 'ios-safari' | 'ios-other' | 'hidden', isMobile: boolean, promptInstall(): Promise<void> }`. The passive banner renders only when `isMobile` is true; the Settings entry consumes the same hook regardless of `isMobile` (so desktop install stays reachable on demand).
- `useInstallPrompt.ts` (native) — **no-op**, always returns `{ mode: 'hidden' }`. Native build never imports web-only DOM code; web bundle never imports native modules (memory `native_import_sentry_blindspot`).
- One presentational component `InstallNudge` consuming the hook — renders banner / instructions sheet / nothing per `mode`. Web-only; on native the hook returns `hidden` so it renders null.

### `beforeinstallprompt` capture timing (the one real gotcha)
The event fires **early**, often before React mounts the nudge. Capture it at the **document level in `setupPwa.web.ts`** (which already runs at boot) into a module-level holder, and have the hook read from that holder + subscribe for later firings. This avoids "the event already fired and we missed it." Document this in the hook.

### Detection logic (explicit, to avoid UA guesswork drift)
- `isStandalone` = `matchMedia('(display-mode: standalone)').matches || navigator.standalone === true` → `hidden`.
- `deferredPrompt` present → `install` (Android **or** desktop; `isMobile` distinguishes — desktop suppresses the passive banner).
- else iOS (`/iP(hone|ad|od)/` and not standalone): Safari (no `CriOS`/`FxiOS`/other in UA) → `ios-safari`; otherwise → `ios-other`.
- else → `hidden` (don't nag browsers that can't install).
- `isMobile` = iOS match **or** Android UA (`/Android/`) / coarse-pointer + small viewport. Desktop → `isMobile: false` → no passive banner.

### 3.4 Nudge Manager — the shared passive-nudge slot (owned by this session)

**Why it exists:** the parent dashboard will have *more than one* thing that wants to nudge — install (this session), "Rate BUFF" (`pkg/rate-us-port`), and existing care prompts (anchor recovery, recommendation/recap cards). Adi's decision: **the banners are connected — at most ONE passive nudge per visit, never stacked.** That arbitration is a shared concern, so it lives in one small manager that both sessions use instead of each banner deciding independently.

**Contract (cross-platform — native + web; install registers web-only, rate registers on both):**

```ts
type PassiveNudge = {
  id: 'install' | 'rate';        // extensible
  priority: number;               // higher wins when several are eligible
  eligible: () => boolean | Promise<boolean>;   // per-nudge gating (platform, install state, cooldown, engagement)
  render: () => ReactNode;        // the banner/card to show
};

registerNudge(nudge: PassiveNudge): void;        // module-level registry, called at app init
useActiveNudge(): PassiveNudge | null;           // the manager hook the dashboard renders
```

**Manager rules (the "connection" Adi asked about):**
1. **One slot, one winner.** Collect all registered nudges whose `eligible()` is true, pick the **highest `priority`**, render only that one. Everyone else stays hidden this visit.
2. **Priority order (high → low):** care/recovery prompts > `install` > `rate`. (Care prompts are emotional-state-sensitive and must win; rate is the politest ask, so it yields to everything.)
3. **Suppressed by care prompts:** if an anchor-recovery / care prompt is active this session, the manager slot stays **empty** — no install, no rate. (v1: the manager treats an active care prompt as a global suppressor; it does not need to absorb those prompts into the registry — that would be scope creep.)
4. **Global cooldown between *different* nudges:** after any passive nudge is dismissed, suppress **all** passive nudges for a global window so a parent isn't hit by install today and rate tomorrow. (Default: 7 days global, matching the install per-nudge cooldown; final number Adi's call.)
5. **Per-nudge cooldown + "already done" still apply on top:** install = 7-day dismiss cooldown + never if installed; rate = its own cooldown + never if already rated. The manager enforces the *global* gap; each nudge still owns its *local* eligibility.
6. **Never on a child-owned session.** Same Pillar-2 guard as the install banner.

**Files (owned here):**
- `src/lib/nudges/nudgeManager.ts` — the registry + `useActiveNudge()` + global-cooldown bookkeeping.
- `src/lib/nudges/nudgeStorage.ts` (+ `.web.ts`) — tiny persistence split: `localStorage` on web, `AsyncStorage` on native (so the cross-platform manager has one storage contract). Keys namespaced per nudge id + a shared `nudges:lastShownAt`.
- Install registers itself (`id:'install'`, web+mobile eligibility). The dashboard renders `useActiveNudge()` in the single slot above the tab bar.

**Boundary:** `pkg/rate-us-port` calls `registerNudge({id:'rate', …})` and writes **no** file under `src/lib/nudges/`. If this manager isn't merged when rate-us reaches its passive phase, rate-us ships its Settings entry + gate first and waits on the slot (exactly as its SPEC §5 already states).

### 3.5 Conversion alignment (researched 2026-06-20)

The copy + structure match documented best practice; this is *why* we expect a good install rate, not just nice wording. Sources at the end of this section.

- **Custom prompt (not the browser's default mini-infobar)** is the single biggest lever — Google reports up to **6× the add-to-home-screen rate** vs sites with no custom prompt; Lancôme saw **+17% A2HS**. ✓ We ship a custom banner.
- **Engagement-gated timing** (show after the visitor is engaged, not on first load) lifts installs **~30%**. ✓ Our banner waits for an engaged visit + lives on the dashboard, not the splash.
- **Value-proposition-first copy, concise, clear CTA.** ✓ Headline = the outcome ("open from your home screen"), subtext = the benefit ("one tap, no browser"), button = the OS verb. This is exactly the recommended shape (cf. web.dev's "explain the value, then what they get from installing").
- **Don't bundle other asks (push/geo) into the install moment** — we already excluded notifications (§2.3). ✓
- **NEW lever — enrich the manifest so Android shows the *rich* install dialog:** on Android Chrome, if the manifest has `description` **and `screenshots`**, the install prompt upgrades from a thin info-bar to a large app-store-style card (icon + screenshots + description) — measurably higher intent. Our [`manifest.json`](../../../public/manifest.json) has `description` but **no `screenshots`** → add 1–3 narrow-form-factor screenshots. **Assets already exist** (memory `store_screenshots_v162`: EN/HE shots in `docs/marketing-screenshots/v1.6.2/`); just resize/declare them. Low cost, real lift. **In scope for this package.**

> Honest framing: the 5×/6× figures are *vs no custom prompt*, not a promised absolute rate. Real install rate also depends on audience warmth — and ours is warm (already-onboarded parents on the dashboard), which is the favourable end. Copy is necessary-but-not-sufficient; the levers above are what convert.

**Sources:** [web.dev — promote install](https://web.dev/articles/promote-install) · [web.dev — installation prompt](https://web.dev/learn/pwa/installation-prompt) · [Progressier — in-app PWA promotion](https://progressier.com/features/in-app-pwa-promotion)

### i18n
All strings via `t()` (i18next) per memory `i18n_three_language_sources` — **never** read copy off `useLanguage()` (that leaked device lang in View-as-Child 3×). New keys under an `install.*` namespace in `en.json` + `he.json`. The guard test in the i18n suite must stay green.

### Out of scope (flag, don't pull)
- ❌ A "Help & install **video**" (Lovable has a video; we ship instructions/text for v1 — video is a content task for Adi, not code).
- ❌ Web Push itself (SW `push` handler, firebase web SDK, VAPID) — separate package; today it's a `not_implemented` stub (§2.3). This package must not imply notifications exist.
- ❌ Push-notification re-engagement to drive installs (separate, FCM-gated — memory `fcm_hat4_pending`).
- ✅ **In scope:** add `screenshots` to `manifest.json` (rich Android install dialog — §3.5). No other manifest/icon/SW change (they already pass installability).
- ❌ Active desktop install nudge — desktop is capability-only (Settings entry + browser affordance); decided in §2.3, not a TODO.

---

## 4. Capabilities & Bottlenecks (Capability Check)

| # | What | This package |
|---|---|---|
| 1 | What CC can do | Write the platform-split hook + `InstallNudge` component + Settings entry, capture logic in `setupPwa.web.ts`, i18n keys (en/he), jest + typecheck + code-review. |
| 2 | What CC will do | Phase-by-phase in Plan Mode with diffs. Verify on **web** via `npm run web` + preview tools — including the `beforeinstallprompt` path and the iOS-Safari instruction branch (UA-spoof to confirm rendering). |
| 3 | What Adi must do herself | (a) **Real iOS Safari** check on an actual iPhone — the Add-to-Home-Screen flow can't be truly verified in a desktop preview. (b) **Real Android Chrome** check that the native install sheet fires. (c) Approve final copy (Pillar 2 — see Values). (d) Decide: ship video later or text-only for v1. |
| 4 | Where the bottleneck is | Device verification. Chrome desktop covers the `install` event; the **iOS-Safari** and **real-Android-sheet** branches need real devices (Hat-4). No emulator shortcut for the iOS Share sheet. |

---

## 5. Values Check (mandatory — 9 questions)

Infrastructure / distribution feature (how to install the app), parent-facing. Passes with a copy guardrail.

### Pillar 1 — Intrinsic Motivation
1. *Want it without a reward?* — N/A to the child; it's a parent install affordance. Neutral. **Pass.**
2. *Moves toward a self-chosen reward?* — Neutral; untouched. **Pass.**
3. *"I want" vs "I must"?* — Dismissible, non-blocking, never forced. **Pass.**

### Pillar 2 — Positive Coaching
1. *Shaming / comparative / failure-framed?* — No. "Add BUFF to your phone 🙂", never "you haven't installed yet / you're missing out." **Pass (guardrail below).**
2. *Child-failure empathy?* — No child failure state; not shown on child-owned sessions. **Pass.**
3. *BUDDY suffering/loss mechanic?* — None. **Pass.**

### Pillar 3 — Independence-Building
1. *More capable without the app?* — Neutral infra; lowers friction to the tool, doesn't create dependency. **Pass.**
2. *Child has a voice?* — Parent-controlled action, fully dismissible. **Pass.**
3. *Still necessary in 6 months?* — Yes while we ship a PWA. Plumbing, not a fading scaffold. **Pass (intentional infra exception).**

**Copy guardrail (Pillar 2):** lead with the outcome/benefit, not mechanics, per memory `marketing_why_what` — e.g. "Open BUFF straight from your home screen" over "Install our PWA." Plain, inviting, never FOMO/shame. Final copy → Adi.

**Verdict: PASS** — proceed to ROADMAP on Adi's approval.

---

## 6. Decisions & open questions

1. **Desktop — RESOLVED (§2.3):** no active banner; capability-only via the Settings entry + browser affordance. Active nudge is **mobile-only**.
2. **Frequency — RESOLVED (Adi 2026-06-20):** passive mobile banner shows at most once per engaged visit; on dismiss, **7-day cooldown** (localStorage flag). Settings entry always available.
3. **Video — RESOLVED (Adi 2026-06-20):** no screen-recorded video for v1 (CC can't capture a real iOS install flow; a faked one would mislead). Ship an **illustrated 3-step instruction card** (text + accurate icons, he/en) as a shippable SVG. Android screenshot can be grabbed from the emulator; a real iOS screenshot is a Hat-4 item if we want a photo instead of the illustration. The Lovable-style video stays a later content task for Adi.
4. **Banner coordination with `pkg/rate-us-port` — RESOLVED (Adi 2026-06-20):** this session **owns the Nudge Manager** (§3.4). Both banners share one slot, one-at-a-time, priority care > install > rate, with a global cooldown. Rate-us consumes the contract and writes nothing here. **Sequencing:** this session ships the manager + install nudge first; rate-us plugs in after.
5. **OPEN — rate passive-nudge priority/threshold:** confirmed as **lowest** here; the *engagement threshold* that makes a parent "ready to be asked to rate" is `pkg/rate-us-port`'s open question, not this one.
6. **OPEN — Final copy:** draft below in §7. Adi to redline (verb rules §2.1: "התקינו" Android / "הוסיפו למסך הבית" iOS, never "הורידו").

---

## 7. Copy draft (EN + HE) — for Adi's redline

Parent-facing surface, so standard-warm (not kid body-double voice). Headline leads with the **outcome** (home-screen access), button matches the **OS verb** — per `marketing_why_what` + §2.1.

### Passive banner (mobile, shared headline)
| Slot | EN | HE |
|---|---|---|
| Headline | Open BUFF straight from your home screen | פִתחו את BUFF ישר ממסך הבית |
| Subtext | One tap, no browser — just like an app. | בנגיעה אחת, בלי דפדפן — בדיוק כמו אפליקציה. |
| Dismiss | Maybe later | אולי אחר כך |

### Android (`install`)
| Slot | EN | HE |
|---|---|---|
| Primary button | Install | התקנה |
| Fallback (event missing) | Tap the menu ⋮ → Install app | פִתחו את התפריט ⋮ ← "התקנת אפליקציה" |

### iOS Safari (`ios-safari`) — opens the instruction card
| Slot | EN | HE |
|---|---|---|
| Button | How to add | איך מוסיפים |
| Card title | Add BUFF to your Home Screen | הוספת BUFF למסך הבית |
| Step 1 | Tap the **Share** button ⬆️ | הקישו על כפתור **השיתוף** ⬆️ |
| Step 2 | Choose **"Add to Home Screen"** | בחרו ב**"הוספה למסך הבית"** |
| Step 3 | Tap **"Add"** — done! | הקישו על **"הוספה"** — וזהו! |

### iOS non-Safari (`ios-other`)
| Slot | EN | HE |
|---|---|---|
| Message | To add BUFF, open this page in **Safari** first | כדי להוסיף את BUFF, פִתחו קודם את הדף ב-**Safari** |
| Helper | Then tap Share ⬆️ → Add to Home Screen | ואז: שיתוף ⬆️ ← הוספה למסך הבית |

### Settings entry (all web, incl. desktop)
| Slot | EN | HE |
|---|---|---|
| Row label | Install BUFF on this device | התקנת BUFF במכשיר הזה |
| Row subtext | Add a home-screen shortcut | קיצור דרך במסך הבית |
