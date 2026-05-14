# Lovable Parity & Backlog — Roadmap

> פאזה אחת — חבילת תיעוד קטנה, אפס שינוי קוד.

## פאזה 1 — עדכון בקלוג + אסטרטגיית Web ב-PRD

**Scope:**

1. **עריכת `docs/BUFF_FEATURE_PRIORITIZATION.md`:**
   - הוספת 2 שורות חדשות בסקציית **PARENT DASHBOARD & TASK MANAGEMENT** (אחרי F-023):
     - **F-024** Daily summary email/notification להורה — Out / Phase 2 — XL — *מקור: Lovable `daily-summary` edge function. עוטף את F-020 + F-022.*
     - **F-025** Schedule parsing (טקסט חופשי → לוח זמנים, AI) — Out / Phase 2 — XL — *מקור: Lovable `parse-schedule` edge function. ה-AI יקר.*
   - הוספת 5 שורות חדשות בסקציית **TECHNICAL INFRASTRUCTURE** (אחרי F-070):
     - **F-071** Translate review (i18n דינמי לתוכן משתמשים) — Out / Phase 2 — M — *מקור: Lovable `translate-review` edge function.*
     - **F-072** Email password recovery — **Out / Phase 2 — Conditional** — S — *הקוד קורא ל-`resetPasswordForEmail` ב-[LoginScreen.tsx:65](src/screens/auth/LoginScreen.tsx) אבל ResetPassword screen חסר. **החלטת 2026-05-14: אדי שאלה "אם Google תומך בזה למה צריך?" — מסומן Out כל עוד אין החלטה רשמית להסיר email/password auth. אם email/password יישאר ב-MVP, F-072 חוזר ל-Should Have.***
     - **F-073** Web build via Expo Web + PWA install — Should Have / Phase 2 — L — *תחליף זמני ל-iOS עד יציאת iOS native. Expo Web = React Native Web (production-grade ב-X/Twitter, Coinbase, Discord).*
     - **F-074** Static marketing landing (buffadhd.com revamp) — Should Have / Phase 2 — M — *מקור: Lovable `Landing.tsx`. בנפרד מקוד האפליקציה.*
     - **F-075** Sunset Lovable (תקשורת ל-2 משתמשים פעילים + הורדת תשתית) — Should Have / Phase 2 — S.
   - שינוי **F-006** (Beta migration from PWA) מ-Must Have/MVP ל-Out — *לפי החלטת 2026-05-14: אדי החליטה לוותר על הגירה אוטומטית; 2 המשתמשים הפעילים ב-Lovable יעברו ידנית.*
   - עדכון Summary Counts: Must Have 37→36, Should Have 9→12, Out/Phase 2 6→11 (Total 53→60).

2. **הוספת סעיף ל-`docs/BUFF_PRD.md`:**
   - מיקום: אחרי הסעיף האחרון ב-PRD, מספר זמני "9.X Web Strategy" (CC ייתן את המספר הסידורי הנכון בעת הכתיבה).
   - תוכן: ארכיטקטורה תלת-שכבתית (static landing + Expo Web app + Supabase backend), trade-offs ידועים (PWA push limitations, responsive desktop), מקורות (Expo docs + Meta RSD + תקדימים תעשייתיים).

3. **הוספת FLAG ל-`docs/INTEGRATION_LEARNINGS.md`:**
   - תוכן: "🚩 לפני התקנת native dep חדש — לבדוק שעובר ל-Expo Web (אחרת ה-Web build יישבר עתידית). דוגמאות לבעיות: native vibration, deep camera access, חלק ממודולי FCM."

4. **טיוטת decision ב-`STATUS.md` של החבילה** — מוכן להעתקה/עריכה ע"י אדי ל-`BUFF_DECISIONS_LOG.md` (CC לא נוגע ב-DECISIONS_LOG).

**תנאי עצירה (concrete, measurable):**
- 7 שורות חדשות (F-024, F-025, F-071..F-075) + 1 שורה מעודכנת (F-006 → Out) ב-`BUFF_FEATURE_PRIORITIZATION.md` + עדכון Summary Counts.
- סעיף Web Strategy חדש ב-`BUFF_PRD.md`.
- FLAG חדש ב-`INTEGRATION_LEARNINGS.md`.
- טיוטת decision ב-`STATUS.md` כוללת את כל הנקודות המוסכמות.
- אדי עברה על ה-diff ואישרה.
- TESTS.md עבר.

**Exit Deliverables:**
- [ ] שינויי docs (אפס קוד)
- [ ] עדכוני canonical docs לפי SPEC_SYNC.md (השורה של פאזה זו)
- [ ] STATUS.md מעודכן עם שורת הפאזה (state=passed, commit hash)
- [ ] INTEGRATION_LEARNINGS.md עודכן (FLAG חדש — אין הפתעה כי תוכנן)
- [ ] Values Check passed (חוזר על הסעיף ב-SPEC.md, מאומת לאחר implementation)

---

## Closeout

- [ ] הפאזה עברה לפי TESTS.md
- [ ] כל canonical docs מסונכרנים לפי SPEC_SYNC.md
- [ ] Git tag נוצר (מוצע: `pkg/lovable-parity-and-backlog/v1`)
- [ ] STATUS.md closeout checklist הושלם
- [ ] PR ל-main, fast-forward merge, branch נמחק (לפי Verify-Before-Delete Protocol ב-CLAUDE.md)
