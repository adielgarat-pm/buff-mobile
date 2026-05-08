# admin-dashboard-port — Spec Sync

> רשימת canonical docs שהחבילה משנה, ממופה לפאזה.

## Docs שנוגעים בהם

| Doc | פאזה(ות) | אופי השינוי |
|---|---|---|
| `docs/INTEGRATION_LEARNINGS.md` | כל פאזה שמפתיעה | הוספת FLAGs אם מתגלות הפתעות |
| `docs/BUFF_GAP_ANALYSIS.md` | 11 (Polish) | עדכון סטטוס admin dashboard מ-❌ ל-✅ כשנשלח |
| `docs/sessions/admin-dashboard-port/AUDIT.md` | 1 | קובץ חדש — ממצאי Lovable audit |
| `docs/sessions/admin-dashboard-port/phase-3-migration.sql` | 3 | SQL migration text — Adi runs manually in Supabase Dashboard. NOT a migration file; committed as documentation only. Creates: admin_users table, is_admin() function, RLS + read-only policies for 15 existing tables. |
| `admin-web/src/lib/` | 3 | supabase.ts (client init) + auth.ts (signInWithMagicLink, signOut, checkIsAdmin via is_admin RPC) |
| `admin-web/src/contexts/AuthContext.tsx` | 3 | Session + isAdmin + isLoading state; onAuthStateChange listener |
| `admin-web/src/pages/` | 3 | Login.tsx, Dashboard.tsx (placeholder), AccessDenied.tsx |
| `admin-web/src/components/RequireAdmin.tsx` | 3 | Route guard: loading → spinner, no session → /login, session+not admin → /access-denied |
| `package.json` (root) | 2 | Added `"workspaces": ["admin-web"]` — npm workspace declaration |
| `admin-web/` (new subtree) | 2 | New Vite + React 19 + TypeScript + Tailwind 3.4 + shadcn scaffold (placeholder hello-world) |
| `docs/sessions/admin-dashboard-port/DEPLOYMENT.md` | 10 (ref) | Phase 10 (Vercel deploy) planning doc — authored by Claude.ai 2026-05-04, saved to disk but not committed. Recovered to version control 2026-05-05 via repo-state-recovery package. |

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
