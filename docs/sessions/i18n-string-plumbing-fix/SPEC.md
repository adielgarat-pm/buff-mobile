# i18n-string-plumbing-fix — SPEC

> Target state for this package. Authoritative until superseded.
> Wins over canonical docs during the package; canonical docs update at exit per SPEC_SYNC.md.

**Slug:** `pkg/i18n-string-plumbing-fix`
**Branch:** `pkg/i18n-string-plumbing-fix`
**Origin:** Noa Morag feedback 2026-05-27 — "חלק מהממשק בעברית וחלק באנגלית, המשימות באנגלית גם בעברית". Investigation in this session traced the root to bilingual data being written/read incompletely in two places (tasks INSERT picks English unconditionally; rewards SELECT ignores `title_he`). Same root cause, two surfaces — no guardrail prevents recurrence.
**Depends on:** nothing.
**Unblocks:** consistent Hebrew display across all bilingual content paths + future-proof pattern that catches the bug class in CI.

---

## Why a systemic fix and not a point fix

Adi's call 2026-05-27 (chat transcript): "אני רוצה שנבין את סיבת העומק ולא נטפל נקודתית". Investigation confirmed:

1. Same root cause (incomplete bilingual plumbing) already manifested **twice with different fingerprints**:
   - `UStep5_Preview.tsx:179, :196` — INSERT hardcodes `.title.en` even though `lang` is computed two lines above and never used
   - `ParentRewardsScreen.tsx:68`, `ChildRewardsScreen.tsx:69`, `GamerRewardsScreen.tsx:102` — SELECT omits `title_he` even though the column exists and INSERT correctly populates it
2. No code convention, helper, or lint rule prevents the same regression in any future bilingual field (skins, achievements, badges, philosophy strings, etc.).
3. Evidence base: DB query (this session) confirmed Noa + Adi are the only 2 families today with English starter tasks, both from buff-mobile onboarding 2026-05-26/27 — NOT a Lovable migration artifact. Going forward every new parent hits this.

---

## Capabilities & Bottlenecks

### What CC does
- **Phase 1**: Create `src/lib/i18nString.ts` helper with `pickLang(I18nString, lang)` + `pickI18nColumn(row, lang)`. Single source of truth. Unit test.
- **Phase 2**: Fix INSERT in `UStep5_Preview.tsx` — replace 2 occurrences of `t.title.en` / `r.title.en` with locale-aware calls via the helper. **Schema decision: single-column `tasks.title` (no migration).** Rewards already have both columns; INSERT stays.
- **Phase 3**: Fix SELECT + display in 3 reward screens (`ParentRewards`, `ChildRewards`, `GamerRewards`) — add `title_he` to SELECT, render via `pickI18nColumn`.
- **Phase 4**: Audit + ESLint rule. Grep entire `src/` for any remaining `.title.en` / `.title.he` / `.title_he` access outside `i18nString.ts`. Add `no-restricted-syntax` rule to `eslint.config.js` banning future bypasses.
- **Phase 5**: One-shot SQL backfill via Supabase MCP — update Adi's + Noa's existing English starter task titles to their Hebrew counterparts. Match by exact title string against `STARTER_TASKS_BY_CHALLENGE`.
- **Phase 6**: Docs — INTEGRATION_LEARNINGS entry IN-2026-05-27-04 documenting the regression class + guardrail. SPEC_SYNC commits. STATUS.md closeout.

### What Adi does
- Approve the helper API at Phase 1 (interface decision — easy to override before Phase 2 uses it).
- Approve the backfill SQL preview at Phase 5 (it's destructive in the sense that it changes data; reversible if wrong via `task_audit_log` if such exists, else manual edit).
- Hat-4 verification on Android emulator: complete onboarding in Hebrew → see Hebrew tasks. Switch to English, complete a new family onboarding → see English tasks.

### Bottlenecks
- Phase 1 helper API design — closed in chat already (pickLang + pickI18nColumn). Phase 1 just implements.
- Phase 5 backfill — small (~10 rows total between Adi + Noa). Reversible via re-run with reverse mapping if needed.

---

## Values Check

> 9 questions from `docs/BUFF_VALUES.md`.

### Pillar 1 — Intrinsic Motivation
1. **Would the child want this even without virtual reward?** ✅ Hebrew is the kid's native language; comprehension is a prerequisite, not a reward.
2. **Closer to a self-chosen reward?** ✅ Restoring Hebrew display restores readability of the entire task + reward loop.
3. **"I want to" vs "I have to"?** ✅ Kids can't engage with English instructions; restoration removes friction.

### Pillar 2 — Positive Coaching
1. **Shame / compare / display failure?** ✅ No tone change; pure plumbing fix.
2. **Empathy if child fails?** ✅ Unchanged.
3. **Suffering / loss / anger mechanic?** ✅ N/A.

### Pillar 3 — Independence-Building
1. **More capable without app?** 🟡 Neutral.
2. **Child has voice?** ✅ Restoring Hebrew gives back the child's voice (currently silenced by language mismatch).
3. **In 6 months still necessary?** ✅ Permanent — Hebrew is the default for Israel-first MVP, and the guardrail is forever.

**Values Check Pass:** ✅ Yes.

---

## Goals

- A new parent completing onboarding in Hebrew sees Hebrew starter tasks in the DB and on screen.
- A new parent completing onboarding in English sees English starter tasks in the DB and on screen.
- Existing English starter tasks (Adi + Noa) are translated to Hebrew via Phase 5 backfill.
- Rewards display picks the right column based on the active locale across all 3 reward screens.
- A future developer (or CC session) who tries to access `.title.en` / `.title.he` / `.title_he` directly outside `i18nString.ts` is blocked by ESLint at commit time.

## Non-goals

- No new bilingual fields. We're plumbing what exists.
- No tasks schema migration (single-column `tasks.title` stays — see Open Question 1).
- No translation logic — using existing Hebrew strings from `onboardingData.ts`.
- No UI/UX changes — purely data + plumbing.
- No locale switcher UI changes.
- No backfill of arbitrary historical user-typed strings — only known starter content that maps cleanly to `STARTER_TASKS_BY_CHALLENGE`.
- No fix for the duplicate-family issue (IN-2026-05-14-03) — separate package.

---

## Behavior Contract

### Helper API (Phase 1)

```ts
// src/lib/i18nString.ts
export type I18nString = { en: string; he: string };

/** For bilingual literals in memory ({en, he} objects) — onboarding seed data. */
export function pickLang(s: I18nString, lang: string): string;

/** For DB rows that store both languages in separate columns. */
export function pickI18nColumn(
  row: { title: string; title_he?: string | null },
  lang: string,
): string;
```

- `lang` is the runtime `i18n.language` string ("he", "en", "he-IL", etc.)
- Hebrew chosen iff `lang.startsWith('he')` AND the Hebrew value exists (non-empty string).
- English fallback otherwise. Never returns undefined.

### Insert path (Phase 2)
- `UStep5_Preview.tsx` calls `pickLang(t.title, lang)` instead of `t.title.en`. Same for additional-challenge bonus tasks.
- Rewards insert stays bilingual (both columns).

### Display path (Phase 3)
- All 3 reward screens add `title_he` to SELECT.
- Reward title rendered as `pickI18nColumn(reward, i18n.language)`.
- TypeScript `StoreReward` interface updated to include `title_he?: string | null`.

### Guardrail (Phase 4)
- ESLint `no-restricted-syntax` rule blocks any `MemberExpression` matching `.title.en`, `.title.he`, `.title_he` in files other than `src/lib/i18nString.ts` and `src/lib/i18nString.test.ts`.
- Backstop: README or a CONTRIBUTING note pointing future contributors to the helper.

### Backfill (Phase 5)
- SQL UPDATE statements scoped to specific family_ids (Adi `37d6a2bd...`, Noa `a29f83d9...`).
- Match on exact English title string from `STARTER_TASKS_BY_CHALLENGE.title.en`.
- UPDATE sets `tasks.title` to the corresponding `.title.he`.
- No backfill on `store_rewards` — Phase 3 display fix is enough (data already in `title_he`).
- Preview the queries to Adi before execution.

---

## Open Questions

> Resolved in chat 2026-05-27. Listed for traceability.

1. **Schema for tasks**: single-column `title` (pick locale at INSERT) **OR** add `title_he` column (migration, dual-write)?
   - **Resolved: single-column.** Israel-first MVP. Migration deferred until a real need for in-place language switching emerges. Sub-decision documented in this SPEC; D-log entry not required (architecturally minor).

2. **Backfill via SQL OR manual UI edit?**
   - **Resolved: SQL.** Reversible if wrong, ~10 rows total, takes 30 seconds. Manual edit forces Adi to type the same Hebrew strings she already authored.

3. **ESLint rule scope — block `.en`/`.he` only, or also `.title_he`?**
   - **Resolved: block all three patterns.** Future bilingual columns may reuse the `_he` suffix convention; the rule covers any direct access.

## Out of Scope

- Duplicate-family issue (IN-2026-05-14-03) — separate package `pkg/childjoin-claim-orphans`.
- Locale auto-detection during ChildJoin — kids without their own device inherit parent's locale via shared session.
- BUDDY V0.5 i18n — not touched.
- Any string outside `tasks` and `store_rewards`.
- Translating user-typed strings — those are user content, not plumbing.

---

## Phases (full ROADMAP.md created at session start)

| Phase | What | Exit criteria |
|---|---|---|
| 1 | Helper file `src/lib/i18nString.ts` + unit test | Jest passes; tsc clean; two helpers exported |
| 2 | `UStep5_Preview.tsx` INSERT through helper | Tasks insert in active locale; Jest unchanged or passes |
| 3 | 3 reward screens fetch + render `title_he` | Jest passes; Hebrew preview renders correctly |
| 4 | ESLint rule + audit grep | `npm run lint` clean; no `.title.en` / `.title.he` / `.title_he` access outside helper |
| 5 | SQL backfill (Adi + Noa) via Supabase MCP | Queries previewed to Adi → executed → row count verified |
| 6 | Docs — IN-2026-05-27-04, STATUS, SPEC_SYNC | All canonical doc updates per SPEC_SYNC; STATUS closeout |
| 7 (Hat-4) | Adi emulator verification | Adi confirms Hebrew tasks on fresh Hebrew onboarding; English tasks on English onboarding; existing data shows Hebrew |

---

## Risks

- **ESLint rule false positives** — if some legitimate code accesses `.title_he` (e.g. backfill scripts, migration code), exempt those files explicitly. Phase 4 audit catches this.
- **Backfill mismatch** — Adi's family has 4 English tasks (per SQL probe), expected starter set has 5; one slot may have been edited. Mitigation: SQL uses exact match, only rows that match get updated; any drift remains as-is and Adi can edit manually.
- **Migration regret** — if we discover later that in-place language switching is needed, we'd have to go A (add `title_he` column). The cost: a small migration + backfill from EN-only rows would need user-side translation. Low likelihood for MVP; accepted.
