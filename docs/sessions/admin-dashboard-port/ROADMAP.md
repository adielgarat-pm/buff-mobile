# admin-dashboard-port — Roadmap

> 11 פאזות מ-SPEC §8. כל גבול פאזה = שער שניתן לבדוק.
> MVP-minimum: Phases 1-7 + 10. Phases 8-9 = MVP+1.

---

## Phase 1 — AUDIT

**Scope:** CC clones `https://github.com/adielgarat-pm/buff` to /tmp/, inventories Admin codebase, writes `AUDIT.md`.

**תנאי עצירה:**
- `AUDIT.md` קיים ב-`docs/sessions/admin-dashboard-port/`
- `wc -l AUDIT.md` ≥ 150 שורות
- `grep -c "^## Section" AUDIT.md` = 7

**Exit Deliverables:**
- [ ] AUDIT.md נוצר
- [ ] STATUS.md row 1 מלא
- [ ] /tmp/buff-lovable נמחק

---

## Phase 2 — Workspace Setup

**Scope:** npm workspaces setup, `admin-web/` subdirectory, vite + react + tailwind + shadcn scaffold.

**תנאי עצירה:**
- `admin-web/package.json` קיים
- `npm run dev --workspace=admin-web` מריץ ללא שגיאות
- `admin-web/src/App.tsx` קיים

**Exit Deliverables:**
- [ ] admin-web/ scaffold committed
- [ ] STATUS.md row 2 מלא

---

## Phase 3 — Auth Foundation

**Scope:** Supabase migrations (`admin_users` table + `is_admin` function), Magic Link login screen.

**תנאי עצירה:**
- Migration `add_admin_users` קיימת ב-`supabase/migrations/`
- Login screen מציג שדה email + כפתור Magic Link
- Login ב-Adi's email מביא ל-dashboard (manual test)

**Exit Deliverables:**
- [ ] Migration files committed
- [ ] Login screen committed
- [ ] STATUS.md row 3 מלא
- [ ] INTEGRATION_LEARNINGS.md updated if surprises

---

## Phase 4 — Layout + Tabs

**Scope:** App shell, sidebar/topbar, tab routing (App Pulse / Users+Pro / Emails / משפחות).

**תנאי עצירה:**
- 4 tabs מנווטים ללא שגיאות
- Layout consistent ב-desktop

**Exit Deliverables:**
- [ ] Layout + tabs committed
- [ ] STATUS.md row 4 מלא

---

## Phase 5 — Funnel + KPIs

**Scope:** Cohort filter (7/30/90/Custom), 4-stage funnel (Signups→Activated→Engaged→Active), KPI cards (Long-term + Daily).

**תנאי עצירה:**
- Funnel מציג נתוני אמת מ-Supabase mobile
- Engaged % ≤ 100% (bug fix from Lovable)
- KPI cards נטענות

**Exit Deliverables:**
- [ ] Funnel + KPIs committed
- [ ] STATUS.md row 5 מלא

---

## Phase 6 — Attention Needed

**Scope:** 3 cards (Stuck in Onboarding / Churn Risk / Low Engagement) + drill-down lists.

**תנאי עצירה:**
- כל כרטיסייה מציגה נתוני אמת
- Drill-down list פותח per card

**Exit Deliverables:**
- [ ] Attention Needed committed
- [ ] STATUS.md row 6 מלא

---

## Phase 7 — Charts

**Scope:** Growth vs Engagement (dual axis), Task Completion by Category (7d), Completion Trend 8 weeks, device type donut.

**תנאי עצירה:**
- לפחות 2 מתוך 4 charts מציגים נתוני אמת
- אין chart errors ב-console

**Exit Deliverables:**
- [ ] Charts committed
- [ ] STATUS.md row 7 מלא

---

## Phase 8 — Family Deep-dive (MVP+1)

**Scope:** Family search, modal with 5 tabs (ילדים/מערכת/פרסים/משימות/מעקב), JSON export.

**תנאי עצירה:**
- חיפוש family name מחזיר תוצאות
- JSON export מוריד קובץ עם schema זהה ל-Lovable (SPEC §4.6)
- Adi הצליחה לזהות משפחה אמיתית ולבדוק את הנתונים שלה

**Exit Deliverables:**
- [ ] Family deep-dive committed
- [ ] STATUS.md row 8 מלא

---

## Phase 9 — Blocked Registrations (MVP+1)

**Scope:** Tab/card חדש — registrations שנחסמו (18+, decision 2026-05-04). מבוסס על audit_log table.

**תנאי עצירה:**
- Blocked Registrations card מציג נתוני אמת (גם 0 = תקין)

**Exit Deliverables:**
- [ ] Blocked Registrations committed
- [ ] STATUS.md row 9 מלא

---

## Phase 10 — Vercel Deploy

**Scope:** Production deploy ל-Vercel, env vars, custom domain (`admin.buffahdh.com` or TBD).

**תנאי עצירה:**
- Admin עולה ב-HTTPS על custom domain
- Magic Link עובד ב-production
- RLS חוסם non-admin users

**Exit Deliverables:**
- [ ] Vercel config committed
- [ ] Domain live and tested by Adi
- [ ] STATUS.md row 10 מלא

---

## Phase 11 — Polish + Testing

**Scope:** Manual testing, edge cases, visual polish, open questions from AUDIT.

**תנאי עצירה:**
- כל success criteria ב-TESTS.md עברו
- STATUS.md closeout checklist הושלם

**Exit Deliverables:**
- [ ] All TESTS.md criteria checked
- [ ] STATUS.md row 11 מלא
- [ ] Git tag נוצר
- [ ] PR ל-main, merge, branch deleted

---

## Closeout

- [ ] כל הפאזות עברו לפי TESTS.md
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (`pkg/admin-dashboard-port/v1`)
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק
