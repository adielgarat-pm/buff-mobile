# Sentry + EAS Resumption — Spec Sync

> רשימת canonical docs שהחבילה הזו משנה, ממופה לפאזה שנוגעת בכל אחד.
> CC חייב לעדכן כל doc ברשימה כחלק מ-exit deliverable של הפאזה הנקובה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `CLAUDE.md` | Closeout | §Tech Stack — replace "EAS Build / Submit decision pending DevEx session" with "EAS Build production shipped; Sentry integrated; EAS Submit deferred". §Open FLAGs — remove Sentry-for-beta if listed. §FLAGs/IN — reference new IN-2026-05-25-XX |
| `docs/BUFF_DECISIONS_LOG.md` | Closeout | Append 2 new D entries: (1) Sentry re-adoption + first AAB v10; (2) 5/16 work-loss root cause + Verify-Before-Delete reinforcement |
| `docs/INTEGRATION_LEARNINGS.md` | Phase 1 + Closeout | Phase 1: correct F-2026-05-05-01 doc drift. Closeout: add IN-2026-05-25-XX (lost-work pattern + mitigation) |

## Out of Scope (intentionally NOT updated)

- `docs/README.md` — no structural change to docs index
- `docs/WORKFLOW.md` — workflow itself unchanged
- `docs/BUFF_VALUES.md` — Adi's doc; not updated unilaterally (CLAUDE.md rule)
- `docs/BUFF_PRD.md` — no product change
- `docs/BUFF_GAP_ANALYSIS.md` — Adi's doc; not updated unilaterally (CLAUDE.md rule). Sentry is infra, not a PRD gap.
- `docs/BUFF_BUDDY_SYSTEM.md` — no BUDDY change
- `docs/BUFF_USER_STORIES.md` — no user-facing change
- `docs/BUFF_FEATURE_AUDIT.md` — no feature change
- `docs/BUFF_FEATURE_PRIORITIZATION.md` — no prioritization change
- `docs/CONVERSATION_STARTER.md` — no protocol change
- `docs/ARCHITECTURE.md` — would benefit from a §Observability section but that's a separate doc-improvement package
- `docs/teen-ui-design/` — no UI change
- Brand-family docs (`BUFF_BRAND`, `BUFF_PERSONAS`, `BUFF_MESSAGING`, `BUFF_COMPETITORS`) — not relevant; infra work

## Verification

- [ ] כל פאזה ב-ROADMAP.md כוללת עדכוני docs כחלק מה-chunk (where SPEC_SYNC lists that phase)
- [ ] TESTS.md כולל "doc updated per SPEC_SYNC" בכל פאזה רלוונטית
- [ ] אחרי כל הפאזות — אין drift בין canonical docs לבין המערכת החיה
- [ ] D-XX numbering — pulled from current DECISIONS_LOG at Closeout time (avoid pre-assigning to dodge conflicts with other branches)
