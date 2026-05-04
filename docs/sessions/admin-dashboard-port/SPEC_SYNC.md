# admin-dashboard-port — Spec Sync

> רשימת canonical docs שהחבילה משנה, ממופה לפאזה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | כל פאזה שמפתיעה | הוספת FLAGs אם מתגלות הפתעות |
| `docs/BUFF_GAP_ANALYSIS.md` | 11 (Polish) | עדכון סטטוס admin dashboard מ-❌ ל-✅ כשנשלח |
| `docs/sessions/admin-dashboard-port/AUDIT.md` | 1 | קובץ חדש — ממצאי Lovable audit |
| `supabase/migrations/` | 3 | הוספת migrations: admin_users + is_admin function |

## Note — No drift yet

SPEC נכתב ע"י Claude.ai ב-2026-05-04. טרם בוצע קוד. אין drift בין SPEC לבין המערכת.

## Out of Scope

- `docs/BUFF_DECISIONS_LOG.md` — Adi's doc; decisions recorded there separately
- `docs/BUFF_PRD.md` — no product-level changes
- `src/` (React Native) — zero changes; admin is a separate admin-web/ subtree
- `docs/BUFF_BUDDY_SYSTEM.md` — no BUDDY changes

## Verification

- [ ] TESTS.md כולל verification לכל doc שנוגעים בו
- [ ] כל פאזה כוללת canonical doc updates ב-אותו commit
- [ ] אחרי Phase 11 — אין drift בין SPEC לבין המערכת החיה
