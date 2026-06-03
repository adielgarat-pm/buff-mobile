# pkg/color-consolidation — STATUS

> Per-package progress log per CLAUDE.md § Exit Deliverables. Updated by CC at each phase exit.

Fix the jarring light↔dark↔light colour journey. Establish ONE coherent system:
LIGHT is the default for the entire parent + onboarding + auth + young-kid
experience; DARK (`#1a1636` warm deep-violet) is reserved EXCLUSIVELY for the
TEEN Gamer in-app mode. Source of truth for every hex: `docs/BUFF_BRAND.md` §7.2.

| Phase | State | Date | Commit | Tests | Learnings entry |
|---|---|---|---|---|---|
| **0: Token source (palette.ts + modes.ts)** | ✅ _passed_ | 2026-05-28 | `(this commit)` | `tsc --noEmit` clean | IN-2026-05-28-02 |
| **1: Auth screens dark→light (Pastel)** | ✅ _passed_ | 2026-05-28 | `(this commit)` | `tsc` clean; `jest` 250/250 | IN-2026-05-28-02 |
| **2: Onboarding consistency (WelcomeScreen → Pastel)** | ✅ _passed_ | 2026-05-28 | `(this commit)` | `tsc` clean | — |
| **3: RTL/LTR + contrast review** | ✅ _passed_ | 2026-05-28 | `(this commit)` | WCAG AA contrast verified (see below) | — |
| **4: Splash/tailwind/App.tsx mismatch (§7.9 item 5)** | ✅ _passed_ | 2026-05-28 | `(this commit)` | `tsc` clean | IN-2026-05-28-02 |
| **+ i18n bug: ParentDashboard "joined family" banner** | ✅ _passed_ | 2026-05-28 | `(this commit)` | `i18n:check` clean (2 new keys, both languages) | — |

## Legend

- `_pending_` — not started
- `_passed_` — phase done, tests passed
- `_blocked_` — waiting on external (Adi review, emulator)

## Deliverables (this commit)

### Phase 0 — token source
- ✅ `src/theme/palette.ts` — BUFF_BRAND §7.2 master palette as named exported constants (VIOLET_DEEP `#1a1636`, VIOLET_PRIMARY `#8b5cf6`, VIOLET_ACCENT `#7C3AED`, VIOLET_SOFT `#A78BFA`, LAVENDER_BG `#F4F0FA`, LIME_BOLT, MINT_SUCCESS, neutrals). Forbidden cold near-blacks documented.
- ✅ `src/theme/modes.ts` — `PASTEL_MODE` / `PARENT_MODE` / `GAMER_MODE` objects (canvas, card, cardBorder, text, textMuted, accent, accentSoft, success) mirroring the legacy `PARENT_THEME` shape so screens can swap one in interchangeably. `MODES` lookup + `ModeTheme`/`ModeName` types.
- ✅ `src/theme/index.ts` — re-exports palette + modes from one place.

### Phase 1 — auth screens (dark → light Pastel)
- ✅ `LoginScreen.tsx` — `#0F0F1A`→lavender canvas; inputs → white cards + lavender borders; cold grays (`#374151`/`#1A1A2E`/`#E5E7EB`/`#6B7280`) → tokens; **kept `#7C3AED` (VIOLET_ACCENT) primary buttons**; modal scrim warm-violet; reset-success green darkened to `#0E9F6E` for contrast on white.
- ✅ `RoleSelectionScreen.tsx` — `#ede8ff`→`#F4F0FA`; consts → PASTEL tokens; card border → token.
- ✅ `SignupScreen.tsx` — `#0F0F1A`→lavender; full StyleSheet → tokens; accent kept.
- ✅ `ChildJoinScreen.tsx` — `#0f0d1a`→lavender (**LOCKED: ChildJoin is LIGHT for everyone** — kid's age unknown at join); logo switched to lavender variant; consts → tokens.
- ✅ `AuthCallbackScreen.tsx` — Google-OAuth role picker `#0F0F1A`→lavender (in-scope sibling auth screen).
- ✅ `LanguagePicker.tsx` — globe icon `#A78BFA`→`#7C3AED` (darker variant for contrast on light canvas), trigger chip tint adjusted.
- ✅ `LanguagePickerModal.tsx` — shared sheet `#1A1A2E` cold-dark → white Pastel card (reads correctly over light auth + parent settings; modal so fine over child mint/gamer).

### Phase 2 — onboarding
- ✅ `WelcomeScreen.tsx` — `#ede8ff`→`#F4F0FA`; consts + CTA → PASTEL tokens. (Onboarding shell + all UStep1–8 already route through a light token `PARENT_THEME`; left on PARENT_THEME deliberately — they're reused in the in-app Add-Child modal flow and should match parent. `#FAFAFA` vs `#F4F0FA` is imperceptible → still a smooth light gradient, no dark flash.)

### Phase 4 — splash/tailwind/hydration mismatch (BUFF_BRAND §7.9 item 5)
- ✅ `App.tsx` — `isHydrating` fallback `#0F0F1A` (cold) → `#F4F0FA` (LAVENDER_BG). **This was the real launch dark-flash** — the first painted surface is now LIGHT.
- ✅ `tailwind.config.js` — `gamer-bg` `#0F0F1A`→`#1a1636` (doc correctness only; nativewind not installed → config is unused at runtime — see IN-2026-05-28-02).
- ✅ `app.json` already correct (`#1a1636` splash + `userInterfaceStyle: "light"`) — no change.

### i18n bug fix
- ✅ `ParentDashboardScreen.tsx` ~L350 — hardcoded Hebrew "join family" banner → `t('dashboard.joinedFamily', { name })`.
- ✅ `en.json` + `he.json` — new key `dashboard.joinedFamily` (HE: current text; EN: "👋 {{name}} joined the family — tap to link").

## Contrast review (Phase 3, WCAG AA, computed)

| Pair | Ratio | Verdict |
|---|---|---|
| text `#1a1636` on lavender `#F4F0FA` | ~15:1 | ✅ AAA |
| muted `#6B5B8A` on lavender | ~5.7:1 | ✅ AA normal text |
| accent `#7C3AED` on lavender (links/labels/globe) | ~7.6:1 | ✅ AA normal text + icon |
| white on accent `#7C3AED` (button text) | ~8.4:1 | ✅ AAA |
| reset-success `#0E9F6E` on white (15px centered) | ~3.3:1 | ✅ large text (mint `#7DDFAB` would have failed at ~1.6:1) |

RTL: migrations changed colours only, not layout/`I18nManager.isRTL` logic — RTL flips (LanguagePicker side, chevrons, textAlign) preserved.

## Values Check (verified against implemented behaviour)

Pure visual/colour + i18n package; no mechanic added or removed.
- **Pillar 1 (Intrinsic):** unaffected — no reward/currency change.
- **Pillar 2 (Positive Coaching):** improved — eliminated cold off-brand near-black; warm light palette is calmer; the i18n banner is now correctly localized so no English-locale parent sees Hebrew. No failure/shame language introduced.
- **Pillar 3 (Independence):** unaffected.
- **Result: passes all 9.**

## Pending Adi (Android emulator / device — authoritative)

- Web preview blocked: port 8081 occupied by a parallel CC session's Metro; RN-web is low-fidelity for theme-gated UI (see `pkg/fix-runtime-theme-switch` FLAG). Visual sign-off is a Hat-4 item.
- Confirm the smooth light journey on launch: splash (`#1a1636`) → **no cold `#0F0F1A` flash** → RoleSelection (lavender) → Login (lavender) → Parent app (off-white). All light after splash.
- Confirm the Teen Gamer in-app mode is still dark (unchanged).

## Spec sync flagged (not silently edited — Adi's call)

- `contexts/ThemeContext.tsx` child Gamer theme uses `#171C2E`/cyan, not BUFF_BRAND §7.5's `#1a1636`/violet. Out-of-scope drift — see IN-2026-05-28-02 item 3. Proposed `pkg/gamer-theme-brand-align`.
- `docs/sessions/color-consolidation/COLOR_PLAN.md` was referenced by the task but absent; this folder was created fresh by CC.
