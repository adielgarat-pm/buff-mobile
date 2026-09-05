# pkg/marketing-scout — BUFF's daily marketing scout

**Status:** Built · **runs ON-DEMAND** (autonomous cron abandoned 2026-09-05 — see IN-2026-09-05). Adi runs `/buff-marketing-scout` in her own session; a daily push reminder nudges her (Routine `trig_012Fd1JkBok8wNrT7WNKrgLd`).
**Branch:** `claude/epic-johnson-j0lv3w` (skill + docs) · `automation/marketing-scout` holds state files only.
**Opened:** 2026-09-04 · **Owner:** Adi (delegated execution to CC, "מאשרת הכל" 2026-09-04)

| File | What |
|---|---|
| `SPEC.md` | Target state, Capability Check, Values Check |
| `REVIEW.md` | Six-discipline agency review of Plan v1 → Plan v2 (the design rationale) |
| `ROADMAP.md` | Phases 0–3 with stop conditions |
| `TESTS.md` | Pass/fail per phase |
| `SPEC_SYNC.md` | Canonical docs touched per phase |
| `STATUS.md` | Phase rows (CC updates at each exit) |

Runtime pieces: `.claude/skills/buff-marketing-scout/` (procedure) · `docs/marketing-scout/` (config, state, reports, phone checklist).
