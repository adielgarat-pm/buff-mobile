# i18n-string-plumbing-fix — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | 6 | Append IN-2026-05-27-04 — regression class diagnosis (two fingerprints, one root) + `i18nString.ts` helper as the new convention + ESLint guardrail. Includes evidence table (Lovable era vs. buff-mobile era data) and the systemic-vs-point-fix decision rationale. |
| `docs/BUFF_GAP_ANALYSIS.md` | 6 | Update or add row: "bilingual content plumbing — convention + helper now exists; future bilingual fields must use it." |
| `eslint.config.js` | 4 | Not a doc, but listed here so reviewer knows the rule lives there. |

> כל doc אחר ב-template — לא רלוונטי לחבילה הזו.

## Out of Scope

- `docs/BUFF_DECISIONS_LOG.md` — Architectural decision is minor (single-column tasks vs. dual-column). Could go either way for MVP; not D-log worthy.
- `docs/BUFF_BUDDY_SYSTEM.md` — buddy mechanics unchanged.
- `docs/BUFF_VALUES.md` — not changing.
- `docs/BUFF_PRD.md` — already implicitly assumes Hebrew default; not edited.
- `docs/BUFF_USER_STORIES.md` — no new user story.
- `CLAUDE.md` — operating rules unchanged.

## Verification

- [ ] Phase 6 commit touches IN-2026-05-27-04 and GAP_ANALYSIS row.
- [ ] `TESTS.md` Phase 6 row reads "doc updated per SPEC_SYNC" with file list.
- [ ] After Phase 7 (Hat-4 pass), no drift between docs and live behavior.
- [ ] ESLint rule is referenced from IN-2026-05-27-04 with the exact pattern blocked.
