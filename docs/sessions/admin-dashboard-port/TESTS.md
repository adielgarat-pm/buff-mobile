# admin-dashboard-port — Tests

> קריטריוני success לסגירת הpackage כ-"shipped". מ-SPEC §10.

## Phase 1 — AUDIT

### אוטומטי (CC)
- [ ] `ls docs/sessions/admin-dashboard-port/AUDIT.md` → קיים
- [ ] `wc -l docs/sessions/admin-dashboard-port/AUDIT.md` → ≥ 150 שורות
- [ ] `grep -c "^## Section" docs/sessions/admin-dashboard-port/AUDIT.md` → 7
- [ ] `/tmp/buff-lovable` נמחק לאחר audit

---

## Phases 2-9 — Per-phase tests

ייפתחו עם תחילת כל פאזה. ראי ROADMAP.md § תנאי עצירה per phase.

---

## Closeout — Success Criteria (SPEC §10)

לסגירת הpackage כ-"shipped":

- [ ] Admin עולה ב-`admin.buffadhd.com` (או דומה) עם HTTPS
- [ ] Magic Link מעבד login של Adi
- [ ] RLS חוסם משתמשים שאינם admin
- [ ] User Funnel מציג נתוני אמת מ-Supabase של mobile (גם 0 משפחות = תקין)
- [ ] 3 כרטיסיות "Attention Needed" מציגות נתוני אמת
- [ ] Family search + drill-down מציגים נתוני אמת
- [ ] JSON export מוריד קובץ עם schema זהה ל-Lovable (SPEC §4.6)
- [ ] Charts — לפחות 2 מתוך 4 מציגים נתוני אמת
- [ ] Adi הצליחה לזהות לפחות **משפחה אחת אמיתית** ולקרוא לה (CRM action)
- [ ] STATUS.md מלא, FLAGs פתוחים מתועדים, EOD נוצר

### בדיקות מתודולוגיות (כל פאזה)
- [ ] STATUS.md row נוסף באותו commit כמו הקוד
- [ ] Canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Values Check עדיין עובר אחרי implementation
- [ ] INTEGRATION_LEARNINGS.md עודכן אם היו הפתעות
- [ ] Zero files changed under src/ (React Native), app/, components/ (RN)
