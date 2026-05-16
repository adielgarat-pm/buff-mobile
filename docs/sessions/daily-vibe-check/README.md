# pkg/daily-vibe-check

> Daily Vibe Check (GAP S-07, MVP-critical) — kid rates energy 1-5 once per day; score ≤ 2 activates Low Power Mode (trimmed task list + SOS to parent + Instant Buff self-care card).

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — סמכותי לחבילה הזו. כולל Schema Verified + Decisions Locked (Phase 0). |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |
| `TESTS.md` | קריטריוני pass/fail לכל פאזה |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |

**אין קובצי `PRINCIPLES.md` או `ROADMAP.md`** — הפיצ'ר נשען על `BUFF_VALUES.md` הגלובלי, והפאזות מתוארות ב-`SPEC.md` § "Proposed Phased Chunks".

## רקע

- **TRACK_8 source brief:** `docs/sessions/beta-2026-06-01/TRACK_8_daily_vibe_check_SPEC.md` — נשמר כ-planning artifact.
- **Schema:** קיים. אומת ב-Phase 0 ב-Supabase MCP. אין שינוי schema בפיצ'ר הזה.
- **Pause-mode pattern:** משמש כתבנית ל-`useDailyVibe` hook ולגישת short-circuit ב-dashboard.

## רצף ביצוע

לכל פאזה: CC מציג plan → Adi מאשרת `approved, proceed` → CC מבצע chunk → diff review → tests מ-TESTS.md → STATUS.md row → קומיט.

## כללי המתודולוגיה (קבועים — מ-CLAUDE.md + WORKFLOW.md)

- Plan Mode בכל פאזה
- אין self-approved decisions — אי-בהירות עולה ל-Adi
- Inspect actual code לפני הצעות
- Chunk-by-chunk; sequencing מ-SPEC.md § Proposed Phased Chunks
- STATUS.md + canonical docs באותו commit כמו הקוד
- Values Check עובר לפני שעוברים פאזה
- אין push ל-main בלי PR + merge אישור Adi
