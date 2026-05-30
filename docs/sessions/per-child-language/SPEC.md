# SPEC — `pkg/per-child-language` (DRAFT, not approved)

> **Status:** DRAFT by CC, 2026-05-29. NOT approved, NOT implemented.
> **Origin:** PR #120 (onboarding starter tasks) introduced `detectLangFromName` to pick a
> child's task language from the script of their name. Emulator + DB testing (2026-05-29)
> showed the real anomaly: Adi's own kids are stored with **Latin display names** (Itay, Emi,
> Leia) but are **Hebrew speakers**, so name-script alone would give them English tasks.
> Adi's call: keep name-script as a smart default, but add an explicit **per-child language**
> the parent can override — without bloating the parent's settings.
> **Relates to / depends on:** `src/contexts/LanguageContext.tsx` (device-level language +
> RTL), `pkg/settings-language` (in-progress branch — see Coordination), PR #120
> (`detectLangFromName`, task-title baking), IN-2026-05-29-04.

---

## 1. Goal / target state

Each child has an explicit **language** (`he` | `en`) that the parent controls. It:
1. Defaults at onboarding from `detectLangFromName(childName)` (PR #120's logic) — so most
   families never touch it.
2. Is editable per child via a single toggle on the existing **EditChild** screen — not a new
   settings area.
3. Drives: (a) the language starter tasks are written in, (b) the language the **child's own
   device** renders in, (c) the strings shown when a parent uses **View-as-Child**.

A parent's own UI language is unchanged by this feature — it stays the device language
(`LanguageContext`). Per-child language and device language are **two different axes**; §5 is
the map of how they interact, and §6 is where they conflict.

---

## 2. What already exists (do NOT rebuild)

| Piece | File | Behaviour |
|---|---|---|
| Device language | `LanguageContext.tsx` | One language per app install, persisted to AsyncStorage `buff_language`. Hydrates AsyncStorage → device locale → `en`. |
| **RTL handling** | `LanguageContext.tsx` | `he` = RTL, `en` = LTR. `I18nManager.forceRTL` applied at mount. **A he↔en flip changes layout direction, which the native engine only reads at startup → `setLanguage` triggers `Updates.reloadAsync()` (or a manual-restart Alert in dev).** Strings update live; **layout direction needs a restart.** ← the central constraint of this whole spec. |
| Language picker | `LanguagePicker.tsx` | Used in ParentSettings + ChildSettings (calls `setLanguage`). |
| View-as-Child | `ModeContext.tsx` | `enterChildPreview(childId)` flips `viewMode` to `'child'` + sets `previewChildId`. **Does NOT touch language today** — child preview renders in the parent's device language. |
| Task titles | `tasks.title` (single column) | Monolingual; baked at onboarding (PR #120 bakes via `detectLangFromName`). |
| Rewards | `store_rewards.title` + `title_he` | **Already bilingual**; rendered via `pickI18nColumn(row, locale)`. Adapts to whatever locale is active. ✅ no change needed. |

---

## 3. Data model

- Add **`pro_settings.language: 'he' | 'en'`** to each child profile (JSON column — **no
  migration**; same place as `age_group`/`gender`/`onboarding_data`).
- **Default (new child):** `detectLangFromName(childName)` at onboarding → write into
  `pro_settings.language` AND use it to bake task titles. (PR #120 change: read from this field
  instead of inferring inline.)
- **Backfill (existing children):** see OQ-3 — recommended: one-time set
  `pro_settings.language = detectLangFromName(display_name)`, BUT flag that this gives Itay/Emi/
  Leia `en` (Latin names) despite Hebrew tasks. Safer alt: backfill from the language of the
  child's **existing** task titles if detectable, else device language. **Adi decision.**
- **Resolution helper** (new): `resolveChildLang(child) = child.pro_settings?.language ?? detectLangFromName(child.display_name) ?? deviceLanguage`.

---

## 4. The three language axes (keep these distinct)

1. **Device language** — `LanguageContext`, per app install. Controls the **parent's own UI**
   and the **native RTL/LTR layout direction** (restart-gated).
2. **Per-child language** — `pro_settings.language`. Controls **that child's** content + view.
3. **Baked task-title language** — frozen into `tasks.title` at creation time (Phase 1).

Conflicts happen wherever two axes are active on one screen at one time. §5 maps the intended
winner per surface; §6 lists the genuine clashes.

---

## 5. Surface → language resolution (intended behaviour)

| # | Surface | Strings (UI chrome) | Task titles | RTL layout | Notes |
|---|---|---|---|---|---|
| 5.1 | Parent's own UI (dashboard, settings) | **Device** language | n/a | Device | Unchanged by this feature. |
| 5.2 | Parent Tasks tab (parent reads a child's task list) | Device language | **Child's baked language** (Phase 1) | Device | Mild mismatch: an English-UI parent may see a Hebrew task title. Accepted in Phase 1; Phase 2 fixes it. |
| 5.3 | **View-as-Child** on parent device | **Child** language (strings flip live) | Child's baked language | **Device** (NOT flipped — see §6.1) | Preview approximation: text is the child's language, layout direction stays the device's to avoid a restart on every preview. |
| 5.4 | **Child's OWN device** (ChildJoin persistent session) | **Child** language | Child's baked language | **Child** (full RTL, restart-once at session bind) | The real daily-use case; deserves full correctness. |
| 5.5 | Onboarding (parent creating the child) | Device language (parent is driving) | Written in **child** language (= `resolveChildLang`) | Device | This is where the default is computed + stored. |
| 5.6 | Rewards (any surface) | follows active locale | bilingual already | — | ✅ already correct via `pickI18nColumn`. |

---

## 6. Conflicts & recommended resolutions

### 6.1 — RTL direction can't flip live (THE hard one)
`he` is RTL, `en` is LTR. The native layout engine reads `I18nManager.isRTL` only at startup;
`LanguageContext.setLanguage` already restarts the app when direction changes. Therefore a
**single device cannot show RTL and LTR at the same time**, and we cannot silently flip
direction when a parent enters View-as-Child.

- **Same-direction pairs** (parent `he` + child `he`, or parent `en` + child `en`): no problem.
- **Cross-direction** (parent `en` device previews a `he` child, or vice-versa):
  - **Recommended (5.3):** in View-as-Child, switch **strings only** (`i18n.changeLanguage` for
    the preview) and leave layout direction = device. Hebrew text still renders RTL *within*
    each text box (BiDi), but rows/alignment stay the device's direction. Honest, no restart.
  - **Rejected:** forcing `reloadApp()` on every preview enter/exit — too jarring for a feature
    parents tap dozens of times a day.
  - **Child's own device (5.4):** full RTL is correct and worth one restart — handled at session
    bind (§6.2), exactly like a normal device language change.
- **OQ-1:** is "strings-only, device-direction" acceptable for cross-direction *preview*, or do
  you want the preview visually exact (which forces a restart)? Recommend strings-only.

### 6.2 — Who wins on a child's OWN device: profile vs device setting?
On a ChildJoin device the only user is that one child. Today `LanguageContext` hydrates from
AsyncStorage/device locale and is **unaware of the auth profile**.
- **Recommended:** when `profile.role === 'child'`, `LanguageContext` hydrates from
  `resolveChildLang(profile)` (the parent-set per-child language) and treats it as the source of
  truth, overriding the device AsyncStorage default. If that differs from the current device
  direction, do the one-time restart (same path as `setLanguage`).
- **OQ-2:** may a child change their own language from **ChildSettings** (the picker exists
  there)? Options: (a) hide/disable the picker in child mode — parent owns it; (b) allow it, and
  writing it updates `pro_settings.language` (child overrides parent). Recommend **(a)** for MVP
  — keeps the parent in control (Pillar: parent-managed), avoids a child↔parent tug-of-war.

### 6.3 — Backfill of existing children
Existing kids have no `pro_settings.language`; Adi's are Latin-named Hebrew speakers.
- **OQ-3:** backfill rule — (a) `detectLangFromName` (gives Itay/Emi/Leia `en` — likely wrong);
  (b) infer from the language of each child's existing task titles (Itay→he, Emi→en per current
  DB); (c) default all to `he` (Israel-first) and let parents flip exceptions; (d) leave null →
  resolve to device language at render. Recommend **(b) if cheap, else (c)**.

### 6.4 — Phase-1 task-title staleness
Task titles are baked. If a parent flips a child `he→en` after onboarding, the UI chrome + new
tasks flip but **old task titles stay in the original language** → a mixed-language list.
- **Phase 1:** accept; surface a one-line note in the EditChild toggle ("changes new tasks; the
  UI flips, existing task names stay"). 
- **Phase 2 (separate, optional):** make `tasks.title` bilingual (add `title_he`, mirror the
  rewards pattern + `pickI18nColumn`) so flips are fully live. Mobile DB has no prod users → CC
  can add the column. Bigger; do only if Adi wants instant full switching.

### 6.5 — Parent device language change mid-session
Parent flips **device** language in ParentSettings. Effect: parent UI + RTL restart. It does
**not** change any child's `pro_settings.language`. View-as-Child still uses the child's
language. ✅ clean separation — but verify the restart doesn't strand an in-progress preview.

### 6.6 — Multi-child, one parent device
Child A `he`, Child B `en`, parent `en`. Preview A → Hebrew strings (LTR layout per §6.1) →
exit → device `en` → preview B → `en` (matches device, trivial). Each `enterChildPreview` must
re-resolve language from the previewed child; `exitChildPreview` must restore device language.
- **OQ-4:** on exit, restore to device language via `i18n.changeLanguage(deviceLang)` (no
  restart since direction returns to device's own). Confirm no flicker.

### 6.7 — Onboarding preview vs saved language
PR #120 currently bakes via name-script. Under this spec, onboarding should bake via
`resolveChildLang` (= the to-be-stored `pro_settings.language`). The UStep5 on-screen preview
should show titles in that same language for consistency. Small change to PR #120 (or layer on
after it merges).

---

## 7. Scope split

**Phase 1 — `pkg/per-child-language` (this package):**
1. `pro_settings.language` field + `resolveChildLang` helper.
2. Onboarding writes it (default `detectLangFromName`) + bakes task titles from it (adjust PR #120).
3. EditChild: single language toggle (עברית / English) with the Phase-1 note (6.4).
4. Child's-own-device: `LanguageContext` hydrates from the child profile (6.2), restart-once on
   direction change.
5. View-as-Child: strings-only switch to child language on enter, restore on exit (6.1/6.6).
6. Backfill existing children per OQ-3.
7. ChildSettings language picker hidden/disabled in child mode per OQ-2(a).

**Phase 2 — `pkg/bilingual-tasks` (separate, optional, only if Adi wants live full switching):**
- `tasks.title` → bilingual (`+ title_he`), render via `pickI18nColumn`, retro-translate or
  dual-write existing tasks. Removes the 6.4 staleness entirely.

---

## 8. Coordination

- **`pkg/settings-language`** (in-progress branch): owns the device-level picker + `LanguageContext`.
  Per-child language LAYERS on top — do not duplicate the picker logic; reuse `setLanguage` /
  `i18n.changeLanguage`. If settings-language is mid-flight, sequence this **after** it merges, or
  rebase. **Check with that session before starting.**
- **PR #120:** if it merges first, Phase 1 changes the task-title source from inline
  `detectLangFromName(childName)` to `resolveChildLang(child)` (writes through `pro_settings.language`).
  No conflict, just a small follow-up edit. If #120 is still open, fold the `pro_settings.language`
  write into it.

---

## 9. Values Check (to complete at design-finalisation)

- **Pillar 1 (Intrinsic):** language is a comprehension/accessibility setting, not a reward
  mechanic. Neutral. ✅
- **Pillar 2 (Positive coaching):** ensure the EditChild toggle copy is neutral; no "fix your
  child's language". ✅ (copy review at build).
- **Pillar 3 (Independence / child voice):** OQ-2 — letting a child set their own language is a
  voice win, but risks parent/child conflict. MVP keeps it parent-controlled; revisit giving
  older teens self-control as a follow-up. ⚠️→ decision logged.

---

## 10. Decisions — LOCKED (Adi accepted CC recommendations, 2026-05-29: "מקבלת")

1. **OQ-1 (6.1):** View-as-Child cross-direction = **strings-only** (no restart; layout keeps
   the device direction). Hebrew text still renders RTL per-textbox via BiDi.
2. **OQ-2 (6.2):** A child **cannot** change their own language on-device for MVP — the parent
   owns it (hide/disable the picker in child mode).
3. **OQ-3 (6.3):** Backfill existing children = **infer from the language of their existing
   task titles; if undetectable, default `he`** (Israel-first). NOT name-script (would wrongly
   give Itay/Emi/Leia `en`).
4. **OQ-4 (6.6):** Exit-preview restores device language with no restart/flicker — **verify at
   build** (must hold).
5. **Scope:** **Phase 1 now**; Phase 2 (bilingual tasks) deferred to `pkg/bilingual-tasks`.
6. **Sequencing:** `pkg/settings-language` is **already merged to main** (commit `953afa8`) so
   `LanguageContext` exists. F **branches from `pkg/onboarding-starter-tasks`** (PR #120, which
   it extends) and rebases onto main if #120 merges first.

---

## 11. Test plan (Hat mapping — for the build session)

- **Hat 1:** unit `resolveChildLang` (profile > name-script > device); `detectLangFromName`
  already covered. typecheck/jest/i18n:check.
- **Hat 3 (emulator):** (a) onboard he-named + en-named child → correct task language;
  (b) EditChild toggle flips child language → new task + child-mode UI reflect it;
  (c) View-as-Child of a he child from an en device → Hebrew strings, no crash/restart;
  (d) multi-child preview A(he)→B(en) → each correct, exit restores parent.
  ⚠️ NOTE the 2026-05-29 finding: onboarding E2E on the shared emulator was flaky (dashboard
  refetch churn dismissed the modal). Budget for that or get exclusive emulator.
- **Hat 4 (Adi, real device):** the RTL restart on a child's own device (ChildJoin) — the one
  flow the emulator can't fully exercise (persistent child session + real restart feel).
