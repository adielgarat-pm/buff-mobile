# `pkg/community-surfacing` — SPEC

**Status:** `BUILT — Adi approved 2026-07-27. Phases 0–4 complete, Gate 1 green. Awaiting review + Hat-4.`
**Slug:** `pkg/community-surfacing`
**Branch:** `pkg/community-surfacing` (off `main`)
**Target release:** OTA-eligible (JS-only, no new deps, no schema) — rides the current vc68 runtime.
**Drafted:** 2026-07-27 by CC, after the "no new WhatsApp joiners" audit.

> Target state for this package. Authoritative until superseded.

### Corrections found in Phase 0 (recon beat the plan)

Three assumptions in the draft were wrong and the build follows the corrected version:

1. **Instrumentation.** The draft proposed reusing "the existing event helper used by
   the install CTA". That helper is `installCtaTelemetry.web.ts` — **web-only**, and its
   Edge Function takes a fixed `{cta_id, event_type, placement, target}` shape. Using it
   would have left Android unmeasured. The build uses `logOnboardingEvent`
   (`lib/onboardingFunnel.ts`) instead: cross-platform, fire-and-forget, already the
   pattern the capture beta reuses. `onboarding_events.event_type` was confirmed against
   prod to carry **no CHECK constraint**, so the new `community_link_clicked` type is a
   client-only change — **no migration**.
2. **The guides are bilingual, not four single-language pages.** Each guide is one file
   with `<main id="lang-en">` + `<main id="lang-he">` and a JS language switcher, so
   Surface D is **8 insertion points**, not 4 — each language section getting its own
   group link.
3. **The add-child discriminator already existed.** No new param or profile read was
   needed: `saveAll` already fetches `pro_settings` *before* flipping
   `onboarding_complete`, so that pre-save value is the discriminator.

---

## Why this exists

BUFF has two live WhatsApp communities (HE + EN). Both invite links resolve to a valid
join page as of 2026-07-27. Yet joins have flatlined.

The audit found why:

| Surface | Community link present? |
|---|---|
| Landing footer (`Landing.tsx:402`) | ✅ — 7th item in a row of small grey text links |
| `/about` page (`AboutPage.tsx:24`) | ✅ — button |
| SEO guides (`/guides/*`, the actual organic traffic) | ❌ |
| **The app — any screen** | ❌ **none** |

The app is where 100% of new users land, and it never mentions the community.

The copy already exists and is already translated, with a **correct per-language link**:

```
src/i18n/he.json:998–1001   philosophy.community.title / .insight / .buttonText / .link  → HE group
src/i18n/en.json:998–1001   same keys                                                     → EN group
```

**No component references any of them.** They were ported from the Lovable build and
never wired to a screen — `PhilosophyScreen.tsx` renders pillars, principles and the
quote, and stops before the community block. This package is closer to a bug-fix than
a feature: render copy that is already written, tested and translated.

---

## Scope at a glance

| In v1 | Explicitly deferred |
|---|---|
| **A — Settings → About: "BUFF Community" row** | In-app community feed / forum |
| **B — Philosophy screen: community block** (the keys' intended home) | Any WhatsApp API integration or auto-invite |
| **C — Post-onboarding (UStep8) quiet join link**, below the primary CTA | Deep-linked per-family invites |
| **D — Community block at the foot of the 4 SEO guide pages** (landing-web) | Tracking who joined (WhatsApp gives us nothing) |
| Click instrumentation via the existing event helper | A second CTA anywhere in the child experience |

**Not in scope:** any child-facing surface. The community is parents-only, by design.

---

## Dependencies

| Dep | Status |
|---|---|
| `philosophy.community.*` i18n keys (HE + EN) | ✅ exist, translated, per-language link |
| `ParentSettingsScreen` `SECTIONS` array + `sectionAbout` | ✅ exists (`ParentSettingsScreen.tsx:191`) |
| `PhilosophyScreen` | ✅ exists, reachable from Settings → `rowPhilosophy` |
| `UStep8_Complete` | ✅ exists |
| landing-web static guides (`landing-web/public/guides/*/index.html`) | ✅ exist |
| New npm packages | ❌ **none** |
| Schema / RLS changes | ❌ **none** |

---

## Values Check

> 9 questions from `docs/BUFF_VALUES.md`. Parent-surface package → Pillar 1 questions are
> answered honestly as N/A rather than hand-waved.

| Pillar | Q | Answer |
|---|---|---|
| 1 — Intrinsic Motivation | 1 — would the kid want this without a virtual reward? | ⚪ **N/A** — parent-only surface. No child screen is touched. |
| 1 | 2 — closer to a real reward the kid chose? | ⚪ **N/A** — no reward economy involved. |
| 1 | 3 — feels like "I want to" not "I have to"? | ✅ Applied to the **parent**: every entry point is an opt-in link, never a modal, never a blocker, never repeated after dismissal. |
| 2 — Positive Coaching | 1 — any shaming / comparison / failure framing? | ✅ Copy is invitational ("questions, tips and support from parents who understand the journey"). No "parents like you are struggling", no social proof by comparison. |
| 2 | 2 — empathy not pressure on failure? | ✅ Not tied to any performance state. The link never appears *because* a child had a low day. |
| 2 | 3 — any BUDDY suffering/loss mechanic? | ✅ None. BUDDY is untouched. |
| 3 — Independence-Building | 1 — makes the child more capable without the app? | 🟡 **Indirect.** Peer support raises the parent's chance of staying the coach through week 3, which is when the child's habit either survives or dies (`project_buff_war_non_return`). Honest answer: this helps the parent, not the child directly. |
| 3 | 2 — does the child have a voice? | ⚪ **N/A** — parent-only. Crucially, the group is **not** a place where a child's data is surfaced; nothing from the child's screen is exported into it. |
| 3 | 3 — in 6 months, still needed or did its job? | ✅ The link is a one-time doorway; once joined, the app stops being the channel. Surface C is shown once, ever. |

**Values Check Pass:** [x] yes — draft. Re-verify against built behavior at package exit.

---

## Goal (end-state after this package merges)

A parent can find the community from inside the app in **one tap from Settings**, meets it
once at the moment they finish onboarding, and organic readers of the guides get an
invitation at the point they finish reading. The correct language group opens in every case.

---

## Behavior Contract

### Surface A — Settings → About → "BUFF Community"

1. A new row in the existing `sectionAbout` block of `ParentSettingsScreen`, directly
   **above** `rowPhilosophy`.
2. Label: new key `settings.rowCommunity` — HE `"קהילת BUFF"` / EN `"BUFF Community"`.
   Sub-value: reuse `philosophy.community.insight` (already translated).
3. Tap → opens `t('philosophy.community.link')` externally.
4. Because the link is an **i18n value**, the app's active language selects the group.
   No `language === 'he'` branching anywhere in this package — that pattern is what leaks
   device locale (`project_i18n_three_language_sources`).

### Surface B — Philosophy screen community block

1. Rendered at the foot of `PhilosophyScreen`, after the quote.
2. Uses `philosophy.community.title` + `.insight` + `.buttonText` + `.link` — the four keys
   exactly as authored. No new copy.
3. Same open-link behavior as A.

### Surface C — Post-onboarding join link (UStep8_Complete)

1. Appears **only after** `saved === true`, i.e. only once the profile is committed.
2. Rendered **below** the "Go to Dashboard" CTA and below the referral input, above
   `DisclaimerFooter`. Quiet text-link treatment (`textMuted`), never a button.
   Rationale: "Go to Dashboard" is the activation-critical tap
   (`project_activation_crisis_2026_07`) and must remain the single visually dominant action.
3. New keys `onboarding.step8.communityLine` + `.communityCta`.
4. Shown on first-time onboarding only — **suppressed on the add-child path**, which reuses
   this screen. Gate on the same param the screen already uses to distinguish the two flows
   (Phase 0 confirms the exact param; if none exists, gate on
   `profile.onboarding_complete === false` at mount).
5. One-shot: once tapped or once the screen has been completed, never shown again.
   Persist via `AsyncStorage` key `buff.communityInviteSeen` (no schema change).

### Surface D — Guides footer block (landing-web)

1. A community block appended to each of the 4 static guide pages
   (`adhd-screen-time`, `back-to-school`, `summer`, `why-adhd-charts-fail`).
2. Language of each guide page determines the group (these pages are single-language files —
   Phase 0 confirms which of the 4 are HE and which EN, and each gets its matching link).
3. Plain HTML/CSS consistent with the existing guide styling. No JS.

### Cross-cutting — opening the link

- **Native:** `Linking.openURL(url)`.
- **Web:** must open **synchronously inside the click handler** via `window.open(url, '_blank', 'noopener,noreferrer')`
  with a `window.location.href` fallback. `react-native-web`'s `Linking.openURL` resolves inside a
  promise, loses user activation and gets popup-blocked — this exact bug already cost us the Play
  Store CTA (see the comment at `GetTheAppCta.web.tsx:132`).
- Implemented once as a shared `openExternalUrl` helper in `src/platform/` (alongside `crossAlert`),
  with `.web.tsx` split, and reused by A/B/C. **This is the only structural addition** and it is
  extracting an existing, already-proven web implementation — not new architecture.

---

## Platform Parity

| Surface | Android | Web PWA |
|---|---|---|
| A — Settings row | ✅ `Linking.openURL` | ✅ `window.open` (new tab) |
| B — Philosophy block | ✅ | ✅ |
| C — UStep8 link | ✅ | ✅ |
| D — Guides footer | n/a (web-only asset) | ✅ |

No platform is left undefined. Verification required on **both** Android emulator and
`npm run web` before the package is called done.

---

## Instrumentation

Each surface logs a click with a `placement` discriminator (`settings` / `philosophy` /
`onboarding_complete`) through the existing event helper used by the install CTA, so we can
tell which doorway actually works. WhatsApp itself returns nothing — click-out is the only
signal we will ever have. Guides (Surface D) are static and are measured by group growth only.

---

## Out of scope — flagged, not pulled

- The landing footer's hard-coded `language === 'he' ? ... : ...` ternaries duplicate the link
  in two places (`Landing.tsx:402`, `AboutPage.tsx:24`). They work. Consolidating them into a
  shared constant is a **separate** cleanup — flagged, not touched here.
- Dead `philosophy.*` keys beyond the community block were not audited.

---

## Open Questions — resolved at approval

- **OQ-1 — RESOLVED (CC recommendation, approved 2026-07-27).** Surface C ships at the end of
  onboarding, below the CTA, one-shot. There is no day-3 channel to hold it for (no push, no
  email — `project_activation_crisis_2026_07`).
- **OQ-2 — RESOLVED (CC recommendation, approved 2026-07-27).** Both groups are surfaced. The
  EN group was ~5 members at the `launch-comms-2026-06-01` count; it is only empty until it
  isn't, and the intl GTM push (`project_intl_gtm_plan`) needs a destination.
  **Revisit if** EN joiners arrive and find a dead room — the fallback is to point EN users at
  the HE group's English-friendly thread until the EN group reaches ~20.

---

## Phases

| # | Phase | Exit condition |
|---|---|---|
| 0 | Recon | Confirm UStep8 add-child param, guide page languages, event-helper signature |
| 1 | `openExternalUrl` platform helper + unit test | tsc 0, jest green |
| 2 | Surface A + B (Settings row + Philosophy block) | Both languages verified Android + web |
| 3 | Surface C (UStep8, one-shot, add-child suppressed) | Add-child flow verified NOT to show it |
| 4 | Surface D (guides) | 4 pages, correct link per language |
| 5 | Exit deliverables | SPEC_SYNC rows, STATUS row, RELEASE_QUEUE row, Values re-check |

---

**Maintained by:** CC · **Approver:** Adi
