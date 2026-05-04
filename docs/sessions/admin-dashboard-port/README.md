# admin-dashboard-port

> Port the Lovable PWA Admin Dashboard to a standalone Vite+React web app inside buff-mobile, connecting to the mobile Supabase project. Enables Adi to make data-driven decisions on funnel, retention, and family engagement.

## סטטוס
ראי [STATUS.md](./STATUS.md) להתקדמות פאזות.

## קבצים

| קובץ | תפקיד |
|---|---|
| `SPEC.md` | מצב יעד — **סמכותי לחבילה הזו** (נכתב ע"י Claude.ai 2026-05-04) |
| `ROADMAP.md` | 11 פאזות עם תנאי עצירה |
| `TESTS.md` | קריטריוני success לסגירת הpackage |
| `SPEC_SYNC.md` | אילו canonical docs מעודכנים, באיזו פאזה |
| `STATUS.md` | מעקב פאזות — מתעדכן ע"י CC בכל phase exit |
| `AUDIT.md` | ממצאי Phase 1 — Lovable codebase audit (נוצר ב-Phase 1) |

> **הערה:** אין `PROMPTS.md` ואין `PRINCIPLES.md`.
> ראי `docs/WORKFLOW.md` § Universal Preamble ו-`docs/BUFF_VALUES.md`.

## Reference

- **Lovable repo (source):** https://github.com/adielgarat-pm/buff
- **Mobile repo (target):** https://github.com/adielgarat-pm/buff-mobile
- **Lovable production:** https://buffadhd.com/admin

## MVP-minimum per SPEC §8

Phases 1-7 + 10. Phases 8-9 (Family deep-dive + Blocked Registrations) = MVP+1.
