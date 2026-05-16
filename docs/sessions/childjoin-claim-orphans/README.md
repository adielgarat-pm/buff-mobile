# childjoin-claim-orphans

> תיקון IN-2026-05-14-03: ChildJoin signup לא מאחד עם orphan profiles קיימים, ויוצר duplicate בשקט. החבילה מוסיפה SECURITY DEFINER RPC לתביעה אטומית של ה-orphan + UX חוסם ל-ambiguity.

## סטטוס

**Phase 0 passed (2026-05-16).** Adi אישרה את 4 ה-recommendations של CC ("do them all"). תרחיש A:
- Q1 = drop (b) — F-2026-05-03-03 closed-not-applicable (ראי FLAG removal הצעה לAdi בPhase 3)
- Q2 = SECURITY DEFINER RPC `claim_orphan_profile` + `preflight_claim_orphan`
- Q3 = trim + Unicode NFC + lower (case-insensitive)
- Q4 = blocking error UX ("בקש מההורה לוודא את השם")

Next: Phase 1 — write + apply migration. ראי `ROADMAP.md` ו-`TESTS.md`.

## הקשר לחבילת `beta-2026-06-01` (umbrella)

החבילה הזו הוקדמה מ-`docs/sessions/beta-2026-06-01/` (umbrella for the 2026-06-01 beta launch) ל-package נפרד, כי:
- אורכה outgrew the umbrella's TRACK convention (SPEC + ROADMAP + TESTS + SPEC_SYNC + STATUS)
- כוללת SQL migration — והumbrella כותב מפורש: *"No SQL, no schema changes, no code edits happen from inside `beta-2026-06-01/` files."*

Pointer ל-package הזה נמצא ב-[`../beta-2026-06-01/TRACK_9_childjoin_claim_orphans.md`](../beta-2026-06-01/TRACK_9_childjoin_claim_orphans.md).

קשור ל-FLAG IN-2026-05-14-03 (חוסם beta 2026-06-01 לפי ההצעה הראשונית של Adi).

## קבצים

| קובץ | תפקיד |
|---|---|
| `README.md` | קובץ זה |
| `SPEC.md` | מצב יעד + Values Check + Q1-Q4 answers |
| `ROADMAP.md` | פאזות 1-3 (scenario A concrete) |
| `TESTS.md` | קריטריוני pass/fail per phase |
| `SPEC_SYNC.md` | רשימת canonical docs ועדכוניהם per phase |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |

## רצף ביצוע

1. Phase 1 — RPC migration (`claim_orphan_profile` + `preflight_claim_orphan`). CC writes SQL, applies via Supabase MCP, verifies with execute_sql.
2. Phase 2 — Client integration ב-`AuthContext.signUp` + `ChildJoinScreen.handleJoin` + i18n. Adi מאמתת באמולטור.
3. Phase 3 — Closeout: INTEGRATION_LEARNINGS updates, PR ל-main, FLAG-removal diff מוצע ל-Adi.

---

**Branch:** `claude/lucid-sinoussi-235144` (current worktree)
**Drafted:** 2026-05-16 by CC
