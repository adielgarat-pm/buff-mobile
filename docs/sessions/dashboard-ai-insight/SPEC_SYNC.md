# dashboard-ai-insight — SPEC_SYNC

> אילו canonical docs מתעדכנים בסוף כל פאזה, ומה בדיוק.

| Phase | Canonical doc | מה מתעדכן |
|---|---|---|
| 0 | `docs/BUFF_DECISIONS_LOG.md` (Adi בלבד — הצעה) | D חדש: מעבר ספק LLM לתובנות → Gemini (`gemini-2.5-flash`), Anthropic כ-fallback; החלטת 2026-07-14 |
| 0 | `migrations/` | `042_smart_insight_state_computed_at.sql` (כלול בקומיט) |
| 1 | `docs/BUFF_FLOWS.md` | כרטיס התובנה בדשבורד = תובנת AI (coach) עם fallback rule-based; auto-generate שבועי |
| 1 | `docs/INTEGRATION_LEARNINGS.md` | הפתעות מהפאזה (אם היו) |
| סיום | `docs/RELEASE_QUEUE.md` | שורה לחבילה אחרי merge (feedback: release tracking in FILES) |

הערות:
- `BUFF_DECISIONS_LOG.md` הוא של Adi — CC מציע נוסח, לא כותב לבד.
- אין עדכון ל-`BUFF_VALUES.md` (אין שינוי עקרונות).
