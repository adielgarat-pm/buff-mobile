# Track 9 — ChildJoin claim orphans

**Status:** `in-progress` — promoted to its own package
**Package:** [`docs/sessions/childjoin-claim-orphans/`](../childjoin-claim-orphans/)
**FLAG:** IN-2026-05-14-03 (beta 2026-06-01 blocker per initial Adi brief 2026-05-16)

## Goal

תיקון ChildJoin: כאשר ילד נרשם עם family code ושמו תואם orphan profile קיים (parent יצר ב-UStep5_Preview עם `user_id=null`), ה-orphan נתבע אטומית במקום שייווצר profile כפול.

## Why this got promoted (not a single TRACK file)

Track outgrew the umbrella convention — דורש:
- Supabase migration (SECURITY DEFINER RPC + preflight) — וה-umbrella כותב מפורש "no SQL from here"
- Granular SPEC + ROADMAP + TESTS + SPEC_SYNC + STATUS
- Multi-phase execution (3 phases)

Per umbrella convention: *"If a Track grows large enough to need its own ROADMAP/TESTS/SPEC_SYNC files, it graduates to its own `docs/sessions/{slug}/` folder and stays linked from here."*

## Scope summary

- **(a) IN-2026-05-14-03** — orphan reconciliation. *In scope.*
- **(b) F-2026-05-03-03 (Teen age 13-15 vs 13-17)** — investigation showed code has zero 13-15 hardcoding; flag is already CLOSED-STALE. *Confirmed dropped from this package; FLAG removal proposed in Phase 3 closeout for Adi.*

## Decisions (Adi 2026-05-16 "do them all")

- Q1 = drop (b)
- Q2 = SECURITY DEFINER RPC (`claim_orphan_profile` + `preflight_claim_orphan`)
- Q3 = trim + Unicode NFC + lower (case-insensitive)
- Q4 = blocking error UX

## Status / Phases

| Phase | State | Detail |
|---|---|---|
| 0 — Q1-Q4 | ✅ passed 2026-05-16 | "do them all" |
| 1 — Migration | _pending_ | RPC + preflight; apply via Supabase MCP |
| 2 — Client | _pending_ | AuthContext.signUp + ChildJoinScreen + i18n Hebrew |
| 3 — Closeout | _pending_ | INTEGRATION_LEARNINGS updates + PR + FLAG-removal diff for Adi |

## Cascading requirements / cross-Track

None today. The migration touches `profiles` table (shared with TRACK 5 cohort lifetime work) but only adds a function; no schema change to existing tables/columns. No conflict expected with TRACK 5's `pending_lifetime_grants` work.
