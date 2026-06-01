# Color Consolidation Plan

> **Status:** PLAN ONLY — implementation deferred to a separate session (Adi 2026-05-27).
> **Trigger:** Adi noticed a jarring color journey while navigating v18: pastel role-selection → purple/black auth → pastel/white parent settings.
> **Source of truth:** `docs/BUFF_BRAND.md §7 Visual Identity` (the 3-mode palette already exists; this plan is about *applying it consistently*, not inventing new colors).

---

## 1. The problem — the entry funnel flickers light↔dark↔light

The user's path through the app crosses three different background philosophies that were each built in isolation:

| Step | Screen | Current canvas | Hardcoded? | Feels like |
|---|---|---|---|---|
| 1 | RoleSelection | `#ede8ff` lavender | yes (const BG) | Pastel ☀️ |
| 2a | Login | `#0F0F1A` cold dark | yes (StyleSheet) | Cold dark 🌑 |
| 2b | Signup | dark (same family) | yes | Cold dark 🌑 |
| 2c | ChildJoin | `#0f0d1a` cold dark | yes (const BG) | Cold dark 🌑 |
| 3 | Parent app (Dashboard/Settings) | `T.bg` theme token (≈ `#FAFAFA`/`#ede8ff`) | NO — uses theme system | Light ☀️ |
| 4-kid | Child app (young) | Pastel theme | theme | Pastel ☀️ |
| 4-teen | Child app (teen) | `#1a1636` Gamer dark | theme | Warm dark 🌙 |

**Two distinct issues:**

### Issue A — Auth screens are off-brand cold-dark
Login/Signup/ChildJoin use `#0F0F1A` / `#0f0d1a` with **cool-gray** chrome (`#374151` borders, `#E5E7EB` text, `#1A1A2E` inputs). None of these are brand colors. The brand explicitly forbids this register:

> **BUFF_BRAND.md §7.2:** "אסור ב-BUFF: Pure `#000000` (קר מדי, לא ב-DNA)…"

The brand's dark mode is **warm deep-violet** (`#1a1636`), not cold navy-gray. So even the dark itself is the wrong dark.

### Issue B — The funnel mixes light and dark with no logic
For a **parent**, the journey is light → dark → light. The dark auth is a meaningless detour — the parent never sees dark again. For a **young kid**, same problem. Only a **teen** ends in dark (Gamer mode), so for teens the dark auth could be justified as a preview — but we don't know the kid's age at auth time.

---

## 2. The brand already has the answer — 3 modes (BUFF_BRAND.md §7)

| Mode | Canvas token | Hex | Who / when |
|---|---|---|---|
| **Pastel** | `--lavender-bg` | `#F4F0FA` | Kid mode (ages 6-12), onboarding |
| **Parent** | `--off-white` | `#FAFAFA` | Parent app — "morning coffee" calm |
| **Gamer** | `--violet-deep` | `#1a1636` | Teen mode (ages 13-18) ONLY |

Shared accents across all modes:
| Token | Hex | Use |
|---|---|---|
| `--violet-primary` | `#8b5cf6` | Primary actions, brand surface |
| `--violet-accent` | `#7C3AED` | Hover/pressed, Gamer accent |
| `--violet-soft` | `#A78BFA` | Secondary text, muted highlights |
| `--lime-bolt` | `#A8E63E` | The "dopamine" signal — logo bolt, sparingly |
| `--mint-success` | `#7DDFAB` | Success, BUFFs-positive, completion |
| `--gray-text` | `#1a1636` | Body text on light (deep-violet, softer than black) |

---

## 3. Recommendation (confidence: HIGH on direction, MEDIUM on the one open question)

### Core principle
**The entire entry funnel — RoleSelection, Login, Signup, ChildJoin, onboarding — should be ONE coherent light experience (Pastel family).** Dark is reserved exclusively for the teen Gamer in-app experience. That way:
- Parent path: Pastel → Pastel → Parent-light = seamless, no flicker
- Young kid path: Pastel → Pastel → Pastel = seamless
- Teen path: Pastel → Pastel → **deliberate transition to Gamer dark** = the darkness becomes a meaningful "you've entered your space" signal instead of random

### Proposed canvas per screen (target state)

| Screen | Current | → Target | Token |
|---|---|---|---|
| RoleSelection | `#ede8ff` | `#F4F0FA` | `--lavender-bg` |
| Login | `#0F0F1A` | `#F4F0FA` light | `--lavender-bg` |
| Signup | dark | `#F4F0FA` light | `--lavender-bg` |
| ChildJoin | `#0f0d1a` | `#F4F0FA` light | `--lavender-bg` |
| Onboarding steps | mixed | `#F4F0FA` | `--lavender-bg` |
| Parent app | `T.bg` | keep (`#FAFAFA`) | `--off-white` |
| Teen Gamer app | `#1a1636` | keep | `--violet-deep` |

On a light auth canvas, the existing `--violet-primary` (`#8b5cf6`) buttons + `--violet-soft` text already read beautifully — no need to invent anything. Inputs become white cards with a `#E9E3F5`-ish border instead of `#1A1A2E`/`#374151`.

### THE ONE OPEN QUESTION for Adi

**Should ChildJoin (the kid-facing auth) stay dark as a Gamer-mode teaser, or go light with everyone else?**
- **Light (CC recommendation):** maximum consistency; we don't know the kid's age at join time, so don't presume Gamer.
- **Dark:** if you believe most own-device kids are teens (the Gamer demographic), a dark ChildJoin previews their world.

CC leans **light** (we can't assume age, and the teen gets the dark reveal *after* age detection). But this is a brand/product call — your decision drives the ChildJoin row above.

---

## 4. Why this is a "token consolidation," not a repaint

The root cause is that screens were built with **hardcoded hex values** instead of pulling from a shared token source. The parent app already does it right (`T.bg`, `T.card`, `T.cardBorder` from a theme object). The fix is to extend that discipline to the auth + onboarding screens.

This matches the existing flag in `BUFF_BRAND.md §line 370`:
> "color token consolidation across mobile + web + logo."

And the audit items at §7 lines 362-363:
- `#0F0F1A` in tailwind vs `#1a1636` in splash — **mismatch confirmed** (it's in LoginScreen too)
- web accent `mint` vs `#7DDFAB` — verify during the same pass

---

## 5. Implementation approach (for the separate session)

### Phase 0 — Create the token source (foundation)
- Add a `src/theme/palette.ts` exporting the BUFF_BRAND.md §7 master palette as named constants (single source of truth)
- Add a `src/theme/modes.ts` with `pastel`, `parent`, `gamer` mode objects (canvas, card, cardBorder, text, accent, success) — mirror the shape the parent app's `T` object already uses

### Phase 1 — Migrate auth screens to Pastel
- `RoleSelectionScreen.tsx` — swap `#ede8ff` → `palette.lavenderBg`; verify cards/text tokens
- `LoginScreen.tsx` — biggest change: dark→light. Replace `#0F0F1A`/`#1A1A2E`/`#374151`/`#E5E7EB` with Pastel tokens. Inputs → white cards + lavender borders. Keep `#7C3AED`→`--violet-primary` buttons.
- `SignupScreen.tsx` — same treatment
- `ChildJoinScreen.tsx` — per Adi's answer to §3 open question (light recommended)
- Verify the `LanguagePicker` globe icon contrast still works on the new light canvas (currently `#A78BFA` on dark — needs a darker variant on light)

### Phase 2 — Onboarding consistency
- Sweep `src/screens/onboarding/**` for hardcoded backgrounds; route through tokens

### Phase 3 — RTL + contrast audit
- Re-verify all migrated screens in both `he` (RTL) and `en` (LTR)
- WCAG AA contrast check: `--violet-soft` text on `--lavender-bg` may be too low-contrast for body text — verify, bump to `--gray-text` where needed (use the `design:accessibility-review` skill)

### Phase 4 — Token audit closeout
- Resolve the `#0F0F1A` vs `#1a1636` splash/tailwind mismatch (§7 audit item 5)
- Update `BUFF_BRAND.md §7` audit checklist; close the "color token consolidation" flag

### Verification per phase
- `npm run web` + Claude_Preview for each migrated screen (light screens are previewable, unlike auth-gated ones — bonus)
- Screenshot before/after for the funnel: RoleSelection → Login → Parent (should now be a smooth light gradient, no dark flash)

### Estimated scope
- Phase 0-1: ~half a session (the LoginScreen dark→light is the bulk)
- Phase 2-4: ~half a session
- Total: 1 focused session. New `pkg/color-consolidation` package.

---

## 6. Out of scope for this plan

- ❌ The Vibe Check display variants (smileys for young kids / recharging battery for teens) — **separate flagged item**, Adi raised it the same evening. That's a Vibe Check component redesign, not a color-token issue. Track separately.
- ❌ Web (`buffadhd.com` / Lovable) color sync — note it during Phase 4 audit but the Lovable codebase is a separate deploy.
- ❌ Logo color variants (monochrome dark still missing per §7.1) — separate asset task.

---

## 7. Quick-resume prompt for the implementation session

```
Plan Mode. Pick up pkg/color-consolidation.
Read first:
- docs/sessions/color-consolidation/COLOR_PLAN.md (this plan)
- docs/BUFF_BRAND.md §7 (the 3-mode master palette — source of truth)
- src/screens/auth/{RoleSelection,Login,Signup,ChildJoin}Screen.tsx (current hardcoded colors)
- src/screens/parent/ParentSettingsScreen.tsx (the T.* theme-token pattern to mirror)

Adi's open decision needed before Phase 1: should ChildJoin go light
(CC recommendation) or stay dark as a Gamer teaser? (§3)

Build the token source first (Phase 0), then migrate auth screens
dark→light (Phase 1). Chunk-by-chunk per CLAUDE.md. Verify each
screen via npm run web + Claude_Preview (auth screens become
previewable once they're light + unauth).
```

---

**Lovable Publish reminder:** N/A for the planning doc. When the implementation ships, if any shared color token also lives in the Lovable web codebase, that's a separate Lovable Publish step.
